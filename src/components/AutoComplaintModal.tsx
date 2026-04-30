import { Issue } from '../types';
import { RESPONSIBLE_BODIES } from '../constants';
import { X, Send, Copy, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AutoComplaintModalProps {
  issue: Issue;
  onClose: () => void;
}

export default function AutoComplaintModal({ issue, onClose }: AutoComplaintModalProps) {
  const department = RESPONSIBLE_BODIES[issue.category];
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draftText, setDraftText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Static fallback template
  const fallbackDraft = `To: ${department} Complaints Department
Subject: URGENT: Broken Public Amenity - ${issue.title} (ID: ${issue.id.slice(0, 6)})

Sir/Madam,

I am writing to formally report a critical issue regarding public infrastructure under your administration. 

Issue: ${issue.title}
Location: ${issue.address} (GPS: ${issue.location.lat.toFixed(4)}, ${issue.location.lng.toFixed(4)})
Reported On: ${issue.createdAt instanceof Date ? issue.createdAt.toLocaleDateString() : new Date(issue.createdAt).toLocaleDateString()}

Citizen Account / Field Notes:
"${issue.description}"

This issue has been independently verified by ${issue.upvotes} members of the community on the CivicLens platform, with a verification score of ${issue.verificationScore}. As this represents a significant hazard and disruption to public accessibility, we urge immediate rectification.

Please provide a resolution timeline or ticket number for tracking purposes.

Sincerely,
Concerned Citizens of the District`;

  const generateDraft = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: issue.title,
          description: issue.description,
          category: issue.category,
          address: issue.address,
          verificationScore: issue.verificationScore,
          department,
        }),
      });

      if (!response.ok) {
        throw new Error('Backend returned an error.');
      }

      const data = await response.json();
      if (data.draft) {
        setDraftText(data.draft);
      } else {
        throw new Error('Empty draft returned.');
      }
    } catch (err) {
      console.error('Complaint generation error:', err);
      setError('AI generation unavailable — using standard template.');
      setDraftText(fallbackDraft);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(draftText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard write failed:', err);
      // Fallback: select the textarea text for manual copy
      const textarea = document.getElementById('complaint-draft') as HTMLTextAreaElement;
      if (textarea) { textarea.select(); document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    }
  };

  const handleSend = () => {
    window.location.href = `mailto:compliance-${department.toLowerCase().replace(/[^a-z]/g, '')}@city.gov?subject=URGENT: Broken Public Amenity - ${issue.title}&body=${encodeURIComponent(draftText)}`;
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div 
        className="w-full max-w-lg bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-red-400/50 to-orange-500/50"></div>
          <h2 className="text-sm font-bold tracking-widest text-red-100 uppercase flex items-center gap-2 drop-shadow-[0_0_8px_rgba(248,113,113,0.3)]">
            <Sparkles size={16} className="text-amber-400" />
            AI-Generated Complaint
          </h2>
          <button 
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors bg-white/5 border border-white/10 rounded-lg p-1.5 hover:bg-white/10"
            aria-label="Close"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-5 bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner">
             <div className="text-[10px] uppercase font-bold text-cyan-200/50 tracking-widest mb-1.5">Target Department</div>
             <div className="text-sm font-bold text-white">
               {department}
             </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-400/20 flex items-center justify-center">
                  <Loader2 size={28} className="text-amber-400 animate-spin" />
                </div>
                <Sparkles size={16} className="absolute -top-1 -right-1 text-amber-400 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white mb-1">Gemini AI is drafting your complaint…</p>
                <p className="text-[10px] text-blue-200/50 uppercase tracking-widest font-bold">
                  Analyzing case #{issue.id.slice(0, 6)} • {issue.title}
                </p>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-[11px] text-amber-300 font-medium">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="complaint-draft" className="text-[10px] uppercase font-bold text-cyan-200/50 tracking-widest mb-2 flex justify-between items-end cursor-pointer">
                  Draft Message 
                  <span className="text-[8px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30">Official Escalation</span>
                </label>
                <textarea 
                  id="complaint-draft"
                  className="w-full h-64 p-4 text-xs text-blue-100/90 bg-white/5 border border-white/10 rounded-xl resize-none focus:outline-none focus:border-cyan-400/50 font-mono leading-relaxed shadow-inner"
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                />
              </div>

              <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
                <button
                  onClick={handleCopy}
                  className="flex-[0.3] flex items-center justify-center gap-2 py-3.5 bg-white/5 border border-white/10 text-white/80 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-white/10 hover:text-white transition-all shadow-inner"
                >
                  <Copy size={14} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => generateDraft()}
                  className="flex-[0.3] flex items-center justify-center gap-2 py-3.5 bg-white/5 border border-white/10 text-amber-300/80 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-amber-500/10 hover:text-amber-300 transition-all shadow-inner"
                  title="Regenerate with AI"
                >
                  <RefreshCw size={14} />
                  Redo
                </button>
                <button
                  onClick={handleSend}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-linear-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white rounded-xl text-xs font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(225,29,72,0.4)] border border-red-400/30 transition-all group"
                >
                  <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  Open Mail
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
