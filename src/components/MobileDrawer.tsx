import React from 'react';
import { X, LayoutDashboard, FileText, BarChart3, Landmark, Settings, HelpCircle, Plus, Bell } from 'lucide-react';
import { PortalLogo } from './PortalLogo';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '../context/LanguageContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onFileNewGrievance: () => void;
  pendingCount?: number;
  unreadNotificationCount?: number;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  onFileNewGrievance,
  pendingCount = 12,
  unreadNotificationCount = 0
}) => {
  const { t, isHindi } = useLanguage();

  if (!isOpen) return null;

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { id: 'my-grievances', label: t('nav.my_grievances', 'My Grievances'), icon: FileText, badge: pendingCount > 0 ? `${pendingCount}` : undefined },
    { id: 'notifications', label: t('nav.notifications', 'Notifications'), icon: Bell, badge: unreadNotificationCount > 0 ? `${unreadNotificationCount}` : undefined },
    { id: 'analytics', label: t('nav.analytics', 'Analytics'), icon: BarChart3 },
    { id: 'departments', label: t('nav.departments', 'Departments'), icon: Landmark },
    { id: 'settings', label: t('nav.settings', 'Settings'), icon: Settings },
    { id: 'support', label: t('nav.support', 'Support & FAQs'), icon: HelpCircle },
  ];

  return (
    <div className="md:hidden fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-4/5 max-w-xs bg-[#FFFFFF] dark:bg-[#0B1528] text-[#0A192F] dark:text-[#F0F7FF] h-full p-4 flex flex-col justify-between shadow-2xl border-r border-[#C8E2FA] dark:border-[#1E3456] transition-colors">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center pb-3 border-b border-[#C8E2FA] dark:border-[#1E3456] mb-4">
            <div className="flex items-center gap-2.5">
              <PortalLogo size="sm" />
              <div className="flex flex-col">
                <span className="font-bold text-base text-[#0A192F] dark:text-white leading-tight">
                  smart<span className="text-[#0284C7] dark:text-[#38BDF8]">Gov</span>
                  <span className="text-[#FACC15] font-black">.</span>
                </span>
                <span className="text-[10px] text-[#64748B] dark:text-slate-400 uppercase font-semibold">
                  {t('app.portal', 'Portal')}
                </span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-full text-[#64748B] dark:text-slate-400 hover:bg-[#E0F0FE] dark:hover:bg-[#13233D] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* CTA */}
          <button
            onClick={() => {
              onFileNewGrievance();
              onClose();
            }}
            className="w-full bg-gradient-to-r from-[#0A192F] via-[#0F294D] to-[#1E3A8A] text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 mb-4 shadow-sm hover:opacity-95 transition-all cursor-pointer border border-[#1E3A8A]"
          >
            <Plus className="w-4 h-4 text-[#FACC15]" />
            <span>{t('nav.file_grievance', 'Add New Complaint')}</span>
          </button>

          {/* Navigation Links */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#E0F0FE] dark:bg-[#13233D] text-[#0A192F] dark:text-white border-l-4 border-l-[#FACC15] border-y border-r border-[#C8E2FA] dark:border-[#1E3456]'
                      : 'text-[#475569] dark:text-slate-300 hover:bg-[#F0F7FF] dark:hover:bg-[#0F1D33]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#0284C7] dark:text-[#38BDF8]' : 'text-[#64748B] dark:text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-[#FEF08A] text-[#854D0E] text-[10px] px-2 py-0.5 rounded-full font-bold border border-[#FDE047]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer & Controls */}
        <div className="pt-3 border-t border-[#C8E2FA] dark:border-[#1E3456] space-y-2.5">
          {/* Language Selector in Mobile Drawer */}
          <LanguageSelector variant="sidebar" className="px-0" />

          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-[#475569] dark:text-slate-300">{t('nav.theme_mode', 'Theme')}</span>
            <ThemeToggle variant="button" />
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400">
            {isHindi ? 'नागरिक एआई प्रणाली • मोबाइल तैयार' : 'Civic Intelligence System • Mobile Ready'}
          </div>
        </div>
      </div>
    </div>
  );
};
