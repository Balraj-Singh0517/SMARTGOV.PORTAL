import { ethers } from 'ethers';
import {
  computeComplaintHash,
  computeActionHash,
  computeResolutionHash,
  complaintIdToBytes32,
  departmentToBytes32,
} from './hashing';
import {
  OnChainComplaintRecord,
  OnChainActionEvent,
  BlockchainAuditMetadata,
  IntegrityVerificationResult,
  BlockchainNetworkStatus,
} from './types';
import { getContractConfig, SMART_GOV_AUDIT_ABI } from './contract';
import { txQueue, type WsBroadcaster } from './queue/txQueue.ts';

// Mapping helper for Status enum in SmartGovAudit.sol
export const STATUS_MAP: Record<string, number> = {
  Open: 1,
  'In Progress': 2,
  Transferred: 3,
  Resolved: 4,
  Closed: 5,
};

export const REVERSE_STATUS_MAP: Record<number, string> = {
  1: 'Open',
  2: 'In Progress',
  3: 'Transferred',
  4: 'Resolved',
  5: 'Closed',
};

// Mapping helper for Priority enum in SmartGovAudit.sol
export const PRIORITY_MAP: Record<string, number> = {
  Low: 1,
  General: 2,
  High: 3,
  Urgent: 4,
};

class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private isConnected: boolean = false;
  private config = getContractConfig();

  // In-memory idempotency cache: `${id}_${actionHash}` => txHash
  private processedActions: Set<string> = new Set();

  // Local tamper-evident fallback store if RPC node is temporarily offline
  private localLedger: Map<
    string,
    {
      record: OnChainComplaintRecord;
      history: OnChainActionEvent[];
      metadata: BlockchainAuditMetadata;
    }
  > = new Map();

  constructor() {
    this.setupQueueListeners();
    this.initialize();
  }

  private setupQueueListeners(): void {
    txQueue.addListener((event, op) => {
      const local = this.localLedger.get(op.grievanceId);
      if (local) {
        if (event === 'confirmed') {
          local.metadata.status = 'CONFIRMED';
          local.metadata.verified = true;
          if (op.txHash) local.metadata.txHash = op.txHash;
          if (op.receipt?.blockNumber) local.metadata.blockNumber = op.receipt.blockNumber;
          if (op.receipt?.gasUsed) local.metadata.gasUsed = op.receipt.gasUsed;
        } else if (event === 'failed') {
          local.metadata.status = 'FAILED';
          local.metadata.error = op.error || undefined;
        } else if (event === 'pending') {
          local.metadata.status = 'PENDING';
          if (op.txHash) local.metadata.txHash = op.txHash;
        }
      }
    });
  }

  public setWsBroadcaster(broadcaster: WsBroadcaster | null): void {
    txQueue.setBroadcaster(broadcaster);
  }

  public shutdown(): void {
    txQueue.saveToDisk();
  }

  public getQueueOperations(grievanceId?: string) {
    if (grievanceId) {
      return txQueue.getOperationsByGrievance(grievanceId);
    }
    return txQueue.getAllOperations();
  }

  public async initialize() {
    try {
      this.config = getContractConfig();
      if (!this.config.contractAddress) {
        console.log(
          'ℹ️ Blockchain notice: No contract address configured. Operating in Local Tamper-Evident Ledger mode.'
        );
        return;
      }

      // Quick probe to check if RPC node is active without triggering ethers retry loop
      const isRpcActive = await fetch(this.config.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
        signal: AbortSignal.timeout(1000),
      })
        .then((res) => res.ok)
        .catch(() => false);

      if (!isRpcActive) {
        console.log(
          `ℹ️ Blockchain RPC offline at ${this.config.rpcUrl}. Operating with Local Tamper-Evident Ledger mode.`
        );
        this.isConnected = false;
        return;
      }

      const staticNet = ethers.Network.from({
        name: this.config.network,
        chainId: this.config.chainId,
      });

      this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl, staticNet, {
        staticNetwork: staticNet,
      });

      if (this.config.privateKey) {
        this.signer = new ethers.Wallet(this.config.privateKey, this.provider);
        this.contract = new ethers.Contract(
          this.config.contractAddress,
          SMART_GOV_AUDIT_ABI,
          this.signer
        );
        this.isConnected = true;
        console.log(
          `Connected to Blockchain Node at ${this.config.rpcUrl} (Contract: ${this.config.contractAddress})`
        );

        // Reconcile pending/queued operations upon startup and process remaining queue
        await txQueue.reconcileOnStartup(this.contract, this.provider);
        txQueue.processQueue(this.contract, this.signer, this.provider);
      }
    } catch (err: any) {
      console.log(
        `ℹ️ Blockchain RPC unavailable (${err?.message || 'offline'}). Operating with local tamper-evident verification ledger.`
      );
      this.isConnected = false;
    }
  }

  public getNetworkStatus(): BlockchainNetworkStatus {
    return {
      active: this.isConnected,
      network: this.config.network,
      chainId: this.config.chainId,
      contractAddress: this.config.contractAddress || '0xLocalAuditLedger',
      rpcUrl: this.config.rpcUrl,
      currentBlock: 0,
      totalComplaintsOnChain: this.localLedger.size,
      explorerBaseUrl: this.config.explorerUrl,
      mode: this.isConnected ? 'live-evm' : 'mock-audit',
      queue: txQueue.getStats(),
    };
  }

  /**
   * Registers a new complaint on-chain.
   * Performs deterministic canonical hashing and commits record asynchronously.
   */
  public async registerComplaint(grievance: {
    id: string;
    description: string;
    department: string;
    priority: string;
    location?: { lat: number; lng: number };
  }): Promise<BlockchainAuditMetadata> {
    const complaintHash = computeComplaintHash(grievance);
    const idBytes32 = complaintIdToBytes32(grievance.id);
    const deptHash = departmentToBytes32(grievance.department);
    const priorityNum = PRIORITY_MAP[grievance.priority] || 2;
    const now = Date.now();

    // Enqueue operation into durable transaction queue
    const queuedOp = txQueue.enqueue(grievance.id, 'REGISTER', {
      idBytes32,
      complaintHash,
      deptHash,
      priorityNum,
    });

    // If already in local ledger
    const existing = this.localLedger.get(grievance.id);
    if (existing) {
      if (queuedOp.status === 'CONFIRMED') {
        existing.metadata.status = 'CONFIRMED';
        existing.metadata.verified = true;
        if (queuedOp.txHash) existing.metadata.txHash = queuedOp.txHash;
      }
      return existing.metadata;
    }

    const metadata: BlockchainAuditMetadata = {
      complaintHash,
      timestamp: now,
      status: queuedOp.status, // Always reflect real queue status: 'QUEUED', 'PENDING', or 'CONFIRMED'
      network: this.config.network,
      contractAddress: this.config.contractAddress || 'SmartGovAudit',
      explorerUrl: queuedOp.txHash
        ? `${this.config.explorerUrl}${queuedOp.txHash}`
        : `${this.config.explorerUrl}${complaintHash}`,
      verified: queuedOp.status === 'CONFIRMED',
      txHash: queuedOp.txHash || undefined,
    };

    // Store in local ledger for immediate read consistency
    const initialRecord: OnChainComplaintRecord = {
      complaintId: grievance.id,
      complaintHash,
      departmentHash: deptHash,
      priority: priorityNum,
      status: 1, // Open
      latestActionHash: complaintHash,
      resolutionHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      registeredAt: Math.floor(now / 1000),
      updatedAt: Math.floor(now / 1000),
      actionCount: 1,
      exists: true,
    };

    const initialEvent: OnChainActionEvent = {
      actionHash: complaintHash,
      status: 1,
      departmentHash: deptHash,
      timestamp: Math.floor(now / 1000),
      actionType: 'REGISTERED',
    };

    this.localLedger.set(grievance.id, {
      record: initialRecord,
      history: [initialEvent],
      metadata,
    });

    // If EVM contract is live, process queue asynchronously
    if (this.isConnected && this.contract && this.signer && this.provider) {
      txQueue.processQueue(this.contract, this.signer, this.provider);
    }

    return metadata;
  }

  /**
   * Records a status transition on-chain.
   */
  public async recordStatusChange(
    id: string,
    newStatus: string,
    note: string,
    officerName: string
  ): Promise<BlockchainAuditMetadata | null> {
    const idBytes32 = complaintIdToBytes32(id);
    const statusCode = STATUS_MAP[newStatus] || 2;
    const actionHash = computeActionHash({
      actionType: 'STATUS_UPDATE',
      grievanceId: id,
      officerName,
      details: note || `Status updated to ${newStatus}`,
    });

    const now = Math.floor(Date.now() / 1000);
    const existing = this.localLedger.get(id);
    if (existing) {
      existing.record.status = statusCode;
      existing.record.latestActionHash = actionHash;
      existing.record.updatedAt = now;
      existing.record.actionCount++;
      existing.history.push({
        actionHash,
        status: statusCode,
        departmentHash: existing.record.departmentHash,
        timestamp: now,
        actionType: 'STATUS_UPDATE',
      });
      existing.metadata.latestActionHash = actionHash;
      if (existing.metadata.status !== 'CONFIRMED') {
        existing.metadata.status = 'QUEUED';
      }
    }

    // Enqueue operation into durable queue
    txQueue.enqueue(id, 'STATUS_UPDATE', {
      idBytes32,
      newStatus: statusCode,
      actionHash,
    });

    if (this.isConnected && this.contract && this.signer && this.provider) {
      txQueue.processQueue(this.contract, this.signer, this.provider);
    }

    return existing ? existing.metadata : null;
  }

  /**
   * Records a department transfer on-chain.
   */
  public async recordDepartmentTransfer(
    id: string,
    newDepartment: string,
    reason: string,
    officerName: string
  ): Promise<BlockchainAuditMetadata | null> {
    const idBytes32 = complaintIdToBytes32(id);
    const newDeptHash = departmentToBytes32(newDepartment);
    const actionHash = computeActionHash({
      actionType: 'TRANSFER',
      grievanceId: id,
      officerName,
      details: `Transferred to ${newDepartment}: ${reason}`,
    });

    const now = Math.floor(Date.now() / 1000);
    const existing = this.localLedger.get(id);
    if (existing) {
      existing.record.departmentHash = newDeptHash;
      existing.record.status = 3; // Transferred
      existing.record.latestActionHash = actionHash;
      existing.record.updatedAt = now;
      existing.record.actionCount++;
      existing.history.push({
        actionHash,
        status: 3,
        departmentHash: newDeptHash,
        timestamp: now,
        actionType: 'TRANSFER',
      });
      existing.metadata.latestActionHash = actionHash;
      if (existing.metadata.status !== 'CONFIRMED') {
        existing.metadata.status = 'QUEUED';
      }
    }

    // Enqueue operation into durable queue
    txQueue.enqueue(id, 'TRANSFER', {
      idBytes32,
      newDeptHash,
      actionHash,
    });

    if (this.isConnected && this.contract && this.signer && this.provider) {
      txQueue.processQueue(this.contract, this.signer, this.provider);
    }

    return existing ? existing.metadata : null;
  }

  /**
   * Records an official officer reply action on-chain.
   */
  public async recordOfficerReply(
    id: string,
    replyText: string,
    officerName: string,
    securityCode?: string
  ): Promise<BlockchainAuditMetadata | null> {
    const idBytes32 = complaintIdToBytes32(id);
    const actionHash = computeActionHash({
      actionType: 'OFFICIAL_REPLY',
      grievanceId: id,
      officerName: `${officerName} [${securityCode || 'GOV'}]`,
      details: replyText,
    });

    const now = Math.floor(Date.now() / 1000);
    const existing = this.localLedger.get(id);
    if (existing) {
      existing.record.latestActionHash = actionHash;
      existing.record.updatedAt = now;
      existing.record.actionCount++;
      existing.history.push({
        actionHash,
        status: existing.record.status,
        departmentHash: existing.record.departmentHash,
        timestamp: now,
        actionType: 'OFFICIAL_REPLY',
      });
      existing.metadata.latestActionHash = actionHash;
      if (existing.metadata.status !== 'CONFIRMED') {
        existing.metadata.status = 'QUEUED';
      }
    }

    // Enqueue operation into durable queue
    txQueue.enqueue(id, 'OFFICER_REPLY', {
      idBytes32,
      actionHash,
      actionType: 'OFFICIAL_REPLY',
    });

    if (this.isConnected && this.contract && this.signer && this.provider) {
      txQueue.processQueue(this.contract, this.signer, this.provider);
    }

    return existing ? existing.metadata : null;
  }

  /**
   * Records a resolution proof and photo content hash on-chain.
   */
  public async recordResolutionProof(
    id: string,
    proof: {
      officerName: string;
      notes: string;
      materialsUsed?: string;
      photoUrl?: string;
    }
  ): Promise<BlockchainAuditMetadata | null> {
    const idBytes32 = complaintIdToBytes32(id);
    const resolutionHash = computeResolutionHash(proof);
    const actionHash = computeActionHash({
      actionType: 'RESOLUTION',
      grievanceId: id,
      officerName: proof.officerName,
      details: `Resolution certified with proof: ${proof.notes}`,
    });

    const now = Math.floor(Date.now() / 1000);
    const existing = this.localLedger.get(id);
    if (existing) {
      existing.record.status = 4; // Resolved
      existing.record.resolutionHash = resolutionHash;
      existing.record.latestActionHash = actionHash;
      existing.record.updatedAt = now;
      existing.record.actionCount++;
      existing.history.push({
        actionHash,
        status: 4,
        departmentHash: existing.record.departmentHash,
        timestamp: now,
        actionType: 'RESOLUTION',
      });
      existing.metadata.resolutionHash = resolutionHash;
      existing.metadata.latestActionHash = actionHash;
      if (existing.metadata.status !== 'CONFIRMED') {
        existing.metadata.status = 'QUEUED';
      }
    }

    // Enqueue operation into durable queue
    txQueue.enqueue(id, 'RESOLUTION', {
      idBytes32,
      resolutionHash,
      actionHash,
    });

    if (this.isConnected && this.contract && this.signer && this.provider) {
      txQueue.processQueue(this.contract, this.signer, this.provider);
    }

    return existing ? existing.metadata : null;
  }

  /**
   * Performs cryptographic integrity verification of current off-chain grievance data
   * against the on-chain recorded hash.
   */
  public async verifyIntegrity(
    id: string,
    currentGrievanceData: {
      id: string;
      description: string;
      department: string;
      priority: string;
      location?: { lat: number; lng: number };
    }
  ): Promise<IntegrityVerificationResult> {
    const calculatedHash = computeComplaintHash(currentGrievanceData);
    const idBytes32 = complaintIdToBytes32(id);

    let onChainHash = '';
    let exists = false;
    let blockTimestamp = Date.now();
    let history: OnChainActionEvent[] = [];

    // Try on-chain lookup first if connected
    if (this.isConnected && this.contract) {
      try {
        const onChainRecord = await this.contract.getComplaint(idBytes32);
        if (onChainRecord && onChainRecord.exists) {
          onChainHash = onChainRecord.complaintHash;
          exists = true;
          blockTimestamp = Number(onChainRecord.registeredAt) * 1000;
          const rawHistory = await this.contract.getAuditHistory(idBytes32);
          history = rawHistory.map((item: any) => ({
            actionHash: item.actionHash,
            status: Number(item.status),
            departmentHash: item.departmentHash,
            timestamp: Number(item.timestamp),
            actionType: item.actionType,
          }));
        }
      } catch {
        // Fallback to local ledger below
      }
    }

    // Fallback to local ledger if on-chain not reached or running in mock mode
    if (!exists) {
      const local = this.localLedger.get(id);
      if (local) {
        onChainHash = local.record.complaintHash;
        exists = true;
        blockTimestamp = local.record.registeredAt * 1000;
        history = local.history;
      }
    }

    const verified = exists && onChainHash === calculatedHash;

    return {
      complaintId: id,
      verified,
      onChainHash: onChainHash || '0xNotRegistered',
      calculatedHash,
      statusMismatch: false,
      departmentMismatch: false,
      blockTimestamp,
      contractAddress: this.config.contractAddress,
      network: this.config.network,
      explorerUrl: `${this.config.explorerUrl}${onChainHash}`,
      auditTrailLength: history.length,
      history,
      details: verified
        ? 'INTEGRITY VERIFIED: Off-chain complaint data matches on-chain cryptographic proof perfectly.'
        : exists
        ? 'INTEGRITY CHECK FAILED: Calculated hash differs from on-chain audit record. Data tampering detected!'
        : 'UNREGISTERED: Complaint is not yet registered on the blockchain audit layer.',
    };
  }

  /**
   * Retrieves on-chain audit details for a grievance.
   */
  public async getAuditRecord(id: string) {
    const idBytes32 = complaintIdToBytes32(id);
    const queueOperations = txQueue.getOperationsByGrievance(id);

    if (this.isConnected && this.contract) {
      try {
        const record = await this.contract.getComplaint(idBytes32);
        if (record && record.exists) {
          const history = await this.contract.getAuditHistory(idBytes32);
          return {
            onChain: true,
            record: {
              complaintId: id,
              complaintHash: record.complaintHash,
              departmentHash: record.departmentHash,
              priority: Number(record.priority),
              status: Number(record.status),
              latestActionHash: record.latestActionHash,
              resolutionHash: record.resolutionHash,
              registeredAt: Number(record.registeredAt),
              updatedAt: Number(record.updatedAt),
              actionCount: Number(record.actionCount),
              exists: record.exists,
            },
            history: history.map((item: any) => ({
              actionHash: item.actionHash,
              status: Number(item.status),
              departmentHash: item.departmentHash,
              timestamp: Number(item.timestamp),
              actionType: item.actionType,
            })),
            queueOperations,
          };
        }
      } catch {
        // Fall through to local ledger
      }
    }

    const local = this.localLedger.get(id);
    if (local) {
      return {
        onChain: false,
        record: local.record,
        history: local.history,
        metadata: local.metadata,
        queueOperations,
      };
    }

    return null;
  }
}

export const blockchainService = new BlockchainService();
