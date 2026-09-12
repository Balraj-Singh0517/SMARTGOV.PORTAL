export type PriorityNumber = 1 | 2 | 3 | 4; // 1=Low, 2=General, 3=High, 4=Urgent
export type StatusNumber = 1 | 2 | 3 | 4 | 5; // 1=Open, 2=InProgress, 3=Transferred, 4=Resolved, 5=Closed

export interface OnChainComplaintRecord {
  complaintId: string;
  complaintHash: string;
  departmentHash: string;
  priority: number;
  status: number;
  latestActionHash: string;
  resolutionHash: string;
  registeredAt: number;
  updatedAt: number;
  actionCount: number;
  exists: boolean;
}

export interface OnChainActionEvent {
  actionHash: string;
  status: number;
  departmentHash: string;
  timestamp: number;
  actionType: string;
}

export type QueueStatus = 'QUEUED' | 'PENDING' | 'CONFIRMED' | 'FAILED';

export type OperationType =
  | 'REGISTER'
  | 'STATUS_UPDATE'
  | 'TRANSFER'
  | 'OFFICER_REPLY'
  | 'RESOLUTION';

export interface QueuedOperation {
  operationId: string;
  grievanceId: string;
  operationType: OperationType;
  payload: any;
  txHash: string | null;
  nonce: number | null;
  attemptCount: number;
  maxAttempts: number;
  createdAt: number;
  updatedAt: number;
  error: string | null;
  status: QueueStatus;
  receipt?: {
    blockNumber?: number;
    gasUsed?: string;
    status?: number;
  } | null;
}

export interface BlockchainConfirmedEvent {
  event: 'blockchain:confirmed';
  grievanceId: string;
  operationId: string;
  transactionHash: string;
  blockNumber: number;
  operationType: OperationType;
  timestamp: number;
}

export interface BlockchainFailedEvent {
  event: 'blockchain:failed';
  grievanceId: string;
  operationId: string;
  error: string;
  operationType: OperationType;
  timestamp: number;
}

export interface BlockchainAuditMetadata {
  operationId?: string;
  txHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  network?: string;
  contractAddress?: string;
  status: 'QUEUED' | 'PENDING' | 'CONFIRMED' | 'FAILED' | 'LOCAL_AUDIT';
  complaintHash: string;
  timestamp: number;
  latestActionHash?: string;
  resolutionHash?: string;
  explorerUrl?: string;
  verified?: boolean;
  error?: string | null;
}

export interface IntegrityVerificationResult {
  complaintId: string;
  verified: boolean;
  onChainHash: string;
  calculatedHash: string;
  statusMismatch: boolean;
  departmentMismatch: boolean;
  blockTimestamp?: number;
  transactionHash?: string;
  network?: string;
  contractAddress?: string;
  explorerUrl?: string;
  auditTrailLength: number;
  history: OnChainActionEvent[];
  details: string;
}

export interface BlockchainNetworkStatus {
  active: boolean;
  network: string;
  chainId: number;
  contractAddress: string;
  currentBlock: number;
  totalComplaintsOnChain: number;
  explorerBaseUrl: string;
  mode: 'live-evm' | 'mock-audit';
  queue?: {
    total: number;
    queued: number;
    pending: number;
    confirmed: number;
    failed: number;
  };
}
