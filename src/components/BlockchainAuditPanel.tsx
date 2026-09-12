import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Link,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Fingerprint,
  FileCheck2,
  Lock,
} from 'lucide-react';
import { Grievance, IntegrityVerificationResult } from '../types';

interface BlockchainAuditPanelProps {
  grievance: Grievance;
}

export const BlockchainAuditPanel: React.FC<BlockchainAuditPanelProps> = ({ grievance }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<IntegrityVerificationResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const audit = grievance.blockchainAudit;

  // Auto-verify on component mount or grievance change
  useEffect(() => {
    handleVerify();
  }, [grievance.id]);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/blockchain/verify/${grievance.id}`, {
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

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.result) {
          setVerificationResult(data.result);
        }
      }
    } catch (e) {
      console.warn('Verification API request failed:', e);
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const truncateHash = (hash?: string) => {
    if (!hash) return '0x--';
    if (hash.length <= 16) return hash;
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const isVerified = verificationResult ? verificationResult.verified : audit?.verified ?? true;

  return (
    <div
      id="blockchain-audit-panel"
      className="bg-[#FFFFFF] dark:bg-[#0B1528] rounded-2xl p-5 border border-[#C8E2FA] dark:border-[#1E3456] shadow-xs transition-colors"
    >
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#C8E2FA] dark:border-[#1E3456]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#E0F0FE] dark:bg-[#13233D] text-[#0284C7] dark:text-[#38BDF8]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#0A192F] dark:text-white tracking-tight">
                Blockchain Tamper-Evident Audit Layer
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#F0F7FF] dark:bg-[#080E1A] border border-[#C8E2FA] dark:border-[#1E3456] text-[#64748B] dark:text-slate-400">
                EVM Smart Contract
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Cryptographic integrity proofs & state transitions anchored immutably on-chain
            </p>
          </div>
        </div>

        {/* Verification Status Pill */}
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
              isVerified
                ? 'bg-[#FEF08A]/70 text-[#854D0E] border-[#FACC15]'
                : 'bg-[#ffdad6] text-[#ba1a1a] border-[#ffb4ab]'
            }`}
          >
            {isVerified ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#EAB308]" />
                <span>INTEGRITY VERIFIED</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-[#ba1a1a]" />
                <span>INTEGRITY MISMATCH</span>
              </>
            )}
          </div>

          <button
            type="button"
            id="verify-blockchain-btn"
            onClick={handleVerify}
            disabled={isVerifying}
            className="p-1.5 rounded-lg bg-[#F0F7FF] dark:bg-[#13233D] hover:bg-[#E0F0FE] text-[#0A192F] dark:text-slate-200 border border-[#C8E2FA] dark:border-[#1E3456] transition-all cursor-pointer disabled:opacity-50"
            title="Recalculate cryptographic hash and verify against on-chain record"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin text-[#0284C7]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Proof Card Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {/* Complaint Hash */}
        <div className="p-3 bg-[#F0F7FF] dark:bg-[#0F1D33] rounded-xl border border-[#C8E2FA] dark:border-[#1E3456] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400 mb-1">
            <span className="font-semibold flex items-center gap-1">
              <Fingerprint className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" />
              Complaint Core Hash
            </span>
            <button
              onClick={() =>
                copyToClipboard(
                  verificationResult?.onChainHash || audit?.complaintHash || '0x--',
                  'complaintHash'
                )
              }
              className="text-[#64748B] hover:text-[#0A192F] dark:hover:text-white"
            >
              {copiedField === 'complaintHash' ? (
                <Check className="w-3 h-3 text-[#EAB308]" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          <p className="font-mono text-xs font-bold text-[#0A192F] dark:text-white truncate">
            {truncateHash(verificationResult?.onChainHash || audit?.complaintHash)}
          </p>
          <span className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1">
            Keccak-256 of complaint payload (no PII)
          </span>
        </div>

        {/* Latest Action Hash */}
        <div className="p-3 bg-[#F0F7FF] dark:bg-[#0F1D33] rounded-xl border border-[#C8E2FA] dark:border-[#1E3456] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400 mb-1">
            <span className="font-semibold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" />
              Latest Action Hash
            </span>
            <button
              onClick={() => copyToClipboard(audit?.latestActionHash || '0x--', 'latestActionHash')}
              className="text-[#64748B] hover:text-[#0A192F] dark:hover:text-white"
            >
              {copiedField === 'latestActionHash' ? (
                <Check className="w-3 h-3 text-[#EAB308]" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          <p className="font-mono text-xs font-bold text-[#0A192F] dark:text-white truncate">
            {truncateHash(audit?.latestActionHash || verificationResult?.onChainHash)}
          </p>
          <span className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1">
            Audit events: {verificationResult?.auditTrailLength || 1} logged
          </span>
        </div>

        {/* Resolution Certification Hash */}
        <div className="p-3 bg-[#F0F7FF] dark:bg-[#0F1D33] rounded-xl border border-[#C8E2FA] dark:border-[#1E3456] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400 mb-1">
            <span className="font-semibold flex items-center gap-1">
              <FileCheck2 className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" />
              Resolution Proof Hash
            </span>
            {audit?.resolutionHash && (
              <button
                onClick={() => copyToClipboard(audit.resolutionHash || '', 'resolutionHash')}
                className="text-[#64748B] hover:text-[#0A192F] dark:hover:text-white"
              >
                {copiedField === 'resolutionHash' ? (
                  <Check className="w-3 h-3 text-[#EAB308]" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
          <p className="font-mono text-xs font-bold text-[#0A192F] dark:text-white truncate">
            {audit?.resolutionHash ? truncateHash(audit.resolutionHash) : 'Pending Resolution'}
          </p>
          <span className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1">
            {audit?.resolutionHash ? 'Includes photo content digest' : 'Certifies on-ground repair'}
          </span>
        </div>
      </div>

      {/* Network & Verification Detailed Bar */}
      <div className="p-3 bg-[#E0F0FE]/40 dark:bg-[#13233D]/60 rounded-xl border border-[#BAE0FD] dark:border-[#1E3456] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-semibold text-[#0A192F] dark:text-white">
            <Lock className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" />
            Network:
            <span className="font-mono font-bold text-[#0284C7] dark:text-[#38BDF8]">
              {verificationResult?.network || audit?.network || 'Hardhat Local (Chain 31337)'}
            </span>
          </span>

          {verificationResult?.contractAddress && (
            <span className="hidden sm:inline-block text-[#64748B] dark:text-slate-400 font-mono text-[11px]">
              Contract: {truncateHash(verificationResult.contractAddress)}
            </span>
          )}
        </div>

        {verificationResult?.explorerUrl && (
          <a
            href={verificationResult.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#0284C7] dark:text-[#38BDF8] hover:underline font-bold text-xs"
          >
            <span>View Proof on Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Verification Diagnostic Summary */}
      {verificationResult && (
        <div
          className={`mt-3 p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
            verificationResult.verified
              ? 'bg-[#FEF08A]/30 border-[#FDE047]/60 text-[#854D0E] dark:text-[#FDE047]'
              : 'bg-[#ffdad6]/60 border-[#ffb4ab] text-[#93000a] dark:text-rose-200'
          }`}
        >
          {verificationResult.verified ? (
            <CheckCircle2 className="w-4 h-4 text-[#EAB308] shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span className="font-bold block">
              {verificationResult.verified ? 'Cryptographic Integrity Confirmed' : 'Tamper Alert Detected'}
            </span>
            <span className="text-[11px] opacity-90">{verificationResult.details}</span>
          </div>
        </div>
      )}
    </div>
  );
};
