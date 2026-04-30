import { useState } from 'react';
import { User } from '../types';
import { ShieldCheck, User as UserIcon, Mail, Lock, Upload, ArrowRight, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthLandingProps {
  onLogin: (user: User) => void;
}

export default function AuthLanding({ onLogin }: AuthLandingProps) {
  const [activeTab, setActiveTab] = useState<'CITIZEN' | 'GOVERNMENT'>('CITIZEN');

  // Citizen Form state
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPassword, setCPassword] = useState('');
  const [isVerifier, setIsVerifier] = useState(false);

  // Gov Form state
  const [gEmail, setGEmail] = useState('');
  const [gPassword, setGPassword] = useState('');
  const [gDept, setGDept] = useState('PWD / DPPW');

  // Shared state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatAuthError = (code: string): string => {
    const messages: Record<string, string> = {
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/user-not-found': 'No account found. Creating a new one...',
      'auth/email-already-in-use': 'Email already registered. Try logging in.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
      'auth/network-request-failed': 'Network error. Check your connection.',
    };
    return messages[code] || 'Authentication failed. Please try again.';
  };

  const handleCitizenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !cEmail || !cPassword) return;
    setLoading(true);
    setError('');

    const role = isVerifier ? 'VERIFIER' : 'REPORTER';
    const score = isVerifier ? 150 : 15;

    try {
      // Try signing in first
      let firebaseUser;
      try {
        const cred = await signInWithEmailAndPassword(auth, cEmail, cPassword);
        firebaseUser = cred.user;
      } catch (signInErr: any) {
        if (
          signInErr.code === 'auth/user-not-found' ||
          signInErr.code === 'auth/invalid-credential'
        ) {
          // New user — register them
          const cred = await createUserWithEmailAndPassword(auth, cEmail, cPassword);
          firebaseUser = cred.user;
          await updateProfile(firebaseUser, { displayName: cName });
          // Persist user profile to Firestore
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            name: cName,
            email: cEmail,
            role,
            score,
            createdAt: new Date().toISOString(),
          });
        } else {
          throw signInErr;
        }
      }

      // Fetch profile from Firestore (in case existing user)
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      const profile = snap.exists() ? snap.data() : null;

      onLogin({
        uid: firebaseUser.uid,
        name: profile?.name || firebaseUser.displayName || cName,
        email: firebaseUser.email!,
        role: profile?.role || role,
        score: profile?.score ?? score,
      });
    } catch (err: any) {
      setError(formatAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGovLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gEmail || !gPassword) return;
    setLoading(true);
    setError('');

    try {
      let firebaseUser;
      try {
        const cred = await signInWithEmailAndPassword(auth, gEmail, gPassword);
        firebaseUser = cred.user;
      } catch (signInErr: any) {
        if (
          signInErr.code === 'auth/user-not-found' ||
          signInErr.code === 'auth/invalid-credential'
        ) {
          const cred = await createUserWithEmailAndPassword(auth, gEmail, gPassword);
          firebaseUser = cred.user;
          const govName = gEmail.split('@')[0].replace('.', ' ');
          await updateProfile(firebaseUser, { displayName: govName });
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            name: govName,
            email: gEmail,
            role: 'GOVERNMENT',
            department: gDept,
            createdAt: new Date().toISOString(),
          });
        } else {
          throw signInErr;
        }
      }

      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      const profile = snap.exists() ? snap.data() : null;
      const govName = gEmail.split('@')[0].replace('.', ' ');

      onLogin({
        uid: firebaseUser.uid,
        name: profile?.name || govName,
        email: firebaseUser.email!,
        role: 'GOVERNMENT',
        department: profile?.department || gDept,
      });
    } catch (err: any) {
      setError(formatAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex flex-col items-center justify-start p-4 xl:p-8 font-sans selection:bg-cyan-500/30 selection:text-white">

      {/* Deep Space / Glowing Abstract Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-purple-700/20 blur-[130px] rounded-full mix-blend-screen" />
        <div className="absolute top-[30%] right-[10%] w-[40vw] h-[40vw] bg-cyan-400/10 blur-[100px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-slate-950/50 to-slate-950/80" />
      </div>

      <div className="w-full max-w-5xl relative z-10 flex flex-col gap-6 my-auto">

        {/* Floating Top Tabs */}
        <div className="self-center flex items-center p-1.5 rounded-full backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
          <button
            onClick={() => { setActiveTab('CITIZEN'); setError(''); }}
            className={cn(
              "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300",
              activeTab === 'CITIZEN'
                ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/20"
                : "text-slate-400 hover:text-white border border-transparent"
            )}
          >
            Citizen Portal
          </button>
          <button
            onClick={() => { setActiveTab('GOVERNMENT'); setError(''); }}
            className={cn(
              "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300",
              activeTab === 'GOVERNMENT'
                ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/20"
                : "text-slate-400 hover:text-white border border-transparent"
            )}
          >
            Government Portal
          </button>
        </div>

        {/* Dual Panel Composition Container */}
        <div className="flex flex-col md:flex-row items-stretch justify-center relative w-full pt-4 pb-4">

          {/* Left Glass Pane (Title & App Pitch) */}
          <div className="w-full md:w-[45%] lg:w-[40%] backdrop-blur-2xl bg-white/5 border border-white/20 rounded-4xl p-10 lg:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.37)] relative overflow-hidden flex flex-col justify-center z-10">
            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/40 to-transparent" />
            <div className="absolute -inset-full bg-linear-to-br from-white/10 via-transparent to-transparent opacity-50 blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.6)] mb-8 animate-pulse text-white">
                <ShieldCheck size={28} />
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-6">
                CIVIC <br className="hidden md:block"/> LENS
              </h1>
              <p className="text-blue-100/70 text-sm leading-relaxed font-medium">
                An enterprise platform bridging the gap between official records and ground truth. Report, verify, and resolve critical utility failures.
              </p>
              <div className="mt-8 flex items-center gap-2 text-[10px] font-bold text-cyan-400/60 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Secured by Firebase
              </div>
            </div>
          </div>

          {/* Right Glass Pane (Forms) */}
          <div className="w-full md:w-[65%] lg:w-[50%] backdrop-blur-3xl bg-black/40 border border-white/10 rounded-4xl p-8 lg:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] md:-ml-8 z-20 mt-8 md:mt-0 relative max-h-[85vh] overflow-y-auto">
            <div className="absolute top-0 left-10 right-10 h-px bg-linear-to-r from-transparent via-cyan-400/30 to-transparent" />

            {/* Global Error Banner */}
            {error && (
              <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm font-medium">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            {activeTab === 'CITIZEN' ? (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500 h-full flex flex-col justify-center">
                <h2 className="text-2xl font-bold text-white tracking-tight mb-8">Citizen Login</h2>

                <form onSubmit={handleCitizenLogin} className="space-y-5">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-cyan-200/70 tracking-widest mb-2">Full Name</label>
                    <div className="relative group">
                      <UserIcon size={18} className="absolute left-4 top-3.5 text-blue-200/50 group-focus-within:text-cyan-400 transition-colors" />
                      <input
                        required
                        type="text"
                        placeholder="Jane Doe"
                        className="w-full pl-12 p-3.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/60 focus:bg-white/10 outline-none transition-all placeholder:text-blue-200/40 font-medium shadow-inner"
                        value={cName}
                        onChange={e => setCName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-cyan-200/70 tracking-widest mb-2">Email Address</label>
                    <div className="relative group">
                      <Mail size={18} className="absolute left-4 top-3.5 text-blue-200/50 group-focus-within:text-cyan-400 transition-colors" />
                      <input
                        required
                        type="email"
                        placeholder="jane@example.com"
                        className="w-full pl-12 p-3.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/60 focus:bg-white/10 outline-none transition-all placeholder:text-blue-200/40 font-medium shadow-inner"
                        value={cEmail}
                        onChange={e => setCEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-cyan-200/70 tracking-widest mb-2">Password</label>
                    <div className="relative group">
                      <Lock size={18} className="absolute left-4 top-3.5 text-blue-200/50 group-focus-within:text-cyan-400 transition-colors" />
                      <input
                        required
                        type="password"
                        placeholder="Min. 6 characters"
                        className="w-full pl-12 p-3.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/60 focus:bg-white/10 outline-none transition-all placeholder:text-blue-200/40 font-medium shadow-inner"
                        value={cPassword}
                        onChange={e => setCPassword(e.target.value)}
                      />
                    </div>
                    <p className="text-[10px] text-blue-200/40 mt-1.5 pl-1">New to CivicLens? An account is created automatically.</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-colors">
                    <label className="flex items-start gap-4 cursor-pointer group">
                      <div className="relative flex items-center justify-center mt-0.5">
                        <input
                          type="checkbox"
                          className="peer appearance-none w-5 h-5 border-2 border-white/30 rounded bg-black/20 checked:bg-cyan-500 checked:border-cyan-400 transition-all cursor-pointer"
                          checked={isVerifier}
                          onChange={e => setIsVerifier(e.target.checked)}
                        />
                        <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-cyan-100 transition-colors">Enlist as Community Verifier</div>
                        <div className="text-[10px] text-blue-200/60 uppercase tracking-widest mt-1.5">Grants +5/-5 vote weighting privileges</div>
                      </div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-linear-to-r from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 disabled:opacity-60 disabled:cursor-not-allowed text-white p-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(34,211,238,0.3)] border border-cyan-400/30 hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] group"
                  >
                    {loading ? (
                      <><Loader2 size={18} className="animate-spin" /> Authenticating...</>
                    ) : (
                      <>Access Portal <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500 h-full flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-5">
                  <ShieldCheck size={28} className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                  <h2 className="text-2xl font-bold text-white tracking-tight">Official Login</h2>
                </div>

                <form onSubmit={handleGovLogin} className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-emerald-200/70 tracking-widest mb-2">Government Email</label>
                    <div className="relative group">
                      <Mail size={18} className="absolute left-4 top-3.5 text-blue-200/50 group-focus-within:text-emerald-400 transition-colors" />
                      <input
                        required
                        type="email"
                        placeholder="official@city.gov"
                        className="w-full pl-12 p-3.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/60 focus:bg-white/10 outline-none transition-all placeholder:text-blue-200/40 font-medium shadow-inner"
                        value={gEmail}
                        onChange={e => setGEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-emerald-200/70 tracking-widest mb-2">Password</label>
                    <div className="relative group">
                      <Lock size={18} className="absolute left-4 top-3.5 text-blue-200/50 group-focus-within:text-emerald-400 transition-colors" />
                      <input
                        required
                        type="password"
                        placeholder="Min. 6 characters"
                        className="w-full pl-12 p-3.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/60 focus:bg-white/10 outline-none transition-all placeholder:text-blue-200/40 font-medium shadow-inner"
                        value={gPassword}
                        onChange={e => setGPassword(e.target.value)}
                      />
                    </div>
                    <p className="text-[10px] text-blue-200/40 mt-1.5 pl-1">First login? An account is provisioned automatically.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="dept-select" className="block text-[10px] uppercase font-bold text-emerald-200/70 tracking-widest mb-2">Department</label>
                      <div className="relative">
                        <select
                          id="dept-select"
                          className="w-full p-3 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/60 focus:bg-white/10 outline-none transition-all appearance-none cursor-pointer font-medium shadow-inner"
                          value={gDept}
                          onChange={e => setGDept(e.target.value)}
                        >
                          <option className="bg-slate-900" value="PWD / DPPW">PWD / DPPW</option>
                          <option className="bg-slate-900" value="Municipal Corporation">Municipal Corp.</option>
                          <option className="bg-slate-900" value="Parks Department">Parks Dept.</option>
                          <option className="bg-slate-900" value="Electricity Board">Electricity Board</option>
                          <option className="bg-slate-900" value="Sanitation Department">Sanitation Dept.</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-emerald-400/50">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-emerald-200/70 tracking-widest mb-2">Credential Upload</label>
                      <div className="w-full h-[42px] border-2 border-dashed border-white/20 rounded-xl bg-white/5 transition-all group flex items-center justify-center gap-2 px-3 opacity-50 cursor-not-allowed" title="Feature coming soon">
                        <Upload size={16} className="text-white/40 shrink-0" />
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Coming Soon</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-linear-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-60 disabled:cursor-not-allowed text-white p-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(52,211,153,0.3)] border border-emerald-400/30 hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] group"
                  >
                    {loading ? (
                      <><Loader2 size={18} className="animate-spin" /> Authenticating...</>
                    ) : (
                      <>Initialize Terminal <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
