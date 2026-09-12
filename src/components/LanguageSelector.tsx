import React, { useState, useRef, useEffect } from 'react';
import { Languages, Check, ChevronDown, Globe, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../utils/translations';

interface LanguageSelectorProps {
  variant?: 'button' | 'dropdown' | 'card' | 'sidebar';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'button',
  className = ''
}) => {
  const { language, setLanguage, toggleLanguage, isHindi } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languageOptions: { code: Language; label: string; native: string; description: string }[] = [
    {
      code: 'en',
      label: 'English',
      native: 'English (US/UK)',
      description: 'Default municipal portal interface'
    },
    {
      code: 'hi',
      label: 'हिन्दी',
      native: 'हिन्दी (Hindi)',
      description: 'नागरिक सेवा एवं शिकायत निवारण पोर्टल'
    }
  ];

  // VARIANT: Card (for SettingsView.tsx)
  if (variant === 'card') {
    return (
      <div id="language-setting-card" className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {languageOptions.map((opt) => {
            const isSelected = language === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                id={`lang-opt-${opt.code}`}
                onClick={() => setLanguage(opt.code)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#E0F0FE] to-[#F0F7FF] dark:from-[#13233D] dark:to-[#0F1D33] border-[#0284C7] dark:border-[#38BDF8] ring-2 ring-[#0284C7]/20 shadow-xs'
                    : 'bg-[#FFFFFF] dark:bg-[#0B1528] border-[#C8E2FA] dark:border-[#1E3456] hover:bg-[#F0F7FF] dark:hover:bg-[#13233D]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border ${
                      isSelected
                        ? 'bg-[#0A192F] text-[#FACC15] border-[#1E3A8A]'
                        : 'bg-[#F0F7FF] dark:bg-[#080E1A] text-[#0A192F] dark:text-white border-[#C8E2FA] dark:border-[#1E3456]'
                    }`}>
                      {opt.code === 'en' ? 'EN' : 'हिं'}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-[#0A192F] dark:text-white block">
                        {opt.native}
                      </span>
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400">
                        {opt.code === 'en' ? 'English' : 'Hindi'}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#475569] dark:text-slate-300 mt-1">
                  {opt.description}
                </p>

                {isSelected && (
                  <div className="mt-3 pt-2 border-t border-[#C8E2FA]/60 dark:border-[#1E3456] flex items-center gap-1.5 text-[10px] font-bold text-[#0369A1] dark:text-[#7DD3FC]">
                    <Sparkles className="w-3 h-3 text-[#FACC15]" />
                    <span>Currently Active Translation</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Live Translation Preview Banner */}
        <div className="p-3.5 rounded-2xl bg-[#F0F7FF] dark:bg-[#080E1A] border border-[#C8E2FA] dark:border-[#1E3456] text-xs flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#FFFFFF] dark:bg-[#0B1528] text-[#0284C7] dark:text-[#38BDF8] border border-[#C8E2FA] dark:border-[#1E3456] shrink-0">
            <Languages className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] uppercase font-bold text-[#64748B] dark:text-slate-400 tracking-wider">
              {isHindi ? 'प्रत्यक्ष अनुवाद पूर्वावलोकन' : 'Live Translation Preview'}
            </div>
            <p className="font-semibold text-[#0A192F] dark:text-white">
              {isHindi 
                ? 'शिकायत स्थिति: निस्तारित एवं सत्यापित • विभाग: जल आपूर्ति बोर्ड • फील्ड निरीक्षण पूर्ण'
                : 'Ticket Status: Solved & Verified • Dept: Water Supply Board • Field Inspection Complete'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // VARIANT: Sidebar / Footer Item
  if (variant === 'sidebar') {
    return (
      <div 
        id="language-sidebar-control"
        className={`flex items-center justify-between px-3 py-1.5 text-xs text-[#475569] dark:text-slate-300 ${className}`}
      >
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
          <span className="font-medium">{isHindi ? 'भाषा (Language)' : 'Site Language'}</span>
        </div>
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#F0F7FF] dark:bg-[#13233D] hover:bg-[#E0F0FE] dark:hover:bg-[#1E3456] text-[#0A192F] dark:text-white border border-[#C8E2FA] dark:border-[#1E3456] rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
          title="Toggle English / हिन्दी"
        >
          <span className="text-[#0284C7] dark:text-[#38BDF8]">{isHindi ? 'हिन्दी' : 'EN'}</span>
          <span className="text-[10px] text-[#64748B] dark:text-slate-400">↔</span>
          <span className="text-[10px] text-[#64748B] dark:text-slate-400">{isHindi ? 'EN' : 'हिन्दी'}</span>
        </button>
      </div>
    );
  }

  // VARIANT: Compact Button with Dropdown (Default for TopNavBar)
  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <button
        id="language-choose-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#FFFFFF] dark:bg-[#0F1D33] hover:bg-[#F0F7FF] dark:hover:bg-[#13233D] text-[#0A192F] dark:text-white border border-[#C8E2FA] dark:border-[#1E3456] rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs group"
        aria-label="Choose site language (English / Hindi)"
        aria-expanded={isOpen}
      >
        {/* Universal Language Translation Icon */}
        <div className="p-1 rounded-full bg-[#E0F0FE] dark:bg-[#13233D] text-[#0284C7] dark:text-[#38BDF8] group-hover:scale-105 transition-transform">
          <Languages className="w-3.5 h-3.5" />
        </div>

        {/* Current Active Language Pill */}
        <span className="font-extrabold text-[#0A192F] dark:text-white tracking-wide">
          {isHindi ? 'हिन्दी' : 'English'}
        </span>

        <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-[#0A192F] text-[#FACC15] dark:bg-[#1E3A8A] dark:text-[#FACC15]">
          {isHindi ? 'HI' : 'EN'}
        </span>

        <ChevronDown className={`w-3 h-3 text-[#64748B] dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Language Selection Popover Dropdown */}
      {isOpen && (
        <div 
          id="language-dropdown-menu"
          className="absolute right-0 mt-2 w-56 p-1.5 bg-[#FFFFFF] dark:bg-[#0B1528] border border-[#C8E2FA] dark:border-[#1E3456] rounded-2xl shadow-xl z-50 animate-fadeIn space-y-1"
        >
          <div className="px-3 py-1.5 border-b border-[#C8E2FA]/60 dark:border-[#1E3456]">
            <span className="text-[10px] uppercase font-extrabold text-[#64748B] dark:text-slate-400 tracking-wider flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-[#0284C7]" />
              <span>Select Language / भाषा</span>
            </span>
          </div>

          {languageOptions.map((opt) => {
            const isSelected = language === opt.code;
            return (
              <button
                key={opt.code}
                id={`lang-dropdown-item-${opt.code}`}
                onClick={() => {
                  setLanguage(opt.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#E0F0FE] dark:bg-[#13233D] text-[#0369A1] dark:text-[#7DD3FC] font-bold'
                    : 'text-[#475569] dark:text-slate-300 hover:bg-[#F0F7FF] dark:hover:bg-[#0F1D33] hover:text-[#0A192F] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center border ${
                    isSelected 
                      ? 'bg-[#0A192F] text-[#FACC15] border-[#1E3A8A]' 
                      : 'bg-[#F0F7FF] dark:bg-[#080E1A] text-[#0A192F] dark:text-white border-[#C8E2FA] dark:border-[#1E3456]'
                  }`}>
                    {opt.code === 'en' ? 'EN' : 'हिं'}
                  </span>
                  <div className="text-left">
                    <span className="block">{opt.native}</span>
                    <span className="text-[10px] text-[#64748B] dark:text-slate-400 block font-normal">
                      {opt.code === 'en' ? 'English' : 'Hindi translation'}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
                )}
              </button>
            );
          })}

          <div className="p-2 border-t border-[#C8E2FA]/60 dark:border-[#1E3456] bg-[#F0F7FF]/50 dark:bg-[#080E1A]/50 rounded-xl text-[10px] text-[#64748B] dark:text-slate-400">
            {isHindi 
              ? 'पोर्टल का सभी डेटा एवं मेनू तुरंत हिन्दी में परिवर्तित हो जाएगा।'
              : 'Applies instantly across navigation, forms, and alerts.'}
          </div>
        </div>
      )}
    </div>
  );
};
