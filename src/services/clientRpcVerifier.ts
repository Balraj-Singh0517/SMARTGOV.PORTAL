import { Contract, JsonRpcProvider } from 'ethers';
import {
  computeComplaintHash,
  complaintIdToBytes32,
} from '../utils/clientHashing.ts';
import type { ClientGrievancePayload } from '../utils/clientHashing.ts';

export type VerificationSource = 'DIRECT_RPC' | 'BACKEND_PROXY';

export interface ClientVerificationResult {
  verified: boolean;
  tamperDetected: boolean;
  source: VerificationSource;
  complaintId: string;
  calculatedHash: string;
  onChainHash: string;
  exists: boolean;
  status: 'VERIFIED' | 'TAMPERING_DETECTED' | 'NOT_ON_CHAIN' | 'RPC_ERROR';
  onChainStatus?: number;
  priority?: number;
  latestActionHash?: string;
  resolutionHash?: string;
  registeredAt?: number;
  updatedAt?: number;
  actionCount?: number;
  auditTrailLength?: number;
  network?: string;
  contractAddress?: string;
  rpcUrl?: string;
  details: string;
  rawError?: string;
}

export interface VerificationOptions {
  rpcUrl?: string;
  contractAddress?: string;
  provider?: any;
  timeoutMs?: number;
  forceBackendFallback?: boolean;
}

// Minimal read-only ABI for SmartGovAudit contract (no state modification, no signer needed)
export const SMART_GOV_AUDIT_READ_ABI = [
  "function getComplaint(bytes32 id) view returns (tuple(bytes32 complaintHash, bytes32 departmentHash, bytes32 latestActionHash, bytes32 resolutionHash, uint64 registeredAt, uint64 updatedAt, uint32 actionCount, uint8 priority, uint8 status, bool exists))",
  "function verifyComplaint(bytes32 id, bytes32 candidateHash) view returns (bool isValid)",
  "function verifyResolution(bytes32 id, bytes32 candidateResolutionHash) view returns (bool isValid)",
  "function getAuditHistory(bytes32 id) view returns (tuple(bytes32 actionHash, uint8 status, bytes32 departmentHash, uint256 timestamp, string actionType)[])",
  "function totalComplaints() view returns (uint256)"
];

const DEFAULT_RPC_URL = 'http://127.0.0.1:8545';
const DEFAULT_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const DEFAULT_TIMEOUT_MS = 4000;
const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

let cachedConfig: { rpcUrl: string; contractAddress: string; network: string } | null = null;

/**
 * Resolves blockchain public endpoint configuration safely.
 * Checks environment variables first (VITE_BLOCKCHAIN_RPC_URL, VITE_CONTRACT_ADDRESS),
 * then falls back to public /api/blockchain/status or local defaults.
 * NEVER exposes private keys or signing credentials.
 */
export async function getClientBlockchainConfig(): Promise<{ rpcUrl: string; contractAddress: string; network: string }> {
  if (cachedConfig) {
    return cachedConfig;
  }

  let envRpcUrl = '';
  let envContractAddress = '';

  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      envRpcUrl = (import.meta as any).env.VITE_BLOCKCHAIN_RPC_URL || '';
      envContractAddress = (import.meta as any).env.VITE_CONTRACT_ADDRESS || '';
    }
  } catch {
    // Ignore in non-Vite environments (e.g. Node tests)
  }

  if (typeof process !== 'undefined' && process.env) {
    if (!envRpcUrl) envRpcUrl = process.env.VITE_BLOCKCHAIN_RPC_URL || '';
    if (!envContractAddress) envContractAddress = process.env.VITE_CONTRACT_ADDRESS || '';
  }

  if (envRpcUrl && envContractAddress) {
    cachedConfig = {
      rpcUrl: envRpcUrl,
      contractAddress: envContractAddress,
      network: 'Hardhat Local (EVM)',
    };
    return cachedConfig;
  }

  // Attempt dynamic discovery from /api/blockchain/status if in browser
  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    try {
      const res = await fetch('/api/blockchain/status', { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.status) {
          cachedConfig = {
            rpcUrl: envRpcUrl || data.status.rpcUrl || DEFAULT_RPC_URL,
            contractAddress: envContractAddress || data.status.contractAddress || DEFAULT_CONTRACT_ADDRESS,
            network: data.status.network || 'Hardhat Local',
          };
          return cachedConfig;
        }
      }
    } catch {
      // Backend not yet ready or unreachable
    }
  }

  cachedConfig = {
    rpcUrl: envRpcUrl || DEFAULT_RPC_URL,
    contractAddress: envContractAddress || DEFAULT_CONTRACT_ADDRESS,
    network: 'Hardhat Local (EVM 31337)',
  };
  return cachedConfig;
}

/**
 * Executes a promise with an enforced timeout.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Direct read-only JSON-RPC verification against the SmartGovAudit smart contract.
 * Queries on-chain storage directly via eth_call and compares hashes locally in-browser.
 */
async function verifyDirectRpc(
  grievance: ClientGrievancePayload,
  calculatedHash: string,
  idBytes32: string,
  rpcUrl: string,
  contractAddress: string,
  timeoutMs: number,
  customProvider?: any
): Promise<ClientVerificationResult> {
  const provider = customProvider || new JsonRpcProvider(rpcUrl);
  const contract = new Contract(contractAddress, SMART_GOV_AUDIT_READ_ABI, provider);

  // Direct eth_call to getComplaint(bytes32 id)
  let complaintData: any;
  try {
    complaintData = await withTimeout(
      contract.getComplaint(idBytes32),
      timeoutMs,
      `Direct RPC eth_call timed out after ${timeoutMs}ms`
    );
  } catch (err: any) {
    const errMsg = String(err?.message || err);
    const errData = String(err?.data || '');
    if (
      errMsg.includes('ComplaintDoesNotExist') ||
      errData.includes('ComplaintDoesNotExist') ||
      err?.errorName === 'ComplaintDoesNotExist' ||
      errMsg.includes('0x38411b93') // keccak selector for ComplaintDoesNotExist(bytes32)
    ) {
      return {
        verified: false,
        tamperDetected: false,
        source: 'DIRECT_RPC',
        complaintId: grievance.id,
        calculatedHash,
        onChainHash: ZERO_BYTES32,
        exists: false,
        status: 'NOT_ON_CHAIN',
        details: 'Grievance is not anchored on the blockchain ledger yet (ComplaintDoesNotExist).',
        rpcUrl,
        contractAddress,
      };
    }
    throw err;
  }

  const exists: boolean = Boolean(complaintData.exists);
  const onChainHash: string = String(complaintData.complaintHash || ZERO_BYTES32);

  if (!exists || onChainHash === ZERO_BYTES32) {
    return {
      verified: false,
      tamperDetected: false,
      source: 'DIRECT_RPC',
      complaintId: grievance.id,
      calculatedHash,
      onChainHash: ZERO_BYTES32,
      exists: false,
      status: 'NOT_ON_CHAIN',
      details: 'Grievance is not anchored on the blockchain ledger yet. It may be queued or pending block confirmation.',
      rpcUrl,
      contractAddress,
    };
  }

  // Local in-memory cryptographic hash comparison
  const isMatch = calculatedHash.toLowerCase() === onChainHash.toLowerCase();

  return {
    verified: isMatch,
    tamperDetected: !isMatch,
    source: 'DIRECT_RPC',
    complaintId: grievance.id,
    calculatedHash,
    onChainHash,
    exists: true,
    status: isMatch ? 'VERIFIED' : 'TAMPERING_DETECTED',
    onChainStatus: Number(complaintData.status),
    priority: Number(complaintData.priority),
    latestActionHash: String(complaintData.latestActionHash),
    resolutionHash: String(complaintData.resolutionHash),
    registeredAt: Number(complaintData.registeredAt),
    updatedAt: Number(complaintData.updatedAt),
    actionCount: Number(complaintData.actionCount),
    contractAddress,
    rpcUrl,
    details: isMatch
      ? 'Zero-Trust Direct EVM Proof: In-browser Keccak-256 matches smart contract storage byte-for-byte.'
      : 'TAMPERING DETECTED: Locally computed Keccak-256 does NOT match the immutable on-chain record!',
  };
}

/**
 * Backend fallback verification when direct RPC node is unavailable.
 * CRITICAL: Even when falling back to the backend proxy, the client NEVER trusts
 * an arbitrary backend `verified: true`! It strictly verifies that the onChainHash
 * returned by the proxy matches the client's own locally calculated hash.
 */
async function verifyBackendFallback(
  grievance: ClientGrievancePayload,
  calculatedHash: string,
  reason: string
): Promise<ClientVerificationResult> {
  try {
    const res = await fetch(`/api/blockchain/verify/${encodeURIComponent(grievance.id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: grievance.id,
        description: grievance.description,
        department: grievance.department,
        priority: grievance.priority,
        location: grievance.location,
      }),
    });

    if (!res.ok) {
      throw new Error(`Backend proxy responded with HTTP ${res.status}`);
    }

    const data = await res.json();
    const result = data.result || {};
    const backendOnChainHash = String(result.onChainHash || ZERO_BYTES32);

    // CRITICAL SECURITY ENFORCEMENT:
    // Disregard backend's claim of `result.verified`!
    // The client MUST independently compare its own locally computed hash against the on-chain hash!
    const isMatch =
      backendOnChainHash !== ZERO_BYTES32 &&
      calculatedHash.toLowerCase() === backendOnChainHash.toLowerCase();

    const exists = backendOnChainHash !== ZERO_BYTES32;

    return {
      verified: isMatch,
      tamperDetected: exists && !isMatch,
      source: 'BACKEND_PROXY',
      complaintId: grievance.id,
      calculatedHash,
      onChainHash: backendOnChainHash,
      exists,
      status: exists ? (isMatch ? 'VERIFIED' : 'TAMPERING_DETECTED') : 'NOT_ON_CHAIN',
      network: result.network,
      contractAddress: result.contractAddress,
      auditTrailLength: result.auditTrailLength,
      details: isMatch
        ? `Backend Proxy Fallback: Locally calculated hash matches on-chain hash. (${reason})`
        : `TAMPERING DETECTED (via Proxy): Locally computed hash does NOT match on-chain record! (${reason})`,
    };
  } catch (backendErr: any) {
    return {
      verified: false,
      tamperDetected: false,
      source: 'BACKEND_PROXY',
      complaintId: grievance.id,
      calculatedHash,
      onChainHash: ZERO_BYTES32,
      exists: false,
      status: 'RPC_ERROR',
      details: `Verification failed: Direct RPC was unavailable (${reason}), and backend fallback failed: ${backendErr?.message || 'Network error'}`,
      rawError: backendErr?.message,
    };
  }
}

/**
 * Main verification entrypoint for frontend components (Citizen & Officer).
 *
 * Sequence:
 * 1. Computes deterministic Keccak-256 hash in browser memory (clientHashing.ts).
 * 2. Attempts direct JSON-RPC read-only query (DIRECT_RPC) to SmartGovAudit contract.
 * 3. Compares locally calculated hash against on-chain hash.
 * 4. Falls back to BACKEND_PROXY ONLY when direct RPC is unavailable.
 * 5. Under NO circumstances does it trust a backend `verified: true` when hashes mismatch.
 */
export async function verifyGrievanceIntegrity(
  grievance: ClientGrievancePayload,
  options: VerificationOptions = {}
): Promise<ClientVerificationResult> {
  const calculatedHash = computeComplaintHash(grievance);
  const idBytes32 = complaintIdToBytes32(grievance.id);

  const config = await getClientBlockchainConfig();
  const rpcUrl = options.rpcUrl || config.rpcUrl;
  const contractAddress = options.contractAddress || config.contractAddress;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

  // If explicitly requested to test backend fallback (e.g. in tests)
  if (options.forceBackendFallback) {
    return verifyBackendFallback(grievance, calculatedHash, 'Forced backend fallback');
  }

  // Attempt Primary: Direct in-browser JSON-RPC (Zero-Trust)
  try {
    const directResult = await verifyDirectRpc(
      grievance,
      calculatedHash,
      idBytes32,
      rpcUrl,
      contractAddress,
      timeoutMs,
      options.provider
    );
    return directResult;
  } catch (rpcErr: any) {
    const errorMsg = rpcErr?.message || String(rpcErr);
    // Direct RPC failed (e.g. connection refused, CORS, timeout) -> Fallback to Backend Proxy
    return verifyBackendFallback(grievance, calculatedHash, `Direct RPC unreachable: ${errorMsg}`);
  }
}

/**
 * Directly queries on-chain audit trail history for a grievance without relying on backend logs.
 */
export async function fetchOnChainAuditHistory(
  complaintId: string,
  options: VerificationOptions = {}
): Promise<any[]> {
  const idBytes32 = complaintIdToBytes32(complaintId);
  const config = await getClientBlockchainConfig();
  const rpcUrl = options.rpcUrl || config.rpcUrl;
  const contractAddress = options.contractAddress || config.contractAddress;

  try {
    const provider = options.provider || new JsonRpcProvider(rpcUrl);
    const contract = new Contract(contractAddress, SMART_GOV_AUDIT_READ_ABI, provider);
    const history = await withTimeout(
      contract.getAuditHistory(idBytes32),
      options.timeoutMs || DEFAULT_TIMEOUT_MS,
      'Direct RPC history fetch timed out'
    );
    return history.map((event: any) => ({
      actionHash: String(event.actionHash),
      status: Number(event.status),
      departmentHash: String(event.departmentHash),
      timestamp: Number(event.timestamp) * 1000,
      actionType: String(event.actionType),
    }));
  } catch {
    // If direct RPC fails, fetch from backend endpoint
    try {
      const res = await fetch(`/api/blockchain/grievance/${encodeURIComponent(complaintId)}`);
      if (res.ok) {
        const data = await res.json();
        return data.data?.history || [];
      }
    } catch {
      // Ignore
    }
    return [];
  }
}
