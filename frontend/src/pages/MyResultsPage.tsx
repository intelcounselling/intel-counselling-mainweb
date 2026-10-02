import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FileText, RotateCcw, ArrowRight, Loader2, Sparkles, ShieldCheck, BadgeCheck, UserRound, Pencil, HeartPulse } from 'lucide-react';
import FadeIn from '../components/FadeIn';
import AssessmentRegistration from '../components/AssessmentRegistration';
import { CLINICAL_CONFIGS } from '../components/ClinicalQuestions';
import { INTELL_META, INTELL_HUB, isIntellTest, intellTestPath, IntellIcon } from '../utils/intellMeta';
import { apiClient } from '../utils/api';
import { useAuthUser } from '../utils/auth';

interface ResultRow {
  id: string;
  test_id: string | null;
  order_id: string | null;
  created_at: string;
}

const testTitle = (testId: string) =>
  testId === 'career' ? 'Career Guidance Assessment'
    : isIntellTest(testId) ? `Intell: ${INTELL_META[testId]?.label || 'Assessment'}`
    : CLINICAL_CONFIGS[testId]?.title || 'Assessment';

const formatDate = (value: string) => {
  try {
    const d = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z');
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  } catch {
    return value;
  }
};

// The account dashboard: intake details, every saved result, and retakes.
const MyResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [entitled, setEntitled] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [intell, setIntell] = useState<any>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiClient.get<any>('/api/user-results'),
      apiClient.get<any>('/api/career-access'),
      apiClient.get<any>('/api/profile'),
      apiClient.get<any>('/api/intell/status').catch(() => null),
    ])
      .then(([r, a, p, i]) => {
        setIntell(i);
        setResults(r.results || []);
        setEntitled(!!a.entitled);
        setProfile(p.profile);
        setProfileComplete(!!p.complete);
      })
      // A 401 clears the session in apiClient, which redirects below
      .catch((err) => setError(err.status === 401 ? null : 'Could not load your dashboard. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) load();
  }, [user?.id]);

  if (!user) return <Navigate to="/login?next=/my-results" replace />;

  if (editing) {
    return (
      <AssessmentRegistration
        onComplete={() => { setEditing(false); load(); }}
        onClose={() => setEditing(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F7F9] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-terracotta" />
      </div>
    );
  }

  const retakePath = (testId: string) =>
    isIntellTest(testId) ? intellTestPath(testId) : testId === 'career' ? (entitled ? '/assessments/career?retake=1' : '/assessments/career') : `/assessments/${testId}`;

  const startable = [
    { id: 'career', title: testTitle('career'), note: entitled ? 'Purchased — retake free' : 'Premium' },
    { id: 'intell', title: 'Intell Student Assessments', note: intell?.entitled ? 'Purchased — Module A + B' : 'Premium' },
    ...Object.keys(CLINICAL_CONFIGS).map((id) => ({ id, title: CLINICAL_CONFIGS[id].title, note: 'Free' })),
  ];

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-16 px-4 bg-[#F7EBD3]">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-intel-dark/5 border border-black/5 text-terracotta text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
              <Sparkles size={12} /> Your Space
            </div>
            <h1 className="text-3xl md:text-4xl font-black serif text-intel-dark mb-3">Hi, {user.name.split(' ')[0]}</h1>
            <p className="text-intel-dark/60 max-w-md mx-auto text-sm font-light leading-relaxed">
              Your details and every assessment you've taken, in one place.
            </p>
          </div>
        </FadeIn>

        {error && (
          <div role="alert" className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium text-center mb-6">
            {error} <button onClick={load} className="underline font-bold ml-1">Retry</button>
          </div>
        )}

        {/* Intake details */}
        <FadeIn>
          <section className="bg-white p-6 md:p-7 rounded-[28px] shadow-lg border border-black/5 mb-10 flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-terracotta/10 text-terracotta flex items-center justify-center shrink-0">
              <UserRound size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-intel-dark serif text-base">{user.name}</h2>
              <p className="text-xs text-intel-dark/50 font-medium truncate">{user.email}</p>
              {profileComplete ? (
                <p className="text-xs text-intel-dark/60 mt-1">
                  {[profile?.age && `${profile.age} yrs`, profile?.gender, profile?.occupation, profile?.phone].filter(Boolean).join(' · ')}
                </p>
              ) : (
                <p className="text-xs text-terracotta font-semibold mt-1">Complete your intake details once — they're used for every assessment.</p>
              )}
            </div>
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 px-6 py-3 bg-white text-intel-dark border border-black/10 rounded-xl font-black uppercase tracking-widest text-[10px] hover:border-terracotta hover:text-terracotta transition-colors flex items-center justify-center gap-2"
            >
              <Pencil size={12} /> {profileComplete ? 'Edit details' : 'Complete intake'}
            </button>
          </section>
        </FadeIn>

        {/* Intell Student Assessments: progress + profile live on their own hub */}
        {intell?.entitled && (
          <FadeIn>
            <button onClick={() => navigate(INTELL_HUB)} className="w-full text-left bg-intel-dark text-white p-6 md:p-7 rounded-[28px] shadow-lg mb-10 flex flex-col md:flex-row md:items-center gap-5 hover:scale-[1.01] transition-transform">
              <div className="flex -space-x-2 shrink-0">
                {['intell_lp', 'intell_ew', 'phq9'].map((id) => <IntellIcon key={id} id={id} size="sm" />)}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-terracotta">Intell Student Assessments</p>
                <p className="font-black serif text-lg">{intell.tests.filter((t: any) => t.done).length} of 7 done{intell.profile?.complete ? ' — your integrated profile is ready' : ''}</p>
              </div>
              <span className="shrink-0 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">Open profile & tests <ArrowRight size={12} /></span>
            </button>
          </FadeIn>
        )}

        {/* Results */}
        <h2 className="text-xl font-black serif text-intel-dark mb-4">My Results</h2>
        {results.length === 0 ? (
          <div className="bg-white p-10 rounded-[28px] shadow-lg border border-black/5 text-center mb-10">
            <FileText size={22} className="mx-auto text-intel-dark/30 mb-3" />
            <p className="text-sm text-intel-dark/60 font-light">No results yet — pick an assessment below to get started.</p>
          </div>
        ) : (
          <div className="space-y-3 mb-10">
            {results.map((r) => {
              const testId = r.test_id || 'career';
              return (
                <div key={r.id} className="bg-white p-5 md:p-6 rounded-[24px] shadow-sm border border-black/5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${testId === 'career' ? 'bg-intel-dark text-white' : 'bg-terracotta/10 text-terracotta'}`}>
                    {testId === 'career' ? <FileText size={18} /> : <HeartPulse size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-intel-dark serif text-base">{testTitle(testId)}</h3>
                      {testId === 'career' && r.order_id && (
                        <span className="inline-flex items-center gap-1 bg-serene-green/10 text-serene-green text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-serene-green/30">
                          <BadgeCheck size={10} /> Purchased
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-intel-dark/50 font-medium mt-1">Completed {formatDate(r.created_at)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => navigate(isIntellTest(testId) ? INTELL_HUB : `/assessments/${testId}?id=${encodeURIComponent(r.id)}`)}
                      className="flex-1 md:flex-none px-5 py-3 bg-intel-dark text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 flex items-center justify-center gap-2"
                    >
                      View <ArrowRight size={12} />
                    </button>
                    <button
                      onClick={() => navigate(retakePath(testId))}
                      className="flex-1 md:flex-none px-5 py-3 bg-white text-intel-dark border border-black/10 rounded-xl font-black uppercase tracking-widest text-[10px] hover:border-terracotta hover:text-terracotta transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={12} /> Retake
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Start something new */}
        <h2 className="text-xl font-black serif text-intel-dark mb-4">Take an assessment</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {startable.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate(t.id === 'intell' ? INTELL_HUB : retakePath(t.id))}
              className="text-left bg-white p-5 rounded-[20px] border border-black/5 hover:border-terracotta/40 hover:shadow-md transition-all"
            >
              <span className="text-[9px] font-black uppercase tracking-widest text-terracotta">{t.note}</span>
              <span className="block font-bold text-sm text-intel-dark mt-1">{t.title}</span>
            </button>
          ))}
        </div>

        <p className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-intel-dark/30 flex items-center justify-center gap-1.5 mt-10">
          <ShieldCheck size={12} /> Your details and results are encrypted and private to your account
        </p>
      </div>
    </div>
  );
};

export default MyResultsPage;
