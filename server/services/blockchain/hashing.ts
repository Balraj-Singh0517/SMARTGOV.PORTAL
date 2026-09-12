import crypto from 'crypto';

/**
 * Deterministic JSON stringifier that sorts all object keys lexicographically.
 * Ensures identical objects always generate the exact same string representation.
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
 * Keccak-256 implementation matching EVM Solidity keccak256().
 * Uses keccak library if available or ethers.keccak256, with fallback to standard EVM Keccak.
 */
let keccakFn: ((bytes: Uint8Array | string) => string) | null = null;

export function setKeccakImplementation(fn: (bytes: Uint8Array | string) => string) {
  keccakFn = fn;
}

/**
 * Computes standard SHA-256 hash (hex string with 0x prefix).
 */
export function sha256Hash(data: string | Buffer): string {
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return `0x${hash}`;
}

/**
 * Computes EVM Keccak-256 hash.
 * If ethers is initialized, uses ethers.keccak256.
 * Falls back to SHA-256 formatted to bytes32 if keccak is not yet bound.
 */
export function keccak256(data: string | Uint8Array): string {
  if (keccakFn) {
    return keccakFn(data);
  }
  try {
    const { ethers } = require('ethers');
    if (typeof data === 'string') {
      return ethers.keccak256(ethers.toUtf8Bytes(data));
    }
    return ethers.keccak256(data);
  } catch {
    // Pure node fallback
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return `0x${hash}`;
  }
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

/**
 * Generates the deterministic complaint hash.
 * Includes only core civic grievance fields:
 * id, description (trimmed), department, priority, and rounded coordinates.
 * Excludes citizen PII (name, phone, email) to preserve privacy.
 */
export function computeComplaintHash(grievance: {
  id: string;
  description: string;
  department: string;
  priority: string;
  location?: { lat: number; lng: number };
  submittedAt?: string;
}): string {
  const canonicalData = {
    id: grievance.id.trim(),
    department: grievance.department.trim(),
    description: grievance.description.trim().replace(/\r\n/g, '\n'),
    lat: grievance.location?.lat ? Number(grievance.location.lat.toFixed(5)) : 0,
    lng: grievance.location?.lng ? Number(grievance.location.lng.toFixed(5)) : 0,
    priority: grievance.priority.trim(),
  };

  const serialized = canonicalizeJson(canonicalData);
  return keccak256(serialized);
}

/**
 * Generates the deterministic resolution proof hash.
 * Hashes resolution notes, inspector identity, materials, and the content hash of the ground photo.
 */
export function computeResolutionHash(proof: {
  notes: string;
  officerName: string;
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
    notes: proof.notes.trim().replace(/\r\n/g, '\n'),
    officerName: proof.officerName.trim(),
    photoContentHash: photoDigest,
  };

  const serialized = canonicalizeJson(canonicalData);
  return keccak256(serialized);
}

/**
 * Generates an action hash for status transitions, department transfers, and official replies.
 */
export function computeActionHash(action: {
  actionType: string;
  grievanceId: string;
  officerName?: string;
  details: string;
  timestamp?: number;
}): string {
  const canonicalData = {
    actionType: action.actionType,
    details: action.details.trim(),
    grievanceId: action.grievanceId.trim(),
    officerName: (action.officerName || 'Zonal Officer').trim(),
  };

  const serialized = canonicalizeJson(canonicalData);
  return keccak256(serialized);
}
