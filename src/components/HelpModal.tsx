import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  Phone, 
  FileText, 
  CheckCircle2, 
  ShieldAlert, 
  Droplets, 
  Zap, 
  Flame, 
  Building2, 
  Copy, 
  Check, 
  Clock 
} from 'lucide-react';
import { PortalLogo } from './PortalLogo';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HelplineItem {
  id: string;
  name: string;
  number: string;
  tel: string;
  description: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  iconBg: string;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const helplines: HelplineItem[] = [
    {
      id: 'water-control',
      name: 'Water Control',
      number: '1800-121-2164',
      tel: '18001212164',
      description: 'Major pipeline bursts, contaminated supply & tanker control',
      badge: '24x7 Toll-Free',
      icon: Droplets,
      accentBg: 'bg-[#e0f2fe]/60 dark:bg-[#0369a1]/20',
      accentBorder: 'border-[#0284c7]/30 dark:border-[#0284c7]/40',
      accentText: 'text-[#0369a1] dark:text-[#38bdf8]',
      iconBg: 'bg-[#0284c7] text-white'
    },
    {
      id: 'power-outage',
      name: 'Power Outage',
      number: '1912',
      tel: '1912',
      description: 'Transformer failure, fallen lines & localized blackout',
      badge: 'Immediate Dispatch',
      icon: Zap,
      accentBg: 'bg-[#fef9c3]/60 dark:bg-[#ca8a04]/20',
      accentBorder: 'border-[#ca8a04]/30 dark:border-[#ca8a04]/40',
      accentText: 'text-[#854d0e] dark:text-[#fde047]',
      iconBg: 'bg-[#ca8a04] text-white'
    },
    {
      id: 'fire-disaster',
      name: 'Fire / Disaster',
      number: '101',
      tel: '101',
      description: 'Fire hazard, structural collapse & monsoon disaster control',
      badge: 'Emergency Response',
      icon: Flame,
      accentBg: 'bg-[#fee2e2]/60 dark:bg-[#dc2626]/20',
      accentBorder: 'border-[#dc2626]/30 dark:border-[#dc2626]/40',
      accentText: 'text-[#991b1b] dark:text-[#f87171]',
      iconBg: 'bg-[#dc2626] text-white'
    },
    {
      id: 'central-civic',
      name: 'Central Civic',
      number: '155300',
      tel: '155300',
      description: 'Municipal Corporation integrated civic helpline & escalation',
      badge: 'Civic HQ Direct',
      icon: Building2,
      accentBg: 'bg-[#dcfce7]/60 dark:bg-[#16a34a]/20',
      accentBorder: 'border-[#16a34a]/30 dark:border-[#16a34a]/40',
      accentText: 'text-[#166534] dark:text-[#4ade80]',
      iconBg: 'bg-[#16a34a] text-white'
    }
  ];

  const handleCopy = (id: string, num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div 
        id="help-faq-modal"
        className="bg-[#ffffff] dark:bg-[#101b2d] rounded-3xl border border-[#c6c6cd]/40 dark:border-slate-800 w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#c6c6cd]/30 dark:border-slate-800 flex justify-between items-center bg-[#eff4ff] dark:bg-[#142238]">
          <div className="flex items-center gap-3">
            <PortalLogo size="sm" />
            <div>
              <h3 className="text-lg font-bold text-[#0b1c30] dark:text-white tracking-tight flex items-center gap-2">
                Emergency Helplines & Civic FAQs
              </h3>
              <p className="text-xs text-[#45464d] dark:text-slate-400">
                24x7 Municipal contacts and guidance for rapid resolution
              </p>
            </div>
          </div>
          <button 
            id="close-help-modal-btn"
            onClick={onClose} 
            className="p-1.5 text-[#76777d] dark:text-slate-400 hover:text-[#0b1c30] dark:hover:text-white hover:bg-[#d3e4fe] dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            aria-label="Close Help Dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs md:text-sm text-[#45464d] dark:text-slate-300">
          {/* Emergency Municipal Helplines Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#ba1a1a]/10 dark:bg-[#ba1a1a]/30 text-[#ba1a1a] dark:text-rose-400 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-[#0b1c30] dark:text-white tracking-tight">
                  Emergency Municipal Helplines (24x7)
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ffdad6] dark:bg-rose-950/60 text-[#93000a] dark:text-rose-200 border border-[#ba1a1a]/20 dark:border-rose-800">
                Toll-Free & Direct
              </span>
            </div>

            <p className="text-xs text-[#45464d] dark:text-slate-400 leading-relaxed">
              For urgent or hazardous situations, please contact the dedicated 24x7 municipal emergency dispatch lines directly:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {helplines.map((item) => {
                const Icon = item.icon;
                const isCopied = copiedId === item.id;
                return (
                  <div
                    key={item.id}
                    id={`helpline-card-${item.id}`}
                    className={`p-3.5 rounded-2xl border ${item.accentBorder} ${item.accentBg} flex flex-col justify-between space-y-2 transition-all hover:shadow-sm`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0 shadow-xs`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-bold text-sm text-[#0b1c30] dark:text-white leading-tight">
                            {item.name}
                          </h5>
                          <span className={`text-[10px] font-semibold ${item.accentText}`}>
                            {item.badge}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#45464d] dark:text-slate-300 leading-snug line-clamp-2">
                      {item.description}
                    </p>

                    <div className="pt-1 flex items-center justify-between border-t border-black/5 dark:border-white/10">
                      <a
                        href={`tel:${item.tel}`}
                        className="font-mono text-sm md:text-base font-extrabold text-[#0b1c30] dark:text-white hover:text-[#005137] dark:hover:text-[#34d399] tracking-tight flex items-center gap-1.5 transition-colors"
                        title={`Call ${item.name} at ${item.number}`}
                      >
                        <Phone className="w-3.5 h-3.5 text-[#006c4a] dark:text-[#34d399]" />
                        <span>{item.number}</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, item.number)}
                        className="px-2 py-1 bg-white dark:bg-[#142238] hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0b1c30] dark:text-slate-200 rounded-lg text-[11px] font-medium border border-[#c6c6cd]/40 dark:border-slate-700 flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
                        title="Copy phone number"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-[#006c4a] dark:text-[#34d399]" />
                            <span className="text-[#006c4a] dark:text-[#34d399] font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-[#76777d] dark:text-slate-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-sm text-[#0b1c30] dark:text-white tracking-tight flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#006c4a] dark:text-[#34d399]" />
              Civic Portal FAQs
            </h4>

            {/* FAQ 1 */}
            <div className="bg-[#f8f9ff] dark:bg-[#142238] p-4 rounded-2xl border border-[#c6c6cd]/30 dark:border-slate-800 space-y-1.5">
              <h5 className="font-bold text-[#0b1c30] dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#006c4a] dark:text-[#34d399] shrink-0" />
                How does Multilingual AI Triage work?
              </h5>
              <p className="text-xs leading-relaxed text-[#45464d] dark:text-slate-400">
                Citizens can type or voice-record complaints in English, Hindi, or regional languages. Our civic AI engine automatically detects the language, translates to standard municipal terminology, routes to the responsible department, and flags identical issues in the same sector.
              </p>
            </div>

            {/* FAQ 2 */}
            <div className="bg-[#f8f9ff] dark:bg-[#142238] p-4 rounded-2xl border border-[#c6c6cd]/30 dark:border-slate-800 space-y-1.5">
              <h5 className="font-bold text-[#0b1c30] dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#006c4a] dark:text-[#34d399] shrink-0" />
                What is "Support This Instead"?
              </h5>
              <p className="text-xs leading-relaxed text-[#45464d] dark:text-slate-400">
                If your civic issue (such as a pothole or streetlight failure) is already reported nearby, clicking <strong>Support This Instead</strong> increments the existing complaint's priority score. This consolidates field teams and speeds up municipal repair without duplicate paperwork.
              </p>
            </div>

            {/* FAQ 3 */}
            <div className="bg-[#f8f9ff] dark:bg-[#142238] p-4 rounded-2xl border border-[#c6c6cd]/30 dark:border-slate-800 space-y-1.5">
              <h5 className="font-bold text-[#0b1c30] dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#006c4a] dark:text-[#34d399] shrink-0" />
                What are the standard resolution SLAs?
              </h5>
              <p className="text-xs leading-relaxed text-[#45464d] dark:text-slate-400">
                Sanitation and waste clearing target <strong>6-12 hours</strong>; street lighting and power issues target <strong>12-24 hours</strong>; road potholes and civil works target <strong>24-48 hours</strong>. You will receive live milestone updates at each stage.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#eff4ff] dark:bg-[#142238] border-t border-[#c6c6cd]/30 dark:border-slate-800 flex items-center justify-between text-xs text-[#45464d] dark:text-slate-400">
          <span className="font-semibold">
            Emergency services are staffed 24 hours a day, 7 days a week.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#000000] dark:bg-[#006c4a] text-white rounded-xl font-bold text-xs hover:bg-[#131b2e] dark:hover:bg-[#005137] transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
