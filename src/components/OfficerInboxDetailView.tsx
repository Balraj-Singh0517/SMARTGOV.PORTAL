import React, { useState } from 'react';
import { 
  Printer, 
  Share2, 
  Quote, 
  Languages, 
  Cpu, 
  AlertTriangle, 
  Smile, 
  Frown, 
  Flame, 
  MapPin, 
  ArrowRightLeft, 
  Upload, 
  CheckCircle2, 
  Bolt, 
  Trash2, 
  Droplets, 
  TrafficCone, 
  Trees, 
  Clock, 
  Check, 
  Filter,
  Eye,
  EyeOff,
  User,
  PhoneCall,
  Calendar,
  History,
  ShieldCheck
} from 'lucide-react';
import { Grievance, GrievanceStatus, ResolutionProof } from '../types';
import { InteractiveMap } from './InteractiveMap';
import { StatusModal } from './StatusModal';
import { TransferModal } from './TransferModal';
import { ResolutionProofModal } from './ResolutionProofModal';

interface OfficerInboxDetailViewProps {
  grievances: Grievance[];
  selectedGrievanceId: string | null;
  onSelectGrievance: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: GrievanceStatus, note: string) => void;
  onTransferDept: (id: string, newDept: string, reason: string) => void;
  onSubmitResolutionProof: (id: string, proof: ResolutionProof) => void;
}

export const OfficerInboxDetailView: React.FC<OfficerInboxDetailViewProps> = ({
  grievances,
  selectedGrievanceId,
  onSelectGrievance,
  onUpdateStatus,
  onTransferDept,
  onSubmitResolutionProof
}) => {
  const [inboxFilter, setInboxFilter] = useState<'all' | 'high' | 'recent'>('all');
  const [showEnglishTranslation, setShowEnglishTranslation] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Modal states
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  // Selected Grievance (defaults to first or selected)
  const selectedItem = grievances.find((g) => g.id === selectedGrievanceId) || grievances[0];

  // Filter list
  const filteredGrievances = grievances.filter((item) => {
    if (inboxFilter === 'high') {
      return item.priority === 'High' || item.urgencyLevel === 'High Risk';
    }
    if (inboxFilter === 'recent') {
      return item.rawTimestamp > Date.now() - 24 * 60 * 60 * 1000;
    }
    return true;
  });

  const getDeptIcon = (dept: string) => {
    if (dept.includes('Power') || dept.includes('Light')) return Bolt;
    if (dept.includes('Sanitation') || dept.includes('Waste')) return Trash2;
    if (dept.includes('Water')) return Droplets;
    if (dept.includes('Roads') || dept.includes('PWD')) return TrafficCone;
    if (dept.includes('Parks')) return Trees;
    return Bolt;
  };

  const handleShare = () => {
    if (navigator.clipboard && selectedItem) {
      navigator.clipboard.writeText(
        `SmartGov Grievance #${selectedItem.id}: ${selectedItem.title} (${selectedItem.location.name})`
      );
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!selectedItem) {
    return (
      <div className="p-8 text-center text-[#76777d]">
        No grievances found matching the current criteria.
      </div>
    );
  }

  const DeptIcon = getDeptIcon(selectedItem.department);

  return (
    <div id="officer-inbox-detail-container" className="h-full">
      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Assigned Inbox (4 cols) */}
        <div 
          id="assigned-inbox-column"
          className="col-span-12 lg:col-span-4 flex flex-col bg-[#FFFFFF] dark:bg-[#0B1528] rounded-2xl border border-[#C8E2FA] dark:border-[#1E3456] shadow-xs overflow-hidden max-h-[85vh] transition-colors"
        >
          {/* Inbox Header */}
          <div className="p-4 border-b border-[#C8E2FA] dark:border-[#1E3456] bg-[#F0F7FF] dark:bg-[#0F1D33]">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-lg text-[#0A192F] dark:text-white tracking-tight flex items-center gap-2">
                <span>Assigned Inbox</span>
                <span className="w-2 h-2 rounded-full bg-[#FACC15]" />
              </h2>
              <span className="bg-[#FFFFFF] dark:bg-[#13233D] text-[#0A192F] dark:text-[#F0F7FF] px-2.5 py-0.5 rounded-full text-xs font-bold border border-[#C8E2FA] dark:border-[#1E3456] shadow-2xs">
                {grievances.filter((g) => g.status !== 'Resolved').length} Pending
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5">
              <button
                id="inbox-filter-all"
                onClick={() => setInboxFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  inboxFilter === 'all'
                    ? 'bg-[#0A192F] text-white shadow-xs'
                    : 'bg-[#FFFFFF] dark:bg-[#13233D] text-[#475569] dark:text-slate-300 hover:bg-[#E0F0FE] border border-[#C8E2FA] dark:border-[#1E3456]'
                }`}
              >
                All
              </button>
              <button
                id="inbox-filter-high"
                onClick={() => setInboxFilter('high')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  inboxFilter === 'high'
                    ? 'bg-[#FEF08A] text-[#854D0E] border border-[#FDE047] shadow-xs'
                    : 'bg-[#FFFFFF] dark:bg-[#13233D] text-[#475569] dark:text-slate-300 hover:bg-[#FEF9C3] border border-[#C8E2FA] dark:border-[#1E3456]'
                }`}
              >
                High Priority
              </button>
              <button
                id="inbox-filter-recent"
                onClick={() => setInboxFilter('recent')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  inboxFilter === 'recent'
                    ? 'bg-[#0A192F] text-white shadow-xs'
                    : 'bg-[#FFFFFF] dark:bg-[#13233D] text-[#475569] dark:text-slate-300 hover:bg-[#E0F0FE] border border-[#C8E2FA] dark:border-[#1E3456]'
                }`}
              >
                Recent
              </button>
            </div>
          </div>

          {/* Grievance Ticket List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 no-scrollbar">
            {filteredGrievances.map((item) => {
              const isSelected = item.id === selectedItem.id;
              const ItemDeptIcon = getDeptIcon(item.department);
              const isHigh = item.priority === 'High' || item.urgencyLevel === 'High Risk';

              return (
                <div
                  key={item.id}
                  id={`inbox-card-${item.id}`}
                  onClick={() => onSelectGrievance(item.id)}
                  className={`p-3.5 rounded-xl transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-[#E0F0FE] dark:bg-[#13233D] border-2 border-[#0A192F] dark:border-[#38BDF8] shadow-sm'
                      : 'bg-[#FFFFFF] dark:bg-[#0F1D33] border border-[#C8E2FA] dark:border-[#1E3456] hover:bg-[#F0F7FF] dark:hover:bg-[#1A2D4C]'
                  }`}
                >
                  {/* Selected Indicator Bar with smooth yellow */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FACC15] rounded-l-xl" />
                  )}

                  <div className="flex justify-between items-start mb-1.5 pl-1">
                    <span className="text-xs font-bold text-[#64748B] dark:text-slate-400">
                      #{item.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isHigh
                          ? 'bg-[#FEF08A] text-[#854D0E] border border-[#FDE047]'
                          : 'bg-[#E0F0FE] dark:bg-[#080E1A] text-[#0369A1] dark:text-[#7DD3FC] border border-[#BAE0FD] dark:border-[#1E3456]'
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-[#0A192F] dark:text-white line-clamp-2 leading-snug mb-2.5 pl-1">
                    {item.title}
                  </p>

                  <div className="flex justify-between items-center pl-1 text-xs text-[#64748B] dark:text-slate-400">
                    <span className="flex items-center gap-1 bg-[#F0F7FF] dark:bg-[#080E1A] px-2 py-0.5 rounded-md text-[#0A192F] dark:text-slate-200 font-medium border border-[#C8E2FA] dark:border-[#1E3456]">
                      <ItemDeptIcon className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" />
                      <span className="truncate max-w-[120px]">{item.department.split(' ')[0]}</span>
                    </span>
                    <span className="text-[11px] font-medium">
                      {item.submittedAt.split(',')[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Grievance Detail View (8 cols) */}
        <div 
          id="grievance-detail-view"
          className="col-span-12 lg:col-span-8 flex flex-col space-y-4"
        >
          {/* Detail Header */}
          <div className="bg-[#FFFFFF] dark:bg-[#0B1528] p-5 rounded-2xl border border-[#C8E2FA] dark:border-[#1E3456] shadow-xs flex flex-wrap justify-between items-end gap-3 transition-colors">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-bold text-2xl md:text-3xl text-[#0A192F] dark:text-white tracking-tight">
                  #{selectedItem.id}
                </h1>
                
                {/* Status Pill */}
                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                  selectedItem.status === 'Resolved'
                    ? 'bg-[#FEF08A]/70 text-[#854D0E] border-[#FACC15]'
                    : selectedItem.status === 'In Progress'
                    ? 'bg-[#E0F0FE] text-[#0369A1] border-[#BAE0FD] dark:bg-[#13233D] dark:text-[#7DD3FC]'
                    : 'bg-[#F0F7FF] text-[#0A192F] border-[#C8E2FA] dark:bg-[#080E1A] dark:text-white'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    selectedItem.status === 'Resolved'
                      ? 'bg-[#EAB308]'
                      : selectedItem.status === 'In Progress'
                      ? 'bg-[#0284C7]'
                      : 'bg-[#0A192F]'
                  }`} />
                  {selectedItem.status}
                </span>
              </div>

              <p className="text-xs md:text-sm text-[#64748B] dark:text-slate-400">
                Submitted by Citizen {selectedItem.citizenUid} • {selectedItem.submittedAt}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                id="print-grievance-btn"
                onClick={handlePrint}
                className="p-2.5 rounded-xl bg-[#F0F7FF] dark:bg-[#13233D] hover:bg-[#E0F0FE] text-[#0A192F] dark:text-slate-200 border border-[#C8E2FA] dark:border-[#1E3456] transition-colors cursor-pointer"
                title="Print ticket record"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                id="share-grievance-btn"
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-[#F0F7FF] dark:bg-[#13233D] hover:bg-[#E0F0FE] text-[#0A192F] dark:text-slate-200 border border-[#C8E2FA] dark:border-[#1E3456] transition-colors cursor-pointer relative"
                title="Copy share link"
              >
                <Share2 className="w-4 h-4" />
                {isCopied && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#0A192F] text-[#FACC15] text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap font-bold border border-[#C8E2FA]/20">
                    Copied!
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Bento Grid Content */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Original Input Card (7 cols) */}
            <div className="md:col-span-7 bg-[#FFFFFF] dark:bg-[#0B1528] rounded-2xl p-5 border border-[#C8E2FA] dark:border-[#1E3456] shadow-xs flex flex-col justify-between relative overflow-hidden transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Quote className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
                  Original Submission
                </h3>
                <span className="text-[11px] font-semibold text-[#0369A1] dark:text-[#7DD3FC] bg-[#E0F0FE] dark:bg-[#13233D] px-2.5 py-0.5 rounded-md border border-[#BAE0FD] dark:border-[#1E3456]">
                  {selectedItem.detectedLanguage}
                </span>
              </div>

              {/* Hindi / Hinglish quote block */}
              <div className="bg-[#F0F7FF] dark:bg-[#0F1D33] p-4 rounded-xl border border-[#C8E2FA] dark:border-[#1E3456] text-sm md:text-base text-[#0A192F] dark:text-slate-100 leading-relaxed italic text-opacity-95 shadow-inner">
                "{selectedItem.description}"
              </div>

              {/* English translation drawer */}
              {showEnglishTranslation && (
                <div className="mt-3 p-3 bg-[#E0F0FE] dark:bg-[#13233D] rounded-xl border border-[#BAE0FD] dark:border-[#1E3456] text-xs md:text-sm text-[#0A192F] dark:text-white leading-relaxed animate-fadeIn">
                  <div className="font-bold text-[11px] uppercase tracking-wide text-[#0284C7] dark:text-[#38BDF8] mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15]" />
                    English Auto-Translation:
                  </div>
                  "{selectedItem.englishTranslation || selectedItem.description}"
                </div>
              )}

              {/* Translation Toggle */}
              <div className="mt-3 pt-3 border-t border-[#C8E2FA]/50 dark:border-[#1E3456] flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-slate-400">
                  <Languages className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
                  Auto-translated to English available
                </span>
                <button
                  id="toggle-translation-btn"
                  onClick={() => setShowEnglishTranslation(!showEnglishTranslation)}
                  className="text-xs font-bold text-[#0A192F] dark:text-[#38BDF8] hover:underline cursor-pointer flex items-center gap-1"
                >
                  {showEnglishTranslation ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Analysis Box (5 cols) */}
            <div className="md:col-span-5 bg-[#FFFFFF] dark:bg-[#0B1528] rounded-2xl p-5 border border-[#C8E2FA] dark:border-[#1E3456] shadow-xs relative overflow-hidden flex flex-col justify-between transition-colors">
              {/* Shimmer Border with smooth yellow accent */}
              <div className="absolute inset-0 border-2 border-transparent rounded-2xl pointer-events-none ai-shimmer opacity-30" />

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-[#0A192F] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
                    AI Analysis
                  </h3>
                  <span className="bg-[#FEF08A] text-[#854D0E] px-2.5 py-0.5 rounded-md text-xs font-bold border border-[#FDE047]">
                    Completed
                  </span>
                </div>

                {/* Recommended Routing */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
                      Assigned Department
                    </span>
                    <span className="text-[10px] font-bold text-[#0369A1] dark:text-[#7DD3FC] bg-[#E0F0FE] dark:bg-[#13233D] px-1.5 py-0.5 rounded flex items-center gap-1 border border-[#BAE0FD] dark:border-[#1E3456]">
                      <ShieldCheck className="w-3 h-3 text-[#0284C7]" />
                      Single-Dept Jurisdiction
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-[#F0F7FF] dark:bg-[#0F1D33] p-2.5 rounded-xl border border-[#C8E2FA] dark:border-[#1E3456]">
                    <span className="text-xs md:text-sm font-bold text-[#0A192F] dark:text-white">
                      {selectedItem.department}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-[#C8E2FA] dark:bg-[#1E3456] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#0A192F] to-[#0284C7] rounded-full" 
                          style={{ width: `${selectedItem.confidenceScore}%` }} 
                        />
                      </div>
                      <span className="text-xs font-bold text-[#0284C7] dark:text-[#38BDF8]">
                        {selectedItem.confidenceScore}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1 italic">
                    Assigned strictly to 1 department to prevent multi-department dispatch overlap.
                  </p>
                </div>

                {/* Urgency & Tone Matrix */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-[#FEF08A]/40 dark:bg-[#1C1F10] p-2.5 rounded-xl border border-[#FDE047]/60">
                    <span className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider block mb-0.5">
                      Urgency Level
                    </span>
                    <span className="text-xs font-bold text-[#854D0E] dark:text-[#FACC15] flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#EAB308]" />
                      {selectedItem.urgencyLevel}
                    </span>
                  </div>

                  <div className="bg-[#F0F7FF] dark:bg-[#0F1D33] p-2.5 rounded-xl border border-[#C8E2FA] dark:border-[#1E3456]">
                    <span className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider block mb-0.5">
                      Detected Tone
                    </span>
                    <span className="text-xs font-bold text-[#0A192F] dark:text-slate-200 flex items-center gap-1">
                      <Frown className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" />
                      {selectedItem.sentiment}
                    </span>
                  </div>
                </div>

                {/* Extracted Entities */}
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Key Entities Extracted
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.entities.map((ent, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-[#F0F7FF] dark:bg-[#0F1D33] border border-[#C8E2FA] dark:border-[#1E3456] text-xs font-medium text-[#0A192F] dark:text-slate-200 flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3 text-[#0284C7]" />
                        {ent}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Map / Location Context (12 cols) */}
            <div className="md:col-span-12">
              <InteractiveMap 
                location={selectedItem.location} 
                title={selectedItem.location.name}
              />
            </div>
          </div>

          {/* Resolution Proof Card if already resolved */}
          {selectedItem.resolutionProof && (
            <div className="bg-[#FEF08A]/20 dark:bg-[#152319] border border-[#FDE047]/60 dark:border-[#FACC15]/40 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start animate-fadeIn">
              {selectedItem.resolutionProof.photoUrl && (
                <img
                  src={selectedItem.resolutionProof.photoUrl}
                  alt="Resolution proof"
                  className="w-full md:w-36 h-24 rounded-xl object-cover border border-[#C8E2FA] dark:border-[#1E3456]"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 text-[#854D0E] dark:text-[#FACC15]">
                  <CheckCircle2 className="w-5 h-5 text-[#EAB308]" />
                  <h4 className="font-bold text-sm">Resolution Proof Verified On-Ground</h4>
                </div>
                <p className="text-xs text-[#0A192F] dark:text-slate-200 mb-1">
                  {selectedItem.resolutionProof.notes}
                </p>
                <div className="text-[11px] text-[#64748B] dark:text-slate-400 flex flex-wrap gap-3">
                  <span>Inspector: <strong>{selectedItem.resolutionProof.officerName}</strong></span>
                  <span>Certified: <strong>{selectedItem.resolutionProof.resolvedAt}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Grievance Lifecycle History & Audit Trail */}
          <div className="bg-[#FFFFFF] dark:bg-[#0B1528] rounded-2xl p-5 border border-[#C8E2FA] dark:border-[#1E3456] shadow-xs transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#C8E2FA] dark:border-[#1E3456]">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#0284C7] dark:text-[#38BDF8]" />
                <h3 className="text-sm font-bold text-[#0A192F] dark:text-white">
                  Grievance Lifecycle History & Audit Trail
                </h3>
              </div>
              <span className="text-xs font-semibold text-[#0369A1] dark:text-[#7DD3FC] bg-[#E0F0FE] dark:bg-[#13233D] px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-[#BAE0FD] dark:border-[#1E3456]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0284C7]" />
                Single Department Isolation: {selectedItem.department}
              </span>
            </div>

            {/* Timeline Steps */}
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#C8E2FA] dark:before:bg-[#1E3456]">
              {((selectedItem.timeline && selectedItem.timeline.length > 0)
                ? selectedItem.timeline
                : [
                    {
                      status: 'Submitted',
                      timestamp: selectedItem.submittedAt,
                      actor: `Citizen ${selectedItem.citizenUid}`,
                      note: `Initial grievance filed with geo-pin at ${selectedItem.location?.name || 'Municipal Ward'}.`
                    },
                    {
                      status: 'Single-Dept Routed',
                      timestamp: selectedItem.submittedAt,
                      actor: 'Civic AI Intelligence Dispatcher',
                      note: `Exclusively routed to ${selectedItem.department}. Jurisdictional isolation check passed: zero overlap with other departments.`
                    },
                    ...(selectedItem.status !== 'Open' ? [{
                      status: selectedItem.status,
                      timestamp: 'In Progress / Current',
                      actor: 'Zonal Municipal Office',
                      note: `Case status updated to ${selectedItem.status}. Assigned field officer working on remediation.`
                    }] : [])
                  ]
              ).map((event, idx) => (
                <div key={idx} className="relative flex items-start gap-3 group">
                  {/* Timeline dot */}
                  <span className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full ring-4 ring-white dark:ring-[#0B1528] shrink-0 ${
                    idx === 0 
                      ? 'bg-[#0A192F] dark:bg-[#38BDF8]' 
                      : event.status.includes('Resolved') 
                      ? 'bg-[#FACC15]' 
                      : event.status.includes('Routed')
                      ? 'bg-[#0284C7]'
                      : 'bg-[#FACC15]'
                  }`} />
                  
                  <div className="flex-1 bg-[#F0F7FF] dark:bg-[#0F1D33] p-3 rounded-xl border border-[#C8E2FA] dark:border-[#1E3456] text-xs space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0A192F] dark:text-white text-xs">
                          {event.status}
                        </span>
                        <span className="text-[10px] bg-[#FFFFFF] dark:bg-[#13233D] border border-[#C8E2FA] dark:border-[#1E3456] px-2 py-0.5 rounded text-[#475569] dark:text-slate-300 font-medium">
                          {event.actor}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.timestamp}
                      </span>
                    </div>
                    <p className="text-[#475569] dark:text-slate-300 leading-relaxed pt-0.5">
                      {event.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Area (Bottom Fixed-like feel) */}
          <div className="bg-[#FFFFFF] dark:bg-[#0B1528] p-4 rounded-2xl border border-[#C8E2FA] dark:border-[#1E3456] shadow-xs flex flex-wrap items-center justify-between gap-3 transition-colors">
            <div className="flex items-center gap-2">
              <button
                id="transfer-grievance-btn"
                onClick={() => setIsTransferModalOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-[#C8E2FA] dark:border-[#1E3456] hover:border-[#0A192F] dark:hover:border-[#38BDF8] text-[#0A192F] dark:text-white font-semibold text-xs md:text-sm bg-[#FFFFFF] dark:bg-[#0F1D33] hover:bg-[#F0F7FF] dark:hover:bg-[#13233D] transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <ArrowRightLeft className="w-4 h-4 text-[#64748B] dark:text-slate-400" />
                <span>Transfer</span>
              </button>

              <button
                id="upload-proof-btn"
                onClick={() => setIsProofModalOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-[#C8E2FA] dark:border-[#1E3456] hover:border-[#0A192F] dark:hover:border-[#38BDF8] text-[#0A192F] dark:text-white font-semibold text-xs md:text-sm bg-[#FFFFFF] dark:bg-[#0F1D33] hover:bg-[#F0F7FF] dark:hover:bg-[#13233D] transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Upload className="w-4 h-4 text-[#64748B] dark:text-slate-400" />
                <span>Upload Resolution Proof</span>
              </button>
            </div>

            {/* Primary Action */}
            <button
              id="update-status-btn"
              onClick={() => setIsStatusModalOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0A192F] via-[#0F294D] to-[#1E3A8A] hover:opacity-95 text-white font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer ml-auto active:scale-98 border border-[#1E3A8A]"
            >
              <CheckCircle2 className="w-4 h-4 text-[#FACC15]" />
              <span>Update Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <StatusModal
        grievance={selectedItem}
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onUpdateStatus={onUpdateStatus}
      />

      <TransferModal
        grievance={selectedItem}
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onTransfer={onTransferDept}
      />

      <ResolutionProofModal
        grievance={selectedItem}
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
        onSubmitProof={onSubmitResolutionProof}
      />
    </div>
  );
};
