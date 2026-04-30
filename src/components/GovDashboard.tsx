import { Issue, User } from '../types';
import { STATUS_LABELS, CATEGORY_LABELS } from '../constants';
import { ShieldCheck, CheckCircle, AlertTriangle, Hammer, Clock, Gauge } from 'lucide-react';
import { cn } from '../lib/utils';

/** Safely convert Firestore Timestamp or Date to a Date object */
function toDate(value: any): Date {
  if (value instanceof Date) return value;
  if (value?.toDate) return value.toDate(); // Firestore Timestamp
  return new Date(value);
}
import { formatDistanceToNow } from 'date-fns';

interface GovDashboardProps {
  user: User;
  issues: Issue[];
  onResolve: (issue: Issue) => void;
}

function SeverityBadge({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <div className="w-16 h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              score >= 7 ? "bg-gradient-to-r from-red-500 to-rose-400" :
              score >= 4 ? "bg-gradient-to-r from-amber-500 to-yellow-400" :
              "bg-gradient-to-r from-emerald-500 to-teal-400"
            )}
            style={{ width: `${(score / 10) * 100}%` }}
          />
        </div>
        <span className={cn(
          "text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border",
          score >= 7 ? "bg-red-500/20 text-red-300 border-red-500/30 shadow-[0_0_10px_rgba(248,113,113,0.2)]" :
          score >= 4 ? "bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]" :
          "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.2)]"
        )}>
          {score >= 7 ? '⚠️' : score >= 4 ? '⚡' : '✓'} {score}/10
        </span>
      </div>
    </div>
  );
}

export default function GovDashboard({ user, issues, onResolve }: GovDashboardProps) {
  const verifiedGhosts = issues.filter(i => i.status === 'VERIFIED_GHOST');
  const resolvedIssues = issues.filter(i => i.status === 'RESOLVED');
  const openIssues = issues.filter(i => i.status === 'OPEN');

  // Calculate average severity across all non-resolved issues that have a score
  const issuesWithSeverity = issues.filter(i => i.severityScore && i.status !== 'RESOLVED');
  const avgSeverity = issuesWithSeverity.length > 0
    ? (issuesWithSeverity.reduce((sum, i) => sum + (i.severityScore || 0), 0) / issuesWithSeverity.length).toFixed(1)
    : '—';

  // Sort priority queue: severity first (desc), then verification score as tiebreaker
  const sortedQueue = [...verifiedGhosts].sort((a, b) => {
    const sevDiff = (b.severityScore || 0) - (a.severityScore || 0);
    if (sevDiff !== 0) return sevDiff;
    return (b.verificationScore || 0) - (a.verificationScore || 0);
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 relative z-10 w-full h-full">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header section */}
        <div className="bg-black/40 backdrop-blur-2xl border border-emerald-500/30 rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-start md:items-center justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ShieldCheck size={180} className="text-emerald-500" />
          </div>
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-emerald-400/50 to-transparent"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck size={20} className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
              <h1 className="text-sm font-bold tracking-widest text-emerald-300/80 uppercase">Admin Operations</h1>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-white">{user.department}</h2>
            <p className="text-xs text-emerald-200/50 font-bold uppercase tracking-widest">
              Authorized Agent: <span className="text-white">{user.name}</span> | {user.email}
            </p>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border-l-[6px] border-l-amber-500 border-t border-t-white/10 border-r border-r-white/10 border-b border-b-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-between hover:bg-white/10 transition-colors">
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-200/70 tracking-widest mb-1 shadow-transparent">Open Reports</div>
              <div className="text-4xl font-black text-white">{openIssues.length}</div>
            </div>
            <Clock className="text-amber-500/30" size={48} />
          </div>

          <div className="bg-white/5 backdrop-blur-xl border-l-[6px] border-l-red-500 border-t border-t-white/10 border-r border-r-white/10 border-b border-b-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-between hover:bg-white/10 transition-colors">
            <div>
              <div className="text-[10px] uppercase font-bold text-red-200/70 tracking-widest mb-1">Critical Cases</div>
              <div className="text-4xl font-black text-white">{verifiedGhosts.length}</div>
            </div>
            <AlertTriangle className="text-red-500/30" size={48} />
          </div>

          <div className="bg-white/5 backdrop-blur-xl border-l-[6px] border-l-emerald-500 border-t border-t-white/10 border-r border-r-white/10 border-b border-b-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-between hover:bg-white/10 transition-colors">
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-200/70 tracking-widest mb-1">Resolved Utilities</div>
              <div className="text-4xl font-black text-white">{resolvedIssues.length}</div>
            </div>
            <CheckCircle className="text-emerald-500/30" size={48} />
          </div>

          {/* NEW: Average Severity Stat */}
          <div className="bg-white/5 backdrop-blur-xl border-l-[6px] border-l-violet-500 border-t border-t-white/10 border-r border-r-white/10 border-b border-b-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-between hover:bg-white/10 transition-colors">
            <div>
              <div className="text-[10px] uppercase font-bold text-violet-200/70 tracking-widest mb-1">Avg Severity</div>
              <div className="text-4xl font-black text-white">{avgSeverity}<span className="text-lg text-violet-300/50">/10</span></div>
            </div>
            <Gauge className="text-violet-500/30" size={48} />
          </div>
        </div>

        {/* Action Priority Queue — now sorted by severity */}
        <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-red-500/10 flex items-center justify-between relative">
            <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-red-500/50 to-transparent"></div>
            <h2 className="text-sm font-bold text-red-400 uppercase tracking-widest flex items-center gap-3 drop-shadow-[0_0_10px_rgba(248,113,113,0.3)]">
              <AlertTriangle size={18} className="text-red-500" /> Action Priority Queue
            </h2>
            <span className="text-[9px] text-blue-200/40 font-bold uppercase tracking-widest">Sorted by AI Severity → Verification</span>
          </div>

          {sortedQueue.length === 0 ? (
            <div className="p-16 text-center text-blue-200/50 text-sm font-medium">
              No critical infrastructure cases registered at this time.
            </div>
          ) : (
            <div className="grid grid-cols-1 divide-y divide-white/10">
              {sortedQueue.map(issue => (
                <div key={issue.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/5 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-[10px] font-bold text-blue-200/50 uppercase tracking-widest">ID: {issue.id.slice(0, 6)}</span>
                      <span className="text-[9px] bg-white/10 border border-white/20 px-2 py-1 rounded font-bold uppercase tracking-widest text-blue-200/80">
                        {CATEGORY_LABELS[issue.category]}
                      </span>
                      <span className="text-[9px] bg-red-500/20 text-red-300 font-bold px-2 py-1 rounded uppercase tracking-widest border border-red-500/30 shadow-[0_0_15px_rgba(248,113,113,0.2)]">
                        Verification: {issue.verificationScore || issue.upvotes}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-lg tracking-tight mb-2">{issue.title}</h3>
                    
                    {/* Severity Badge Row */}
                    {issue.severityScore ? (
                      <div className="mb-3">
                        <div className="text-[9px] font-bold text-blue-200/40 uppercase tracking-widest mb-1.5">AI Severity Assessment</div>
                        <SeverityBadge score={issue.severityScore} />
                      </div>
                    ) : (
                      <div className="mb-3 text-[9px] text-blue-200/30 italic uppercase tracking-widest">No AI severity data</div>
                    )}

                    <p className="text-sm text-blue-200/60 mb-3">{issue.address}</p>
                    <p className="text-xs text-blue-200/80 italic line-clamp-1 border-l-2 border-cyan-500/50 pl-3">"{issue.description}"</p>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-4">
                    <div className="text-[10px] font-bold uppercase text-blue-200/50 tracking-widest flex items-center gap-1.5">
                      <Clock size={12} /> Reported {formatDistanceToNow(toDate(issue.createdAt))} ago
                    </div>
                    <button
                      onClick={() => onResolve(issue)}
                      className="px-6 py-3 bg-linear-to-r from-emerald-600 to-teal-400 hover:from-emerald-500 hover:to-teal-300 text-white rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.4)] border border-emerald-400/30 group transition-all"
                    >
                      <Hammer size={14} className="group-hover:-rotate-12 transition-transform" /> Log Resolution
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
