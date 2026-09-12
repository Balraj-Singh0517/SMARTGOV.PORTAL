import React, { useState } from 'react';
import { X, ArrowRightLeft, Building2 } from 'lucide-react';
import { Grievance } from '../types';

interface TransferModalProps {
  grievance: Grievance;
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (id: string, newDept: string, reason: string) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  grievance,
  isOpen,
  onClose,
  onTransfer
}) => {
  const [targetDept, setTargetDept] = useState(grievance.department);
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const departments = [
    'Public Works (Power)',
    'Roads & Bridges (PWD)',
    'Municipal Water Board',
    'Solid Waste & Sanitation',
    'Parks & Horticulture',
    'Public Health',
    'Traffic Management'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDept || targetDept === grievance.department) return;
    onTransfer(grievance.id, targetDept, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-[#ffffff] rounded-2xl border border-[#c6c6cd]/40 w-full max-w-md shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#c6c6cd]/30 flex justify-between items-center bg-[#eff4ff]">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-[#006c4a]" />
            <h3 className="text-lg font-bold text-[#0b1c30]">Transfer Jurisdiction</h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#76777d] hover:bg-[#d3e4fe] rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <span className="text-xs font-bold text-[#76777d] uppercase tracking-wider block mb-1">
              Current Department
            </span>
            <div className="p-2.5 bg-[#eff4ff] rounded-xl font-semibold text-sm text-[#0b1c30] border border-[#c6c6cd]/30">
              {grievance.department}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#45464d] uppercase tracking-wider mb-1">
              Reassign To Department
            </label>
            <select
              value={targetDept}
              onChange={(e) => setTargetDept(e.target.value)}
              className="w-full bg-[#f8f9ff] text-sm text-[#0b1c30] border border-[#c6c6cd]/50 rounded-xl p-2.5 focus:border-[#000000] outline-none"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#45464d] uppercase tracking-wider mb-1">
              Transfer Reason
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Issue pertains to secondary underground cables under PWD jurisdiction."
              className="w-full bg-[#f8f9ff] text-sm text-[#0b1c30] border border-[#c6c6cd]/50 rounded-xl p-3 focus:border-[#000000] outline-none resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-[#45464d] hover:bg-[#eff4ff] rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={targetDept === grievance.department}
              className="px-5 py-2 text-sm font-bold text-white bg-[#000000] hover:bg-[#131b2e] rounded-xl shadow-md disabled:opacity-50"
            >
              Confirm Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
