import React, { useState } from 'react';
import { Settings, Cpu, Bell, Shield, Sliders, Check, Globe, Palette, Moon, Sun, Languages } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

export const SettingsView: React.FC = () => {
  const { theme } = useTheme();
  const { language, t, isHindi } = useLanguage();
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [duplicateThreshold, setDuplicateThreshold] = useState(75);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div id="settings-view" className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end pb-2 border-b border-[#c6c6cd]/30 dark:border-slate-800">
        <div>
          <h1 className="font-bold text-2xl md:text-3xl text-[#0b1c30] dark:text-white tracking-tight">
            {t('settings.title', 'Portal Settings & Configuration')}
          </h1>
          <p className="text-xs md:text-sm text-[#45464d] dark:text-slate-400 mt-1">
            {t('settings.subtitle', 'Customize language, visual theme, Civic Intelligence thresholds, and citizen dispatch alerts.')}
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-5 py-2 bg-[#0A192F] dark:bg-[#0284C7] text-white rounded-xl text-xs font-bold hover:bg-[#132F5B] dark:hover:bg-[#0369A1] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-98"
        >
          <Check className="w-3.5 h-3.5 text-[#FACC15]" />
          <span>{savedNotice ? t('settings.saved_notice', 'Saved Changes!') : t('settings.save_preferences', 'Save Preferences')}</span>
        </button>
      </div>

      {/* Language & Translation Card (English <-> Hindi) */}
      <div className="bg-[#ffffff] dark:bg-[#0B1528] rounded-2xl p-6 border border-[#C8E2FA] dark:border-[#1E3456] shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-2 border-b border-[#C8E2FA]/60 dark:border-[#1E3456]">
          <div className="flex items-center gap-2 text-[#0A192F] dark:text-white">
            <div className="p-1.5 rounded-lg bg-[#E0F0FE] dark:bg-[#13233D] text-[#0284C7] dark:text-[#38BDF8]">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">
                {t('settings.language_title', 'Site Language & Translation')}
              </h2>
              <span className="text-[11px] text-[#64748B] dark:text-slate-400 block font-normal">
                {isHindi ? 'अंग्रेज़ी और हिन्दी के बीच अनुवाद' : 'Instant translation between English and Hindi'}
              </span>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full font-bold bg-[#E0F0FE] dark:bg-[#13233D] text-[#0369A1] dark:text-[#7DD3FC] border border-[#BAE0FD] dark:border-[#1E3456] flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" />
            <span>{isHindi ? 'हिन्दी (Hindi)' : 'English (English)'}</span>
          </span>
        </div>

        <p className="text-xs text-[#45464d] dark:text-slate-300 leading-relaxed">
          {t('settings.language_desc', 'Switch portal interface between English and Hindi (हिन्दी). Translates all navigation, grievance cards, inspection details, and action buttons.')}
        </p>

        {/* Dedicated Language Selector Card Variant */}
        <LanguageSelector variant="card" />
      </div>

      {/* Visual Theme & Appearance Card */}
      <div className="bg-[#ffffff] dark:bg-[#0B1528] rounded-2xl p-6 border border-[#C8E2FA] dark:border-[#1E3456] shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-2 border-b border-[#C8E2FA]/60 dark:border-[#1E3456]">
          <div className="flex items-center gap-2 text-[#0A192F] dark:text-white">
            <div className="p-1.5 rounded-lg bg-[#FEF9C3] dark:bg-[#1C1F10] text-[#854D0E] dark:text-[#FACC15]">
              <Palette className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base">{t('settings.appearance_title', 'Appearance & Portal Theme')}</h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#F0F7FF] dark:bg-[#13233D] text-[#0A192F] dark:text-slate-300 border border-[#C8E2FA] dark:border-[#1E3456]">
            Current: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </div>

        <p className="text-xs text-[#45464d] dark:text-slate-400">
          {t('settings.appearance_desc', 'Choose how smartGov displays on your screen. The setting persists across sessions on this device.')}
        </p>

        {/* Theme Selector Component */}
        <ThemeToggle variant="selector" />
      </div>

      {/* AI Intelligence Configuration Card */}
      <div className="bg-[#ffffff] dark:bg-[#0B1528] rounded-2xl p-6 border border-[#C8E2FA] dark:border-[#1E3456] shadow-xs space-y-5 transition-colors">
        <div className="flex items-center gap-2 text-[#0A192F] dark:text-white pb-2 border-b border-[#C8E2FA]/60 dark:border-[#1E3456]">
          <div className="p-1.5 rounded-lg bg-[#E0F0FE] dark:bg-[#13233D] text-[#0284C7] dark:text-[#38BDF8]">
            <Cpu className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-base">{t('settings.ai_title', 'Civic Intelligence Engine')}</h2>
        </div>

        {/* Confidence Threshold Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-[#0A192F] dark:text-slate-200">
            <span>{t('settings.confidence_threshold', 'Minimum Auto-Triage Confidence Threshold')}</span>
            <span className="font-bold text-[#0284C7] dark:text-[#38BDF8]">{confidenceThreshold}%</span>
          </div>
          <input
            type="range"
            min="60"
            max="95"
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
            className="w-full h-2 bg-[#F0F7FF] dark:bg-[#13233D] rounded-lg appearance-none cursor-pointer accent-[#0284C7]"
          />
          <p className="text-[11px] text-[#64748B] dark:text-slate-400">
            {isHindi
              ? 'इस विश्वास स्कोर से अधिक अंक वाली शिकायतों को बिना मैन्युअल समीक्षा के संबंधित विभाग को प्रेषित किया जाता है।'
              : 'Grievances with confidence above this score are automatically routed to department queues without manual triage.'}
          </p>
        </div>

        {/* Duplicate Detection Cosine Threshold */}
        <div className="space-y-2 pt-3 border-t border-[#C8E2FA]/60 dark:border-[#1E3456]">
          <div className="flex justify-between text-xs font-semibold text-[#0A192F] dark:text-slate-200">
            <span>{t('settings.duplicate_threshold', 'Duplicate & Clustering Sensitivity')}</span>
            <span className="font-bold text-[#0284C7] dark:text-[#38BDF8]">{duplicateThreshold}% Match</span>
          </div>
          <input
            type="range"
            min="50"
            max="95"
            value={duplicateThreshold}
            onChange={(e) => setDuplicateThreshold(Number(e.target.value))}
            className="w-full h-2 bg-[#F0F7FF] dark:bg-[#13233D] rounded-lg appearance-none cursor-pointer accent-[#0284C7]"
          />
          <p className="text-[11px] text-[#64748B] dark:text-slate-400">
            {isHindi 
              ? 'नागरिकों द्वारा शिकायत दर्ज करते समय "समान शिकायत दर्ज है" संकेत प्रदर्शित करने की सीमा।'
              : 'Threshold for presenting "Similar Issue Detected" prompt to citizens when filing complaints.'}
          </p>
        </div>

        {/* Model Engine Selector */}
        <div className="pt-3 border-t border-[#C8E2FA]/60 dark:border-[#1E3456]">
          <label className="block text-xs font-bold text-[#475569] dark:text-slate-300 uppercase tracking-wider mb-2">
            {t('settings.active_model', 'Active Multi-modal Triage Model')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border-2 border-[#0A192F] dark:border-[#38BDF8] bg-[#F0F7FF] dark:bg-[#13233D] flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-[#0A192F] dark:text-white block">Gemini 3.7 Flash</span>
                <span className="text-[10px] text-[#64748B] dark:text-slate-400">
                  {isHindi ? 'उच्च गति, उप-100ms अंग्रेज़ी-हिन्दी बहुभाषी अनुवाद' : 'High speed, sub-100ms multilingual translation'}
                </span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] dark:bg-[#38BDF8] animate-pulse" />
            </div>
            <div className="p-3 rounded-xl border border-[#C8E2FA] dark:border-[#1E3456] bg-[#FFFFFF] dark:bg-[#0B1528] flex items-center justify-between opacity-60">
              <div>
                <span className="font-bold text-xs text-[#0A192F] dark:text-white block">Gemini 2.5 Flash</span>
                <span className="text-[10px] text-[#64748B] dark:text-slate-400">
                  {isHindi ? 'द्वितीयक बैकअप इंजन' : 'Legacy fallback engine'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications & Citizen Alerts */}
      <div className="bg-[#ffffff] dark:bg-[#0B1528] rounded-2xl p-6 border border-[#C8E2FA] dark:border-[#1E3456] shadow-xs space-y-4 transition-colors">
        <div className="flex items-center gap-2 text-[#0A192F] dark:text-white pb-2 border-b border-[#C8E2FA]/60 dark:border-[#1E3456]">
          <div className="p-1.5 rounded-lg bg-[#FEF9C3] dark:bg-[#1C1F10] text-[#854D0E] dark:text-[#FACC15]">
            <Bell className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-base">{t('settings.notification_title', 'Notification & Citizen Communication')}</h2>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <span className="font-bold text-xs text-[#0A192F] dark:text-slate-200 block">
              {t('settings.sms_alerts', 'Instant SMS / WhatsApp Citizen Alerts')}
            </span>
            <span className="text-[11px] text-[#64748B] dark:text-slate-400">
              {isHindi
                ? 'स्थिति "प्रगति पर" या "निस्तारित" में बदलने पर तुरंत नागरिक को अलर्ट भेजें'
                : 'Send real-time updates when status changes to In Progress or Resolved'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSmsAlerts(!smsAlerts)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              smsAlerts ? 'bg-[#0A192F] dark:bg-[#0284C7]' : 'bg-[#C8E2FA] dark:bg-slate-700'
            }`}
          >
            <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
              smsAlerts ? 'right-1' : 'left-1'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between py-2 border-t border-[#C8E2FA]/60 dark:border-[#1E3456]">
          <div>
            <span className="font-bold text-xs text-[#0A192F] dark:text-slate-200 block">
              {t('settings.dispatch_notifs', 'Automated Dispatch Notifications to Field Supervisors')}
            </span>
            <span className="text-[11px] text-[#64748B] dark:text-slate-400">
              {isHindi
                ? 'एआई वर्गीकरण के उपरांत जोनल टीम लीड को पुश संदेश भेजें'
                : 'Route push messages to zonal team leads upon AI categorization'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAutoDispatch(!autoDispatch)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              autoDispatch ? 'bg-[#0A192F] dark:bg-[#0284C7]' : 'bg-[#C8E2FA] dark:bg-slate-700'
            }`}
          >
            <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
              autoDispatch ? 'right-1' : 'left-1'
            }`} />
          </button>
        </div>
      </div>
    </div>
  );
};
