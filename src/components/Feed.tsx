import { Issue, UserRole } from '../types';
import { STATUS_LABELS, CATEGORY_LABELS, RESPONSIBLE_BODIES } from '../constants';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Ghost, Mail, CheckCircle, ExternalLink, ShieldCheck, Check, Flag, Share2, Quote } from 'lucide-react';
import { cn } from '../lib/utils';

/** Safely convert Firestore Timestamp or Date to a Date object */
function toDate(value: any): Date {
  if (value instanceof Date) return value;
  if (value?.toDate) return value.toDate(); // Firestore Timestamp
  return new Date(value);
}

interface FeedProps {
  issues: Issue[];
  selectedIssueId?: string | null;
  onSelectIssue: (id: string, lat: number, lng: number) => void;
  onUpvote: (id: string) => void;
  onDownvote: (id: string) => void;
  onDraftComplaint: (issue: Issue) => void;
  onResolve: (issue: Issue) => void;
  onShare: (issue: Issue) => void;
  userRole: UserRole;
  currentUserName: string;
}

export default function Feed({ issues, selectedIssueId, onSelectIssue, onUpvote, onDownvote, onDraftComplaint, onResolve, onShare, userRole, currentUserName }: FeedProps) {
  // Sort issues by VERIFIED_GHOST first, then by verificationScore
  const sortedIssues = [...issues].sort((a, b) => {
    if (a.status === 'VERIFIED_GHOST' && b.status !== 'VERIFIED_GHOST') return -1;
    if (b.status === 'VERIFIED_GHOST' && a.status !== 'VERIFIED_GHOST') return 1;
    return (b.verificationScore || 0) - (a.verificationScore || 0);
  });

  return (
    <div className="flex flex-col h-full bg-transparent overflow-y-auto">
      <div className="p-6 sticky top-0 bg-black/40 backdrop-blur-3xl z-10 border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2" /></svg>
          Verification Feed
        </h2>
        <div className="text-[10px] text-cyan-200/50 font-bold uppercase mt-2 tracking-widest">Data Integrity Monitor</div>
      </div>

      <div className="flex-1 p-6 space-y-4">
        {sortedIssues.map(issue => (
          <div 
            key={issue.id}
            onClick={() => onSelectIssue(issue.id, issue.location.lat, issue.location.lng)}
            className={cn(
              "p-5 rounded-2xl border-l-4 border-t border-r border-b cursor-pointer transition-all duration-300 group shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-md",
              issue.status === 'VERIFIED_GHOST' ? "border-l-red-500 bg-red-500/10 hover:bg-red-500/20 shadow-[0_0_15px_rgba(248,113,113,0.1)]" : issue.status === 'RESOLVED' ? "border-l-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20" : "border-l-amber-500 bg-white/5 hover:bg-white/10",
              selectedIssueId === issue.id ? "ring-1 ring-cyan-400/50 border-t-cyan-400/30 border-r-cyan-400/30 border-b-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]" : "border-t-white/10 border-r-white/10 border-b-white/10"
            )}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-blue-200/50 uppercase tracking-widest">ID: {issue.id.slice(0, 6)}</span>
                <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">Score: {issue.verificationScore || 0}</span>
                {issue.severityScore && (
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-widest flex items-center gap-1",
                    issue.severityScore >= 7 ? "text-red-400" :
                    issue.severityScore >= 4 ? "text-amber-400" :
                    "text-emerald-400"
                  )}>
                    Severity: {issue.severityScore}/10
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest border",
                issue.status === 'VERIFIED_GHOST' ? "bg-red-500/20 text-red-300 border-red-500/30" : issue.status === 'RESOLVED' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"
              )}>
                {STATUS_LABELS[issue.status]}
              </span>
            </div>
            
            <p className="text-sm font-bold text-white mb-2 flex items-center justify-between">
              <span className="truncate pr-2">{issue.title}</span>
              <span className="text-[9px] text-blue-200/80 bg-white/10 border border-white/20 px-2 py-0.5 rounded uppercase tracking-widest shrink-0">
                {CATEGORY_LABELS[issue.category]}
              </span>
            </p>
            
            <p className="text-[11px] text-blue-200/60 italic mb-3 line-clamp-2">
              "{issue.description}"
            </p>

            {issue.civicQuote && (
              <div className="mb-4 relative">
                <div className="absolute -left-1 top-0 opacity-10">
                  <Quote size={24} className="text-cyan-400" />
                </div>
                <p className="text-[10px] text-cyan-200/70 font-medium leading-relaxed pl-5 py-1 border-l border-cyan-500/20">
                  {issue.civicQuote}
                </p>
              </div>
            )}

            {issue.officialResponse && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-[10px]">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400 uppercase tracking-widest mb-2 mt-0.5 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
                  <ShieldCheck size={12} /> Official Government Response:
                </div>
                <p className="text-emerald-100/90 italic leading-snug">{issue.officialResponse}</p>
                {issue.workLogUrl && (
                  <a href={issue.workLogUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 mt-2 text-emerald-400 hover:text-emerald-300 font-bold underline decoration-emerald-500/50 underline-offset-4 transition-colors">
                    <ExternalLink size={12} /> View Work Log
                  </a>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <div className="flex flex-col gap-1 text-[10px] text-blue-200/50 font-bold uppercase tracking-widest w-full">
                <div className="flex items-center gap-1 text-blue-200/50 justify-between">
                  <div className="flex items-center gap-1">
                    <span className="truncate max-w-[140px] text-blue-200/80">{issue.address}</span>
                    <span className="opacity-30">|</span>
                    <Clock size={10} className="inline ml-1 mb-0.5" />
                    <span>{formatDistanceToNow(toDate(issue.createdAt))}</span>
                  </div>
                  <span>BY {issue.reportedBy}</span>
                </div>
              </div>
            </div>
              
            <div className="flex items-center gap-2 mt-3 w-full justify-between">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!issue.votes?.[currentUserName]) onUpvote(issue.id);
                    }}
                    disabled={!!issue.votes?.[currentUserName]}
                    title="Confirm broken"
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border shadow-sm",
                      issue.votes?.[currentUserName] === 'UP' || ((issue.verificationScore || 0) >= 50 && issue.status !== 'RESOLVED')
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.3)]" 
                        : "bg-white/5 text-blue-200/70 border-white/10 hover:bg-white/10 disabled:opacity-40"
                    )}
                  >
                    <Check size={14} strokeWidth={3} />
                    {issue.upvotes}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!issue.votes?.[currentUserName]) onDownvote(issue.id);
                    }}
                    disabled={!!issue.votes?.[currentUserName]}
                    title="Dispute"
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border shadow-sm",
                      issue.votes?.[currentUserName] === 'DOWN'
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                        : "bg-white/5 text-blue-200/70 border-white/10 hover:bg-white/10 disabled:opacity-40"
                    )}
                  >
                    <Flag size={14} strokeWidth={2.5} />
                    {issue.downvotes}
                  </button>
                </div>
                
                {userRole === 'GOVERNMENT' && issue.status !== 'RESOLVED' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onResolve(issue);
                    }}
                    className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 bg-linear-to-r from-emerald-600 to-teal-400 hover:from-emerald-500 hover:to-teal-300 text-white rounded-lg transition-all shadow-[0_0_15px_rgba(52,211,153,0.3)] border border-emerald-400/30"
                  >
                    <CheckCircle size={12} />
                    Resolve Issue
                  </button>
                )}

                {userRole !== 'GOVERNMENT' && issue.status !== 'RESOLVED' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDraftComplaint(issue);
                    }}
                    className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                  >
                    <Mail size={12} />
                    Draft Complaint ({RESPONSIBLE_BODIES[issue.category]})
                  </button>
                )}

                {issue.status !== 'RESOLVED' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(issue);
                    }}
                    title="Share to X"
                    className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 border border-sky-400/20 text-sky-400 rounded-lg hover:bg-sky-500/20 hover:border-sky-400/40 transition-all shadow-sm"
                  >
                    <Share2 size={12} />
                    Share
                  </button>
                )}
              </div>
          </div>
        ))}
        {issues.length === 0 && (
          <div className="text-center py-16 px-6">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
              <Ghost className="text-cyan-400/50" size={32} />
            </div>
            <h3 className="font-bold text-white mb-2 text-lg">No reports in this area</h3>
            <p className="text-sm text-blue-200/50 font-medium">Be the first to log broken infrastructure.</p>
          </div>
        )}
      </div>
    </div>
  );
}
