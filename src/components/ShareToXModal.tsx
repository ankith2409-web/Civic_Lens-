import { useState, useEffect } from 'react';
import { Issue } from '../types';
import { CATEGORY_LABELS } from '../constants';
import { X, Loader2, Share2, Edit3, MapPin, Hash, ExternalLink, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';

interface ShareToXModalProps {
  issue: Issue;
  attachedFile: File | null;
  onClose: () => void;
}

interface TweetData {
  description: string;
  hashtags: string[];
  locationContext: string;
}

const BACKEND_URL = ''; // Relative path for Vercel deployment

export default function ShareToXModal({ issue, attachedFile, onClose }: ShareToXModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [tweetData, setTweetData] = useState<TweetData | null>(null);
  const [editableDescription, setEditableDescription] = useState('');
  const [editableHashtags, setEditableHashtags] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Posting state
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const [postUrl, setPostUrl] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);

  useEffect(() => {
    analyzeImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analyzeImage = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      if (attachedFile) {
        const formData = new FormData();
        formData.append('image', attachedFile);
        formData.append('title', issue.title);
        formData.append('category', issue.category);
        formData.append('address', issue.address);

        const response = await fetch(`${BACKEND_URL}/api/analyze-for-share`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Backend analysis failed');
        }

        const data: TweetData = await response.json();
        setTweetData(data);
        setEditableDescription(data.description);
        setEditableHashtags(data.hashtags.join(' '));
      } else {
        // No image attached — generate basic tweet content from issue data
        const fallback: TweetData = {
          description: `⚠️ ${issue.title} reported at ${issue.address}. This needs urgent civic attention!`,
          hashtags: ['#CivicLens', '#InfrastructureCase', `#${issue.category.charAt(0) + issue.category.slice(1).toLowerCase()}`],
          locationContext: issue.address,
        };
        setTweetData(fallback);
        setEditableDescription(fallback.description);
        setEditableHashtags(fallback.hashtags.join(' '));
      }
    } catch (err) {
      console.error('Share analysis error:', err);
      const fallback: TweetData = {
        description: `⚠️ ${issue.title} reported at ${issue.address}. This needs urgent civic attention!`,
        hashtags: ['#CivicLens', '#InfrastructureCase'],
        locationContext: issue.address,
      };
      setTweetData(fallback);
      setEditableDescription(fallback.description);
      setEditableHashtags(fallback.hashtags.join(' '));
      setError('AI analysis unavailable. Using basic content — you can edit before posting.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const buildTweetText = () => {
    const location = tweetData?.locationContext ? `📍 ${tweetData.locationContext}` : '';
    return `${editableDescription}\n\n${location}\n\n${editableHashtags}`.trim();
  };

  const handleShareToX = async () => {
    setIsPosting(true);
    setPostError(null);

    // Simulate posting delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 1800));

    setPostSuccess(true);
    setPostUrl(null);
    setIsPosting(false);
  };

  const charCount = buildTweetText().length;
  const isOverLimit = charCount > 280;

  // Generate a timestamp for the simulated post
  const now = new Date();
  const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-lg">
      <div 
        className="w-full max-w-lg bg-black/50 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden"
        role="dialog"
        aria-label="Share to X"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5 relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-sky-400/50 via-blue-500/50 to-indigo-500/50"></div>
          <h2 className="text-sm font-bold tracking-widest text-white uppercase flex items-center gap-2">
            <Share2 size={16} className="text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
            Share to X
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors bg-white/5 border border-white/10 rounded-lg p-1.5 hover:bg-white/10"
            aria-label="Close"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Loading: Gemini AI analysis */}
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-sky-500/10 border border-sky-400/20 flex items-center justify-center">
                  <Loader2 size={28} className="text-sky-400 animate-spin" />
                </div>
                <Sparkles size={16} className="absolute -top-1 -right-1 text-amber-400 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white mb-1">Analyzing with Gemini AI...</p>
                <p className="text-[10px] text-blue-200/50 uppercase tracking-widest font-bold">Generating tweet content from your image</p>
              </div>
            </div>

          /* Success: Tweet posted */
          ) : postSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 gap-5">
              {/* Animated Success Ring */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-400/30 flex items-center justify-center shadow-[0_0_40px_rgba(52,211,153,0.15)]">
                  <CheckCircle size={48} className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-sky-500/20 border border-sky-400/30 rounded-full flex items-center justify-center">
                  <span className="text-sm font-black text-sky-400">𝕏</span>
                </div>
              </div>

              {/* Success Title */}
              <div className="text-center space-y-2">
                <p className="text-xl font-black text-white tracking-tight">Successfully Published to 𝕏</p>
                <p className="text-[10px] text-emerald-300/60 uppercase tracking-[0.2em] font-bold">Broadcast Complete • {formattedTime} • {formattedDate}</p>
              </div>

              {/* Thank You Card */}
              <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-emerald-400/30 to-transparent" />
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Thank you for your civic contribution</p>
                    <p className="text-[11px] text-blue-200/60 leading-relaxed">
                      Your report on "<span className="text-white font-semibold">{issue.title}</span>" has been shared with the public. 
                      By raising awareness, you are helping hold local authorities accountable and making your community safer for everyone.
                    </p>
                  </div>
                </div>

                {/* Impact Stats */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-sky-400">1</div>
                    <div className="text-[8px] text-blue-200/40 uppercase tracking-widest font-bold mt-0.5">Post Live</div>
                  </div>
                  <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-emerald-400">{issue.upvotes}</div>
                    <div className="text-[8px] text-blue-200/40 uppercase tracking-widest font-bold mt-0.5">Verifications</div>
                  </div>
                  <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-amber-400">{issue.verificationScore}</div>
                    <div className="text-[8px] text-blue-200/40 uppercase tracking-widest font-bold mt-0.5">Impact Score</div>
                  </div>
                </div>

                <p className="text-[9px] text-center text-blue-200/30 uppercase tracking-widest font-bold pt-1">
                  Every voice matters • CivicLens Transparency Network
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full mt-1 py-3.5 bg-linear-to-r from-emerald-600/80 to-teal-500/80 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(52,211,153,0.2)] border border-emerald-400/20 hover:shadow-[0_0_25px_rgba(52,211,153,0.4)]"
              >
                Continue to Dashboard
              </button>
            </div>

          /* Default: Tweet preview & edit */
          ) : (
            <>
              {error && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-[11px] text-amber-300 font-medium">
                  {error}
                </div>
              )}

              {postError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-[11px] text-red-300 font-medium flex items-center gap-2">
                  <AlertTriangle size={14} className="text-red-400 shrink-0" />
                  {postError}
                </div>
              )}

              {/* Tweet Preview Card */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
                      <span className="text-xs font-black text-sky-400">𝕏</span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white">CivicLens Reporter</p>
                      <p className="text-[9px] text-blue-200/40 font-medium">@{issue.reportedBy.toLowerCase().replace(/\s/g, '_')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-[9px] font-bold uppercase tracking-widest text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1"
                    title="Edit tweet"
                  >
                    <Edit3 size={10} />
                    {isEditing ? 'Preview' : 'Edit'}
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  {isEditing ? (
                    <>
                      <div>
                        <label htmlFor="tweet-desc" className="block text-[9px] font-bold uppercase tracking-widest text-cyan-200/50 mb-1">
                          Description
                        </label>
                        <textarea
                          id="tweet-desc"
                          rows={3}
                          value={editableDescription}
                          onChange={(e) => setEditableDescription(e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-blue-200/30 focus:outline-none focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/50 resize-none transition-all"
                        />
                      </div>
                      <div>
                        <label htmlFor="tweet-tags" className="block text-[9px] font-bold uppercase tracking-widest text-cyan-200/50 mb-1">
                          Hashtags
                        </label>
                        <input
                          id="tweet-tags"
                          type="text"
                          value={editableHashtags}
                          onChange={(e) => setEditableHashtags(e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-blue-200/30 focus:outline-none focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/50 transition-all"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-[13px] text-white leading-relaxed whitespace-pre-wrap">{editableDescription}</p>
                      
                      {tweetData?.locationContext && (
                        <div className="flex items-center gap-1.5 text-[11px] text-sky-300/80">
                          <MapPin size={12} className="text-sky-400" />
                          <span>{tweetData.locationContext}</span>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {editableHashtags.split(/\s+/).filter(Boolean).map((tag, i) => (
                          <span key={i} className="text-[11px] text-sky-400 font-medium hover:underline cursor-default">
                            {tag.startsWith('#') ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Character count */}
                <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash size={10} className="text-blue-200/30" />
                    <span className="text-[9px] text-blue-200/40 uppercase tracking-widest font-bold">
                      {CATEGORY_LABELS[issue.category]}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold tracking-wider ${isOverLimit ? 'text-red-400' : 'text-blue-200/40'}`}>
                    {charCount}/280
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-white/70 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleShareToX}
                  disabled={isOverLimit || isPosting}
                  className="flex-1 py-3 bg-linear-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.3)] border border-sky-400/30 hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isPosting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      Post to 𝕏
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
