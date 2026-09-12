export type PriorityLevel = 'High' | 'General' | 'Urgent' | 'Low';
export type GrievanceStatus = 'Open' | 'In Progress' | 'Resolved' | 'Under Review';

export interface GrievanceLocation {
  name: string;
  zone: string;
  ward: string;
  lat: number;
  lng: number;
  address?: string;
}

export interface GrievanceTimelineItem {
  status: string;
  timestamp: string;
  note: string;
  actor: string;
}

export interface GrievanceAttachment {
  type: 'photo' | 'location' | 'document';
  name: string;
  url?: string;
  previewUrl?: string;
}

export interface ResolutionProof {
  officerName: string;
  resolvedAt: string;
  notes: string;
  photoUrl?: string;
  materialsUsed?: string;
}

export interface OfficialReply {
  id: string;
  officerName: string;
  officerEmail: string;
  securityCode?: string;
  department?: string;
  replyText: string;
  statusSet: 'unseen' | 'in_progress' | 'solved';
  timestamp: string;
}

export interface AuthUser {
  email: string;
  name: string;
  role: 'citizen' | 'officer';
  department?: string;
  uniqueSecurityCode?: string;
  avatarUrl?: string;
}

export interface Grievance {
  id: string;
  citizenUid: string;
  citizenName?: string;
  submittedAt: string;
  rawTimestamp: number;
  description: string;
  englishTranslation?: string;
  detectedLanguage: string;
  title: string;
  department: string;
  confidenceScore: number;
  priority: PriorityLevel;
  urgencyLevel: 'High Risk' | 'Moderate' | 'Low';
  sentiment: string;
  entities: string[];
  status: GrievanceStatus;
  location: GrievanceLocation;
  supportersCount: number;
  hasSupported?: boolean;
  attachments?: GrievanceAttachment[];
  resolutionProof?: ResolutionProof;
  timeline?: GrievanceTimelineItem[];
  officialReplies?: OfficialReply[];
  isUnseen?: boolean;
  blockchainAudit?: BlockchainAuditMetadata;
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
  details: string;
}

export interface AIAnalysisResult {
  detectedLanguage: string;
  contextSummary: string;
  translatedText: string;
  recommendedDepartment: string;
  confidenceScore: number;
  priority: PriorityLevel;
  urgencyLevel: 'High Risk' | 'Moderate' | 'Low';
  tone: string;
  extractedEntities: string[];
  suggestedTitle: string;
  routingRationale?: string;
  antiJurisdictionConflict?: boolean;
  similarGrievance?: {
    id: string;
    title: string;
    description: string;
    matchPercentage: number;
    supporters: number;
    status: string;
  } | null;
}

export interface Officer {
  id: string;
  name: string;
  initials: string;
  department: string;
  activeCases: number;
  resolved30d: number;
  efficiency: number;
  efficiencyScore?: number;
  badge?: string;
  role?: string;
  avatar?: string;
  avatarUrl?: string;
}

export interface DepartmentSummary {
  id?: string;
  name: string;
  shortName?: string;
  category?: string;
  activeComplaints?: number;
  resolvedComplaints?: number;
  slaPercent?: number;
  avgHours?: number;
  officersCount?: number;
  iconName?: string;
  accentColor?: string;
  officerInCharge: string;
  activeCases: number;
  resolvedThisMonth: number;
  resolutionSla: string;
  contactPhone: string;
}

export interface AISystemMetrics {
  languageDetectionLatency: number;
  categoryConfidenceAvg: number;
  duplicateQueueCount: number;
  totalProcessed24h: number;
  routingAccuracy: number;
  systemLoadPercent: number;
}

export type NotificationStatusType = 'seen' | 'solved' | 'in_progress' | 'urgent';

export interface PortalNotification {
  id: string;
  grievanceId: string;
  title: string;
  desc: string;
  category: string;
  department: string;
  location: string;
  statusType: NotificationStatusType;
  seen: boolean;
  seenAt?: string;
  seenBy?: string;
  solved: boolean;
  solvedAt?: string;
  solvedBy?: string;
  resolutionProofNote?: string;
  isRecent: boolean;
  timeAgo: string;
  rawTimestamp: number;
  priority: PriorityLevel;
}

export type WebSocketEventType =
  | 'init:sync'
  | 'presence:update'
  | 'grievance:created'
  | 'grievance:updated'
  | 'grievance:status_changed'
  | 'grievance:transferred'
  | 'grievance:replied'
  | 'grievance:supported'
  | 'notification:new'
  | 'notification:updated'
  | 'client:support'
  | 'client:create_grievance'
  | 'client:update_status'
  | 'ping'
  | 'pong';

export interface WebSocketMessage<T = any> {
  type: WebSocketEventType;
  payload: T;
  timestamp: number;
}

export interface WebSocketContextValue {
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  onlineCount: number;
  lastMessage: WebSocketMessage | null;
  sendMessage: (type: string, payload?: any) => void;
  subscribe: (eventType: WebSocketEventType | string, callback: (message: WebSocketMessage) => void) => () => void;
  reconnect: () => void;
}
