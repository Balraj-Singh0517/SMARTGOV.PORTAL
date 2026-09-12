import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Complete ABI for SmartGovAudit contract
export const SMART_GOV_AUDIT_ABI = [
  "constructor(address initialAdmin, address initialRelayer)",
  "error ActionTypeTooLong()",
  "error CannotTransferResolvedComplaint(bytes32 id)",
  "error ComplaintAlreadyRegistered(bytes32 id)",
  "error ComplaintAlreadyResolved(bytes32 id)",
  "error ComplaintAlreadyTerminal(bytes32 id)",
  "error ComplaintDoesNotExist(bytes32 id)",
  "error IdenticalDepartment()",
  "error InvalidComplaintId()",
  "error InvalidHash()",
  "error InvalidStatusTransition(uint8 currentStatus, uint8 attemptedStatus)",
  "error ZeroDepartmentHash()",
  "event ComplaintRegistered(bytes32 indexed id, bytes32 indexed complaintHash, bytes32 departmentHash, uint8 priority, uint256 timestamp)",
  "event ComplaintResolved(bytes32 indexed id, bytes32 indexed resolutionHash, bytes32 actionHash, uint256 timestamp)",
  "event ComplaintStatusChanged(bytes32 indexed id, uint8 previousStatus, uint8 newStatus, bytes32 actionHash, uint256 timestamp)",
  "event ComplaintTransferred(bytes32 indexed id, bytes32 previousDeptHash, bytes32 newDeptHash, bytes32 actionHash, uint256 timestamp)",
  "event OfficerActionRecorded(bytes32 indexed id, bytes32 actionHash, string actionType, uint256 timestamp)",
  "function AUDITOR_ROLE() view returns (bytes32)",
  "function BACKEND_ROLE() view returns (bytes32)",
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function getAuditHistory(bytes32 id) view returns (tuple(bytes32 actionHash, uint8 status, bytes32 departmentHash, uint256 timestamp, string actionType)[])",
  "function getAuditHistoryPaginated(bytes32 id, uint256 offset, uint256 limit) view returns (tuple(bytes32 actionHash, uint8 status, bytes32 departmentHash, uint256 timestamp, string actionType)[] records, uint256 total)",
  "function getComplaint(bytes32 id) view returns (tuple(bytes32 complaintHash, bytes32 departmentHash, bytes32 latestActionHash, bytes32 resolutionHash, uint64 registeredAt, uint64 updatedAt, uint32 actionCount, uint8 priority, uint8 status, bool exists))",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function pause()",
  "function recordOfficerAction(bytes32 id, bytes32 actionHash, string actionType)",
  "function recordResolution(bytes32 id, bytes32 resolutionHash, bytes32 actionHash)",
  "function registerComplaint(bytes32 id, bytes32 complaintHash, bytes32 departmentHash, uint8 priority)",
  "function totalComplaints() view returns (uint256)",
  "function transferDepartment(bytes32 id, bytes32 newDeptHash, bytes32 actionHash)",
  "function unpause()",
  "function updateStatus(bytes32 id, uint8 newStatus, bytes32 actionHash)",
  "function verifyComplaint(bytes32 id, bytes32 candidateHash) view returns (bool isValid)",
  "function verifyResolution(bytes32 id, bytes32 candidateResolutionHash) view returns (bool isValid)"
];

export interface ContractConfig {
  rpcUrl: string;
  privateKey?: string;
  contractAddress?: string;
  network: string;
  chainId: number;
  explorerUrl: string;
}

export function getContractConfig(): ContractConfig {
  // Try to read deployment file if available
  let deployedAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || '';
  const candidatePaths = [
    path.join(__dirname, 'contractDeployment.json'),
    path.join(process.cwd(), 'server/services/blockchain/contractDeployment.json'),
    path.join(__dirname, 'server/services/blockchain/contractDeployment.json'),
  ];
  for (const p of candidatePaths) {
    if (!deployedAddress && fs.existsSync(p)) {
      try {
        const meta = JSON.parse(fs.readFileSync(p, 'utf-8'));
        if (meta.address) {
          deployedAddress = meta.address;
          break;
        }
      } catch {
        // Ignore
      }
    }
  }

  return {
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545',
    privateKey:
      process.env.BLOCKCHAIN_PRIVATE_KEY ||
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Default Hardhat dev key
    contractAddress: deployedAddress,
    network: process.env.BLOCKCHAIN_NETWORK || 'hardhat-local',
    chainId: parseInt(process.env.BLOCKCHAIN_CHAIN_ID || '31337', 10),
    explorerUrl: process.env.BLOCKCHAIN_EXPLORER_URL || 'https://sepolia.etherscan.io/tx/',
  };
}
