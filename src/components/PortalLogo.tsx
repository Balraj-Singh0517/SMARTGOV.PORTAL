import React, { useState } from 'react';

interface PortalLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  className?: string;
  showText?: boolean;
}

export const PortalLogo: React.FC<PortalLogoProps> = ({
  size = 'md',
  className = '',
  showText = false
}) => {
  const [imageError, setImageError] = useState(false);

  // Size mapping matching previous grievance portal logo proportions
  // Previous logo was w-10 h-10 (40px) in Sidebar, w-8 h-8 in MobileDrawer, w-11 h-11 in Modals
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    custom: ''
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div 
        className={`relative shrink-0 ${sizeClasses} rounded-full overflow-hidden bg-white shadow-xs ring-1 ring-slate-900/10 transition-transform duration-200 hover:scale-105`}
        title="SmartGov Portal - Your Voice • Our Action"
      >
        {!imageError ? (
          <img
            src="/smart-gov-logo.jpg"
            alt="SmartGov Grievance Portal Logo"
            className="w-full h-full object-cover object-center transform scale-102"
            referrerPolicy="no-referrer"
            loading="eager"
            onError={() => setImageError(true)}
          />
        ) : (
          /* High-fidelity Vector Fallback */
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full"
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer gradient border ring */}
            <circle cx="50" cy="50" r="46" stroke="url(#logo-gradient)" strokeWidth="5" fill="#ffffff" />
            
            {/* Soft inner accent glow ring */}
            <circle cx="50" cy="50" r="41" stroke="#e0f2fe" strokeWidth="1.5" strokeDasharray="6 3" />
            
            {/* Capitol Dome Building */}
            <g fill="#0f2b48">
              {/* Central Dome */}
              <path d="M41 33 C41 26 59 26 59 33 Z" />
              <rect x="49" y="21" width="2" height="6" fill="#0f2b48" />
              <path d="M51 21 L56 23 L51 25 Z" fill="#0284c7" />
              {/* Pediment Arch & Columns */}
              <rect x="39" y="33" width="22" height="3" rx="1" />
              <rect x="41" y="38" width="3" height="12" rx="0.8" />
              <rect x="46" y="38" width="3" height="12" rx="0.8" />
              <rect x="51" y="38" width="3" height="12" rx="0.8" />
              <rect x="56" y="38" width="3" height="12" rx="0.8" />
              <rect x="38" y="50" width="24" height="3" rx="1" />
            </g>

            {/* Checkmark badge with motion rays */}
            <line x1="64" y1="29" x2="70" y2="29" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="64" y1="33" x2="68" y2="33" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="73" cy="35" r="5.5" fill="#10b981" />
            <path d="M71 35 L72.5 36.5 L75.5 33.5" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />

            {/* Protective stylized hands / leaves */}
            {/* Left Hand: Deep Navy / Blue */}
            <path 
              d="M24 41 C27 49 35 56 50 58 C38 58 28 52 24 41 Z" 
              fill="#0369a1" 
            />
            <path 
              d="M28 46 C34 53 43 56 50 58 C36 57 28 51 28 46 Z" 
              fill="#0284c7" 
            />

            {/* Right Hand: Vibrant Emerald Green */}
            <path 
              d="M76 41 C73 49 65 56 50 58 C62 58 72 52 76 41 Z" 
              fill="#059669" 
            />
            <path 
              d="M72 46 C66 53 57 56 50 58 C64 57 72 51 72 46 Z" 
              fill="#10b981" 
            />

            {/* smartGov Text Emblem */}
            <text x="50" y="70" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="10.5" fill="#0b1c30">
              smart<tspan fill="#10b981">Gov</tspan>
            </text>

            {/* Sprout on v */}
            <path d="M68 64 C70 61 74 61 74 63 C74 66 70 65 68 64 Z" fill="#10b981" />
            
            {/* Subtitle PORTAL */}
            <text x="50" y="77" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="4.5" letterSpacing="0.2em" fill="#475569">
              PORTAL
            </text>

            {/* Micro Motto */}
            <text x="50" y="85" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="600" fontSize="2.8" letterSpacing="0.05em" fill="#0284c7">
              YOUR VOICE • OUR ACTION
            </text>

            {/* Gradients */}
            <defs>
              <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0A192F" />
                <stop offset="60%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#FACC15" />
              </linearGradient>
            </defs>
          </svg>
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-lg text-[#0A192F] dark:text-white tracking-tight leading-tight">
              smart<span className="text-[#0284C7] dark:text-[#38BDF8]">Gov</span>
              <span className="text-[#FACC15]">.</span>
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.2 bg-[#E0F0FE] text-[#0369A1] rounded-sm border border-[#BAE0FD]">
              Portal
            </span>
          </div>
          <p className="text-[11px] font-semibold text-[#475569] tracking-wider uppercase">
            Grievance Resolution
          </p>
        </div>
      )}
    </div>
  );
};
