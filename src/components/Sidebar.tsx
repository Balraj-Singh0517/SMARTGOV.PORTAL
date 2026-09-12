import React from 'react';
import { 
  Building2, 
  Plus, 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Landmark, 
  Settings, 
  HelpCircle, 
  LogOut,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Bell
} from 'lucide-react';
import { AuthUser } from '../types';
import { PortalLogo } from './PortalLogo';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onFileNewGrievance: () => void;
  pendingCount?: number;
  currentUser?: AuthUser | null;
  onOpenLogin?: () => void;
  unreadNotificationCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onFileNewGrievance,
  pendingCount = 12,
  currentUser,
  onOpenLogin,
  unreadNotificationCount = 0
}) => {
  const { t, isHindi } = useLanguage();

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { 
      id: 'my-grievances', 
      label: t('nav.my_grievances', 'My Grievances'), 
      icon: FileText,
      badge: pendingCount > 0 ? `${pendingCount}` : undefined
    },
    {
      id: 'notifications',
      label: t('nav.notifications', 'Notifications'),
      icon: Bell,
      badge: unreadNotificationCount > 0 ? `${unreadNotificationCount}` : undefined
    },
    { id: 'analytics', label: t('nav.analytics', 'Analytics'), icon: BarChart3 },
    { id: 'departments', label: t('nav.departments', 'Departments'), icon: Landmark },
    { id: 'settings', label: t('nav.settings', 'Settings'), icon: Settings },
  ];

  const isOfficer = currentUser?.role === 'officer';

  return (
    <nav 
      id="main-sidebar"
      className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-[#FFFFFF] dark:bg-[#0B1528] border-r border-[#C8E2FA] dark:border-[#1E3456] shadow-sm p-4 space-y-2 z-40 transition-colors"
    >
      {/* Brand Header */}
      <div className="px-2 pt-2 pb-3 mb-2 flex items-center gap-3">
        <PortalLogo size="md" />
        <div className="flex flex-col">
          <h1 className="font-bold text-lg text-[#0A192F] dark:text-white tracking-tight leading-tight">
            smart<span className="text-[#0284C7] dark:text-[#38BDF8]">Gov</span>
            <span className="text-[#FACC15] font-black">.</span>
          </h1>
          <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
            Grievance Portal
          </p>
        </div>
      </div>

      {/* Primary Call to Action */}
      <div className="px-1 pb-3">
        <button
          id="sidebar-file-grievance-btn"
          onClick={onFileNewGrievance}
          className="w-full bg-gradient-to-r from-[#0A192F] via-[#0F294D] to-[#1E3A8A] hover:opacity-95 text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-900/20 active:scale-[0.98] cursor-pointer border border-[#1E3A8A]"
        >
          <Plus className="w-4 h-4 text-[#FACC15]" />
          <span>{t('nav.file_grievance', 'Add New Complaint')}</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#E0F0FE] to-[#F0F7FF] dark:from-[#13233D] dark:to-[#0F1D33] text-[#0A192F] dark:text-white border-l-4 border-l-[#FACC15] border-y border-r border-[#C8E2FA] dark:border-[#1E3456] font-bold shadow-xs scale-[0.98]'
                  : 'text-[#475569] dark:text-slate-300 hover:bg-[#F0F7FF] dark:hover:bg-[#0F1D33] hover:text-[#0A192F] dark:hover:text-white hover:translate-x-1'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#0284C7] dark:text-[#38BDF8]' : 'text-[#64748B] dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  isActive 
                    ? 'bg-[#FEF08A] text-[#854D0E] border border-[#FDE047]' 
                    : 'bg-[#E0F0FE] dark:bg-[#13233D] text-[#0369A1] dark:text-[#7DD3FC]'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active User Account Badge */}
      <div className="bg-[#F0F7FF] dark:bg-[#0F1D33] p-3 rounded-2xl border border-[#C8E2FA] dark:border-[#1E3456] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
            Active Account
          </span>
          {isOfficer ? (
            <span className="text-[10px] font-bold bg-[#E0F0FE] text-[#0369A1] dark:bg-[#13233D] dark:text-[#7DD3FC] px-1.5 py-0.5 rounded flex items-center gap-1 border border-[#BAE0FD] dark:border-[#1E3456]">
              <ShieldCheck className="w-3 h-3 text-[#0284C7]" />
              <span>Officer</span>
            </span>
          ) : (
            <span className="text-[10px] font-bold bg-[#FEF9C3] text-[#854D0E] dark:bg-[#1A2614] dark:text-[#FACC15] px-1.5 py-0.5 rounded flex items-center gap-1 border border-[#FDE047]/60">
              <UserCheck className="w-3 h-3 text-[#EAB308]" />
              <span>Citizen</span>
            </span>
          )}
        </div>
        <div className="text-xs font-bold text-[#0A192F] dark:text-white truncate">
          {currentUser?.name || (isOfficer ? 'Municipal Officer' : 'Public Citizen')}
        </div>
        <div className="text-[11px] text-[#475569] dark:text-slate-300 truncate">
          {currentUser?.email || (isOfficer ? 'officer.sharma@muni.gov.in' : 'citizen@gmail.com')}
        </div>
        {currentUser?.uniqueSecurityCode && (
          <div className="text-[10px] font-mono text-[#0A192F] dark:text-[#FACC15] bg-[#FFFFFF] dark:bg-[#080E1A] px-2 py-0.5 rounded flex items-center gap-1 font-bold border border-[#C8E2FA] dark:border-[#1E3456]">
            <KeyRound className="w-3 h-3 text-[#EAB308]" />
            <span>Passkey: {currentUser.uniqueSecurityCode}</span>
          </div>
        )}
      </div>

      {/* Footer Items */}
      <div className="mt-auto pt-2 border-t border-[#C8E2FA] dark:border-[#1E3456] space-y-1">
        {/* Language Selection Quick Switcher */}
        <LanguageSelector variant="sidebar" />

        <div className="flex items-center justify-between px-3 py-1.5 text-xs text-[#475569] dark:text-slate-300">
          <span className="font-medium">{t('nav.theme_mode', 'Theme Mode')}</span>
          <ThemeToggle variant="button" />
        </div>
        <button
          id="nav-item-support"
          onClick={() => onSelectTab('support')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            currentTab === 'support' 
              ? 'bg-[#E0F0FE] dark:bg-[#13233D] text-[#0A192F] dark:text-white font-bold' 
              : 'text-[#475569] dark:text-slate-300 hover:bg-[#F0F7FF] dark:hover:bg-[#0F1D33] hover:text-[#0A192F] dark:hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>{t('nav.support', 'Support & Help')}</span>
        </button>
        <button
          id="nav-item-logout"
          onClick={onOpenLogin}
          className="w-full flex items-center gap-3 px-3 py-2 text-[#0A192F] dark:text-white hover:bg-[#F0F7FF] dark:hover:bg-[#0F1D33] rounded-xl text-sm font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-[#0284C7]" />
          <span>{t('nav.switch_account', 'Switch Account / Login')}</span>
        </button>
      </div>
    </nav>
  );
};
