import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import type {
  QueuedOperation,
  OperationType,
  QueueStatus,
  BlockchainConfirmedEvent,
  BlockchainFailedEvent,
} from '../types.ts';
import { NonceManager, nonceManager as defaultNonceManager } from './nonceManager.ts';

export interface TxQueueConfig {
  storagePath?: string;
  maxAttempts?: number;
  baseBackoffMs?: number;
  maxBackoffMs?: number;
  nonceManager?: NonceManager;
}

export type WsBroadcaster = (type: string, payload: any) => void;

export type QueueEventListener = (
  event: 'confirmed' | 'failed' | 'pending' | 'queued',
  op: QueuedOperation
) => void;

export class TransactionQueue {
  private operations: Map<string, QueuedOperation> = new Map();
  private storagePath: string;
  private maxAttempts: number;
  private baseBackoffMs: number;
  private maxBackoffMs: number;
  private nonceManager: NonceManager;
  private isProcessing: boolean = false;
  private wsBroadcaster: WsBroadcaster | null = null;
  private listeners: Set<QueueEventListener> = new Set();
  private retryTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: TxQueueConfig = {}) {
    this.storagePath =
      config.storagePath ||
      path.join(process.cwd(), 'data', 'blockchainQueue.json');
    this.maxAttempts = config.maxAttempts || 3;
    this.baseBackoffMs = config.baseBackoffMs || 1000;
    this.maxBackoffMs = config.maxBackoffMs || 10000;
    this.nonceManager = config.nonceManager || new NonceManager();
    this.loadFromDisk();
  }

  public setBroadcaster(broadcaster: WsBroadcaster | null) {
    this.wsBroadcaster = broadcaster;
  }

  public addListener(listener: QueueEventListener): void {
    this.listeners.add(listener);
  }

  public removeListener(listener: QueueEventListener): void {
    this.listeners.delete(listener);
  }

  public loadFromDisk(): void {
    try {
      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, 'utf8');
        const list: QueuedOperation[] = JSON.parse(raw);
        this.operations.clear();
        for (const op of list) {
          this.operations.set(op.operationId, op);
        }
      }
    } catch (err: any) {
      console.warn(`[TxQueue] Failed to load queue from ${this.storagePath}:`, err?.message);
    }
  }

  public saveToDisk(): void {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const list = Array.from(this.operations.values());
      fs.writeFileSync(this.storagePath, JSON.stringify(list, null, 2), 'utf8');
    } catch (err: any) {
      console.warn(`[TxQueue] Failed to save queue to ${this.storagePath}:`, err?.message);
    }
  }

  /**
   * Generates a deterministic operation ID based on grievance ID, type, and payload hashes.
   */
  public generateOperationId(
    grievanceId: string,
    operationType: OperationType,
    payload: any
  ): string {
    switch (operationType) {
      case 'REGISTER':
        return `OP_REG_${grievanceId}`;
      case 'STATUS_UPDATE':
        return `OP_STATUS_${grievanceId}_${payload.newStatus}_${payload.actionHash}`;
      case 'TRANSFER':
        return `OP_TRANSFER_${grievanceId}_${payload.newDeptHash}_${payload.actionHash}`;
      case 'OFFICER_REPLY':
        return `OP_REPLY_${grievanceId}_${payload.actionHash}`;
      case 'RESOLUTION':
        return `OP_RES_${grievanceId}_${payload.resolutionHash}`;
      default:
        return `OP_${operationType}_${grievanceId}_${Date.now()}`;
    }
  }

  /**
   * Enqueues an operation into the durable queue.
   * Idempotent: returns existing record if already queued, pending, or confirmed.
   */
  public enqueue(
    grievanceId: string,
    operationType: OperationType,
    payload: any
  ): QueuedOperation {
    const operationId = this.generateOperationId(grievanceId, operationType, payload);
    const existing = this.operations.get(operationId);
    if (existing) {
      // If already CONFIRMED or PENDING, return without duplicating
      if (existing.status === 'CONFIRMED' || existing.status === 'PENDING') {
        return existing;
      }
      // If FAILED, allow re-enqueue by resetting
      if (existing.status === 'FAILED') {
        existing.status = 'QUEUED';
        existing.attemptCount = 0;
        existing.error = null;
        existing.updatedAt = Date.now();
        this.saveToDisk();
        return existing;
      }
      return existing;
    }

    const now = Date.now();
    const newOp: QueuedOperation = {
      operationId,
      grievanceId,
      operationType,
      payload,
      txHash: null,
      nonce: null,
      attemptCount: 0,
      maxAttempts: this.maxAttempts,
      createdAt: now,
      updatedAt: now,
      error: null,
      status: 'QUEUED',
      receipt: null,
    };

    this.operations.set(operationId, newOp);
    this.saveToDisk();
    return newOp;
  }

  /**
   * Reconciles queue items against on-chain state on server restart.
   */
  public async reconcileOnStartup(
    contract: ethers.Contract | null,
    provider: ethers.Provider | null
  ): Promise<void> {
    if (!contract || !provider) return;

    for (const op of this.operations.values()) {
      if (op.status === 'PENDING' && op.txHash) {
        try {
          const receipt = await provider.getTransactionReceipt(op.txHash);
          if (receipt) {
            if (receipt.status === 1) {
              op.status = 'CONFIRMED';
              op.receipt = {
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                status: 1,
              };
              op.updatedAt = Date.now();
              this.emitConfirmed(op);
            } else {
              op.status = 'FAILED';
              op.error = 'Transaction reverted on-chain (mined with status 0)';
              op.updatedAt = Date.now();
              this.emitFailed(op);
            }
          } else {
            // Check if still in mempool
            const tx = await provider.getTransaction(op.txHash);
            if (!tx) {
              // Dropped from mempool; reset to QUEUED for clean retry
              op.status = 'QUEUED';
              op.txHash = null;
              op.updatedAt = Date.now();
            }
          }
        } catch (err: any) {
          console.warn(`[TxQueue] Startup reconciliation error for ${op.operationId}:`, err?.message);
        }
      } else if (op.status === 'QUEUED') {
        // Pre-check if operation was already committed on-chain earlier
        try {
          const idBytes32 = op.payload.idBytes32;
          if (idBytes32 && op.operationType === 'REGISTER') {
            const onChain = await contract.getComplaint(idBytes32);
            if (onChain && onChain.exists) {
              op.status = 'CONFIRMED';
              op.updatedAt = Date.now();
              this.emitConfirmed(op);
            }
          }
        } catch {
          // Record does not exist on-chain; remains QUEUED
        }
      }
    }
    this.saveToDisk();
  }

  /**
   * Processes all QUEUED operations sequentially with nonce management.
   */
  public async processQueue(
    contract: ethers.Contract,
    signer: ethers.Signer,
    provider: ethers.Provider
  ): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (true) {
        const queuedOps = Array.from(this.operations.values()).filter(
          (op) => op.status === 'QUEUED'
        );
        if (queuedOps.length === 0) break;

        for (const op of queuedOps) {
          if (op.status === 'QUEUED') {
            await this.dispatchOperation(op, contract, signer, provider);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Dispatches a single queued operation to EVM.
   */
  public async dispatchOperation(
    op: QueuedOperation,
    contract: ethers.Contract,
    signer: ethers.Signer,
    provider: ethers.Provider
  ): Promise<void> {
    op.attemptCount++;
    op.updatedAt = Date.now();

    const contractWithSigner = contract.runner === signer ? contract : (contract.connect(signer) as ethers.Contract);

    // Pre-flight check: on-chain verification to prevent duplicate reverts
    try {
      const idBytes32 = op.payload.idBytes32;
      if (idBytes32 && op.operationType === 'REGISTER') {
        const onChain = await contractWithSigner.getComplaint(idBytes32);
        if (onChain && onChain.exists) {
          op.status = 'CONFIRMED';
          op.updatedAt = Date.now();
          this.saveToDisk();
          this.emitConfirmed(op);
          return;
        }
      } else if (idBytes32 && op.operationType === 'RESOLUTION') {
        const onChain = await contractWithSigner.getComplaint(idBytes32);
        if (onChain && onChain.exists && onChain.resolutionHash === op.payload.resolutionHash) {
          op.status = 'CONFIRMED';
          op.updatedAt = Date.now();
          this.saveToDisk();
          this.emitConfirmed(op);
          return;
        }
      }
    } catch {
      // Not yet on-chain; proceed
    }

    try {
      const nonce = await this.nonceManager.acquireNonce(signer);
      op.nonce = nonce;

      let tx: any;
      switch (op.operationType) {
        case 'REGISTER':
          tx = await contractWithSigner.registerComplaint(
            op.payload.idBytes32,
            op.payload.complaintHash,
            op.payload.deptHash,
            op.payload.priorityNum,
            { nonce }
          );
          break;
        case 'STATUS_UPDATE':
          tx = await contractWithSigner.updateStatus(
            op.payload.idBytes32,
            op.payload.newStatus,
            op.payload.actionHash,
            { nonce }
          );
          break;
        case 'TRANSFER':
          tx = await contractWithSigner.transferDepartment(
            op.payload.idBytes32,
            op.payload.newDeptHash,
            op.payload.actionHash,
            { nonce }
          );
          break;
        case 'OFFICER_REPLY':
          tx = await contractWithSigner.recordOfficerAction(
            op.payload.idBytes32,
            op.payload.actionHash,
            op.payload.actionType,
            { nonce }
          );
          break;
        case 'RESOLUTION':
          tx = await contractWithSigner.recordResolution(
            op.payload.idBytes32,
            op.payload.resolutionHash,
            op.payload.actionHash,
            { nonce }
          );
          break;
        default:
          throw new Error(`Unsupported operation type: ${op.operationType}`);
      }

      op.txHash = tx.hash;
      op.status = 'PENDING';
      op.updatedAt = Date.now();
      this.saveToDisk();

      for (const listener of this.listeners) {
        try { listener('pending', op); } catch (e) {}
      }

      // Wait for confirmation in background
      tx.wait(1).then((receipt: any) => {
        if (receipt && receipt.status === 1) {
          op.status = 'CONFIRMED';
          op.receipt = {
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : '0',
            status: 1,
          };
          op.updatedAt = Date.now();
          this.saveToDisk();
          this.emitConfirmed(op);
        } else {
          op.status = 'FAILED';
          op.error = 'Transaction reverted on-chain (status 0)';
          op.updatedAt = Date.now();
          this.saveToDisk();
          this.emitFailed(op);
        }
      }).catch((err: any) => {
        op.status = 'FAILED';
        op.error = err?.message || 'Transaction wait failed';
        op.updatedAt = Date.now();
        this.saveToDisk();
        this.emitFailed(op);
      });

    } catch (err: any) {
      this.nonceManager.resetNonce();
      const errMsg = err?.message || String(err);
      op.error = errMsg;
      op.updatedAt = Date.now();

      // Reverts should not retry indefinitely
      const isRevert =
        err?.code === 'CALL_EXCEPTION' ||
        errMsg.includes('reverted') ||
        errMsg.includes('custom error') ||
        errMsg.includes('execution reverted');

      if (isRevert || op.attemptCount >= op.maxAttempts) {
        op.status = 'FAILED';
        this.saveToDisk();
        this.emitFailed(op);
      } else {
        // Schedule retry with exponential backoff
        op.status = 'QUEUED';
        this.saveToDisk();
        const backoff = Math.min(
          this.baseBackoffMs * Math.pow(2, op.attemptCount - 1),
          this.maxBackoffMs
        );
        const timer = setTimeout(() => {
          this.processQueue(contract, signer, provider);
        }, backoff);
        this.retryTimers.set(op.operationId, timer);
      }
    }
  }

  private emitConfirmed(op: QueuedOperation): void {
    for (const listener of this.listeners) {
      try { listener('confirmed', op); } catch (e) {}
    }
    if (this.wsBroadcaster) {
      const event: BlockchainConfirmedEvent = {
        event: 'blockchain:confirmed',
        grievanceId: op.grievanceId,
        operationId: op.operationId,
        transactionHash: op.txHash || '',
        blockNumber: op.receipt?.blockNumber || 0,
        operationType: op.operationType,
        timestamp: Date.now(),
      };
      this.wsBroadcaster('blockchain:confirmed', event);
    }
  }

  private emitFailed(op: QueuedOperation): void {
    for (const listener of this.listeners) {
      try { listener('failed', op); } catch (e) {}
    }
    if (this.wsBroadcaster) {
      const event: BlockchainFailedEvent = {
        event: 'blockchain:failed',
        grievanceId: op.grievanceId,
        operationId: op.operationId,
        error: op.error || 'Unknown error',
        operationType: op.operationType,
        timestamp: Date.now(),
      };
      this.wsBroadcaster('blockchain:failed', event);
    }
  }

  /**
   * Helper to wait for a specific operation to confirm or fail.
   */
  public async waitForConfirmation(
    operationId: string,
    timeoutMs: number = 15000
  ): Promise<QueuedOperation> {
    const op = this.operations.get(operationId);
    if (op && (op.status === 'CONFIRMED' || op.status === 'FAILED')) {
      return op;
    }

    return new Promise<QueuedOperation>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeListener(listener);
        reject(new Error(`Timeout waiting for confirmation of operation ${operationId}`));
      }, timeoutMs);

      const listener: QueueEventListener = (event, updatedOp) => {
        if (updatedOp.operationId === operationId) {
          if (event === 'confirmed' || event === 'failed') {
            clearTimeout(timer);
            this.removeListener(listener);
            resolve(updatedOp);
          }
        }
      };

      this.addListener(listener);
    });
  }

  /**
   * Helper to wait for all queued/pending operations to finish.
   */
  public async waitForAll(timeoutMs: number = 30000): Promise<QueuedOperation[]> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const hasUnfinished = Array.from(this.operations.values()).some(
        (op) => op.status === 'QUEUED' || op.status === 'PENDING'
      );
      if (!hasUnfinished) {
        return Array.from(this.operations.values());
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error('Timeout waiting for all operations to finish');
  }

  public getOperation(operationId: string): QueuedOperation | undefined {
    return this.operations.get(operationId);
  }

  public getOperationsByGrievance(grievanceId: string): QueuedOperation[] {
    return Array.from(this.operations.values()).filter(
      (op) => op.grievanceId === grievanceId
    );
  }

  public getStats(): {
    total: number;
    queued: number;
    pending: number;
    confirmed: number;
    failed: number;
  } {
    let queued = 0;
    let pending = 0;
    let confirmed = 0;
    let failed = 0;

    for (const op of this.operations.values()) {
      switch (op.status) {
        case 'QUEUED':
          queued++;
          break;
        case 'PENDING':
          pending++;
          break;
        case 'CONFIRMED':
          confirmed++;
          break;
        case 'FAILED':
          failed++;
          break;
      }
    }

    return {
      total: this.operations.size,
      queued,
      pending,
      confirmed,
      failed,
    };
  }

  public getAllOperations(): QueuedOperation[] {
    return Array.from(this.operations.values());
  }

  public clearQueue(): void {
    this.operations.clear();
    for (const timer of this.retryTimers.values()) {
      clearTimeout(timer);
    }
    this.retryTimers.clear();
    this.nonceManager.resetNonce();
    this.saveToDisk();
  }
}

export const txQueue = new TransactionQueue();
