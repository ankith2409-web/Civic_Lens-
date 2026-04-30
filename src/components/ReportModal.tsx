import { useState, useEffect, useRef } from 'react';
import { Category, Issue, Location } from '../types';
import { CATEGORY_LABELS, LOCALITY_POPULATIONS } from '../constants';
import { X, MapPin, ImageIcon, Navigation, Loader2, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../lib/utils';

interface ReportModalProps {
  onClose: () => void;
  onSubmit: (issue: Issue, file?: File | null) => void;
  defaultLocation?: Location | null;
  reporterName: string;
  existingIssues?: Issue[];
}

/**
 * Calculate distance between two lat/lng points in meters using the Haversine formula.
 */
function getDistanceInMeters(a: Location, b: Location): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aVal =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  return R * c;
}

export default function ReportModal({ onClose, onSubmit, defaultLocation, reporterName, existingIssues = [] }: ReportModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('RAMP');
  const [address, setAddress] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [locality, setLocality] = useState<string>('General / Other');
  const [isLocating, setIsLocating] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<Issue | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [severityScore, setSeverityScore] = useState<number | null>(null);
  const [severityJustification, setSeverityJustification] = useState<string | null>(null);
  
  // In a real app, clicking the map sets this. For prototype, we default or mock.
  const [location, setLocation] = useState<Location>(defaultLocation || { lat: 12.9716, lng: 77.5946 });

  // Cleanup Object URL on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // Check for duplicates whenever category or location changes
  useEffect(() => {
    const duplicate = existingIssues.find((issue) => {
      if (issue.status === 'RESOLVED') return false; // Ignore resolved cases
      const sameCategory = issue.category === category;
      const distance = getDistanceInMeters(location, issue.location);
      return sameCategory && distance <= 20;
    });
    setDuplicateWarning(duplicate || null);
  }, [category, location, existingIssues]);

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setAddress(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)} (Live GPS)`);
          setIsLocating(false);
        },
        (error) => {
          console.warn("Geolocation Error:", error);
          alert("Couldn't fetch location. Please ensure location permissions are granted.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAttachedFile(file);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(URL.createObjectURL(file));

      // Trigger AI analysis if title and category are set
      if (title && category) {
        await analyzeSeverity(file, title, category);
      }
    }
  };

  const analyzeSeverity = async (file: File, issueTitle: string, issueCategory: string) => {
    setIsAnalyzing(true);
    setSeverityScore(null);
    setSeverityJustification(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('title', issueTitle);
      formData.append('category', issueCategory);

      const response = await fetch('/api/analyze-severity', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Severity analysis failed');

      const data = await response.json();
      setSeverityScore(data.score);
      setSeverityJustification(data.justification);
    } catch (err) {
      console.error('Severity analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemoveFile = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setAttachedFile(null);
    setImagePreview(null);
    setSeverityScore(null);
    setSeverityJustification(null);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Block submission if duplicate exists
    if (duplicateWarning) return;
    
    const newIssue: Issue = {
      id: uuidv4(),
      title,
      description,
      category,
      address: address || 'Current Location (approx)',
      locality,
      location,
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date(),
      upvotes: 1, // Auto-upvote by creator
      downvotes: 0,
      verificationScore: 1, 
      reportedBy: reporterName,
      reportedByUid: '', // Will be set by App when saving to Firestore
      severityScore: severityScore || undefined,
    };
    
    onSubmit(newIssue, attachedFile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div 
        className="w-full max-w-md max-h-[90vh] bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
        role="dialog"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-cyan-400/50 to-blue-500/50"></div>
          <h2 className="text-sm font-bold tracking-widest text-white uppercase flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Verify Ground Truth
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors bg-white/5 border border-white/10 rounded-lg p-1.5 hover:bg-white/10"
            aria-label="Close"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-[10px] font-bold uppercase tracking-widest text-cyan-200/50 mb-1">
                Discrepancy Title
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Broken Wheelchair Ramp"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-blue-200/30 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all shadow-inner"
              />
            </div>

            <div>
              <label htmlFor="locality" className="block text-[10px] font-bold uppercase tracking-widest text-cyan-200/50 mb-1">
                Locality / Ward
              </label>
              <div className="relative">
                <select
                  id="locality"
                  value={locality}
                  onChange={e => setLocality(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400/50 appearance-none shadow-inner"
                >
                  {Object.keys(LOCALITY_POPULATIONS).map(loc => (
                    <option key={loc} value={loc} className="text-slate-900 bg-white">{loc}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/50">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-[10px] font-bold uppercase tracking-widest text-cyan-200/50 mb-1">
                Infrastructure Category
              </label>
              <div className="relative">
                <select
                  id="category"
                  value={category}
                  onChange={e => setCategory(e.target.value as Category)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400/50 appearance-none shadow-inner"
                >
                  {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                    <option key={val} value={val} className="text-slate-900 bg-white">{label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/50">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="location-approx" className="block text-[10px] font-bold uppercase tracking-widest text-cyan-200/50 cursor-pointer">
                  Location Approximation
                </label>
                <button 
                  type="button" 
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="text-[9px] font-bold uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 disabled:opacity-50"
                  title="Get current location"
                  aria-label="Get current location"
                >
                  {isLocating ? <Loader2 size={10} className="animate-spin" /> : <Navigation size={10} />}
                  Live GPS
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin size={14} className={isLocating ? "text-cyan-400/50" : "text-cyan-400"} />
                </div>
                <input
                  id="location-approx"
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Cross streets or use Live GPS"
                  disabled={isLocating}
                  className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-blue-200/30 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all shadow-inner disabled:opacity-50"
                />
              </div>
            </div>

            {/* Duplicate Warning Banner */}
            {duplicateWarning && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-300">
                <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-300 mb-1">Duplicate Case Detected</p>
                  <p className="text-[11px] text-amber-200/70 leading-relaxed">
                    A similar case "<span className="font-bold text-white">{duplicateWarning.title}</span>" 
                    ({CATEGORY_LABELS[duplicateWarning.category]}) has already been registered within 20m of this location.
                  </p>
                  <p className="text-[10px] text-amber-200/50 mt-2 uppercase tracking-widest font-bold">
                    Case ID: #{duplicateWarning.id.slice(0, 6)} • {duplicateWarning.upvotes} confirmations
                  </p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="description" className="block text-[10px] font-bold uppercase tracking-widest text-cyan-200/50 mb-1">
                Visual Evidence / Observation
              </label>
              <textarea
                id="description"
                required
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe why the official record conflicts with ground truth..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-blue-200/30 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 resize-none transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-cyan-200/50 mb-1">
                Visual Evidence
              </label>
              {imagePreview ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <label className="px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest cursor-pointer hover:bg-white/20 transition-colors">
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        Change
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="px-3 py-1.5 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-lg text-[10px] font-bold text-red-300 uppercase tracking-widest hover:bg-red-500/30 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-3 py-1.5">
                      <p className="text-[10px] text-cyan-400 font-bold tracking-wider truncate">{attachedFile?.name}</p>
                    </div>
                  </div>

                  {/* AI Severity Analysis Results */}
                  {(isAnalyzing || severityScore !== null) && (
                    <div className={cn(
                      "border rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300",
                      severityScore !== null && severityScore >= 7 ? "bg-red-500/5 border-red-500/20" :
                      severityScore !== null && severityScore >= 4 ? "bg-amber-500/5 border-amber-500/20" :
                      severityScore !== null ? "bg-emerald-500/5 border-emerald-500/20" :
                      "bg-white/5 border-white/10"
                    )}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-200/50 flex items-center gap-1.5">
                          <Sparkles size={12} className="text-amber-400" />
                          AI Severity Analysis
                        </span>
                        {isAnalyzing ? (
                          <Loader2 size={12} className="text-cyan-400 animate-spin" />
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => attachedFile && analyzeSeverity(attachedFile, title, category)}
                              className="text-[8px] font-bold uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                              title="Re-analyze"
                            >
                              <RefreshCw size={9} />
                              Re-scan
                            </button>
                            <span className={cn(
                              "text-[10px] font-black px-2.5 py-1 rounded-lg",
                              severityScore! >= 7 ? "bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(248,113,113,0.15)]" :
                              severityScore! >= 4 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]" :
                              "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.15)]"
                            )}>
                              {severityScore! >= 7 ? '⚠️' : severityScore! >= 4 ? '⚡' : '✓'} Level {severityScore}/10
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {isAnalyzing ? (
                        <div className="space-y-2">
                          <p className="text-[11px] text-blue-200/40 italic">Gemini is evaluating damage intensity...</p>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400/30 rounded-full animate-pulse" style={{ width: '60%' }} />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Severity Bar */}
                          <div className="space-y-1.5">
                            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden relative">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all duration-700 ease-out",
                                  severityScore! >= 7 ? "bg-gradient-to-r from-red-500 to-rose-400 shadow-[0_0_8px_rgba(248,113,113,0.4)]" :
                                  severityScore! >= 4 ? "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]" :
                                  "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                                )}
                                style={{ width: `${(severityScore! / 10) * 100}%` }} 
                              />
                            </div>
                            <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-blue-200/30">
                              <span>Minor</span>
                              <span>Moderate</span>
                              <span>Critical</span>
                            </div>
                          </div>

                          <p className="text-[11px] text-blue-100/80 leading-relaxed italic border-l-2 border-white/10 pl-3">
                            "{severityJustification}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show analyze button when image is uploaded but no analysis has run yet */}
                  {!isAnalyzing && severityScore === null && attachedFile && (
                    <button
                      type="button"
                      onClick={() => analyzeSeverity(attachedFile, title || 'Infrastructure issue', category)}
                      className="w-full py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest text-amber-300 hover:bg-amber-500/15 hover:text-amber-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles size={12} />
                      Analyze Severity with AI
                    </button>
                  )}
                </div>

              ) : (
                <label className="border border-dashed border-white/20 rounded-xl p-6 bg-white/5 text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-colors group relative overflow-hidden">
                  <input type="file" accept="image/*" className="absolute opacity-0 w-[0.1px] h-[0.1px] overflow-hidden z-[-1]" onChange={handleFileChange} />
                  <ImageIcon size={28} className="text-white/40 group-hover:text-cyan-400 transition-colors" />
                  <span className="text-[10px] font-bold tracking-widest text-white/50 uppercase group-hover:text-cyan-200 mt-2">Upload File</span>
                </label>
              )}
            </div>
          </div>
          
          <div className="mt-5 sticky bottom-0 bg-black/40 backdrop-blur-md pt-3 -mx-5 px-5 -mb-5 pb-5 border-t border-white/5">
            <button 
              type="submit"
              disabled={!!duplicateWarning}
              className={cn(
                "w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all group flex items-center justify-center gap-2",
                duplicateWarning
                  ? "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                  : "bg-linear-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)] border border-red-400/30"
              )}
            >
              {duplicateWarning ? 'Case Already Registered Nearby' : 'Verify & Submit Record'}
            </button>
            <p className="text-center text-[9px] text-cyan-200/40 mt-3 uppercase tracking-widest font-bold pb-1">
              Data synchronized to public audit log
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
