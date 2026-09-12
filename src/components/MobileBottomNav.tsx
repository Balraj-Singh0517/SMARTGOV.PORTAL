import React from 'react';
import { LayoutDashboard, FileText, PlusCircle, BarChart3, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onFileNewGrievance: () => void;
  onOpenMobileMenu: () => void;
  pendingCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onFileNewGrievance,
  onOpenMobileMenu,
  pendingCount = 0
}) => {
  return (
    <div 
      id="mobile-bottom-bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/95 dark:bg-[#0B1528]/95 backdrop-blur-md border-t border-[#C8E2FA] dark:border-[#1E3456] px-3 py-2 flex items-center justify-around shadow-lg transition-colors"
    >
      <button
        id="mobile-nav-dashboard"
        onClick={() => onSelectTab('dashboard')}
        className={`flex flex-col items-center gap-1 p-1 min-w-[56px] text-xs font-medium cursor-pointer transition-colors ${
          currentTab === 'dashboard' 
            ? 'text-[#0284C7] dark:text-[#38BDF8] font-bold' 
            : 'text-[#475569] dark:text-slate-400 hover:text-[#0A192F] dark:hover:text-white'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Home</span>
      </button>

      <button
        id="mobile-nav-grievances"
        onClick={() => onSelectTab('my-grievances')}
        className={`relative flex flex-col items-center gap-1 p-1 min-w-[56px] text-xs font-medium cursor-pointer transition-colors ${
          currentTab === 'my-grievances' 
            ? 'text-[#0284C7] dark:text-[#38BDF8] font-bold' 
            : 'text-[#475569] dark:text-slate-400 hover:text-[#0A192F] dark:hover:text-white'
        }`}
      >
        <FileText className="w-5 h-5" />
        <span>Grievances</span>
        {pendingCount > 0 && (
          <span className="absolute top-0 right-2 w-4 h-4 bg-[#FACC15] text-[#0A192F] text-[10px] font-black rounded-full flex items-center justify-center ring-1 ring-white">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Primary Center Action Button */}
      <button
        id="mobile-nav-file-btn"
        onClick={onFileNewGrievance}
        className="flex flex-col items-center -mt-5 bg-[#0A192F] dark:bg-[#13233D] text-[#FACC15] p-3 rounded-full shadow-md active:scale-95 transition-transform cursor-pointer border-2 border-white dark:border-[#1E3456]"
        aria-label="Report Grievance"
      >
        <PlusCircle className="w-6 h-6 text-[#FACC15]" />
      </button>

      <button
        id="mobile-nav-analytics"
        onClick={() => onSelectTab('analytics')}
        className={`flex flex-col items-center gap-1 p-1 min-w-[56px] text-xs font-medium cursor-pointer transition-colors ${
          currentTab === 'analytics' 
            ? 'text-[#0284C7] dark:text-[#38BDF8] font-bold' 
            : 'text-[#475569] dark:text-slate-400 hover:text-[#0A192F] dark:hover:text-white'
        }`}
      >
        <BarChart3 className="w-5 h-5" />
        <span>Analytics</span>
      </button>

      <button
        id="mobile-nav-menu"
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center gap-1 p-1 min-w-[56px] text-xs font-medium text-[#475569] dark:text-slate-400 hover:text-[#0A192F] dark:hover:text-white cursor-pointer"
      >
        <Menu className="w-5 h-5" />
        <span>Menu</span>
      </button>
    </div>
  );
};
