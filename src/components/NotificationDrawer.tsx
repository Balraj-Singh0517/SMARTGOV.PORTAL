import React, { useState, useMemo } from 'react';
import { 
  X, 
  Bell, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Filter, 
  Search, 
  CheckCheck, 
  MapPin,
  Building2,
  Zap
} from 'lucide-react';
import { PortalNotification } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGrievance?: (id: string) => void;
  notifications?: PortalNotification[];
  onToggleSeen?: (id: string) => void;
  onToggleSolved?: (id: string) => void;
  onToggleRecent?: (id: string) => void;
  onMarkAllAsSeen?: () => void;
}

export const INITIAL_NOTIFICATIONS: PortalNotification[] = [
  {
    id: 'notif-1',
    grievanceId: 'GRV-2023-1048',
    title: 'Water Board: Pipeline Burst Emergency Team Dispatched',
    desc: 'Emergency Valve Isolation Team en route to Ring Road Junction. Main water line shut-off scheduled to halt street flooding.',
    category: 'Water Supply',
    department: 'Water Board',
    location: 'Ring Road Junction, Ward 03',
    statusType: 'in_progress',
    seen: true,
    seenAt: '10m ago',
    seenBy: 'Officer Michael Ross (Field Supervisor)',
    solved: false,
    isRecent: true,
    timeAgo: '8m ago',
    rawTimestamp: Date.now() - 8 * 60 * 1000,
    priority: 'High'
  },
  {
    id: 'notif-2',
    grievanceId: 'GRV-2023-1033',
    title: 'Parks Dept: Children Playground Swings Solved & Verified',
    desc: 'Repairs completed by Municipal Workshop Team. All damaged swings replaced with child-safe coated chains and rusted frames welded.',
    category: 'Public Safety',
    department: 'Parks & Horticulture',
    location: 'Nehru Park, Ward 15',
    statusType: 'solved',
    seen: true,
    seenAt: '45m ago',
    seenBy: 'Officer Vikram Chawla (Horticulture Lead)',
    solved: true,
    solvedAt: '22m ago',
    solvedBy: 'Officer Vikram Chawla',
    resolutionProofNote: 'Safety inspection certificate issued; before/after photos uploaded to municipal registry.',
    isRecent: true,
    timeAgo: '22m ago',
    rawTimestamp: Date.now() - 22 * 60 * 1000,
    priority: 'General'
  },
  {
    id: 'notif-3',
    grievanceId: 'GRV-2023-1042',
    title: 'Power Dept: High Risk Streetlight Failure Seen & Escalated',
    desc: 'Ticket flagged as High Risk due to night collision hazard at Central Market. Night patrol vehicle assigned with replacement ballast.',
    category: 'Street Lighting',
    department: 'Public Works (Power)',
    location: 'Central Market Road, Ward 12',
    statusType: 'seen',
    seen: true,
    seenAt: '35m ago',
    seenBy: 'Er. Jane Smith (Zonal Engineer)',
    solved: false,
    isRecent: true,
    timeAgo: '35m ago',
    rawTimestamp: Date.now() - 35 * 60 * 1000,
    priority: 'High'
  },
  {
    id: 'notif-4',
    grievanceId: 'GRV-2023-1051',
    title: 'Water Board: Contaminated Tap Water Complaint Received',
    desc: 'Citizen report of muddy water in Sector 15. Awaiting field inspector laboratory sample test and line flush.',
    category: 'Water Quality',
    department: 'Water Board',
    location: 'Sector 15 Block B, Ward 02',
    statusType: 'urgent',
    seen: false,
    solved: false,
    isRecent: true,
    timeAgo: '3m ago',
    rawTimestamp: Date.now() - 3 * 60 * 1000,
    priority: 'High'
  },
  {
    id: 'notif-5',
    grievanceId: 'GRV-2023-1045',
    title: 'Sanitation: Sector 42 Garbage Collection Seen & Vehicle Assigned',
    desc: 'Assigned to Ward Sanitation Supervisor Anita Patel. Hydraulic compactor vehicle dispatched to clear corner dump.',
    category: 'Solid Waste',
    department: 'Sanitation',
    location: 'Sector 42 Gate 3, Ward 08',
    statusType: 'seen',
    seen: true,
    seenAt: '2h ago',
    seenBy: 'Supervisor Anita Patel',
    solved: false,
    isRecent: false,
    timeAgo: '2h ago',
    rawTimestamp: Date.now() - 2 * 60 * 60 * 1000,
    priority: 'General'
  },
  {
    id: 'notif-6',
    grievanceId: 'GRV-2023-1028',
    title: 'Road Works: Bus Terminal Pothole Solved & Resurfaced',
    desc: 'Bitumen hot-mix resurfacing completed. Traffic flow restored smoothly with citizen sign-off and compaction testing.',
    category: 'Roads & Transport',
    department: 'Civil Infrastructure',
    location: 'Interstate Bus Terminal Gate 2, Ward 06',
    statusType: 'solved',
    seen: true,
    seenAt: '6h ago',
    seenBy: 'Executive Engineer K. Verma',
    solved: true,
    solvedAt: '4h ago',
    solvedBy: 'Civil Works Rapid Response Unit',
    resolutionProofNote: 'Quality test verified; durability warranty registered in civic portal.',
    isRecent: false,
    timeAgo: '4h ago',
    rawTimestamp: Date.now() - 4 * 60 * 60 * 1000,
    priority: 'General'
  },
  {
    id: 'notif-7',
    grievanceId: 'GRV-2023-1019',
    title: 'Public Health: Stagnant Water Vector Treatment Solved',
    desc: 'Anti-larval chemical spraying and drainage channel desilting completed to prevent dengue vector breeding.',
    category: 'Public Health',
    department: 'Health & Vector Control',
    location: 'Greenfield Colony Sector 9, Ward 11',
    statusType: 'solved',
    seen: true,
    seenAt: '1 day ago',
    seenBy: 'Chief Medical Officer Dr. Sen',
    solved: true,
    solvedAt: '18h ago',
    solvedBy: 'Vector Control Squad 4',
    resolutionProofNote: 'Chemical density test passed. Zero larval activity recorded.',
    isRecent: false,
    timeAgo: '18h ago',
    rawTimestamp: Date.now() - 18 * 60 * 60 * 1000,
    priority: 'General'
  }
];

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onSelectGrievance,
  notifications: propNotifications,
  onToggleSeen,
  onToggleSolved,
  onToggleRecent,
  onMarkAllAsSeen
}) => {
  const [internalNotifications, setInternalNotifications] = useState<PortalNotification[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'seen' | 'solved' | 'unseen'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const notifications = propNotifications || internalNotifications;

  const handleToggleSeen = (id: string) => {
    if (onToggleSeen) {
      onToggleSeen(id);
    } else {
      setInternalNotifications((prev) =>
        prev.map((n) => {
          if (n.id === id) {
            const nextSeen = !n.seen;
            return {
              ...n,
              seen: nextSeen,
              seenAt: nextSeen ? 'Just now' : undefined,
              seenBy: nextSeen ? 'Municipal Official' : undefined
            };
          }
          return n;
        })
      );
    }
  };

  const handleToggleSolved = (id: string) => {
    if (onToggleSolved) {
      onToggleSolved(id);
    } else {
      setInternalNotifications((prev) =>
        prev.map((n) => {
          if (n.id === id) {
            const nextSolved = !n.solved;
            return {
              ...n,
              solved: nextSolved,
              statusType: nextSolved ? 'solved' : (n.seen ? 'seen' : 'in_progress'),
              solvedAt: nextSolved ? 'Just now' : undefined,
              solvedBy: nextSolved ? 'Municipal Field Team' : undefined,
              resolutionProofNote: nextSolved ? 'Work order verified on-ground with photo proof.' : undefined
            };
          }
          return n;
        })
      );
    }
  };

  const handleToggleRecent = (id: string) => {
    if (onToggleRecent) {
      onToggleRecent(id);
    } else {
      setInternalNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRecent: !n.isRecent } : n))
      );
    }
  };

  const handleMarkAllSeen = () => {
    if (onMarkAllAsSeen) {
      onMarkAllAsSeen();
    } else {
      setInternalNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          seen: true,
          seenAt: n.seenAt || 'Just now',
          seenBy: n.seenBy || 'Municipal Official'
        }))
      );
    }
  };

  // Metrics counters
  const totalCount = notifications.length;
  const recentCount = notifications.filter((n) => n.isRecent).length;
  const seenCount = notifications.filter((n) => n.seen).length;
  const solvedCount = notifications.filter((n) => n.solved).length;
  const unseenCount = notifications.filter((n) => !n.seen).length;

  // Filtered list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === 'recent' && !n.isRecent) return false;
      if (activeTab === 'seen' && !n.seen) return false;
      if (activeTab === 'solved' && !n.solved) return false;
      if (activeTab === 'unseen' && n.seen) return false;

      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase();
        return (
          n.title.toLowerCase().includes(query) ||
          n.desc.toLowerCase().includes(query) ||
          n.grievanceId.toLowerCase().includes(query) ||
          n.department.toLowerCase().includes(query) ||
          n.location.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [notifications, activeTab, searchFilter]);

  if (!isOpen) return null;

  return (
    <div 
      id="portal-notification-overlay"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="portal-notification-drawer"
        className="w-full max-w-lg h-full shadow-2xl flex flex-col justify-between border-l border-[#C8E2FA] dark:border-[#1E3456] animate-slideLeft transition-all relative overflow-hidden bg-[#F0F7FF] dark:bg-[#080E1A]"
      >
        {/* Enhanced ambient background glow orbs in smooth yellow, light blue, and dark blue */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#0284C7]/20 dark:bg-[#0284C7]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#FACC15]/15 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 right-1/4 w-60 h-60 rounded-full bg-[#38BDF8]/10 blur-3xl" />

        {/* Drawer Header */}
        <div className="relative z-10 p-5 border-b border-[#C8E2FA] dark:border-[#1E3456] bg-[#FFFFFF]/95 dark:bg-[#0B1528]/95 backdrop-blur-md space-y-3.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0A192F] dark:bg-[#0F2342] border border-[#1E3A8A] text-white flex items-center justify-center shadow-md">
                <Bell className="w-5 h-5 text-[#FACC15]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-lg text-[#0A192F] dark:text-white tracking-tight">
                    Portal Notifications
                  </h2>
                  {unseenCount > 0 && (
                    <span className="bg-[#BA1A1A] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse shadow-xs">
                      {unseenCount} New
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  Real-time status updates: Seen & Solved civic grievances
                </p>
              </div>
            </div>
            <button 
              id="close-notifications-btn"
              onClick={onClose} 
              className="p-2 text-[#64748B] dark:text-slate-400 hover:text-[#0A192F] dark:hover:text-white hover:bg-[#E0F0FE] dark:hover:bg-[#13233D] rounded-full transition-colors cursor-pointer"
              aria-label="Close Notification Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Metric Summary Counters Banner */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#0A192F] text-white border-[#0A192F] shadow-xs scale-[1.02]'
                  : 'bg-[#FFFFFF] dark:bg-[#080E1A] text-[#0A192F] dark:text-white border-[#C8E2FA] dark:border-[#1E3456] hover:bg-[#F0F7FF]'
              }`}
            >
              <span className={`block text-[10px] uppercase font-bold ${activeTab === 'all' ? 'text-slate-300' : 'text-[#64748B] dark:text-slate-400'}`}>All</span>
              <span className="text-sm font-extrabold">{totalCount}</span>
            </button>

            <button
              onClick={() => setActiveTab('recent')}
              className={`p-2 rounded-xl text-center border transition-all cursor-pointer relative overflow-hidden ${
                activeTab === 'recent'
                  ? 'bg-[#FEF08A] text-[#854D0E] border-[#FACC15] shadow-xs scale-[1.02]'
                  : 'bg-[#FFFFFF] dark:bg-[#080E1A] text-[#0A192F] dark:text-white border-[#C8E2FA] dark:border-[#1E3456] hover:bg-[#FEF9C3]/50'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <Zap className={`w-3 h-3 ${activeTab === 'recent' ? 'text-[#854D0E]' : 'text-[#EAB308]'}`} />
                <span className="text-[10px] uppercase font-bold">Recent</span>
              </div>
              <span className={`text-sm font-extrabold ${activeTab === 'recent' ? 'text-[#854D0E]' : 'text-[#EAB308]'}`}>{recentCount}</span>
            </button>

            <button
              onClick={() => setActiveTab('seen')}
              className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                activeTab === 'seen'
                  ? 'bg-[#0284C7] text-white border-[#0284C7] shadow-xs scale-[1.02]'
                  : 'bg-[#FFFFFF] dark:bg-[#080E1A] text-[#0A192F] dark:text-white border-[#C8E2FA] dark:border-[#1E3456] hover:bg-[#E0F0FE]'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <Eye className={`w-3 h-3 ${activeTab === 'seen' ? 'text-white' : 'text-[#0284C7]'}`} />
                <span className="text-[10px] uppercase font-bold">Seen</span>
              </div>
              <span className="text-sm font-extrabold">{seenCount}</span>
            </button>

            <button
              onClick={() => setActiveTab('solved')}
              className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                activeTab === 'solved'
                  ? 'bg-[#0A192F] text-white border-[#0A192F] shadow-xs scale-[1.02]'
                  : 'bg-[#FFFFFF] dark:bg-[#080E1A] text-[#0A192F] dark:text-white border-[#C8E2FA] dark:border-[#1E3456] hover:bg-[#F0FDF4]'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <CheckCircle2 className={`w-3 h-3 ${activeTab === 'solved' ? 'text-[#FACC15]' : 'text-[#16A34A]'}`} />
                <span className="text-[10px] uppercase font-bold">Solved</span>
              </div>
              <span className="text-sm font-extrabold">{solvedCount}</span>
            </button>
          </div>

          {/* Search bar & quick filter pills */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] dark:text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                id="search-notifications-input"
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter by Ticket #, department, or keyword..."
                className="w-full pl-8 pr-4 py-2 bg-[#F0F7FF] dark:bg-[#080E1A] border border-[#C8E2FA] dark:border-[#1E3456] rounded-xl text-xs text-[#0A192F] dark:text-white placeholder-[#64748B] dark:placeholder-slate-400 focus:outline-none focus:border-[#0284C7] transition-colors shadow-2xs"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2.5 top-2.5 text-xs text-[#64748B] hover:text-[#0A192F] dark:hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-[11px] font-bold text-[#64748B] dark:text-slate-400 mr-1 flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3" />
                Filter:
              </span>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-full font-semibold shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#0A192F] text-white'
                    : 'bg-[#FFFFFF] dark:bg-[#0B1528] text-[#475569] dark:text-slate-300 border border-[#C8E2FA] dark:border-[#1E3456]'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={`px-2.5 py-1 rounded-full font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTab === 'recent'
                    ? 'bg-[#FEF08A] text-[#854D0E] border border-[#FACC15]'
                    : 'bg-[#FEF9C3] dark:bg-[#1C1F10] text-[#854D0E] dark:text-[#FEF08A] border border-[#FDE047]/60'
                }`}
              >
                <Zap className="w-3 h-3 text-[#EAB308]" />
                Recent ({recentCount})
              </button>
              <button
                onClick={() => setActiveTab('seen')}
                className={`px-2.5 py-1 rounded-full font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTab === 'seen'
                    ? 'bg-[#0284C7] text-white'
                    : 'bg-[#E0F0FE] dark:bg-[#13233D] text-[#0284C7] dark:text-[#38BDF8] border border-[#BAE0FD] dark:border-[#1E3456]'
                }`}
              >
                <Eye className="w-3 h-3" />
                Seen ({seenCount})
              </button>
              <button
                onClick={() => setActiveTab('solved')}
                className={`px-2.5 py-1 rounded-full font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTab === 'solved'
                    ? 'bg-[#0A192F] text-white'
                    : 'bg-[#DCFCE7] dark:bg-[#0F241A] text-[#166534] dark:text-[#4ADE80] border border-emerald-300/60'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                Solved ({solvedCount})
              </button>
              {unseenCount > 0 && (
                <button
                  onClick={() => setActiveTab('unseen')}
                  className={`px-2.5 py-1 rounded-full font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                    activeTab === 'unseen'
                      ? 'bg-[#BA1A1A] text-white'
                      : 'bg-[#FFDAD6] dark:bg-rose-950/60 text-[#93000A] dark:text-rose-200 border border-[#BA1A1A]/30'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  Unseen ({unseenCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications list with Enhanced Background & Cards */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3.5">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFFFFF] dark:bg-[#0B1528] border border-[#C8E2FA] dark:border-[#1E3456] flex items-center justify-center text-[#0284C7]">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-[#0A192F] dark:text-white">
                No notifications in this view
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400 max-w-xs mx-auto">
                No matching alerts found for your active filter. Switch back to "All" or clear the search keyword.
              </p>
              <button
                onClick={() => { setActiveTab('all'); setSearchFilter(''); }}
                className="px-4 py-1.5 bg-[#0A192F] text-white rounded-xl text-xs font-bold hover:bg-[#132F5B] transition-colors cursor-pointer"
              >
                Show All Notifications
              </button>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const isSolved = n.solved;
              const isSeen = n.seen;
              const isRecent = n.isRecent;

              let cardBg = 'bg-[#FFFFFF] dark:bg-[#0B1528] border-[#C8E2FA] dark:border-[#1E3456]';
              if (isSolved) {
                cardBg = 'bg-gradient-to-br from-[#FFFFFF] via-[#F0FDF4] to-[#F0F7FF] dark:from-[#0B1528] dark:via-[#0F241A] dark:to-[#0B1528] border-emerald-300 dark:border-emerald-800/80 shadow-xs';
              } else if (isRecent) {
                cardBg = 'bg-gradient-to-br from-[#FFFFFF] via-[#FEF9C3]/20 to-[#F0F7FF] dark:from-[#0B1528] dark:via-[#1D210F]/30 dark:to-[#0B1528] border-[#FACC15] dark:border-[#FACC15]/60 shadow-xs ring-1 ring-[#FACC15]/30';
              } else if (isSeen) {
                cardBg = 'bg-gradient-to-br from-[#FFFFFF] via-[#E0F0FE]/30 to-[#F0F7FF] dark:from-[#0B1528] dark:via-[#13233D]/40 dark:to-[#0B1528] border-[#BAE0FD] dark:border-[#1E3456]';
              }

              return (
                <div
                  key={n.id}
                  id={`notification-card-${n.id}`}
                  className={`p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md relative group ${cardBg}`}
                >
                  {/* Top Status & Recency Header Row */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Ticket Badge */}
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#0A192F] text-white dark:bg-[#E0F0FE] dark:text-[#0A192F]">
                        #{n.grievanceId}
                      </span>

                      {/* MARK RECENT: High-visibility badge */}
                      {isRecent && (
                        <span className="bg-[#FEF08A] text-[#854D0E] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs border border-[#FACC15]">
                          <Zap className="w-2.5 h-2.5 fill-current animate-pulse text-[#EAB308]" />
                          <span>RECENT</span>
                        </span>
                      )}

                      {/* Explicit Name: SOLVED Details */}
                      {isSolved && (
                        <span className="bg-[#DCFCE7] dark:bg-emerald-950/80 text-[#166534] dark:text-[#4ADE80] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300 dark:border-emerald-700">
                          <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                          <span>SOLVED</span>
                        </span>
                      )}

                      {/* Explicit Name: SEEN Details */}
                      {isSeen && !isSolved && (
                        <span className="bg-[#E0F0FE] dark:bg-[#13233D] text-[#0369A1] dark:text-[#7DD3FC] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-[#BAE0FD] dark:border-[#1E3456]">
                          <Eye className="w-3 h-3 text-[#0284C7]" />
                          <span>SEEN & IN-REVIEW</span>
                        </span>
                      )}

                      {/* Urgent Unseen */}
                      {!isSeen && (
                        <span className="bg-[#FFDAD6] dark:bg-rose-950/80 text-[#93000A] dark:text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-[#BA1A1A]/30">
                          <AlertTriangle className="w-3 h-3" />
                          <span>UNSEEN</span>
                        </span>
                      )}
                    </div>

                    {/* Freshness Timestamp */}
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-[#64748B] dark:text-slate-400 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{n.timeAgo}</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xs md:text-sm font-bold text-[#0A192F] dark:text-white leading-snug mb-1">
                    {n.title}
                  </h3>
                  <p className="text-xs text-[#475569] dark:text-slate-300 leading-relaxed mb-3">
                    {n.desc}
                  </p>

                  {/* Explicit Details Box: Seen Details & Solved Details */}
                  <div className="mb-3 p-2.5 rounded-xl bg-[#F0F7FF]/80 dark:bg-[#080E1A]/80 border border-[#C8E2FA] dark:border-[#1E3456] space-y-2 text-[11px]">
                    {/* Seen Details */}
                    <div>
                      <span className="text-[9px] uppercase font-bold text-[#64748B] dark:text-slate-400 tracking-wider block">
                        Seen Details:
                      </span>
                      {isSeen ? (
                        <div className="flex items-center gap-1.5 text-[#0369A1] dark:text-[#7DD3FC] font-medium">
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Acknowledged by <strong>{n.seenBy || 'Official Supervisor'}</strong> ({n.seenAt || 'Recently'})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#854D0E] dark:text-[#FACC15] font-medium">
                          Pending initial review by designated zonal officer
                        </span>
                      )}
                    </div>

                    {/* Solved Details */}
                    <div className="pt-1.5 border-t border-[#C8E2FA]/60 dark:border-[#1E3456]">
                      <span className="text-[9px] uppercase font-bold text-[#64748B] dark:text-slate-400 tracking-wider block">
                        Solved Details:
                      </span>
                      {isSolved ? (
                        <div className="space-y-0.5 text-[#166534] dark:text-[#4ADE80] font-medium">
                          <div className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#16A34A]" />
                            <span>
                              Resolved by <strong>{n.solvedBy || 'Field Unit'}</strong> ({n.solvedAt || 'Completed'})
                            </span>
                          </div>
                          {n.resolutionProofNote && (
                            <p className="text-[10px] text-[#475569] dark:text-slate-300 pl-5 italic">
                              "{n.resolutionProofNote}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#64748B] dark:text-slate-400">
                          Active repair order • In progress with <strong>{n.department}</strong>
                        </span>
                      )}
                    </div>

                    {/* Location and Department info */}
                    <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 pt-1 border-t border-[#C8E2FA]/60 dark:border-[#1E3456] flex-wrap gap-1">
                      <span className="flex items-center gap-1 font-medium text-[#0A192F] dark:text-slate-200">
                        <Building2 className="w-3 h-3 text-[#0284C7]" />
                        {n.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#FACC15]" />
                        {n.location}
                      </span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-1 text-xs gap-2 flex-wrap">
                    {/* View ticket link */}
                    <button
                      onClick={() => {
                        if (onSelectGrievance && n.grievanceId) {
                          onSelectGrievance(n.grievanceId);
                          onClose();
                        }
                      }}
                      className="font-bold text-[#0284C7] dark:text-[#38BDF8] hover:underline flex items-center gap-1 cursor-pointer py-1"
                    >
                      <span>View Ticket</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Interactive state modifiers */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Toggle Recent */}
                      <button
                        type="button"
                        onClick={() => handleToggleRecent(n.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                          isRecent
                            ? 'bg-[#FEF08A] text-[#854D0E] border-[#FACC15]'
                            : 'bg-[#FFFFFF] dark:bg-[#0B1528] text-[#64748B] dark:text-slate-300 border-[#C8E2FA] dark:border-[#1E3456]'
                        }`}
                        title={isRecent ? 'Unmark Recent' : 'Mark as Recent'}
                      >
                        <Zap className={`w-3 h-3 ${isRecent ? 'fill-current text-[#EAB308]' : ''}`} />
                        <span>{isRecent ? 'Recent' : 'Mark Recent'}</span>
                      </button>

                      {/* Mark Seen Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleSeen(n.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                          isSeen
                            ? 'bg-[#FFFFFF] dark:bg-[#0B1528] text-[#475569] dark:text-slate-300 border-[#C8E2FA] dark:border-[#1E3456] hover:bg-[#F0F7FF]'
                            : 'bg-[#0284C7] text-white border-[#0284C7] shadow-xs hover:bg-[#0369A1]'
                        }`}
                        title={isSeen ? 'Mark as unseen' : 'Mark as seen'}
                      >
                        {isSeen ? (
                          <>
                            <EyeOff className="w-3 h-3 text-[#64748B]" />
                            <span>Unseen</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Seen</span>
                          </>
                        )}
                      </button>

                      {/* Mark Solved Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleSolved(n.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                          isSolved
                            ? 'bg-[#DCFCE7] dark:bg-emerald-950/60 text-[#166534] dark:text-[#4ADE80] border-emerald-300 dark:border-emerald-700'
                            : 'bg-[#FFFFFF] dark:bg-[#0B1528] text-[#0A192F] dark:text-white border-[#C8E2FA] dark:border-[#1E3456] hover:bg-[#F0FDF4]'
                        }`}
                        title={isSolved ? 'Reopen ticket' : 'Mark as solved'}
                      >
                        <CheckCircle2 className={`w-3 h-3 ${isSolved ? 'text-[#16A34A]' : 'text-[#FACC15]'}`} />
                        <span>{isSolved ? 'Solved ✓' : 'Mark Solved'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer with Bulk Actions */}
        <div className="relative z-10 p-4 border-t border-[#C8E2FA] dark:border-[#1E3456] bg-[#FFFFFF]/95 dark:bg-[#0B1528]/95 backdrop-blur-md flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#64748B] dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#FACC15]" />
            <span>
              <strong>{seenCount}</strong> seen • <strong>{solvedCount}</strong> solved
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="mark-all-seen-btn"
              onClick={handleMarkAllSeen}
              className="px-3 py-1.5 bg-[#F0F7FF] dark:bg-[#13233D] hover:bg-[#E0F0FE] dark:hover:bg-[#1E3456] text-[#0A192F] dark:text-white border border-[#C8E2FA] dark:border-[#1E3456] rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Mark All as Seen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
