import React from 'react';
import { Search, Bell, HelpCircle, Menu, ShieldCheck, UserCheck, LogIn, KeyRound, Radio } from 'lucide-react';
import { AuthUser } from '../types';
import { PortalLogo } from './PortalLogo';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '../context/LanguageContext';
import { useWebSocket } from '../context/WebSocketContext';

interface TopNavBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenMobileMenu: () => void;
  onOpenNotifications: () => void;
  onOpenHelp: () => void;
  currentRole: 'officer' | 'citizen';
  onToggleRole: () => void;
  unreadCount?: number;
  title?: string;
  currentUser?: AuthUser | null;
  onOpenLogin?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenMobileMenu,
  onOpenNotifications,
  onOpenHelp,
  currentRole,
  onToggleRole,
  unreadCount = 2,
  title = 'SmartGov Portal',
  currentUser,
  onOpenLogin
}) => {
  const { t, isHindi } = useLanguage();
  const { isConnected, connectionStatus, onlineCount, reconnect } = useWebSocket();

  return (
    <header 
      id="main-top-navbar"
      className="sticky top-0 z-30 flex items-center justify-between w-full px-4 md:px-8 py-3 bg-[#FFFFFF]/95 dark:bg-[#0B1528]/95 backdrop-blur-md border-b border-[#C8E2FA] dark:border-[#1E3456] shadow-xs transition-colors"
    >
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          id="mobile-menu-btn"
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-[#475569] dark:text-slate-300 hover:bg-[#E0F0FE] dark:hover:bg-[#13233D] rounded-full transition-colors cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Portal Title & Logo */}
        <div className="flex items-center gap-2.5">
          <PortalLogo size="sm" className="shrink-0" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg sm:text-xl md:text-2xl text-[#0A192F] dark:text-white tracking-tight">
              smart<span className="text-[#0284C7] dark:text-[#38BDF8]">Gov</span>
              <span className="text-[#FACC15] font-black">.</span>
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E0F0FE] dark:bg-[#13233D] text-[#0369A1] dark:text-[#7DD3FC] border border-[#BAE0FD] dark:border-[#1E3456]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15] mr-1.5 inline-block animate-pulse" />
              {t('app.subtitle', 'Grievance AI')}
            </span>

            {/* Live Real-time WebSocket Status Pill */}
            <div
              id="ws-status-indicator"
              title={isConnected ? `Real-Time WebSocket Active • ${onlineCount} Connected Officer/Citizen(s)` : 'WebSocket Offline (Click to Reconnect)'}
              onClick={!isConnected ? reconnect : undefined}
              className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                isConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60 shadow-2xs'
                  : connectionStatus === 'connecting'
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/60'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/60 cursor-pointer hover:underline'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isConnected ? 'bg-emerald-500' : connectionStatus === 'connecting' ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                />
              </span>
              <span className="font-mono text-[10px] tracking-tight font-bold">
                {isConnected ? `WS Live (${onlineCount})` : connectionStatus === 'connecting' ? 'WS Connecting' : 'WS Reconnect'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Search Bar */}
        <div className="relative hidden sm:flex items-center">
          <Search className="w-4 h-4 text-[#64748B] dark:text-slate-400 absolute left-3 pointer-events-none" />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('search.placeholder', 'Search records or keyword...')}
            className="w-40 md:w-56 pl-9 pr-4 py-1.5 bg-[#F0F7FF] dark:bg-[#0F1D33] border border-[#C8E2FA] dark:border-[#1E3456] rounded-full text-xs md:text-sm text-[#0A192F] dark:text-white placeholder-[#64748B] focus:outline-none focus:border-[#0A192F] dark:focus:border-[#38BDF8] focus:ring-1 focus:ring-[#BAE0FD] transition-colors"
          />
        </div>

        {/* User Account / Role Pill with Code indicator */}
        <button
          id="role-switch-btn"
          onClick={onOpenLogin || onToggleRole}
          title="Click to Switch User / Login Account"
          className="flex items-center gap-2 px-3 py-1.5 bg-[#FFFFFF] dark:bg-[#0F1D33] hover:bg-[#F0F7FF] dark:hover:bg-[#13233D] border border-[#C8E2FA] dark:border-[#1E3456] rounded-full text-xs font-semibold text-[#0A192F] dark:text-white transition-all shadow-2xs cursor-pointer"
        >
          {currentRole === 'officer' ? (
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
              <div className="text-left hidden lg:block">
                <span className="block text-[10px] text-[#0284C7] dark:text-[#38BDF8] font-extrabold uppercase leading-none">
                  {t('role.officer', 'Municipal Official')}
                </span>
                <span className="block text-[11px] text-[#475569] dark:text-slate-300 truncate max-w-[120px]">
                  {currentUser?.email || 'officer@muni.gov.in'}
                </span>
              </div>
              {currentUser?.uniqueSecurityCode && (
                <span className="hidden sm:inline-flex items-center gap-0.5 bg-[#0A192F] text-[#FACC15] text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#C8E2FA]/30">
                  <KeyRound className="w-2.5 h-2.5 text-[#FACC15]" />
                  <span>{currentUser.uniqueSecurityCode}</span>
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#EAB308]" />
              <div className="text-left hidden lg:block">
                <span className="block text-[10px] text-[#EAB308] font-extrabold uppercase leading-none">
                  {t('role.citizen', 'Public Citizen')}
                </span>
                <span className="block text-[11px] text-[#475569] dark:text-slate-300 truncate max-w-[120px]">
                  {currentUser?.email || 'citizen@gmail.com'}
                </span>
              </div>
            </div>
          )}
          <span className="text-[10px] font-bold text-[#0284C7] dark:text-[#38BDF8] underline ml-1">
            {t('role.switch', 'Switch')}
          </span>
        </button>

        {/* Language Choose Button with Icon */}
        <LanguageSelector variant="button" />

        {/* Theme Toggle (Light / Dark Mode) */}
        <ThemeToggle variant="button" />

        {/* Notifications Icon with badge */}
        <button
          id="top-notifications-btn"
          onClick={onOpenNotifications}
          className="relative p-2 text-[#475569] dark:text-slate-300 hover:text-[#0A192F] dark:hover:text-white hover:bg-[#E0F0FE] dark:hover:bg-[#13233D] rounded-full transition-colors cursor-pointer"
          aria-label="View notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#FACC15] rounded-full animate-pulse ring-2 ring-[#FFFFFF] dark:ring-[#0B1528]" />
          )}
        </button>

        {/* Help Icon */}
        <button
          id="top-help-btn"
          onClick={onOpenHelp}
          className="p-2 text-[#475569] dark:text-slate-300 hover:text-[#0284C7] dark:hover:text-[#38BDF8] hover:bg-[#E0F0FE] dark:hover:bg-[#13233D] rounded-full transition-colors cursor-pointer"
          aria-label="Help and guidance"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Profile Avatar */}
        <div className="pl-1 border-l border-[#C8E2FA] dark:border-[#1E3456] flex items-center">
          <img
            id="user-profile-avatar"
            src={currentUser?.avatarUrl || (currentRole === 'officer' 
              ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
              : 'https://lh3.googleusercontent.com/aida-public/AB6AXuDv8p4i2-E_U7846OYqfzokBh1WM2lnghpgiI3419FHWfdExZ7-uyvX12SxIGIatDsQMBtmlas9soqnM7Z14UgzU2hADEJQ5Xbq2-IFjw8G3R-W2aRm6iwb3UE35GVcOJWcbUQGh8_h1xVyXBCqdec6sYZuTPt7B7VUrSZeWh0pVoDBnFfsPHzI_bbniTjC0pSQGTKaFjFwmcmvhFXgkzJ0eeHArmFpQJOf1weqBNXeY4IsQ5GG1NdRyA'
            )}
            alt="User profile"
            className="w-8 h-8 rounded-full border border-[#C8E2FA] dark:border-[#1E3456] object-cover cursor-pointer hover:opacity-85 transition-opacity ring-1 ring-[#FACC15]/60"
            onClick={onOpenLogin || onToggleRole}
          />
        </div>
      </div>
    </header>
  );
};
