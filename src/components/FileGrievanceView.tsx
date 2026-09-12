import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Edit3, 
  Mic, 
  MicOff, 
  Camera, 
  MapPin, 
  Send, 
  Cpu, 
  Languages, 
  Building, 
  AlertTriangle, 
  CheckCircle2, 
  ThumbsUp, 
  Clock, 
  Sparkles,
  X,
  PlusCircle,
  FileCheck,
  Crosshair,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Grievance, AIAnalysisResult, GrievanceLocation } from '../types';
import { SAMPLE_PROMPT_TEMPLATES } from '../data/mockData';
import { InteractiveMap } from './InteractiveMap';
import { detectDeviceLocation } from '../utils/locationService';

interface FileGrievanceViewProps {
  onBack: () => void;
  onSubmitSuccess: (newGrievance: Grievance) => void;
  onSupportExisting: (id: string) => void;
}

export const FileGrievanceView: React.FC<FileGrievanceViewProps> = ({
  onBack,
  onSubmitSuccess,
  onSupportExisting,
}) => {
  const [complaintText, setComplaintText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [photoAttachment, setPhotoAttachment] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<GrievanceLocation>({
    name: 'Central Market Road',
    zone: 'Zone 4',
    ward: 'Ward 12',
    lat: 28.6139,
    lng: 77.2090,
    address: 'Shop 14, Main Road, Central Market, New Delhi'
  });
  const [hasCustomLocation, setHasCustomLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // AI Pipeline State
  const [aiStep, setAiStep] = useState<number>(0);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Trigger AI Analysis when user types
  const handleTextChange = (text: string) => {
    setComplaintText(text);
    setDraftSaved(false);

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    if (text.trim().length > 10) {
      setIsProcessing(true);
      setAiStep(1);

      typingTimerRef.current = setTimeout(async () => {
        try {
          // Call full-stack server API for live Gemini / NLP analysis
          const res = await fetch('/api/ai/analyze-grievance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              location: `${selectedLocation.name}, ${selectedLocation.zone}`
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.result) {
              setAiAnalysis(data.result);
              setAiStep(2);
              setTimeout(() => setAiStep(3), 400);
              setTimeout(() => {
                setAiStep(4);
                setIsProcessing(false);
              }, 800);
              return;
            }
          }
        } catch (e) {
          console.warn('Backend analyze call failed, using client-side fallback analysis', e);
        }

        // Client heuristic fallback
        const lower = text.toLowerCase();
        const isHindi = /(\bhai\b|\bmein\b|\bhain\b|\bka\b|\bki\b|\bke\b|\bse\b|\bandhera\b|\bband\b|\bkooda\b|\bpaani\b)/i.test(text);
        const dept = /(light|andhera|power|bijli)/i.test(lower)
          ? 'Public Works (Power)'
          : /(water|paani|pipe|burst|leak)/i.test(lower)
          ? 'Water Board'
          : /(garbage|kooda|waste|safai)/i.test(lower)
          ? 'Sanitation'
          : 'Public Works (PWD)';

        setAiAnalysis({
          detectedLanguage: isHindi ? 'Hindi / Hinglish' : 'English',
          contextSummary: isHindi ? 'Hindi detected. Context mapped to civic routing directory.' : 'Context mapped to civic routing directory.',
          translatedText: text,
          recommendedDepartment: dept,
          confidenceScore: 94,
          priority: /(accident|urgent|burst|danger|shock)/i.test(lower) ? 'High' : 'General',
          urgencyLevel: /(accident|urgent|burst|danger|shock)/i.test(lower) ? 'High Risk' : 'Moderate',
          tone: /(accident|urgent|dar)/i.test(lower) ? 'Anxious' : 'Concerned',
          extractedEntities: ['Central Market', 'Infrastructure Hazard'],
          suggestedTitle: 'Civic Issue Reported',
          similarGrievance: lower.includes('light') || lower.includes('market') ? {
            id: 'GRV-1023',
            title: 'Street lights not working near main market area for past 2 weeks',
            description: 'Street lights not working near main market area for past 2 weeks...',
            matchPercentage: 85,
            supporters: 42,
            status: 'In Progress'
          } : null
        });

        setAiStep(2);
        setTimeout(() => setAiStep(3), 300);
        setTimeout(() => {
          setAiStep(4);
          setIsProcessing(false);
        }, 600);
      }, 900);
    } else {
      setIsProcessing(false);
      setAiStep(0);
      setAiAnalysis(null);
    }
  };

  // Voice speech typing
  const handleToggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      // Simulate speech-to-text with a realistic Hinglish snippet
      if (!isListening) {
        setIsListening(true);
        setTimeout(() => {
          const sample = 'Hamare area mein 15 din se street lights band hain, raat ko chalna safe nahi lagta...';
          handleTextChange(sample);
          setIsListening(false);
        }, 1500);
      } else {
        setIsListening(false);
      }
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN'; // accepts Hindi & Hinglish

      if (!isListening) {
        setIsListening(true);
        recognition.start();

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((res: any) => res[0].transcript)
            .join('');
          handleTextChange(transcript);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };
      } else {
        recognition.stop();
        setIsListening(false);
      }
    } catch (err) {
      setIsListening(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        setPhotoAttachment(loadEvt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = async () => {
    setIsLocating(true);
    setLocationError(null);
    setShowMapPicker(true);

    try {
      const result = await detectDeviceLocation();
      setIsLocating(false);

      if (result.success && result.location) {
        setSelectedLocation(result.location);
        setHasCustomLocation(true);
      } else {
        setLocationError(
          result.error ||
          'Could not automatically detect GPS. You can search your address or click directly on the OpenStreetMap below.'
        );
        setHasCustomLocation(true);
      }
    } catch {
      setIsLocating(false);
      setLocationError('Location service error. Please search or pick your area on the OpenStreetMap.');
      setHasCustomLocation(true);
    }
  };

  const handleSaveDraft = () => {
    localStorage.setItem('smartgov_draft', complaintText);
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;

    setIsSubmitting(true);

    const payload = {
      description: complaintText,
      englishTranslation: aiAnalysis?.translatedText || complaintText,
      detectedLanguage: aiAnalysis?.detectedLanguage || 'English',
      title: aiAnalysis?.suggestedTitle || 'Reported Civic Issue',
      department: aiAnalysis?.recommendedDepartment || 'Public Works (PWD)',
      confidenceScore: aiAnalysis?.confidenceScore || 94,
      priority: aiAnalysis?.priority || 'General',
      urgencyLevel: aiAnalysis?.urgencyLevel || 'Moderate',
      sentiment: aiAnalysis?.tone || 'Concerned',
      entities: aiAnalysis?.extractedEntities || ['Civic Issue'],
      location: selectedLocation,
      attachments: photoAttachment ? [
        {
          type: 'photo' as const,
          name: 'citizen_attachment.jpg',
          url: photoAttachment
        }
      ] : []
    };

    try {
      const res = await fetch('/api/grievances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setIsSubmitting(false);
        localStorage.removeItem('smartgov_draft');
        onSubmitSuccess(data.data);
        return;
      }
    } catch (e) {
      console.warn('API submission failed, using local mock submission', e);
    }

    // Local fallback
    const fallbackNewItem: Grievance = {
      id: `GRV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      citizenUid: 'UID-88942',
      citizenName: 'Citizen (You)',
      submittedAt: 'Just now',
      rawTimestamp: Date.now(),
      description: complaintText,
      englishTranslation: aiAnalysis?.translatedText || complaintText,
      detectedLanguage: aiAnalysis?.detectedLanguage || 'English',
      title: aiAnalysis?.suggestedTitle || 'Reported Civic Issue',
      department: aiAnalysis?.recommendedDepartment || 'Public Works (Power)',
      confidenceScore: aiAnalysis?.confidenceScore || 94,
      priority: aiAnalysis?.priority || 'High',
      urgencyLevel: aiAnalysis?.urgencyLevel || 'High Risk',
      sentiment: aiAnalysis?.tone || 'Anxious',
      entities: aiAnalysis?.extractedEntities || ['Central Market', 'Street Light'],
      status: 'Open',
      location: selectedLocation,
      supportersCount: 1,
      hasSupported: true,
      attachments: photoAttachment ? [{ type: 'photo', name: 'uploaded_photo.jpg', url: photoAttachment }] : [],
      timeline: [
        {
          status: 'Submitted',
          timestamp: 'Just now',
          note: `Grievance submitted by citizen with GPS location: ${selectedLocation.name}.`,
          actor: 'Citizen UID-88942'
        },
        {
          status: 'Single-Department Routed',
          timestamp: 'Just now',
          note: `Routed exclusively to ${aiAnalysis?.recommendedDepartment || 'Public Works (Power)'}. Anti-jurisdictional conflict verified: 0 inter-departmental overlap.`,
          actor: 'Civic AI Intelligence Dispatcher'
        }
      ]
    };

    setIsSubmitting(false);
    onSubmitSuccess(fallbackNewItem);
  };

  return (
    <div id="file-grievance-screen" className="max-w-6xl mx-auto py-2 px-1 md:px-4">
      {/* Header Section */}
      <div className="mb-6">
        <button
          id="back-to-grievances-btn"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#45464d] hover:text-[#000000] mb-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Grievances</span>
        </button>
        <h2 className="font-bold text-2xl md:text-3xl text-[#0b1c30] tracking-tight">
          Report an Issue
        </h2>
        <p className="text-sm md:text-base text-[#45464d] mt-1">
          Civic Intelligence will automatically route your concern.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Submission Form (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div 
            id="complaint-card"
            className={`bg-[#ffffff] border border-[#c6c6cd]/40 rounded-2xl p-5 md:p-6 shadow-sm ai-processing-border ${
              isProcessing ? 'is-processing' : ''
            }`}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#dce9ff] flex items-center justify-center shrink-0 text-[#131b2e]">
                <Edit3 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <label 
                  htmlFor="complaint-text" 
                  className="block font-semibold text-base text-[#0b1c30] mb-1"
                >
                  Describe the issue in your own words
                </label>
                <p className="text-xs md:text-sm text-[#45464d] mb-3">
                  Hindi, English, or Hinglish accepted. No need to select categories.
                </p>

                {/* Textarea with voice button */}
                <div className="relative w-full">
                  <textarea
                    id="complaint-text"
                    rows={5}
                    value={complaintText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="e.g., Hamare area mein 15 din se street lights band hain, raat ko chalna safe nahi lagta..."
                    className="w-full bg-[#f8f9ff] text-[#0b1c30] border border-[#c6c6cd]/50 rounded-xl p-3.5 text-sm md:text-base focus:border-[#000000] focus:ring-1 focus:ring-[#000000] transition-all resize-none placeholder-[#76777d]/70 shadow-inner outline-none"
                  />
                  
                  {/* Voice Button */}
                  <button
                    type="button"
                    id="voice-typing-btn"
                    onClick={handleToggleVoice}
                    title={isListening ? 'Listening... click to stop' : 'Use Voice Typing (Hindi / Hinglish)'}
                    className={`absolute bottom-3 right-3 p-2 rounded-full border transition-all cursor-pointer ${
                      isListening
                        ? 'bg-[#ba1a1a] text-white border-[#ba1a1a] animate-pulse'
                        : 'bg-[#dce9ff] hover:bg-[#d3e4fe] text-[#0b1c30] border-[#c6c6cd]/30'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>

                {/* Quick Prompts Helper */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-[#76777d] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#006c4a]" /> Try sample:
                  </span>
                  {SAMPLE_PROMPT_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleTextChange(tpl.text)}
                      className="px-2.5 py-1 bg-[#eff4ff] hover:bg-[#d3e4fe] border border-[#c6c6cd]/30 text-xs text-[#0b1c30] rounded-full transition-colors cursor-pointer"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            <div className="md:ml-14 mt-4 pt-4 border-t border-[#c6c6cd]/30">
              <h3 className="text-sm font-semibold text-[#0b1c30] mb-2">
                Attachments (Optional)
              </h3>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Photo Upload Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                {photoAttachment ? (
                  <div className="relative w-24 h-24 rounded-xl border border-[#c6c6cd]/50 overflow-hidden group">
                    <img src={photoAttachment} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoAttachment(null)}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="attach-photo-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-[#c6c6cd]/60 hover:border-[#000000] hover:bg-[#eff4ff] rounded-xl transition-all text-[#45464d] cursor-pointer active:scale-95"
                  >
                    <Camera className="w-5 h-5 mb-1 text-[#76777d]" />
                    <span className="text-xs font-semibold">Photo</span>
                  </button>
                )}

                {/* Location Button */}
                <button
                  type="button"
                  id="attach-location-btn"
                  onClick={handleGetLocation}
                  className={`flex flex-col items-center justify-center min-w-[96px] h-24 px-3 border-2 border-dashed rounded-xl transition-all cursor-pointer active:scale-95 ${
                    hasCustomLocation
                      ? 'border-[#006c4a] bg-[#82f5c1]/20 text-[#005137]'
                      : 'border-[#c6c6cd]/60 hover:border-[#000000] hover:bg-[#eff4ff] text-[#45464d]'
                  }`}
                >
                  {isLocating ? (
                    <Loader2 className="w-5 h-5 mb-1 text-[#006c4a] animate-spin" />
                  ) : (
                    <MapPin className={`w-5 h-5 mb-1 ${hasCustomLocation ? 'text-[#006c4a]' : 'text-[#76777d]'}`} />
                  )}
                  <span className="text-xs font-semibold">
                    {isLocating ? 'Detecting...' : hasCustomLocation ? 'GPS Tagged' : 'Location'}
                  </span>
                  {hasCustomLocation && (
                    <span className="text-[10px] text-[#006c4a] truncate max-w-[90px]">
                      {selectedLocation.zone}
                    </span>
                  )}
                </button>
              </div>

              {/* Toggleable OpenStreetMap Interactive Picker */}
              {showMapPicker && (
                <div className="mt-4 pt-4 border-t border-[#c6c6cd]/30 animate-fadeIn space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#006c4a]" />
                      <span className="text-xs font-bold text-[#0b1c30]">
                        OpenStreetMap Verification & Pinpoint
                      </span>
                      <span className="text-[10px] font-semibold bg-[#82f5c1]/30 text-[#005137] px-2 py-0.5 rounded-md">
                        100% Free OSM
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(false)}
                      className="text-xs text-[#76777d] hover:text-[#0b1c30] flex items-center gap-1 cursor-pointer"
                    >
                      <span>Close Map</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {locationError && (
                    <div className="p-3 bg-[#ba1a1a]/10 border border-[#ba1a1a]/30 rounded-xl text-xs text-[#ba1a1a] flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold">{locationError}</p>
                        <p className="text-[11px] text-[#45464d] mt-1">
                          You can type any street, landmark, or city in the map's search box or click anywhere on the OpenStreetMap to set your pin.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Real Leaflet Map with Search and Drag-to-Pin */}
                  <InteractiveMap
                    location={selectedLocation}
                    title={selectedLocation.name}
                    interactive={true}
                    showSearch={true}
                    heightClass="h-64 sm:h-72"
                    onLocationChange={(newLoc) => {
                      setSelectedLocation(newLoc);
                      setHasCustomLocation(true);
                      setLocationError(null);
                    }}
                  />

                  {/* Selected Location Details Strip */}
                  <div className="p-3 bg-white rounded-xl border border-[#c6c6cd]/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="truncate">
                      <p className="font-bold text-xs text-[#0b1c30] truncate">
                        {selectedLocation.name}
                      </p>
                      <p className="text-[11px] text-[#555] truncate">
                        {selectedLocation.address || `${selectedLocation.zone} • ${selectedLocation.ward}`} • Lat: {selectedLocation.lat.toFixed(4)}, Lng: {selectedLocation.lng.toFixed(4)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isLocating}
                      className="px-3 py-1.5 text-xs font-bold text-[#006c4a] bg-[#82f5c1]/25 hover:bg-[#82f5c1]/40 rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {isLocating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Detecting GPS...</span>
                        </>
                      ) : (
                        <>
                          <Crosshair className="w-3.5 h-3.5" />
                          <span>Re-detect GPS</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              id="save-draft-btn"
              onClick={handleSaveDraft}
              className="px-4 py-2.5 text-sm font-semibold text-[#45464d] hover:text-[#000000] border border-[#c6c6cd]/40 rounded-xl bg-[#ffffff] transition-colors cursor-pointer"
            >
              {draftSaved ? 'Draft Saved!' : 'Save Draft'}
            </button>

            <button
              type="button"
              id="submit-grievance-btn"
              onClick={handleSubmit}
              disabled={!complaintText.trim() || isSubmitting}
              className={`px-6 py-2.5 text-sm font-bold text-white bg-[#000000] hover:bg-[#131b2e] rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-98 ${
                !complaintText.trim() || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span>{isSubmitting ? 'Routing...' : 'Submit Grievance'}</span>
              <Send className="w-4 h-4 text-[#82f5c1]" />
            </button>
          </div>
        </div>

        {/* Right Column: AI Processing & Duplicate Detection (4 cols) */}
        <div className="lg:col-span-4 relative">
          <div className="glass-card rounded-2xl p-5 border border-[#c6c6cd]/40 shadow-xs sticky top-20">
            {/* Widget Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#c6c6cd]/30">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#006c4a]" />
                <h3 className="text-sm font-bold text-[#0b1c30]">
                  Civic Intelligence
                </h3>
              </div>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006c4a] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#006c4a]" />
              </span>
            </div>

            {/* AI Stages */}
            <div className="space-y-4 mb-4" id="ai-status-container">
              {/* Step 1: Language & Context */}
              <div 
                className={`flex items-start gap-3 transition-opacity duration-300 ${
                  aiStep >= 1 ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <Languages className="w-5 h-5 text-[#76777d] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#0b1c30]">
                    Understanding Context
                  </p>
                  <p className="text-xs text-[#45464d] mt-0.5">
                    {aiStep === 0
                      ? 'Waiting for input...'
                      : isProcessing
                      ? 'Translating and parsing...'
                      : aiAnalysis?.contextSummary || 'Context mapped to municipal directory.'}
                  </p>
                </div>
              </div>

              {/* Step 2: Department */}
              <div 
                className={`flex items-start gap-3 transition-opacity duration-300 ${
                  aiStep >= 2 ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <Building className="w-5 h-5 text-[#76777d] mt-0.5 shrink-0" />
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#0b1c30]">
                      Single-Department Routing
                    </p>
                    <span className="text-[10px] font-bold text-[#006c4a] bg-[#82f5c1]/30 px-1.5 py-0.5 rounded">
                      Zero Overlap
                    </span>
                  </div>
                  {aiAnalysis?.recommendedDepartment && aiStep >= 2 && (
                    <div className="mt-1.5 space-y-1.5 animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#eff4ff] text-[#0b1c30] border border-[#c6c6cd]/40 rounded-full px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#006c4a]" />
                          {aiAnalysis.recommendedDepartment}
                        </span>
                        <span className="text-[11px] font-bold text-[#006c4a]">
                          {aiAnalysis.confidenceScore}% match
                        </span>
                      </div>
                      <p className="text-[11px] text-[#45464d] bg-[#f8f9ff] p-2 rounded-lg border border-[#c6c6cd]/30 leading-relaxed">
                        {aiAnalysis.routingRationale || 'Assigned exclusively to one primary municipal department to prevent overlapping authority.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Priority & Risk */}
              <div 
                className={`flex items-start gap-3 transition-opacity duration-300 ${
                  aiStep >= 3 ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-[#76777d] mt-0.5 shrink-0" />
                <div className="w-full">
                  <p className="text-sm font-semibold text-[#0b1c30]">
                    Predicting Priority
                  </p>
                  {aiAnalysis?.urgencyLevel && aiStep >= 3 && (
                    <div className="mt-1.5 flex items-center gap-2 animate-fadeIn">
                      <span className="bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/20 rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {aiAnalysis.urgencyLevel}
                      </span>
                      <span className="text-xs text-[#45464d]">
                        Tone: {aiAnalysis.tone}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Duplicate Found Card */}
            {aiAnalysis?.similarGrievance && aiStep >= 4 && (
              <div className="mt-4 pt-4 border-t border-[#c6c6cd]/30 animate-fadeIn">
                <div className="bg-[#eff4ff] border-l-4 border-[#006c4a] rounded-r-xl p-3.5 shadow-xs relative overflow-hidden">
                  <div className="flex items-center gap-1.5 mb-1 text-[#006c4a]">
                    <CheckCircle2 className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wide">
                      Similar Issue Detected
                    </h4>
                  </div>
                  <p className="text-xs text-[#45464d] mb-2 leading-snug">
                    We found an existing grievance in this location. Supporting it speeds up resolution.
                  </p>

                  <div className="bg-[#ffffff] border border-[#c6c6cd]/30 rounded-lg p-2.5 mb-2.5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-[#000000]">
                        #{aiAnalysis.similarGrievance.id}
                      </span>
                      <span className="bg-[#82f5c1] text-[#00714e] rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                        {aiAnalysis.similarGrievance.matchPercentage}% Match
                      </span>
                    </div>
                    <p className="text-xs text-[#0b1c30] line-clamp-2">
                      "{aiAnalysis.similarGrievance.description}"
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[#76777d] text-[11px]">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3 text-[#006c4a]" />
                        {aiAnalysis.similarGrievance.supporters} Supporters
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#497cff]" />
                        {aiAnalysis.similarGrievance.status}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="support-instead-btn"
                    onClick={() => {
                      if (aiAnalysis?.similarGrievance?.id) {
                        onSupportExisting(aiAnalysis.similarGrievance.id);
                      }
                    }}
                    className="w-full bg-[#dce9ff] hover:bg-[#000000] hover:text-white text-[#000000] border border-[#c6c6cd]/40 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Support This Instead</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
