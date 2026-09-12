import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Search, 
  CheckCheck, 
  MapPin, 
  Building2, 
  Zap,
  ShieldCheck,
  Award,
  Check
} from 'lucide-react';
import { PortalNotification } from '../types';

interface NotificationsViewProps {
  notifications: PortalNotification[];
  onSelectGrievance: (id: string) => void;
  onToggleSeen: (id: string) => void;
  onToggleSolved: (id: string) => void;
  onToggleRecent?: (id: string) => void;
  onMarkAllAsSeen: () => void;
  onFileNewGrievance?: () => void;
}

type TabFilter = 'all' | 'recent' | 'seen' | 'solved' | 'unseen';

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onSelectGrievance,
  onToggleSeen,
  onToggleSolved,
  onToggleRecent,
  onMarkAllAsSeen,
  onFileNewGrievance
}) => {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Counters
  const totalCount = notifications.length;
  const recentCount = notifications.filter((n) => n.isRecent).length;
  const seenCount = notifications.filter((n) => n.seen).length;
  const solvedCount = notifications.filter((n) => n.solved).length;
  const unseenCount = notifications.filter((n) => !n.seen).length;

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === 'recent' && !n.isRecent) return false;
      if (activeTab === 'seen' && !n.seen) return false;
      if (activeTab === 'solved' && !n.solved) return false;
      if (activeTab === 'unseen' && n.seen) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.desc.toLowerCase().includes(q) ||
          n.grievanceId.toLowerCase().includes(q) ||
          n.department.toLowerCase().includes(q) ||
          n.location.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  return (
    <div id="notifications-tab-view" className="max-w-5xl mx-auto space-y-6">
      {/* Enhanced Hero Banner with Dark Blue, Light Blue, White & Smooth Yellow Theme */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-[#0A192F] via-[#0D2342] to-[#123661] text-white border border-[#1E3A8A] shadow-lg transition-all">
        {/* Ambient background glow accents with smooth yellow and light blue */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#0284C7]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#FACC15]/15 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#38BDF8]/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0F0FE]/15 text-[#38BDF8] text-xs font-bold border border-[#38BDF8]/30 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>Civic Dispatch & Resolution Feed</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Portal Notifications & Field Updates</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15] animate-pulse" />
            </h1>
            <p className="text-xs md:text-sm text-[#C8E2FA] max-w-2xl leading-relaxed">
              Real-time audit log tracking official inspection visits, acknowledged civic tickets, on-ground repairs, and verified resolutions.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onMarkAllAsSeen}
              className="px-4 py-2.5 bg-[#FFFFFF] hover:bg-[#F0F7FF] text-[#0A192F] font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer border border-[#C8E2FA] active:scale-98"
            >
              <CheckCheck className="w-4 h-4 text-[#0284C7]" />
              <span>Mark All as Seen</span>
            </button>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#C8E2FA]/20">
          <button
            onClick={() => setActiveTab('all')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-xs ${
              activeTab === 'all'
                ? 'bg-[#FFFFFF] text-[#0A192F] border-white shadow-md scale-[1.02]'
                : 'bg-[#0A192F]/60 text-white border-[#1E3A8A] hover:bg-[#0E284D]/80'
            }`}
          >
            <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${activeTab === 'all' ? 'text-[#0369A1]' : 'text-[#C8E2FA]'}`}>
              Total Notifications
            </div>
            <div className="text-2xl font-extrabold">{totalCount}</div>
            <span className={`text-[10px] mt-0.5 block ${activeTab === 'all' ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>All portal events</span>
          </button>

          <button
            onClick={() => setActiveTab('recent')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden backdrop-blur-xs ${
              activeTab === 'recent'
                ? 'bg-[#FEF08A] text-[#854D0E] border-[#FACC15] shadow-md scale-[1.02]'
                : 'bg-[#0A192F]/60 text-white border-[#1E3A8A] hover:bg-[#0E284D]/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${activeTab === 'recent' ? 'text-[#854D0E]' : 'text-[#FACC15]'}`}>
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Marked Recent</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-[#FACC15] animate-ping" />
            </div>
            <div className={`text-2xl font-extrabold mt-1 ${activeTab === 'recent' ? 'text-[#854D0E]' : 'text-[#FACC15]'}`}>
              {recentCount}
            </div>
            <span className={`text-[10px] block ${activeTab === 'recent' ? 'text-[#854D0E]/80' : 'text-[#C8E2FA]'}`}>
              Recent alerts today
            </span>
          </button>

          <button
            onClick={() => setActiveTab('seen')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-xs ${
              activeTab === 'seen'
                ? 'bg-[#E0F0FE] text-[#0369A1] border-[#BAE0FD] shadow-md scale-[1.02]'
                : 'bg-[#0A192F]/60 text-white border-[#1E3A8A] hover:bg-[#0E284D]/80'
            }`}
          >
            <div className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider mb-1 ${activeTab === 'seen' ? 'text-[#0369A1]' : 'text-[#38BDF8]'}`}>
              <Eye className="w-3.5 h-3.5" />
              <span>Seen Details</span>
            </div>
            <div className={`text-2xl font-extrabold ${activeTab === 'seen' ? 'text-[#0369A1]' : 'text-white'}`}>{seenCount}</div>
            <span className={`text-[10px] mt-0.5 block ${activeTab === 'seen' ? 'text-[#0284C7]' : 'text-[#C8E2FA]'}`}>Officials acknowledged</span>
          </button>

          <button
            onClick={() => setActiveTab('solved')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer backdrop-blur-xs ${
              activeTab === 'solved'
                ? 'bg-[#FFFFFF] text-[#0A192F] border-white shadow-md scale-[1.02]'
                : 'bg-[#0A192F]/60 text-white border-[#1E3A8A] hover:bg-[#0E284D]/80'
            }`}
          >
            <div className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider mb-1 ${activeTab === 'solved' ? 'text-[#0A192F]' : 'text-[#7DD3FC]'}`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>Solved Details</span>
            </div>
            <div className="text-2xl font-extrabold">{solvedCount}</div>
            <span className={`text-[10px] mt-0.5 block ${activeTab === 'solved' ? 'text-[#64748B]' : 'text-[#C8E2FA]'}`}>Work orders verified</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B1528] border border-[#C8E2FA] dark:border-[#1E3456] shadow-xs transition-colors">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'all'
                ? 'bg-[#0A192F] dark:bg-[#38BDF8] text-white dark:text-[#0A192F] shadow-xs'
                : 'text-[#475569] dark:text-slate-300 hover:bg-[#F0F7FF] dark:hover:bg-[#13233D]'
            }`}
          >
            All Updates ({totalCount})
          </button>

          <button
            onClick={() => setActiveTab('recent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'recent'
                ? 'bg-[#FEF08A] text-[#854D0E] border border-[#FACC15] shadow-xs'
                : 'text-[#854D0E] dark:text-[#FEF08A] bg-[#FEF9C3] dark:bg-[#1C1F10] hover:bg-[#FEF08A] dark:hover:bg-[#282E12] border border-[#FDE047]/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current text-[#EAB308]" />
            <span>Marked Recent ({recentCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('seen')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'seen'
                ? 'bg-[#0284C7] text-white shadow-xs'
                : 'text-[#0369A1] dark:text-[#7DD3FC] bg-[#E0F0FE] dark:bg-[#13233D] hover:bg-[#BAE0FD] dark:hover:bg-[#1E3456] border border-[#BAE0FD] dark:border-[#1E3456]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Seen Details ({seenCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('solved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'solved'
                ? 'bg-[#0A192F] text-white shadow-xs'
                : 'text-[#0A192F] dark:text-white bg-[#F0F7FF] dark:bg-[#13233D] hover:bg-[#E0F0FE] border border-[#C8E2FA] dark:border-[#1E3456]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#FACC15]" />
            <span>Solved Details ({solvedCount})</span>
          </button>

          {unseenCount > 0 && (
            <button
              onClick={() => setActiveTab('unseen')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeTab === 'unseen'
                  ? 'bg-[#BA1A1A] text-white shadow-xs'
                  : 'text-[#93000A] dark:text-rose-300 bg-[#FFDAD6] dark:bg-rose-950/60 border border-[#BA1A1A]/30'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Unseen ({unseenCount})</span>
            </button>
          )}
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-[#64748B] dark:text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket, officer or location..."
            className="w-full pl-8 pr-4 py-1.5 bg-[#F0F7FF] dark:bg-[#080E1A] border border-[#C8E2FA] dark:border-[#1E3456] rounded-xl text-xs text-[#0A192F] dark:text-white placeholder-[#64748B] dark:placeholder-slate-400 focus:outline-none focus:border-[#0284C7] dark:focus:border-[#38BDF8]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1.5 text-xs text-[#64748B] hover:text-[#0A192F] dark:hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[#FFFFFF] dark:bg-[#0B1528] rounded-3xl border border-[#C8E2FA] dark:border-[#1E3456] space-y-3 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F0F7FF] dark:bg-[#13233D] flex items-center justify-center text-[#0284C7] border border-[#C8E2FA] dark:border-[#1E3456]">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#0A192F] dark:text-white">
              No notifications matching this filter
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 max-w-sm mx-auto">
              You're currently viewing "{activeTab}" notifications. Try resetting filters to see all municipal updates.
            </p>
            <button
              onClick={() => { setActiveTab('all'); setSearchQuery(''); }}
              className="px-4 py-2 bg-[#0A192F] hover:bg-[#132F5B] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isSolved = n.solved;
            const isSeen = n.seen;
            const isRecent = n.isRecent;

            // Background styling in new Dark Blue / Light Blue / White / Smooth Yellow palette
            let cardBg = 'bg-[#FFFFFF] dark:bg-[#0B1528] border-[#C8E2FA] dark:border-[#1E3456] shadow-xs';
            if (isSolved) {
              cardBg = 'bg-gradient-to-br from-[#FFFFFF] via-[#F0FDF4] to-[#F0F7FF] dark:from-[#0B1528] dark:via-[#0F241A] dark:to-[#0B1528] border-emerald-300 dark:border-emerald-800/80 shadow-xs';
            } else if (isRecent) {
              cardBg = 'bg-gradient-to-br from-[#FFFFFF] via-[#FEF9C3]/20 to-[#F0F7FF] dark:from-[#0B1528] dark:via-[#1D210F]/30 dark:to-[#0B1528] border-[#FACC15] dark:border-[#FACC15]/60 shadow-sm ring-1 ring-[#FACC15]/30';
            } else if (isSeen) {
              cardBg = 'bg-gradient-to-br from-[#FFFFFF] via-[#E0F0FE]/30 to-[#F0F7FF] dark:from-[#0B1528] dark:via-[#13233D]/40 dark:to-[#0B1528] border-[#BAE0FD] dark:border-[#1E3456] shadow-xs';
            }

            return (
              <div
                key={n.id}
                id={`notification-feed-card-${n.id}`}
                className={`p-5 rounded-3xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${cardBg}`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
                  <div className="space-y-1.5">
                    {/* Status badges row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-[#0A192F] text-white dark:bg-[#E0F0FE] dark:text-[#0A192F]">
                        #{n.grievanceId}
                      </span>

                      {/* MARK RECENT BADGE - Smooth Yellow Accent */}
                      {isRecent && (
                        <span className="bg-[#FEF08A] text-[#854D0E] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs border border-[#FACC15]">
                          <Zap className="w-2.5 h-2.5 fill-current animate-pulse text-[#EAB308]" />
                          <span>MARKED RECENT</span>
                        </span>
                      )}

                      {/* SOLVED Details Badge */}
                      {isSolved && (
                        <span className="bg-[#DCFCE7] dark:bg-emerald-950/80 text-[#166534] dark:text-[#4ADE80] text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300 dark:border-emerald-700">
                          <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                          <span>SOLVED & VERIFIED</span>
                        </span>
                      )}

                      {/* SEEN Details Badge */}
                      {isSeen && !isSolved && (
                        <span className="bg-[#E0F0FE] dark:bg-[#13233D] text-[#0369A1] dark:text-[#7DD3FC] text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-[#BAE0FD] dark:border-[#1E3456]">
                          <Eye className="w-3 h-3 text-[#0284C7]" />
                          <span>SEEN & IN-REVIEW</span>
                        </span>
                      )}

                      {!isSeen && (
                        <span className="bg-[#FFDAD6] dark:bg-rose-950/80 text-[#93000A] dark:text-rose-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-[#BA1A1A]/30">
                          <AlertTriangle className="w-3 h-3" />
                          <span>UNSEEN</span>
                        </span>
                      )}

                      <span className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
                        • {n.category}
                      </span>
                    </div>

                    <h2 className="text-sm md:text-base font-bold text-[#0A192F] dark:text-white leading-snug">
                      {n.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-[#64748B] dark:text-slate-400 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{n.timeAgo}</span>
                  </div>
                </div>

                <p className="text-xs md:text-sm text-[#475569] dark:text-slate-300 leading-relaxed mb-4">
                  {n.desc}
                </p>

                {/* Explicit Details Section: Details whether Seen or Solved */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F0F7FF]/80 dark:bg-[#080E1A]/80 border border-[#C8E2FA] dark:border-[#1E3456] text-xs mb-4">
                  {/* Seen Details Block */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[#64748B] dark:text-slate-400 tracking-wider">
                        Seen Details
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSeen 
                          ? 'bg-[#E0F0FE] text-[#0369A1] dark:bg-[#13233D] dark:text-[#7DD3FC]' 
                          : 'bg-[#FEF08A] text-[#854D0E]'
                      }`}>
                        {isSeen ? 'Acknowledged' : 'Pending Review'}
                      </span>
                    </div>

                    {isSeen ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[#0A192F] dark:text-white font-semibold">
                          <Eye className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                          <span>Reviewer: <strong>{n.seenBy || 'Municipal Official'}</strong></span>
                        </div>
                        <p className="text-[11px] text-[#64748B] dark:text-slate-400 pl-5">
                          Acknowledged: {n.seenAt || 'Recently'} • Single-Dept Jurisdiction Confirmed
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[#854D0E] dark:text-[#FACC15] font-medium pt-0.5">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-[#EAB308]" />
                        <span>Awaiting field officer acknowledgment in portal inbox</span>
                      </div>
                    )}
                  </div>

                  {/* Solved Details Block */}
                  <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l sm:pl-3 border-[#C8E2FA] dark:border-[#1E3456] pt-2 sm:pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[#64748B] dark:text-slate-400 tracking-wider">
                        Solved Details
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSolved 
                          ? 'bg-[#DCFCE7] text-[#166534] dark:bg-emerald-950/60 dark:text-[#4ADE80]' 
                          : 'bg-[#F0F7FF] text-[#0369A1] dark:bg-[#13233D] dark:text-[#7DD3FC]'
                      }`}>
                        {isSolved ? 'Resolved & Verified' : 'In Progress'}
                      </span>
                    </div>

                    {isSolved ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[#166534] dark:text-[#4ADE80] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                          <span>Solved by: <strong>{n.solvedBy || 'Field Response Unit'}</strong></span>
                        </div>
                        <p className="text-[11px] text-[#64748B] dark:text-slate-400 pl-5">
                          Completed on: {n.solvedAt || 'Recently'}
                        </p>
                        {n.resolutionProofNote && (
                          <div className="ml-5 p-2 bg-[#FFFFFF] dark:bg-[#13233D] rounded-xl border border-[#C8E2FA] dark:border-[#1E3456] text-[11px] text-[#0A192F] dark:text-slate-200 italic">
                            Proof: "{n.resolutionProofNote}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[#64748B] dark:text-slate-400 pt-0.5">
                        <span>Work order dispatched to <strong>{n.department}</strong>. On-ground repair underway.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer metadata & buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#C8E2FA]/60 dark:border-[#1E3456] text-xs">
                  <div className="flex items-center gap-4 text-[#64748B] dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1.5 font-semibold text-[#0A192F] dark:text-slate-200">
                      <Building2 className="w-3.5 h-3.5 text-[#0284C7]" />
                      <span>{n.department}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#FACC15]" />
                      <span>{n.location}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Toggle Recent status button */}
                    {onToggleRecent && (
                      <button
                        onClick={() => onToggleRecent(n.id)}
                        className={`px-3 py-1.5 rounded-xl font-semibold text-xs border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isRecent
                            ? 'bg-[#FEF08A] text-[#854D0E] border-[#FACC15]'
                            : 'bg-[#FFFFFF] dark:bg-[#0B1528] text-[#475569] dark:text-slate-300 border-[#C8E2FA] dark:border-[#1E3456] hover:bg-[#FEF9C3]'
                        }`}
                        title={isRecent ? 'Unmark Recent' : 'Mark as Recent'}
                      >
                        <Zap className={`w-3.5 h-3.5 ${isRecent ? 'fill-current text-[#EAB308]' : 'text-[#64748B]'}`} />
                        <span>{isRecent ? 'Recent ✓' : 'Mark Recent'}</span>
                      </button>
                    )}

                    {/* Mark as seen / unseen button */}
                    <button
                      onClick={() => onToggleSeen(n.id)}
                      className={`px-3 py-1.5 rounded-xl font-semibold text-xs border flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSeen
                          ? 'bg-[#FFFFFF] dark:bg-[#0B1528] text-[#475569] dark:text-slate-300 border-[#C8E2FA] dark:border-[#1E3456] hover:bg-[#F0F7FF]'
                          : 'bg-[#0284C7] text-white border-[#0284C7] hover:bg-[#0369A1] shadow-2xs'
                      }`}
                    >
                      {isSeen ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-[#64748B]" />
                          <span>Mark Unseen</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Mark Seen</span>
                        </>
                      )}
                    </button>

                    {/* Mark as solved button */}
                    <button
                      onClick={() => onToggleSolved(n.id)}
                      className={`px-3 py-1.5 rounded-xl font-semibold text-xs border flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSolved
                          ? 'bg-[#DCFCE7] dark:bg-emerald-950/70 text-[#166534] dark:text-[#4ADE80] border-emerald-300 dark:border-emerald-700'
                          : 'bg-[#FFFFFF] dark:bg-[#0B1528] text-[#0A192F] dark:text-white border-[#C8E2FA] dark:border-[#1E3456] hover:bg-[#F0FDF4]'
                      }`}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isSolved ? 'text-[#16A34A]' : 'text-[#FACC15]'}`} />
                      <span>{isSolved ? 'Solved ✓' : 'Mark Solved'}</span>
                    </button>

                    {/* View Ticket Link */}
                    <button
                      onClick={() => onSelectGrievance(n.grievanceId)}
                      className="px-3 py-1.5 bg-[#0A192F] hover:bg-[#132F5B] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                    >
                      <span>View Ticket</span>
                      <ArrowRight className="w-3 h-3 text-[#FACC15]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
