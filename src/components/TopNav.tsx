import { User } from '../types';
import { LogOut, Map, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

interface TopNavProps {
  user: User;
  activeView: 'MAP' | 'DASHBOARD';
  onViewChange: (view: 'MAP' | 'DASHBOARD') => void;
  onLogout: () => void;
}

export default function TopNav({ user, activeView, onViewChange, onLogout }: TopNavProps) {
  return (
    <div className="h-14 backdrop-blur-3xl bg-white/5 border-b border-white/10 flex items-center justify-between px-4 shrink-0 text-white select-none z-50 relative">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-500 rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.5)]">
             <ShieldCheck size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm tracking-widest uppercase hidden md:inline-block">CivicLens</span>
        </div>
        
        <div className="flex bg-black/40 rounded-full p-1 border border-white/10 backdrop-blur-sm">
          <button
            onClick={() => onViewChange('MAP')}
            className={cn(
              "px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5 transition-all",
              activeView === 'MAP' ? "bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-white/20" : "text-white/50 hover:text-white border border-transparent"
            )}
          >
            <Map size={12} /> Live Map
          </button>
          <button
            onClick={() => onViewChange('DASHBOARD')}
            className={cn(
              "px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5 transition-all",
              activeView === 'DASHBOARD' ? "bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-white/20" : "text-white/50 hover:text-white border border-transparent"
            )}
          >
            <LayoutDashboard size={12} /> {user.role === 'GOVERNMENT' ? 'Ops Center' : 'My Dashboard'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-bold text-white">{user.name}</span>
          <span className="text-[9px] text-cyan-200/70 font-bold uppercase tracking-widest">
            {user.role === 'GOVERNMENT' ? `Official / ${user.department}` : `Citizen / ${user.role}`}
          </span>
        </div>
        
        <button 
          onClick={onLogout}
          className="p-1.5 bg-black/40 border border-white/10 text-white/50 rounded-full hover:text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-inner"
          title="Logout"
          aria-label="Logout"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
