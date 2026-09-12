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

export interface BlockchainAuditMetadata {
  txHash?: string;
  blockNumber?: number;
  network?: string;
  contractAddress?: string;
  status: 'CONFIRMED' | 'PENDING' | 'FAILED' | 'LOCAL_AUDIT';
  complaintHash: string;
  timestamp: number;
  latestActionHash?: string;
  resolutionHash?: string;
  explorerUrl?: string;
  verified?: boolean;
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
}
