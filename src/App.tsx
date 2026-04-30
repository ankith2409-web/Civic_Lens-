import { useState, useCallback, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import GroundMap from './components/Map';
import Feed from './components/Feed';
import ReportModal from './components/ReportModal';
import AutoComplaintModal from './components/AutoComplaintModal';
import ResolveModal from './components/ResolveModal';
import ShareToXModal from './components/ShareToXModal';
import AuthLanding from './components/AuthLanding';
import TopNav from './components/TopNav';
import CitizenDashboard from './components/CitizenDashboard';
import GovDashboard from './components/GovDashboard';
import { INITIAL_ISSUES, LOCALITY_POPULATIONS, VERIFICATION_THRESHOLD_PERCENT } from './constants';
import { Issue, Location, User } from './types';
import { Plus, AlertCircle, TrendingUp, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [issues, setIssues] = useState<Issue[]>(INITIAL_ISSUES);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftingIssue, setDraftingIssue] = useState<Issue | null>(null);
  const [resolvingIssue, setResolvingIssue] = useState<Issue | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);

  // Share to X state
  const [sharingIssue, setSharingIssue] = useState<Issue | null>(null);
  const [sharingFile, setSharingFile] = useState<File | null>(null);

  // Auth & Routing state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'MAP' | 'DASHBOARD'>('MAP');
  const [authLoading, setAuthLoading] = useState(true); // true while checking session

  // ── Firebase Auth: Persist session across refresh ─────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Restore profile from Firestore
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          setCurrentUser({
            uid: firebaseUser.uid,
            name: data.name || firebaseUser.displayName || firebaseUser.email!,
            email: firebaseUser.email!,
            role: data.role || 'REPORTER',
            department: data.department,
            score: data.score,
          });
          setCurrentView('DASHBOARD');
        } else {
          // Profile not found — sign out to clear stale session
          await signOut(auth);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ── Geolocation ────────────────────────────────────────────────────────────
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => console.warn('Geolocation denied or unavailable')
      );
    }
  }, []);

  const handleSelectIssue = useCallback((id: string) => {
    setSelectedIssueId(id);
  }, []);

  const handleUpvote = useCallback((id: string) => {
    if (!currentUser) return;
    setIssues(prev => prev.map(issue => {
      if (issue.id === id) {
        if (issue.votes?.[currentUser.name]) return issue;
        const weight = currentUser.role === 'VERIFIER' ? 5 : 1;
        const newUpvotes = issue.upvotes + 1;
        const newScore = (issue.verificationScore || 0) + weight;
        
        // Percentage-based verification logic
        const population = LOCALITY_POPULATIONS[issue.locality] || 50000;
        const scorePercentage = (newScore / population) * 100;
        const isVerified = scorePercentage >= VERIFICATION_THRESHOLD_PERCENT;
        
        const newStatus = (isVerified && issue.status !== 'RESOLVED') ? 'VERIFIED_GHOST' : issue.status;
        return {
          ...issue,
          upvotes: newUpvotes,
          verificationScore: newScore,
          status: newStatus as any,
          votes: { ...(issue.votes || {}), [currentUser.name]: 'UP' }
        };
      }
      return issue;
    }));
  }, [currentUser]);

  const handleDownvote = useCallback((id: string) => {
    if (!currentUser) return;
    setIssues(prev => prev.map(issue => {
      if (issue.id === id) {
        if (issue.votes?.[currentUser.name]) return issue;
        const weight = currentUser.role === 'VERIFIER' ? 5 : 1;
        const newDownvotes = issue.downvotes + 1;
        const newScore = (issue.verificationScore || 0) - weight;
        
        // Threshold for automatic dismissal or "hidden" state could also be percentage-based
        const newStatus = (newScore <= -10) ? 'RESOLVED' : issue.status;
        setDraftingIssue(issue);
        return {
          ...issue,
          downvotes: newDownvotes,
          verificationScore: newScore,
          status: newStatus as any,
          votes: { ...(issue.votes || {}), [currentUser.name]: 'DOWN' }
        };
      }
      return issue;
    }));
  }, [currentUser]);

  // ── Create Issue: local state + Firestore ─────────────────────────────────
  const handleCreateIssue = useCallback(async (newIssue: Issue, file?: File | null) => {
    // 1. Fetch Civic Quote from Gemini via backend
    let civicQuote = "Our collective responsibility ensures a better city for all.";
    try {
      const response = await fetch('/api/generate-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newIssue.title,
          description: newIssue.description,
          category: newIssue.category
        })
      });
      if (response.ok) {
        const data = await response.json();
        civicQuote = data.quote;
      }
    } catch (err) {
      console.error('Failed to fetch civic quote:', err);
    }

    const issueWithQuote = { ...newIssue, civicQuote };

    // 2. Add to local state immediately
    setIssues(prev => [issueWithQuote, ...prev]);
    setIsModalOpen(false);
    setSelectedIssueId(newIssue.id);
    setSharingIssue(issueWithQuote);
    setSharingFile(file || null);

    // 3. Persist to Firestore
    if (currentUser) {
      try {
        await addDoc(collection(db, 'reports'), {
          ...issueWithQuote,
          createdAt: Timestamp.fromDate(newIssue.createdAt),
          updatedAt: Timestamp.fromDate(newIssue.updatedAt),
          reportedByUid: currentUser.uid,
        });
      } catch (err) {
        console.error('Failed to save report to Firestore:', err);
      }
    }
  }, [currentUser]);

  const handleShareIssue = useCallback((issue: Issue) => {
    setSharingIssue(issue);
    setSharingFile(null);
  }, []);

  const handleDraftComplaint = useCallback((issue: Issue) => {
    setDraftingIssue(issue);
  }, []);

  const handleResolveIssue = useCallback((id: string, response: string, workLogUrl: string) => {
    setIssues(prev => prev.map(issue => {
      if (issue.id === id) {
        return {
          ...issue,
          status: 'RESOLVED' as const,
          officialResponse: response,
          workLogUrl,
          resolvedAt: new Date(),
        };
      }
      return issue;
    }));
    setResolvingIssue(null);
  }, []);

  const handleDeleteIssue = useCallback((id: string) => {
    setIssues(prev => prev.filter(issue => issue.id !== id));
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('DASHBOARD');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setCurrentView('MAP');
  };

  // Metrics
  const totalIssues = issues.length;
  const verifiedCount = issues.filter(i => i.status === 'VERIFIED_GHOST').length;
  const resolvedCount = issues.filter(i => i.status === 'RESOLVED').length;
  const verificationRate = totalIssues > 0 ? Math.round((verifiedCount / totalIssues) * 100) : 0;
  const resolutionRate = totalIssues > 0 ? Math.round((resolvedCount / totalIssues) * 100) : 0;

  // ── Auth Loading Screen ────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-cyan-400 animate-spin" />
          <p className="text-blue-200/60 text-sm font-medium uppercase tracking-widest">Initializing CivicLens…</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthLanding onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-950 font-sans relative text-white selection:bg-cyan-500/30 selection:text-white">

      {/* Deep Space / Glowing Abstract Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-purple-700/20 blur-[130px] rounded-full mix-blend-screen" />
        <div className="absolute top-[30%] right-[10%] w-[40vw] h-[40vw] bg-cyan-400/10 blur-[100px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-slate-950/50 to-slate-950/80" />
      </div>

      <div className="relative z-10 flex flex-col h-full w-full overflow-hidden">
        <TopNav
          user={currentUser}
          activeView={currentView}
          onViewChange={setCurrentView}
          onLogout={handleLogout}
        />

        {currentView === 'DASHBOARD' ? (
          currentUser.role === 'GOVERNMENT' ? (
            <GovDashboard user={currentUser} issues={issues} onResolve={setResolvingIssue} />
          ) : (
            <CitizenDashboard user={currentUser} issues={issues} onDelete={handleDeleteIssue} />
          )
        ) : (
          <div className="flex-1 w-full flex flex-col md:flex-row overflow-hidden relative">
            {/* Sidebar Feed */}
            <div className="w-full md:w-[450px] lg:w-[500px] h-[50vh] md:h-full flex flex-col z-20 backdrop-blur-3xl bg-black/40 border-r border-white/10 overflow-hidden shrink-0 shadow-[20px_0_60px_rgba(0,0,0,0.5)] relative">
              <Feed
                issues={issues}
                selectedIssueId={selectedIssueId}
                onSelectIssue={handleSelectIssue}
                onUpvote={handleUpvote}
                onDownvote={handleDownvote}
                onDraftComplaint={handleDraftComplaint}
                onResolve={setResolvingIssue}
                onShare={handleShareIssue}
                userRole={currentUser.role}
                currentUserName={currentUser.name}
              />

              {/* Report Button — hidden for GOVERNMENT */}
              {currentUser.role !== 'GOVERNMENT' && (
                <div className="p-6 bg-black/40 border-t border-white/10 z-30 backdrop-blur-md">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-linear-to-r from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 text-white py-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(34,211,238,0.3)] border border-cyan-400/30 hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] group"
                  >
                    <Plus size={18} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform" />
                    Report Amenity +
                  </button>
                </div>
              )}
            </div>

            {/* Map Area */}
            <div className="flex-1 h-[50vh] md:h-full relative z-0">
              <div className="absolute top-0 left-0 right-0 p-6 flex flex-col items-start gap-4 pointer-events-none z-10">
                <div className="pointer-events-auto flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] px-6 py-4 rounded-xl">
                  <span className="text-xs font-bold text-cyan-200/70 uppercase tracking-widest pl-1">District: Central Business Ward</span>
                  <div className="h-5 w-px bg-white/20"></div>
                  <span className="text-xs text-red-400 font-bold animate-pulse uppercase tracking-widest flex items-center gap-2 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]">
                    {issues.filter(i => i.status === 'VERIFIED_GHOST').length} Critical Cases
                  </span>
                </div>
              </div>

              <GroundMap
                issues={issues}
                selectedIssueId={selectedIssueId}
                onSelectIssue={handleSelectIssue}
              />

              {/* Metrics Overlay Panel */}
              <div className="absolute bottom-6 left-6 flex gap-4 pointer-events-none z-10 w-full pr-16 items-end">
                <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-5 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] pointer-events-auto flex flex-col gap-3 min-w-[240px]">
                  <div className="text-[9px] font-bold text-cyan-200/50 uppercase tracking-widest">Success Metrics</div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-blue-200/70 tracking-widest mb-0.5">
                        <TrendingUp size={10} /> Volume
                      </div>
                      <div className="text-lg font-black tracking-tight drop-shadow-sm">{totalIssues}</div>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-blue-200/70 tracking-widest mb-0.5">
                        <CheckCircle size={10} /> Verified
                      </div>
                      <div className="text-lg font-black tracking-tight drop-shadow-sm">{verifiedCount} <span className="text-xs font-medium text-blue-200/50">({verificationRate}%)</span></div>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-blue-200/70 tracking-widest mb-0.5">
                        <Clock size={10} /> Resolved
                      </div>
                      <div className="text-lg font-black tracking-tight text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{resolvedCount} <span className="text-xs font-medium text-emerald-400/50">({resolutionRate}%)</span></div>
                    </div>
                  </div>
                </div>

                <div className="ml-auto pointer-events-auto self-end flex gap-3">
                  <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-sm shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div> Resolved
                  </div>
                  <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-sm shadow-[0_0_15px_red]"></div> Verified Case
                  </div>
                  <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <div className="w-2.5 h-2.5 bg-amber-400 rounded-sm shadow-[0_0_10px_amber]"></div> Unverified
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {isModalOpen && currentUser && (
          <ReportModal
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleCreateIssue}
            defaultLocation={userLocation}
            reporterName={currentUser.name}
            existingIssues={issues}
          />
        )}

        {/* Auto Complaint Modal */}
        {draftingIssue && (
          <AutoComplaintModal
            issue={draftingIssue}
            onClose={() => setDraftingIssue(null)}
          />
        )}

        {/* Resolve Modal */}
        {resolvingIssue && (
          <ResolveModal
            issue={resolvingIssue}
            onClose={() => setResolvingIssue(null)}
            onSubmit={handleResolveIssue}
          />
        )}

        {/* Share to X Modal */}
        {sharingIssue && (
          <ShareToXModal
            issue={sharingIssue}
            attachedFile={sharingFile}
            onClose={() => { setSharingIssue(null); setSharingFile(null); }}
          />
        )}
      </div>
    </div>
  );
}
