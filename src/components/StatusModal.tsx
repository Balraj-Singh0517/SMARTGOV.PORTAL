import React, { useState } from 'react';
import { X, CheckCircle2, Clock, AlertCircle, Send, Smartphone } from 'lucide-react';
import { Grievance, GrievanceStatus } from '../types';

interface StatusModalProps {
  grievance: Grievance;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: GrievanceStatus, note: string) => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  grievance,
  isOpen,
  onClose,
  onUpdateStatus
}) => {
  const [selectedStatus, setSelectedStatus] = useState<GrievanceStatus>(grievance.status);
  const [officerNote, setOfficerNote] = useState('');
  const [notifyCitizen, setNotifyCitizen] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStatus(grievance.id, selectedStatus, officerNote);
    onClose();
  };

  const statusOptions: { status: GrievanceStatus; label: string; desc: string; icon: any; color: string }[] = [
    {
      status: 'Open',
      label: 'Open',
      desc: 'Ticket queued for inspection and assignment',
      icon: AlertCircle,
      color: 'text-[#497cff]'
    },
    {
      status: 'In Progress',
      label: 'In Progress',
      desc: 'Ground repair team dispatched and active',
      icon: Clock,
      color: 'text-[#00714e]'
    },
    {
      status: 'Resolved',
      label: 'Resolved',
      desc: 'Field work completed and verified by inspector',
      icon: CheckCircle2,
      color: 'text-[#006c4a]'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-[#ffffff] rounded-2xl border border-[#c6c6cd]/40 w-full max-w-lg shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#c6c6cd]/30 flex justify-between items-center bg-[#eff4ff]">
          <div>
            <h3 className="text-lg font-bold text-[#0b1c30]">
              Update Grievance Status
            </h3>
            <p className="text-xs text-[#45464d]">
              #{grievance.id} • {grievance.department}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#76777d] hover:bg-[#d3e4fe] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Status Selection Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#45464d] uppercase tracking-wider">
              Select Resolution State
            </label>
            <div className="grid grid-cols-1 gap-2">
              {statusOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedStatus === opt.status;

                return (
                  <button
                    key={opt.status}
                    type="button"
                    onClick={() => setSelectedStatus(opt.status)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#000000] bg-[#eff4ff] shadow-xs'
                        : 'border-[#c6c6cd]/40 hover:bg-[#f8f9ff]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 ${opt.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#0b1c30]">
                          {opt.label}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#006c4a]" />
                        )}
                      </div>
                      <p className="text-xs text-[#45464d] mt-0.5">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Officer Note */}
          <div>
            <label className="block text-xs font-bold text-[#45464d] uppercase tracking-wider mb-1">
              Inspection / Action Log Note
            </label>
            <textarea
              rows={3}
              value={officerNote}
              onChange={(e) => setOfficerNote(e.target.value)}
              placeholder="e.g., Zonal technician dispatched. Underground line repaired and power restored to lamps."
              className="w-full bg-[#f8f9ff] text-sm text-[#0b1c30] border border-[#c6c6cd]/50 rounded-xl p-3 focus:border-[#000000] focus:ring-1 focus:ring-[#000000] outline-none resize-none"
            />
          </div>

          {/* Citizen SMS Alert Preview */}
          <div className="bg-[#f8f9ff] border border-[#c6c6cd]/30 rounded-xl p-3 flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 text-[#006c4a] mt-0.5 shrink-0" />
            <div className="text-xs text-[#45464d]">
              <span className="font-semibold text-[#0b1c30]">Automated Citizen Notification: </span>
              "SmartGov Alert: Your grievance #{grievance.id} is now marked as {selectedStatus}. {officerNote ? `Update: ${officerNote.slice(0, 50)}...` : ''}"
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-[#45464d] hover:bg-[#eff4ff] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-[#000000] hover:bg-[#131b2e] rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#82f5c1]" />
              <span>Confirm Status Update</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
