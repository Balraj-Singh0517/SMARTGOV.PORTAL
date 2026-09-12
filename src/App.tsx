import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNavBar } from './components/TopNavBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileDrawer } from './components/MobileDrawer';
import { FileGrievanceView } from './components/FileGrievanceView';
import { OfficerInboxDetailView } from './components/OfficerInboxDetailView';
import { AnalyticsView } from './components/AnalyticsView';
import { DepartmentsView } from './components/DepartmentsView';
import { SettingsView } from './components/SettingsView';
import { NotificationDrawer, INITIAL_NOTIFICATIONS } from './components/NotificationDrawer';
import { NotificationsView } from './components/NotificationsView';
import { HelpModal } from './components/HelpModal';
import { LoginModal } from './components/LoginModal';
import { Grievance, GrievanceStatus, ResolutionProof, AuthUser, OfficialReply, PortalNotification, WebSocketMessage } from './types';
import { WebSocketProvider } from './context/WebSocketContext';
import { MOCK_GRIEVANCES } from './data/mockData';
import { CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export function App() {
  const [grievances, setGrievances] = useState<Grievance[]>(MOCK_GRIEVANCES);
  const [selectedGrievanceId, setSelectedGrievanceId] = useState<string>('GRV-2023-1042');
  const [currentTab, setCurrentTab] = useState<string>('departments');
  const [currentRole, setCurrentRole] = useState<'officer' | 'citizen'>('officer');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Portal Notifications State (with persistence & initial dataset)
  const [notifications, setNotifications] = useState<PortalNotification[]>(() => {
    try {
      const saved = localStorage.getItem('smartgov_portal_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_NOTIFICATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('smartgov_portal_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn('Failed to cache notifications', e);
    }
  }, [notifications]);

  const handleToggleSeen = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const nextSeen = !n.seen;
          return {
            ...n,
            seen: nextSeen,
            seenAt: nextSeen ? 'Just now' : undefined,
            seenBy: nextSeen ? (currentUser?.name || 'Er. Jane Smith (Zonal Engineer)') : undefined
          };
        }
        return n;
      })
    );
  };

  const handleToggleSolved = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const nextSolved = !n.solved;
          return {
            ...n,
            solved: nextSolved,
            statusType: nextSolved ? 'solved' : (n.seen ? 'seen' : 'in_progress'),
            solvedAt: nextSolved ? 'Just now' : undefined,
            solvedBy: nextSolved ? (currentUser?.name || 'Municipal Field Team') : undefined,
            resolutionProofNote: nextSolved ? 'Work order verified on-ground with photo proof.' : undefined
          };
        }
        return n;
      })
    );
  };

  const handleToggleRecent = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const nextRecent = !n.isRecent;
          return {
            ...n,
            isRecent: nextRecent,
            timeAgo: nextRecent ? 'Just now' : n.timeAgo
          };
        }
        return n;
      })
    );
    showToast('Notification recent status updated');
  };

  const handleMarkAllAsSeen = () => {
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        seen: true,
        seenAt: n.seenAt || 'Just now',
        seenBy: n.seenBy || (currentUser?.name || 'Municipal Official')
      }))
    );
    showToast('All portal notifications marked as seen and acknowledged', 'success');
  };

  const unreadNotificationCount = notifications.filter((n) => !n.seen).length;

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('smartgov_current_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      email: 'officer.sharma@muni.gov.in',
      name: 'Er. Jane Smith (Zonal Engineer)',
      role: 'officer',
      department: 'Public Works (Power)',
      uniqueSecurityCode: 'GOV-2026-MUNI',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    };
  });
  
  // Drawers & Modals
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // Toast Alert Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Sync role with currentUser
  useEffect(() => {
    if (currentUser) {
      setCurrentRole(currentUser.role);
    }
  }, [currentUser]);

  // Fetch initial grievances from server on load (with localStorage caching)
  useEffect(() => {
    const cached = localStorage.getItem('smartgov_all_grievances');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGrievances(parsed);
          if (!selectedGrievanceId) {
            setSelectedGrievanceId(parsed[0].id);
          }
        }
      } catch (e) {
        console.warn('Failed to parse cached grievances', e);
      }
    }

    const fetchGrievances = async () => {
      try {
        const res = await fetch('/api/grievances');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data && data.data.length > 0) {
            setGrievances((prev) => {
              // Merge server items with any newly created local items that might not be on server yet
              const serverIds = new Set(data.data.map((item: Grievance) => item.id));
              const localOnly = prev.filter((item) => !serverIds.has(item.id));
              const merged = [...localOnly, ...data.data];
              localStorage.setItem('smartgov_all_grievances', JSON.stringify(merged));
              return merged;
            });
            if (!selectedGrievanceId) {
              setSelectedGrievanceId(data.data[0].id);
            }
          }
        }
      } catch (err) {
        console.warn('Using local grievances cache', err);
      }
    };
    fetchGrievances();
  }, []);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    try {
      localStorage.setItem('smartgov_current_user', JSON.stringify(user));
    } catch {
      // ignore
    }
    if (user.role === 'officer') {
      showToast(`Government Official Logged In (${user.uniqueSecurityCode})`, 'success');
      setCurrentTab('departments');
    } else {
      showToast(`Logged in as Public Citizen (${user.email})`, 'info');
    }
  };

  // Real-time WebSocket Event Dispatcher (Syncs live multi-client updates)
  const handleWsMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'init:sync': {
        if (message.payload?.grievances && Array.isArray(message.payload.grievances)) {
          setGrievances((prev) => {
            const serverItems: Grievance[] = message.payload.grievances;
            const serverIds = new Set(serverItems.map((g) => g.id));
            const localOnly = prev.filter((g) => !serverIds.has(g.id));
            const merged = [...localOnly, ...serverItems];
            localStorage.setItem('smartgov_all_grievances', JSON.stringify(merged));
            return merged;
          });
        }
        break;
      }
      case 'grievance:created': {
        const newGrievance = message.payload as Grievance;
        if (!newGrievance || !newGrievance.id) break;
        setGrievances((prev) => {
          if (prev.some((g) => g.id === newGrievance.id)) return prev;
          const updated = [newGrievance, ...prev];
          localStorage.setItem('smartgov_all_grievances', JSON.stringify(updated));
          return updated;
        });
        showToast(`⚡ Live Update: New grievance #${newGrievance.id} received in ${newGrievance.department}`, 'info');
        break;
      }
      case 'grievance:status_changed':
      case 'grievance:updated': {
        const updatedItem = message.payload as Grievance;
        if (!updatedItem || !updatedItem.id) break;
        setGrievances((prev) => {
          const updated = prev.map((g) => (g.id === updatedItem.id ? { ...g, ...updatedItem } : g));
          localStorage.setItem('smartgov_all_grievances', JSON.stringify(updated));
          return updated;
        });
        showToast(`⚡ Live Sync: #${updatedItem.id} marked as ${updatedItem.status}`, 'info');
        break;
      }
      case 'grievance:transferred': {
        const transferredItem = message.payload as Grievance;
        if (!transferredItem || !transferredItem.id) break;
        setGrievances((prev) => {
          const updated = prev.map((g) => (g.id === transferredItem.id ? { ...g, ...transferredItem } : g));
          localStorage.setItem('smartgov_all_grievances', JSON.stringify(updated));
          return updated;
        });
        showToast(`⚡ Live Sync: #${transferredItem.id} transferred to ${transferredItem.department}`, 'info');
        break;
      }
      case 'grievance:replied': {
        const { grievance, reply } = message.payload || {};
        if (grievance && grievance.id) {
          setGrievances((prev) => {
            const updated = prev.map((g) => (g.id === grievance.id ? { ...g, ...grievance } : g));
            localStorage.setItem('smartgov_all_grievances', JSON.stringify(updated));
            return updated;
          });
          showToast(`⚡ Live Sync: Official reply posted for #${grievance.id}`, 'success');
        }
        break;
      }
      case 'grievance:supported': {
        const { id, supportersCount } = message.payload || {};
        if (id && typeof supportersCount === 'number') {
          setGrievances((prev) => {
            const updated = prev.map((g) => (g.id === id ? { ...g, supportersCount } : g));
            localStorage.setItem('smartgov_all_grievances', JSON.stringify(updated));
            return updated;
          });
        }
        break;
      }
      case 'notification:new': {
        const notif = message.payload as PortalNotification;
        if (notif && notif.id) {
          setNotifications((prev) => {
            if (prev.some((n) => n.id === notif.id)) return prev;
            const updated = [notif, ...prev];
            localStorage.setItem('smartgov_portal_notifications', JSON.stringify(updated));
            return updated;
          });
        }
        break;
      }
      default:
        break;
    }
  }, []);

  // Handle Official Government Reply to Grievance in Department Folder
  const handleReplyGrievance = async (
    id: string,
    replyText: string,
    statusSet: 'unseen' | 'in_progress' | 'solved',
    officerInfo: { name: string; email: string; securityCode?: string }
  ) => {
    try {
      const res = await fetch(`/api/grievances/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replyText,
          statusSet,
          officerName: officerInfo.name,
          officerEmail: officerInfo.email,
          securityCode: officerInfo.securityCode
        })
      });
      const data = await res.json();
      if (data.success && data.grievance) {
        setGrievances((prev) => {
          const updated = prev.map((g) => (g.id === id ? data.grievance : g));
          localStorage.setItem('smartgov_all_grievances', JSON.stringify(updated));
          return updated;
        });
        showToast(`Official municipal reply published. Ticket marked ${statusSet.toUpperCase()}!`);
        return;
      }
    } catch (e) {
      console.warn('Reply API fallback to local state:', e);
    }

    // Local state fallback update
    const mappedStatus: GrievanceStatus = 
      statusSet === 'solved' ? 'Resolved' : statusSet === 'in_progress' ? 'In Progress' : 'Open';
    
    const newReply: OfficialReply = {
      id: `REP-${Date.now()}`,
      officerName: officerInfo.name,
      officerEmail: officerInfo.email,
      replyText,
      timestamp: new Date().toLocaleString(),
      statusSet,
      securityCode: officerInfo.securityCode
    };

    setGrievances((prev) => {
      const updated = prev.map((g) => {
        if (g.id !== id) return g;
        const officialReplies = [...(g.officialReplies || []), newReply];
        const timeline = [
          ...(g.timeline || []),
          {
            status: `Officer Replied (${statusSet})`,
            timestamp: new Date().toLocaleString(),
            actor: `${officerInfo.name} (${officerInfo.securityCode || 'Gov Officer'})`,
            note: replyText
          }
        ];
        return {
          ...g,
          status: mappedStatus,
          officialReplies,
          timeline,
          isUnseen: statusSet === 'unseen'
        };
      });
      localStorage.setItem('smartgov_all_grievances', JSON.stringify(updated));
      return updated;
    });

    showToast(`Official municipal reply published. Ticket marked ${statusSet.toUpperCase()}!`);
  };

  // Handle new grievance filing
  const handleGrievanceSubmitted = (newGrievance: Grievance) => {
    setGrievances((prev) => {
      const updated = [newGrievance, ...prev];
      localStorage.setItem('smartgov_all_grievances', JSON.stringify(updated));
      return updated;
    });
    setSelectedGrievanceId(newGrievance.id);
    setCurrentTab('my-grievances');
    showToast(`Grievance #${newGrievance.id} submitted & saved! Exclusively routed to ${newGrievance.department}.`);
  };

  // Handle support on existing complaint (duplicate merge)
  const handleSupportExisting = async (id: string) => {
    try {
      await fetch(`/api/grievances/${id}/support`, { method: 'POST' });
    } catch (e) {
      console.warn('Support call fallback');
    }

    setGrievances((prev) => {
      const updated = prev.map((g) =>
        g.id === id
          ? { ...g, supportersCount: (g.supportersCount || 0) + 1, hasSupported: true }
          : g
      );
      localStorage.setItem('smartgov_all_grievances', JSON.stringify(updated));
      return updated;
    });
    setSelectedGrievanceId(id);
    setCurrentTab('my-grievances');
    showToast(`Supported existing ticket #${id}! Priority weight boosted.`);
  };

  // Handle status change & append to timeline history
  const handleUpdateStatus = async (id: string, newStatus: GrievanceStatus, note: string) => {
    const actorName = currentRole === 'officer' ? 'Field Officer (Inspector)' : 'Citizen UID-Self';
    try {
      await fetch(`/api/grievances/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note,
          officerName: actorName
        })
      });
    } catch (e) {
      console.warn('Status patch fallback');
    }

    setGrievances((prev) => {
      const updated = prev.map((g) => {
        if (g.id !== id) return g;
        const newTimelineEvent = {
          status: newStatus,
          timestamp: 'Just now',
          actor: actorName,
          note: note || `Status transitioned to "${newStatus}". Verification underway.`
        };
        return {
          ...g,
          status: newStatus,
          timeline: [...(g.timeline || []), newTimelineEvent]
        };
      });
      localStorage.setItem('smartgov_all_grievances', JSON.stringify(updated));
      return updated;
    });
    showToast(`Status of #${id} updated to "${newStatus}" and citizen audit log appended!`);
  };

  // Handle department transfer & append to timeline history
  const handleTransfer = async (id: string, newDept: string, reason: string) => {
    try {
      await fetch(`/api/grievances/${id}/transfer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDepartment: newDept,
          reason,
          officerName: 'Zonal Inspector'
        })
      });
    } catch (e) {
      console.warn('Transfer patch fallback');
    }

    setGrievances((prev) => {
      const updated = prev.map((g) => {
        if (g.id !== id) return g;
        const transferEvent = {
          status: `Transferred to ${newDept}`,
          timestamp: 'Just now',
          actor: 'Zonal Inspector',
          note: reason || `Department reassigned to ${newDept}. Strict 1:1 departmental jurisdiction maintained.`
        };
        return {
          ...g,
          department: newDept,
          timeline: [...(g.timeline || []), transferEvent]
        };
      });
      localStorage.setItem('smartgov_all_grievances', JSON.stringify(updated));
      return updated;
    });
    showToast(`Jurisdiction of #${id} transferred to "${newDept}". Single authority preserved.`);
  };

  // Handle resolution proof submission
  const handleResolutionProof = async (id: string, proof: ResolutionProof) => {
    try {
      await fetch(`/api/grievances/${id}/resolution-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proof)
      });
    } catch (e) {
      console.warn('Proof post fallback');
    }

    setGrievances((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              status: 'Resolved',
              resolutionProof: proof
            }
          : g
      )
    );

    // Sync portal notification state
    setNotifications((prev) =>
      prev.map((n) =>
        n.grievanceId === id
          ? {
              ...n,
              solved: true,
              statusType: 'solved',
              solvedAt: 'Just now',
              solvedBy: proof.officerName || currentUser?.name || 'Municipal Officer',
              resolutionProofNote: proof.notes || 'Resolved with verified photo proof',
              isRecent: true,
              timeAgo: 'Just now'
            }
          : n
      )
    );

    showToast(`Resolution proof uploaded & ticket #${id} marked Resolved!`);
  };

  // Search filter
  const displayedGrievances = grievances.filter((g) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      g.id.toLowerCase().includes(query) ||
      g.title.toLowerCase().includes(query) ||
      g.description.toLowerCase().includes(query) ||
      g.department.toLowerCase().includes(query) ||
      g.location.name.toLowerCase().includes(query)
    );
  });

  const pendingCount = grievances.filter((g) => g.status !== 'Resolved').length;

  return (
    <WebSocketProvider onMessage={handleWsMessage}>
      <div className="min-h-screen bg-[#F0F7FF] dark:bg-[#080E1A] text-[#0A192F] dark:text-[#F0F7FF] flex flex-col font-sans selection:bg-[#FEF08A] selection:text-[#0A192F] transition-colors">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#0A192F] text-white dark:bg-[#0F1D33] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#C8E2FA]/30 dark:border-[#1E3456] animate-slideDown ring-1 ring-[#FACC15]/40">
          <CheckCircle2 className="w-5 h-5 text-[#FACC15] shrink-0" />
          <span className="text-xs md:text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Main Sidebar (Desktop) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'support') {
            setIsHelpOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        onFileNewGrievance={() => setCurrentTab('file-grievance')}
        pendingCount={pendingCount}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        unreadNotificationCount={unreadNotificationCount}
      />

      {/* Main Content Area */}
      <div className="md:pl-64 flex-1 flex flex-col min-h-screen pb-16 md:pb-6">
        {/* Top Navbar */}
        <TopNavBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          currentRole={currentRole}
          onToggleRole={() => {
            const next = currentRole === 'officer' ? 'citizen' : 'officer';
            setCurrentRole(next);
            if (currentUser) {
              setCurrentUser({ ...currentUser, role: next });
            }
            showToast(`Switched perspective to ${next === 'officer' ? 'Officer View' : 'Citizen View'}`);
          }}
          unreadCount={unreadNotificationCount}
          title="SmartGov Portal"
          currentUser={currentUser}
          onOpenLogin={() => setIsLoginModalOpen(true)}
        />

        {/* View Router */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          {currentTab === 'file-grievance' && (
            <FileGrievanceView
              onBack={() => setCurrentTab('departments')}
              onSubmitSuccess={handleGrievanceSubmitted}
              onSupportExisting={handleSupportExisting}
            />
          )}

          {(currentTab === 'my-grievances' || currentTab === 'dashboard') && (
            <OfficerInboxDetailView
              grievances={displayedGrievances}
              selectedGrievanceId={selectedGrievanceId}
              onSelectGrievance={setSelectedGrievanceId}
              onUpdateStatus={handleUpdateStatus}
              onTransferDept={handleTransfer}
              onSubmitResolutionProof={handleResolutionProof}
            />
          )}

          {currentTab === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              onSelectGrievance={(id) => {
                setSelectedGrievanceId(id);
                setCurrentTab('my-grievances');
              }}
              onToggleSeen={handleToggleSeen}
              onToggleSolved={handleToggleSolved}
              onToggleRecent={handleToggleRecent}
              onMarkAllAsSeen={handleMarkAllAsSeen}
              onFileNewGrievance={() => setCurrentTab('file-grievance')}
            />
          )}

          {currentTab === 'analytics' && <AnalyticsView />}

          {currentTab === 'departments' && (
            <DepartmentsView 
              grievances={grievances}
              onSelectGrievance={(id) => {
                setSelectedGrievanceId(id);
                setCurrentTab('my-grievances');
              }}
              onNavigateToInbox={() => setCurrentTab('my-grievances')}
              currentUser={currentUser}
              currentRole={currentRole}
              onRequestLogin={() => setIsLoginModalOpen(true)}
              onReplyGrievance={handleReplyGrievance}
            />
          )}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation (<768px) */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onFileNewGrievance={() => setCurrentTab('file-grievance')}
        onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
        pendingCount={pendingCount}
      />

      {/* Mobile Slide-over Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'support') {
            setIsHelpOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        onFileNewGrievance={() => setCurrentTab('file-grievance')}
        pendingCount={pendingCount}
        unreadNotificationCount={unreadNotificationCount}
      />

      {/* Notification Slide Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onToggleSeen={handleToggleSeen}
        onToggleSolved={handleToggleSolved}
        onToggleRecent={handleToggleRecent}
        onMarkAllAsSeen={handleMarkAllAsSeen}
        onSelectGrievance={(id) => {
          setSelectedGrievanceId(id);
          setCurrentTab('my-grievances');
        }}
      />

      {/* Help & FAQs Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Dual Login Authentication Modal (Public Gmail vs Government Employee with Security Code) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentUser={currentUser}
      />
    </div>
    </WebSocketProvider>
  );
}

export default App;
