import React, { useState, useRef } from 'react';
import { X, UploadCloud, CheckCircle2, Camera, FileCheck } from 'lucide-react';
import { Grievance, ResolutionProof } from '../types';

interface ResolutionProofModalProps {
  grievance: Grievance;
  isOpen: boolean;
  onClose: () => void;
  onSubmitProof: (id: string, proof: ResolutionProof) => void;
}

export const ResolutionProofModal: React.FC<ResolutionProofModalProps> = ({
  grievance,
  isOpen,
  onClose,
  onSubmitProof
}) => {
  const [officerName, setOfficerName] = useState('Officer Jane Smith');
  const [notes, setNotes] = useState('Repairs completed and tested on ground. Certified compliant with municipal safety codes.');
  const [materialsUsed, setMaterialsUsed] = useState('45W LED Fixture (x2), Copper line splice, Junction box seal');
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=60'
  );
  const fileRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        setPhotoPreview(loadEvt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const proof: ResolutionProof = {
      officerName,
      resolvedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
        new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      notes,
      materialsUsed,
      photoUrl: photoPreview || undefined
    };
    onSubmitProof(grievance.id, proof);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-[#ffffff] rounded-2xl border border-[#c6c6cd]/40 w-full max-w-lg shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#c6c6cd]/30 flex justify-between items-center bg-[#eff4ff]">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#006c4a]" />
            <h3 className="text-lg font-bold text-[#0b1c30]">
              Upload Resolution Proof
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#76777d] hover:bg-[#d3e4fe] rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Officer in charge */}
          <div>
            <label className="block text-xs font-bold text-[#45464d] uppercase tracking-wider mb-1">
              Field Inspector / Supervisor
            </label>
            <input
              type="text"
              value={officerName}
              onChange={(e) => setOfficerName(e.target.value)}
              className="w-full bg-[#f8f9ff] text-sm text-[#0b1c30] border border-[#c6c6cd]/50 rounded-xl p-2.5 outline-none focus:border-[#000000]"
              required
            />
          </div>

          {/* Verification Photo */}
          <div>
            <label className="block text-xs font-bold text-[#45464d] uppercase tracking-wider mb-1">
              Ground Verification Photo (Geo-tagged)
            </label>
            <input type="file" ref={fileRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            
            {photoPreview ? (
              <div className="relative h-40 rounded-xl overflow-hidden border border-[#c6c6cd]/40 group">
                <img src={photoPreview} alt="Resolution proof" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg shadow-sm"
                  >
                    Change Image
                  </button>
                </div>
                <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                  GPS: 28.6139° N, 77.2090° E
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-[#c6c6cd]/60 hover:border-[#000000] rounded-xl flex flex-col items-center justify-center gap-1 text-[#45464d] bg-[#f8f9ff]"
              >
                <Camera className="w-6 h-6 text-[#76777d]" />
                <span className="text-xs font-semibold">Upload Photo Proof</span>
              </button>
            )}
          </div>

          {/* Resolution Description */}
          <div>
            <label className="block text-xs font-bold text-[#45464d] uppercase tracking-wider mb-1">
              Resolution Summary & Inspection Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#f8f9ff] text-sm text-[#0b1c30] border border-[#c6c6cd]/50 rounded-xl p-3 outline-none focus:border-[#000000] resize-none"
              required
            />
          </div>

          {/* Materials / Equipment Used */}
          <div>
            <label className="block text-xs font-bold text-[#45464d] uppercase tracking-wider mb-1">
              Materials & Equipment Utilized
            </label>
            <input
              type="text"
              value={materialsUsed}
              onChange={(e) => setMaterialsUsed(e.target.value)}
              className="w-full bg-[#f8f9ff] text-sm text-[#0b1c30] border border-[#c6c6cd]/50 rounded-xl p-2.5 outline-none focus:border-[#000000]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#c6c6cd]/30">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-[#45464d] hover:bg-[#eff4ff] rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-[#000000] hover:bg-[#131b2e] rounded-xl shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-[#82f5c1]" />
              <span>Mark Resolved & Submit Proof</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
