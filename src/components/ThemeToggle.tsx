import React from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'button' | 'selector';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'button',
  className = ''
}) => {
  const { theme, toggleTheme, setTheme } = useTheme();

  if (variant === 'selector') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3.5 ${className}`} id="theme-selector-panel">
        {/* Light Mode Card: Dark Blue, Very Light Blue, White, and Smooth Yellow */}
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer relative overflow-hidden ${
            theme === 'light'
              ? 'border-[#0A192F] bg-[#FFFFFF] shadow-md ring-2 ring-[#BAE0FD]'
              : 'border-[#C8E2FA] bg-[#FFFFFF] hover:border-[#1E3A8A] dark:bg-[#0F1D33] dark:border-[#1E3456]'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E0F0FE] to-[#FEF08A] text-[#0A192F] flex items-center justify-center border border-[#BAE0FD] shadow-xs">
                <Sun className="w-5 h-5 text-[#EAB308]" />
              </div>
              {/* Palette Quad Swatches */}
              <div className="flex items-center gap-1 bg-[#F0F7FF] px-2 py-1 rounded-full border border-[#C8E2FA] shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0A192F]" title="Dark Blue" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#E0F0FE] border border-[#BAE0FD]" title="Very Light Blue" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFFFFF] border border-[#C8E2FA]" title="White" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15]" title="Smooth Yellow" />
              </div>
            </div>
            {theme === 'light' && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FEF08A] text-[#854D0E] border border-[#FDE047]">
                Active
              </span>
            )}
          </div>
          <div>
            <span className="font-bold text-sm text-[#0A192F] dark:text-white block">
              Light Theme
            </span>
            <span className="text-xs text-[#475569] dark:text-slate-300">
              Crisp white and very light blue surfaces with dark blue framing and a pinch of smooth yellow
            </span>
          </div>
        </button>

        {/* Dark Mode Card: Deep Dark Blue, Midnight Navy, Soft Light Blue, and Smooth Yellow */}
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer relative overflow-hidden ${
            theme === 'dark'
              ? 'border-[#38BDF8] bg-[#0F1D33] shadow-md ring-2 ring-[#1E3A8A]'
              : 'border-[#C8E2FA] bg-[#FFFFFF] hover:border-[#38BDF8] dark:bg-[#0F1D33] dark:border-[#1E3456]'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#080E1A] to-[#1E3A8A] text-[#38BDF8] flex items-center justify-center border border-[#1E3456] shadow-xs">
                <Moon className="w-5 h-5 text-[#38BDF8]" />
              </div>
              {/* Palette Quad Swatches (Dark Mode) */}
              <div className="flex items-center gap-1 bg-[#080E1A] px-2 py-1 rounded-full border border-[#1E3456] shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-[#080E1A] border border-[#1E3456]" title="Midnight Dark Blue" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#13233D]" title="Navy Surface" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" title="Sky Light Blue" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15]" title="Smooth Yellow" />
              </div>
            </div>
            {theme === 'dark' && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#13233D] text-[#38BDF8] border border-[#1E3456]">
                Active
              </span>
            )}
          </div>
          <div>
            <span className="font-bold text-sm text-[#0A192F] dark:text-white block">
              Dark Theme
            </span>
            <span className="text-xs text-[#475569] dark:text-slate-300">
              Deep midnight dark blue canvas, crisp navy containers, sky blue accents & smooth yellow glow
            </span>
          </div>
        </button>
      </div>
    );
  }

  // Quick toggle button for navigation bars
  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-full border border-[#C8E2FA] dark:border-[#1E3456] bg-[#FFFFFF] dark:bg-[#0F1D33] text-[#0A192F] dark:text-[#F0F7FF] hover:bg-[#E0F0FE] dark:hover:bg-[#13233D] transition-all flex items-center justify-center cursor-pointer shadow-xs ${className}`}
      title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-[#FACC15] animate-fadeIn" />
      ) : (
        <Moon className="w-4 h-4 text-[#0A192F] animate-fadeIn" />
      )}
    </button>
  );
};
