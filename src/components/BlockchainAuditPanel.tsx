import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
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
  Cpu,
  Server,
  Zap,
  Radio,
  History,
  Info,
} from 'lucide-react';
import { Grievance } from '../types';
import {
  verifyGrievanceIntegrity,
  fetchOnChainAuditHistory,
} from '../services/clientRpcVerifier';
import type { ClientVerificationResult } from '../services/clientRpcVerifier';
import { computeComplaintHash } from '../utils/clientHashing';

interface BlockchainAuditPanelProps {
  grievance: Grievance;
}

export const BlockchainAuditPanel: React.FC<BlockchainAuditPanelProps> = ({ grievance }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<ClientVerificationResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [simulateTamper, setSimulateTamper] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const audit = grievance.blockchainAudit;

  const runVerification = useCallback(
    async (isTamperedMode: boolean) => {
      setIsVerifying(true);
      try {
        // Construct grievance payload for client verification
        const candidatePayload = {
          id: grievance.id,
          description: isTamperedMode
            ? `${grievance.description} [UNAUTHORIZED MODIFICATION DETECTED]`
            : grievance.description,
          department: grievance.department,
          priority: grievance.priority,
          location: grievance.location,
        };

        const res = await verifyGrievanceIntegrity(candidatePayload);
        setResult(res);
      } catch (err: any) {
        console.warn('In-browser blockchain verification failed:', err);
      } finally {
        setIsVerifying(false);
      }
    },
    [grievance]
  );

  // Auto-verify on grievance change or tamper simulation toggle
  useEffect(() => {
    runVerification(simulateTamper);
  }, [grievance.id, simulateTamper, runVerification]);

  const handleVerify = () => {
    runVerification(simulateTamper);
  };

  const handleToggleTamper = () => {
    setSimulateTamper((prev) => !prev);
  };

  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    setIsLoadingHistory(true);
    try {
      const records = await fetchOnChainAuditHistory(grievance.id);
      setAuditHistory(records);
    } catch (e) {
      console.warn('Failed to load on-chain audit history:', e);
    } finally {
      setIsLoadingHistory(false);
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
    if (!hash || hash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return '0x--';
    }
    if (hash.length <= 16) return hash;
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  // Determine verification status
  const isMatch = result ? result.verified : audit?.verified ?? true;
  const isTampered = result ? result.tamperDetected : !isMatch;
  const verificationSource = result?.source || 'DIRECT_RPC';
  const isDirectRpc = verificationSource === 'DIRECT_RPC';

  // Compute live browser hash for display
  const currentBrowserHash = result?.calculatedHash || computeComplaintHash(grievance);
  const onChainHash = result?.onChainHash || audit?.complaintHash || '0x--';

  return (
    <div
      id="blockchain-audit-panel"
      className={`rounded-2xl p-5 border transition-all ${
        isTampered
          ? 'bg-rose-50/40 dark:bg-[#1A0C14] border-rose-300 dark:border-rose-900/60 shadow-md shadow-rose-500/5'
          : 'bg-[#FFFFFF] dark:bg-[#0B1528] border-[#C8E2FA] dark:border-[#1E3456] shadow-xs'
      }`}
    >
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#C8E2FA] dark:border-[#1E3456]">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl ${
              isTampered
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                : 'bg-[#E0F0FE] dark:bg-[#13233D] text-[#0284C7] dark:text-[#38BDF8]'
            }`}
          >
            {isTampered ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#0A192F] dark:text-white tracking-tight">
                Blockchain Tamper-Evident Audit Layer
              </h3>
              {/* Verification Source Badge */}
              <span
                id="blockchain-source-badge"
                className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded flex items-center gap-1 border ${
                  isDirectRpc
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                }`}
                title={
                  isDirectRpc
                    ? 'Zero-Trust: Queried direct from browser to EVM smart contract via eth_call'
                    : 'Fallback: Direct RPC unavailable, verified via backend API gateway'
                }
              >
                {isDirectRpc ? (
                  <>
                    <Cpu className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>DIRECT_RPC (ZERO-TRUST)</span>
                  </>
                ) : (
                  <>
                    <Server className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>BACKEND_PROXY (FALLBACK)</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              {isDirectRpc
                ? 'Direct browser eth_call verification — no intermediary backend trust'
                : 'Cryptographic integrity verified against on-chain smart contract'}
            </p>
          </div>
        </div>

        {/* Status Pill & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Integrity Status Pill */}
          <div
            id="blockchain-status-pill"
            className={`px-3 py-1 rounded-full text-xs font-black tracking-wide flex items-center gap-1.5 border transition-all ${
              isTampered
                ? 'bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border-red-400 dark:border-red-800 animate-pulse'
                : isMatch
                ? 'bg-[#FEF08A]/70 dark:bg-[#FACC15]/20 text-[#854D0E] dark:text-[#FACC15] border-[#FACC15] dark:border-[#CA8A04]'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300'
            }`}
          >
            {isTampered ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span>TAMPERING DETECTED</span>
              </>
            ) : isMatch ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#EAB308]" />
                <span>INTEGRITY VERIFIED</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                <span>PENDING AUDIT</span>
              </>
            )}
          </div>

          {/* Tamper Simulation Demo Toggle */}
          <button
            type="button"
            id="simulate-tamper-toggle"
            onClick={handleToggleTamper}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
              simulateTamper
                ? 'bg-red-600 text-white border-red-700 shadow-xs'
                : 'bg-[#F0F7FF] dark:bg-[#13233D] text-[#0A192F] dark:text-slate-200 border-[#C8E2FA] dark:border-[#1E3456] hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
            title="Simulate modifying grievance text to demonstrate instant tamper detection"
          >
            <Zap className={`w-3 h-3 ${simulateTamper ? 'text-yellow-300' : 'text-rose-500'}`} />
            <span>{simulateTamper ? 'Revert Tamper' : 'Test Tamper'}</span>
          </button>

          {/* Recalculate & Re-verify Button */}
          <button
            type="button"
            id="verify-blockchain-btn"
            onClick={handleVerify}
            disabled={isVerifying}
            className="p-1.5 rounded-lg bg-[#F0F7FF] dark:bg-[#13233D] hover:bg-[#E0F0FE] text-[#0A192F] dark:text-slate-200 border border-[#C8E2FA] dark:border-[#1E3456] transition-all cursor-pointer disabled:opacity-50"
            title="Recalculate cryptographic hash in-browser and re-verify against EVM contract"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin text-[#0284C7]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tamper Alert Warning Box (Shown only when tampered) */}
      {isTampered && (
        <div
          id="tamper-alert-banner"
          className="mb-4 p-4 rounded-xl bg-red-100/90 dark:bg-red-950/60 border-2 border-red-400 dark:border-red-800 text-red-900 dark:text-red-200 space-y-2 animate-fadeIn"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            <h4 className="font-extrabold text-sm uppercase tracking-wide">
              Critical Cryptographic Alert: Data Tampering Detected!
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-red-800 dark:text-red-300">
            The grievance data held in browser memory differs from the immutable cryptographic hash anchored in the SmartGov EVM smart contract.
            {simulateTamper ? ' (Simulation mode active: description text was altered).' : ' One or more fields have been altered off-chain.'}
          </p>

          {/* Side-by-Side Hash Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-red-200 dark:border-red-800/60 text-[11px] font-mono">
            <div className="bg-white/80 dark:bg-[#0B1528] p-2 rounded-lg border border-red-300 dark:border-red-800">
              <span className="font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                Calculated In-Browser:
              </span>
              <span className="text-red-600 dark:text-red-400 break-all font-bold">
                {currentBrowserHash}
              </span>
            </div>
            <div className="bg-white/80 dark:bg-[#0B1528] p-2 rounded-lg border border-red-300 dark:border-red-800">
              <span className="font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                On-Chain EVM Record:
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 break-all font-bold">
                {onChainHash}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Proof Card Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {/* Complaint Core Hash */}
        <div className="p-3 bg-[#F0F7FF] dark:bg-[#0F1D33] rounded-xl border border-[#C8E2FA] dark:border-[#1E3456] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400 mb-1">
            <span className="font-semibold flex items-center gap-1">
              <Fingerprint className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" />
              Complaint Core Hash
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(onChainHash, 'complaintHash')}
              className="text-[#64748B] hover:text-[#0A192F] dark:hover:text-white cursor-pointer"
              title="Copy hash"
            >
              {copiedField === 'complaintHash' ? (
                <Check className="w-3 h-3 text-[#EAB308]" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          <p
            id="displayed-complaint-hash"
            className={`font-mono text-xs font-bold truncate ${
              isTampered ? 'text-red-600 dark:text-red-400' : 'text-[#0A192F] dark:text-white'
            }`}
          >
            {truncateHash(onChainHash)}
          </p>
          <span className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1">
            Keccak-256 (id, desc, dept, coords, priority)
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
              type="button"
              onClick={() =>
                copyToClipboard(
                  result?.latestActionHash || audit?.latestActionHash || '0x--',
                  'latestActionHash'
                )
              }
              className="text-[#64748B] hover:text-[#0A192F] dark:hover:text-white cursor-pointer"
              title="Copy hash"
            >
              {copiedField === 'latestActionHash' ? (
                <Check className="w-3 h-3 text-[#EAB308]" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          <p className="font-mono text-xs font-bold text-[#0A192F] dark:text-white truncate">
            {truncateHash(result?.latestActionHash || audit?.latestActionHash)}
          </p>
          <div className="flex items-center justify-between text-[10px] text-[#64748B] dark:text-slate-400 mt-1">
            <span>Actions: {result?.actionCount ?? audit?.blockNumber ?? 1} logged</span>
            <button
              type="button"
              onClick={handleOpenHistory}
              className="text-[#0284C7] dark:text-[#38BDF8] hover:underline font-semibold cursor-pointer"
            >
              View Trail
            </button>
          </div>
        </div>

        {/* Resolution Certification Hash */}
        <div className="p-3 bg-[#F0F7FF] dark:bg-[#0F1D33] rounded-xl border border-[#C8E2FA] dark:border-[#1E3456] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400 mb-1">
            <span className="font-semibold flex items-center gap-1">
              <FileCheck2 className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" />
              Resolution Proof Hash
            </span>
            {(result?.resolutionHash || audit?.resolutionHash) && (
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    result?.resolutionHash || audit?.resolutionHash || '',
                    'resolutionHash'
                  )
                }
                className="text-[#64748B] hover:text-[#0A192F] dark:hover:text-white cursor-pointer"
                title="Copy hash"
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
            {result?.resolutionHash &&
            result.resolutionHash !== '0x0000000000000000000000000000000000000000000000000000000000000000'
              ? truncateHash(result.resolutionHash)
              : audit?.resolutionHash
              ? truncateHash(audit.resolutionHash)
              : 'Pending Resolution'}
          </p>
          <span className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1">
            {result?.resolutionHash &&
            result.resolutionHash !== '0x0000000000000000000000000000000000000000000000000000000000000000'
              ? 'Anchors work order & photo digest'
              : 'Certifies on-ground repair'}
          </span>
        </div>
      </div>

      {/* Network & Verification Detailed Bar */}
      <div className="p-3 bg-[#E0F0FE]/40 dark:bg-[#13233D]/60 rounded-xl border border-[#BAE0FD] dark:border-[#1E3456] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 font-semibold text-[#0A192F] dark:text-white">
            <Lock className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" />
            Network:
            <span className="font-mono font-bold text-[#0284C7] dark:text-[#38BDF8]">
              {result?.network || audit?.network || 'Hardhat Local (EVM 31337)'}
            </span>
          </span>

          {(result?.contractAddress || audit?.contractAddress) && (
            <span className="text-[#64748B] dark:text-slate-400 font-mono text-[11px] flex items-center gap-1">
              <span>Contract:</span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    result?.contractAddress || audit?.contractAddress || '',
                    'contractAddress'
                  )
                }
                className="hover:underline font-semibold"
                title="Copy contract address"
              >
                {truncateHash(result?.contractAddress || audit?.contractAddress)}
              </button>
            </span>
          )}
        </div>

        {/* Verification Source Indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
              isDirectRpc
                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/40'
                : 'text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-950/40'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>Channel: {verificationSource}</span>
          </span>

          {audit?.explorerUrl && (
            <a
              href={audit.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#0284C7] dark:text-[#38BDF8] hover:underline font-bold text-xs"
            >
              <span>Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Verification Diagnostic Summary */}
      {result && (
        <div
          id="verification-diagnostic-summary"
          className={`mt-3 p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
            result.tamperDetected
              ? 'bg-rose-100/80 border-rose-300 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
              : result.verified
              ? 'bg-[#FEF08A]/30 border-[#FDE047]/60 text-[#854D0E] dark:text-[#FDE047]'
              : 'bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          {result.tamperDetected ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          ) : result.verified ? (
            <CheckCircle2 className="w-4 h-4 text-[#EAB308] shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span className="font-bold block">
              {result.tamperDetected
                ? 'TAMPERING DETECTED: Hash Discrepancy Found'
                : result.verified
                ? 'Cryptographic Integrity Confirmed'
                : 'Blockchain Status Notice'}
            </span>
            <span className="text-[11px] opacity-90">{result.details}</span>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#0B1528] rounded-2xl max-w-xl w-full p-6 border border-[#C8E2FA] dark:border-[#1E3456] shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#C8E2FA] dark:border-[#1E3456] pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8]" />
                <h3 className="text-base font-bold text-[#0A192F] dark:text-white">
                  On-Chain Immutable Audit Trail
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Direct smart contract audit events recorded for ticket <strong>{grievance.id}</strong>:
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {isLoadingHistory ? (
                <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0284C7]" />
                  <span>Fetching immutable on-chain audit trail via eth_call...</span>
                </div>
              ) : auditHistory.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No subsequent lifecycle actions recorded on-chain yet.
                </div>
              ) : (
                auditHistory.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3 bg-[#F0F7FF] dark:bg-[#0F1D33] rounded-xl border border-[#C8E2FA] dark:border-[#1E3456] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0A192F] dark:text-white uppercase text-[11px]">
                        {rec.actionType || 'Status Update'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {rec.timestamp ? new Date(rec.timestamp).toLocaleString() : 'Anchored on-chain'}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all">
                      Action Hash: {rec.actionHash}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-[#C8E2FA] dark:border-[#1E3456] flex justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-[#0A192F] dark:bg-[#1E3456] text-white rounded-xl text-xs font-bold cursor-pointer hover:opacity-90"
              >
                Close Audit Trail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
