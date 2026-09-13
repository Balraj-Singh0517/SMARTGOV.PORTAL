import { keccak256 as ethersKeccak256, sha256 as ethersSha256, toUtf8Bytes } from 'ethers';

/**
 * Deterministic JSON stringifier that sorts all object keys lexicographically.
 * Ensures identical objects always generate the exact same string representation,
 * matching server/services/blockchain/hashing.ts byte-for-byte.
 */
export function canonicalizeJson(obj: any): string {
  if (obj === null || obj === undefined) {
    return 'null';
  }
  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map((item) => canonicalizeJson(item)).join(',')}]`;
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map((key) => {
    return `${JSON.stringify(key)}:${canonicalizeJson(obj[key])}`;
  });
  return `{${pairs.join(',')}}`;
}

/**
 * Computes EVM-compatible Keccak-256 hash.
 * Guaranteed to match Solidity keccak256() under all execution paths.
 * Never falls back to SHA-256.
 */
export function keccak256(data: string | Uint8Array): string {
  if (typeof data === 'string') {
    return ethersKeccak256(toUtf8Bytes(data));
  }
  return ethersKeccak256(data);
}

/**
 * Computes standard SHA-256 hash (hex string with 0x prefix).
 * Used exclusively for non-blockchain media content digests (e.g. photo file SHA-256).
 */
export function sha256Hash(data: string | Uint8Array): string {
  if (typeof data === 'string') {
    return ethersSha256(toUtf8Bytes(data));
  }
  return ethersSha256(data);
}

/**
 * Converts a string complaint ID (e.g. "GRV-2023-1042") to bytes32 via keccak256.
 */
export function complaintIdToBytes32(id: string): string {
  return keccak256(id.trim().toUpperCase());
}

/**
 * Converts a department name to bytes32 via keccak256.
 */
export function departmentToBytes32(department: string): string {
  return keccak256(department.trim().toLowerCase());
}

export const COMPLAINT_DOMAIN_PREFIX = 'SMARTGOV:COMPLAINT:v1:';
export const RESOLUTION_DOMAIN_PREFIX = 'SMARTGOV:RESOLUTION:v1:';
export const ACTION_DOMAIN_PREFIX = 'SMARTGOV:ACTION:v1:';

export interface ClientGrievancePayload {
  id: string;
  description: string;
  department: string;
  priority: string;
  location?: { lat?: number; lng?: number; [key: string]: any };
  [key: string]: any;
}

/**
 * Generates the deterministic complaint hash directly in the browser with domain separation.
 * Includes only core civic grievance fields:
 * id, description (trimmed, CRLF normalized to LF), department, priority, and rounded coordinates (5 decimals).
 * Excludes citizen PII (name, phone, email) to preserve privacy.
 */
export function computeComplaintHash(grievance: ClientGrievancePayload): string {
  const canonicalData = {
    id: (grievance.id || '').trim(),
    department: (grievance.department || '').trim(),
    description: (grievance.description || '').trim().replace(/\r\n/g, '\n'),
    lat: grievance.location?.lat !== undefined && grievance.location?.lat !== null && !isNaN(Number(grievance.location.lat))
      ? Number(Number(grievance.location.lat).toFixed(5))
      : 0,
    lng: grievance.location?.lng !== undefined && grievance.location?.lng !== null && !isNaN(Number(grievance.location.lng))
      ? Number(Number(grievance.location.lng).toFixed(5))
      : 0,
    priority: (grievance.priority || '').trim(),
  };

  const serialized = canonicalizeJson(canonicalData);
  return keccak256(`${COMPLAINT_DOMAIN_PREFIX}${serialized}`);
}

/**
 * Generates the deterministic resolution proof hash directly in the browser with domain separation.
 * Hashes resolution notes, inspector identity, materials, and the content hash of the ground photo.
 */
export function computeResolutionHash(proof: {
  notes?: string;
  officerName?: string;
  materialsUsed?: string;
  photoUrl?: string;
}): string {
  let photoDigest = '0x0000000000000000000000000000000000000000000000000000000000000000';
  if (proof.photoUrl) {
    if (proof.photoUrl.startsWith('data:')) {
      const base64Part = proof.photoUrl.split(',')[1] || proof.photoUrl;
      photoDigest = sha256Hash(base64Part);
    } else {
      photoDigest = sha256Hash(proof.photoUrl);
    }
  }

  const canonicalData = {
    materialsUsed: (proof.materialsUsed || '').trim(),
    notes: (proof.notes || '').trim().replace(/\r\n/g, '\n'),
    officerName: (proof.officerName || '').trim(),
    photoContentHash: photoDigest,
  };

  const serialized = canonicalizeJson(canonicalData);
  return keccak256(`${RESOLUTION_DOMAIN_PREFIX}${serialized}`);
}

/**
 * Generates an action hash with domain separation for status transitions, department transfers, and official replies.
 */
export function computeActionHash(action: {
  actionType: string;
  grievanceId: string;
  officerName?: string;
  details: string;
}): string {
  const canonicalData = {
    actionType: action.actionType,
    details: (action.details || '').trim(),
    grievanceId: (action.grievanceId || '').trim(),
    officerName: (action.officerName || 'Zonal Officer').trim(),
  };

  const serialized = canonicalizeJson(canonicalData);
  return keccak256(`${ACTION_DOMAIN_PREFIX}${serialized}`);
}
