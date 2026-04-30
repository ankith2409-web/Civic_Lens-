import { Issue } from '../types';
import { X, ExternalLink, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { RESPONSIBLE_BODIES } from '../constants';

interface ResolveModalProps {
  issue: Issue;
  onClose: () => void;
  onSubmit: (id: string, response: string, workLogUrl: string) => void;
}

export default function ResolveModal({ issue, onClose, onSubmit }: ResolveModalProps) {
  const [response, setResponse] = useState(issue.officialResponse || '');
  const [workLogUrl, setWorkLogUrl] = useState(issue.workLogUrl || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(issue.id, response, workLogUrl);
  };

  const department = RESPONSIBLE_BODIES[issue.category];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div 
        className="w-full max-w-lg bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-emerald-400/50 to-teal-500/50"></div>
          <h2 className="text-sm font-bold tracking-widest text-emerald-100 uppercase flex items-center gap-2 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
            Government Resolution Portal
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
        
        <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto">
          <div className="mb-6 bg-emerald-500/10 p-5 rounded-xl border border-emerald-500/30 shadow-inner relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-10">
               <CheckCircle size={64} className="text-emerald-400" />
             </div>
             <div className="relative z-10">
               <div className="text-[10px] uppercase font-bold text-emerald-200/70 tracking-widest mb-2">Acting Department</div>
               <div className="text-xs font-bold text-emerald-100 border border-emerald-500/40 bg-black/20 px-3 py-2 rounded-lg shadow-inner inline-block backdrop-blur-sm">
                 {department}
               </div>
               
               <div className="mt-5 text-[10px] uppercase font-bold text-emerald-200/70 tracking-widest mb-1">Issue Target</div>
               <div className="text-sm font-bold text-white">
                 {issue.title} <span className="font-normal text-emerald-200/50 text-xs">({issue.id.slice(0, 6)})</span>
               </div>
             </div>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="official-response" className="block text-[10px] uppercase font-bold text-emerald-200/70 tracking-widest mb-2 cursor-pointer">
                Official Response / Statement <span className="text-emerald-400">*</span>
              </label>
              <textarea 
                id="official-response"
                required
                placeholder="Detail the work performed, reason for delay, or upcoming fix..."
                className="w-full h-28 p-4 text-sm text-white bg-white/5 border border-white/10 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all shadow-inner placeholder-blue-200/30"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="work-log-url" className="block text-[10px] uppercase font-bold text-emerald-200/70 tracking-widest mb-2 cursor-pointer">
                Work Log / Ticket URL (Optional)
              </label>
              <div className="relative">
                <input 
                  id="work-log-url"
                  type="url"
                  placeholder="https://citygov.domain/tickets/___"
                  className="w-full p-3.5 pl-10 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all shadow-inner placeholder-blue-200/30"
                  value={workLogUrl}
                  onChange={(e) => setWorkLogUrl(e.target.value)}
                />
                <ExternalLink size={16} className="absolute left-3.5 top-3.5 text-emerald-400/50" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8 pt-6 border-t border-white/10">
             <button
               type="button"
               onClick={onClose}
               className="flex-[0.35] py-3.5 bg-white/5 border border-white/10 text-white/70 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-white/10 hover:text-white transition-all"
             >
               Cancel
             </button>
             <button
               type="submit"
               className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-linear-to-r from-emerald-600 to-teal-400 hover:from-emerald-500 hover:to-teal-300 text-white rounded-xl text-xs font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(52,211,153,0.4)] border border-emerald-400/30 group"
             >
               <CheckCircle size={16} className="group-hover:scale-110 transition-transform" />
               Mark as Resolved & Publish
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
