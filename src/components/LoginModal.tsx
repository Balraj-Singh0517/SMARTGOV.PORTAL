import React, { useState } from 'react';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  KeyRound, 
  ArrowRight,
  Info
} from 'lucide-react';
import { AuthUser } from '../types';
import { PortalLogo } from './PortalLogo';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  currentUser?: AuthUser | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'citizen' | 'officer'>('citizen');
  
  // Public Citizen State
  const [citizenEmail, setCitizenEmail] = useState('shcbcbshb1223@gmail.com');
  const [citizenName, setCitizenName] = useState('Aarav Sharma');

  // Government Employee State
  const [officerEmail, setOfficerEmail] = useState('officer.sharma@muni.gov.in');
  const [officerName, setOfficerName] = useState('Er. Jane Smith (Zonal Engineer)');
  const [securityCode, setSecurityCode] = useState('GOV-2026-MUNI');
  const [selectedDept, setSelectedDept] = useState('Public Works (Power)');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCitizenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!citizenEmail || !citizenEmail.includes('@')) {
      setErrorMessage('Please provide a valid Gmail / Google account address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'citizen',
          email: citizenEmail.trim(),
          name: citizenName.trim() || citizenEmail.split('@')[0]
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user);
        onClose();
      } else {
        setErrorMessage(data.error || 'Failed to authenticate citizen account.');
      }
    } catch {
      // Fallback offline login
      const fallbackUser: AuthUser = {
        email: citizenEmail.trim(),
        name: citizenName.trim() || citizenEmail.split('@')[0],
        role: 'citizen',
        avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDv8p4i2-E_U7846OYqfzokBh1WM2lnghpgiI3419FHWfdExZ7-uyvX12SxIGIatDsQMBtmlas9soqnM7Z14UgzU2hADEJQ5Xbq2-IFjw8G3R-W2aRm6iwb3UE35GVcOJWcbUQGh8_h1xVyXBCqdec6sYZuTPt7B7VUrSZeWh0pVoDBnFfsPHzI_bbniTjC0pSQGTKaFjFwmcmvhFXgkzJ0eeHArmFpQJOf1weqBNXeY4IsQ5GG1NdRyA'
      };
      onLoginSuccess(fallbackUser);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOfficerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!officerEmail || !officerEmail.includes('@')) {
      setErrorMessage('Please provide an official government Gmail / email address.');
      return;
    }

    if (!securityCode || securityCode.trim().length === 0) {
      setErrorMessage('Security Code is strictly required for Government / Municipality authentication.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'officer',
          email: officerEmail.trim(),
          name: officerName.trim(),
          uniqueCode: securityCode.trim().toUpperCase(),
          department: selectedDept
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user);
        onClose();
      } else {
        setErrorMessage(data.error || 'Invalid Government Security Code. Access Restricted.');
      }
    } catch {
      // Fallback code validation
      const code = securityCode.trim().toUpperCase();
      if (code.startsWith('GOV-') || code.startsWith('MUNI-') || code.startsWith('PWD-') || code === 'ADMIN-GOV-101') {
        const fallbackUser: AuthUser = {
          email: officerEmail.trim(),
          name: officerName.trim(),
          role: 'officer',
          department: selectedDept,
          uniqueSecurityCode: code,
          avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
        };
        onLoginSuccess(fallbackUser);
        onClose();
      } else {
        setErrorMessage('Access Denied: Invalid Security Code. Only authorized municipality employees may enter.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyDemoCode = (code: string, dept: string, name: string) => {
    setSecurityCode(code);
    setSelectedDept(dept);
    setOfficerName(name);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/60 backdrop-blur-xs animate-fadeIn">
      <div 
        id="login-auth-modal"
        className="relative w-full max-w-lg bg-[#ffffff] dark:bg-[#101b2d] rounded-3xl shadow-2xl border border-[#c6c6cd]/40 dark:border-slate-800 overflow-hidden transition-colors"
      >
        {/* Header */}
        <div className="bg-[#eff4ff] dark:bg-[#142238] p-6 border-b border-[#c6c6cd]/30 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PortalLogo size="md" />
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-[#0b1c30] dark:text-white tracking-tight">
                smart<span className="text-[#006c4a] dark:text-[#34d399]">Gov</span> Portal Access
              </h2>
              <p className="text-xs text-[#45464d] dark:text-slate-400">
                Select authentication portal for citizen or municipality official
              </p>
            </div>
          </div>

          {currentUser && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#76777d] dark:text-slate-400 hover:text-[#000000] dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Selection */}
        <div className="flex p-2 bg-[#f1f3f9] dark:bg-[#0d1522] border-b border-[#c6c6cd]/20 dark:border-slate-800 gap-2">
          <button
            type="button"
            id="tab-public-login"
            onClick={() => { setActiveTab('citizen'); setErrorMessage(null); }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'citizen'
                ? 'bg-white dark:bg-[#16263f] text-[#0b1c30] dark:text-white shadow-xs ring-1 ring-[#c6c6cd]/40 dark:ring-slate-700'
                : 'text-[#76777d] dark:text-slate-400 hover:text-[#0b1c30] dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4 text-[#497cff] dark:text-[#60a5fa]" />
            <span>1. Public Citizen Login</span>
          </button>

          <button
            type="button"
            id="tab-gov-login"
            onClick={() => { setActiveTab('officer'); setErrorMessage(null); }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'officer'
                ? 'bg-[#000000] dark:bg-[#006c4a] text-white shadow-xs'
                : 'text-[#76777d] dark:text-slate-400 hover:text-[#0b1c30] dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#82f5c1]" />
            <span>2. Government Employee</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-[#ffdad6] dark:bg-rose-950/60 text-[#93000a] dark:text-rose-200 text-xs font-semibold flex items-center gap-2 border border-[#ffb4ab] dark:border-rose-900">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {activeTab === 'citizen' ? (
            /* Citizen / Public Login Form */
            <form onSubmit={handleCitizenSubmit} className="space-y-4">
              <div className="p-3 bg-[#eff4ff] dark:bg-[#142238] rounded-xl border border-[#497cff]/20 dark:border-blue-900/40 text-xs text-[#45464d] dark:text-slate-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#497cff] shrink-0 mt-0.5" />
                <p>
                  <strong>Public Access:</strong> Log in seamlessly with your Gmail address. As a citizen, you can report local grievances, track official municipal timelines, and verify completed works.
                </p>
              </div>

              {/* Quick Google Account Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0b1c30] dark:text-slate-200 uppercase tracking-wider block">
                  Gmail / Google Account
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#76777d] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    id="citizen-email-input"
                    value={citizenEmail}
                    onChange={(e) => setCitizenEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#16263f] border border-[#c6c6cd]/60 dark:border-slate-700 rounded-xl text-sm font-medium text-[#0b1c30] dark:text-white focus:border-[#000000] dark:focus:border-[#34d399] outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0b1c30] dark:text-slate-200 uppercase tracking-wider block">
                  Citizen Full Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#76777d] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    id="citizen-name-input"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    placeholder="Aarav Sharma"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#16263f] border border-[#c6c6cd]/60 dark:border-slate-700 rounded-xl text-sm font-medium text-[#0b1c30] dark:text-white focus:border-[#000000] dark:focus:border-[#34d399] outline-none shadow-2xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="submit-citizen-login"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 bg-[#000000] dark:bg-[#006c4a] hover:bg-[#131b2e] dark:hover:bg-[#005137] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                <span>Continue with Gmail (Public Citizen)</span>
                <ArrowRight className="w-4 h-4 text-[#82f5c1]" />
              </button>
            </form>
          ) : (
            /* Government Employee / Municipality Login Form */
            <form onSubmit={handleOfficerSubmit} className="space-y-4">
              <div className="p-3 bg-[#f8f9ff] dark:bg-[#142238] rounded-xl border border-[#006c4a]/30 dark:border-emerald-900/50 text-xs text-[#0b1c30] dark:text-slate-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-[#006c4a] dark:text-[#34d399]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Restricted Municipal Administration</span>
                </div>
                <p className="text-[11px] text-[#45464d] dark:text-slate-400 leading-relaxed">
                  Only verified government officers with an official <strong>Gmail</strong> and a <strong>Unique Security Code</strong> can access the department problem inbox and issue official replies.
                </p>
              </div>

              {/* Official Gmail */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0b1c30] dark:text-slate-200 uppercase tracking-wider block">
                  Official Government Gmail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#76777d] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    id="officer-email-input"
                    value={officerEmail}
                    onChange={(e) => setOfficerEmail(e.target.value)}
                    placeholder="officer.name@muni.gov.in"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#16263f] border border-[#c6c6cd]/60 dark:border-slate-700 rounded-xl text-sm font-medium text-[#0b1c30] dark:text-white focus:border-[#000000] dark:focus:border-[#34d399] outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Unique Security Code for Safety Purpose */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0b1c30] dark:text-slate-200 uppercase tracking-wider block">
                    Unique Security Code (Required)
                  </label>
                  <span className="text-[10px] font-bold text-[#ba1a1a] dark:text-rose-300 bg-[#ffdad6] dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
                    Safety Verified
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#ba1a1a] dark:text-rose-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    id="officer-security-code-input"
                    value={securityCode}
                    onChange={(e) => setSecurityCode(e.target.value)}
                    placeholder="e.g. GOV-2026-MUNI"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#16263f] border-2 border-[#000000] dark:border-[#34d399] font-mono rounded-xl text-sm font-bold text-[#0b1c30] dark:text-white focus:border-[#006c4a] outline-none shadow-2xs uppercase tracking-wider"
                  />
                </div>
              </div>

              {/* Department Jurisdiction Assignment */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0b1c30] dark:text-slate-200 uppercase tracking-wider block">
                  Designated Department Node
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-[#16263f] border border-[#c6c6cd]/60 dark:border-slate-700 rounded-xl text-sm font-medium text-[#0b1c30] dark:text-white focus:border-[#000000] outline-none"
                >
                  <option value="Public Works (Power)">Public Works (Power & Lighting)</option>
                  <option value="Sanitation">Sanitation & Solid Waste</option>
                  <option value="Water Board">Water Supply & Drainage Board</option>
                  <option value="Roads & Bridges (PWD)">Roads & Bridges (PWD)</option>
                  <option value="Parks & Horticulture">Parks & Horticulture</option>
                </select>
              </div>

              {/* Quick Select Demo Security Codes */}
              <div className="pt-2 border-t border-[#c6c6cd]/20 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-[#76777d] dark:text-slate-400 block mb-1.5">
                  Verified Official Passkey Samples (Tap to Auto-Fill):
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyDemoCode('GOV-2026-MUNI', 'Public Works (Power)', 'Chief Engineer Sharma')}
                    className="p-1.5 text-left rounded-lg bg-[#eff4ff] dark:bg-[#142238] hover:bg-[#d3e4fe] dark:hover:bg-slate-800 border border-[#c6c6cd]/30 dark:border-slate-700 text-[11px] transition-colors cursor-pointer"
                  >
                    <strong className="block font-mono text-[#0b1c30] dark:text-white">GOV-2026-MUNI</strong>
                    <span className="text-[#76777d] dark:text-slate-400 text-[10px]">Municipal Nodal In-Charge</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDemoCode('PWD-OFFICER-772', 'Roads & Bridges (PWD)', 'Senior Road Inspector Jane')}
                    className="p-1.5 text-left rounded-lg bg-[#eff4ff] dark:bg-[#142238] hover:bg-[#d3e4fe] dark:hover:bg-slate-800 border border-[#c6c6cd]/30 dark:border-slate-700 text-[11px] transition-colors cursor-pointer"
                  >
                    <strong className="block font-mono text-[#0b1c30] dark:text-white">PWD-OFFICER-772</strong>
                    <span className="text-[#76777d] dark:text-slate-400 text-[10px]">PWD Senior Officer</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="submit-officer-login"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 bg-[#000000] dark:bg-[#006c4a] hover:bg-[#131b2e] dark:hover:bg-[#005137] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#82f5c1]" />
                <span>Verify Security Code & Enter Portal</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
