import { Issue, User } from '../types';
import { STATUS_LABELS, CATEGORY_LABELS } from '../constants';
import { ThumbsUp, Activity, FileText, Trash2, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface CitizenDashboardProps {
  user: User;
  issues: Issue[];
  onDelete?: (id: string) => void;
}

export default function CitizenDashboard({ user, issues, onDelete }: CitizenDashboardProps) {
  const myReports = issues.filter(i => i.reportedByUid === user.uid || (i.reportedBy === user.name && !i.reportedByUid));
  const totalConfirmations = myReports.reduce((sum, issue) => sum + issue.upvotes, 0);
  const resolvedCount = myReports.filter(i => i.status === 'RESOLVED').length;

  return (
    <div className="flex-1 overflow-y-auto p-6 relative z-10 w-full h-full">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.37)] flex items-start justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-cyan-400/30 to-transparent" />
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome, {user.name}</h1>
            <p className="text-sm text-blue-200/70 mt-2 font-medium">Your civic engagement profile and reporting history.</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/70">Reports synced with Firebase</span>
            </div>
          </div>
          <div className="bg-black/40 border border-white/10 px-6 py-4 rounded-xl flex flex-col items-center justify-center backdrop-blur-md shadow-inner">
            <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-200/60 mb-1">Verif. Score</span>
            <span className="text-3xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">{user.score || 0}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.2)] flex items-center gap-5 hover:bg-white/10 transition-colors">
            <div className="w-14 h-14 bg-blue-500/20 text-blue-400 border border-blue-400/30 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.3)]"><FileText size={28} /></div>
            <div>
              <div className="text-3xl font-black text-white">{myReports.length}</div>
              <div className="text-[10px] uppercase font-bold text-blue-200/60 tracking-widest mt-1">Issues Reported</div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.2)] flex items-center gap-5 hover:bg-white/10 transition-colors">
            <div className="w-14 h-14 bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.3)]"><ThumbsUp size={28} /></div>
            <div>
              <div className="text-3xl font-black text-white">{totalConfirmations}</div>
              <div className="text-[10px] uppercase font-bold text-cyan-200/60 tracking-widest mt-1">Community Confirmations</div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.2)] flex items-center gap-5 hover:bg-white/10 transition-colors">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(52,211,153,0.3)]"><Activity size={28} /></div>
            <div>
              <div className="text-3xl font-black text-white">{resolvedCount}</div>
              <div className="text-[10px] uppercase font-bold text-emerald-200/60 tracking-widest mt-1">Issues Resolved</div>
            </div>
          </div>
        </div>

        {/* My Logs Table */}
        <div className="bg-black/40 border border-white/10 backdrop-blur-2xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
              <Activity size={18} className="text-cyan-400" /> My Logs
            </h2>
          </div>
          {myReports.length === 0 ? (
            <div className="p-16 text-center text-blue-200/50 text-sm font-medium">
              You haven't reported any infrastructure cases yet.<br />Return to the Map view to log an issue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-blue-200/60 border-b border-white/10">
                  <tr>
                    <th className="p-5">ID</th><th className="p-5">Title / Location</th><th className="p-5">Category</th>
                    <th className="p-5">Status</th><th className="p-5">Confirmations</th><th className="p-5">Reported On</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {myReports.map(issue => (
                    <tr key={issue.id} className="group hover:bg-white/5 border-l-2 border-l-transparent hover:border-l-cyan-400 transition-colors">
                      <td className="p-5 font-mono text-xs text-blue-200/50">#{issue.id.slice(0, 6)}</td>
                      <td className="p-5">
                        <div className="font-bold text-white tracking-wide">{issue.title}</div>
                        <div className="text-xs text-blue-200/60 truncate max-w-[200px] mt-1">{issue.address}</div>
                        {issue.civicQuote && <div className="text-[9px] text-cyan-400/60 italic mt-1.5 truncate max-w-[200px]">"{issue.civicQuote}"</div>}
                      </td>
                      <td className="p-5"><span className="text-[9px] bg-white/5 border border-white/10 px-2 py-1 rounded font-bold uppercase tracking-widest text-blue-200/80">{CATEGORY_LABELS[issue.category]}</span></td>
                      <td className="p-5">
                        <span className={cn("text-[9px] px-2 py-1 rounded font-bold uppercase tracking-widest border shadow-sm",
                          issue.status === 'VERIFIED_GHOST' ? "bg-red-500/20 text-red-300 border-red-500/30" : issue.status === 'RESOLVED' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        )}>{STATUS_LABELS[issue.status]}</span>
                      </td>
                      <td className="p-5 text-sm font-bold text-cyan-400">{issue.upvotes}</td>
                      <td className="p-5 text-xs text-blue-200/60 font-medium">{issue.createdAt instanceof Date ? issue.createdAt.toLocaleDateString() : new Date(issue.createdAt).toLocaleDateString()}</td>
                      <td className="p-5 text-right">
                        <button onClick={() => onDelete?.(issue.id)} className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Delete Report"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
