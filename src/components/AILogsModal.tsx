import React from 'react';
import { X, Terminal, Cpu, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface AILogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AILogsModal: React.FC<AILogsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const logs = [
    {
      timestamp: '08:46:12.102',
      service: 'nlp.translator',
      level: 'INFO',
      message: 'Detected language "Hindi/Hinglish" [Confidence: 0.982]. Translation executed in 41ms.'
    },
    {
      timestamp: '08:46:12.148',
      service: 'gemini.classifier',
      level: 'INFO',
      message: 'Municipal domain classification: "Public Works (Power)" [Score: 0.94]. Urgency: High Risk.'
    },
    {
      timestamp: '08:46:12.190',
      service: 'gis.duplicate_matcher',
      level: 'INFO',
      message: 'Vector embedding search against Ward 12 index. Match found: #GRV-1023 (cosine sim: 0.854).'
    },
    {
      timestamp: '08:45:01.004',
      service: 'dispatch.engine',
      level: 'INFO',
      message: 'Ticket GRV-2023-1042 dispatched to Central Zone PWD Queue.'
    },
    {
      timestamp: '08:40:22.842',
      service: 'gemini.classifier',
      level: 'INFO',
      message: 'Classification completed for GRV-2023-1045: Sanitation (Score: 0.96).'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-[#131b2e] text-white rounded-2xl border border-white/20 w-full max-w-2xl shadow-2xl overflow-hidden font-mono">
        {/* Terminal Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex justify-between items-center bg-[#0b101c]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 mr-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            <Terminal className="w-4 h-4 text-[#82f5c1]" />
            <span className="text-xs font-bold tracking-wider text-[#82f5c1]">
              CIVIC-AI TELEMETRY STREAM
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-white/70 hover:text-white rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Logs Feed */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto text-xs">
          {logs.map((log, i) => (
            <div key={i} className="flex items-start gap-2.5 leading-relaxed hover:bg-white/5 p-1 rounded transition-colors">
              <span className="text-white/40 shrink-0">{log.timestamp}</span>
              <span className="text-[#82f5c1] font-bold shrink-0">[{log.service}]</span>
              <span className="text-[#d3e4fe]">{log.message}</span>
            </div>
          ))}

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#27c93f] animate-pulse" />
              Live Ingress Pipeline Active • Gemini 3.7 Flash Engine
            </span>
            <span>Avg Latency: 52ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
