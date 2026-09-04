import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, RotateCcw, Lock, ArrowRight, ArrowLeft, Loader2, Sparkles, ShieldCheck, BadgeCheck } from 'lucide-react';
import FadeIn from '../components/FadeIn';
import { apiClient } from '../utils/api';

interface CareerResultRow {
  id: string;
  test_id: string | null;
  order_id: string | null;
  created_at: string;
}

const TEST_LABELS: Record<string, string> = {
  career: 'Career Guidance Assessment',
};

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

const MyResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [entitled, setEntitled] = useState(false);
  const [results, setResults] = useState<CareerResultRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hasLocalSession = !!localStorage.getItem('auth_token');
    if (!hasLocalSession) {
      setLoggedIn(false);
      setLoading(false);
      return;
    }
    setLoggedIn(true);

    Promise.all([
      apiClient.get<any>('/api/user-results').catch((err) => ({ __error: err })),
      apiClient.get<any>('/api/career-access').catch((err) => ({ __error: err })),
    ]).then(([resultsRes, accessRes]) => {
      if ((resultsRes as any).__error || (accessRes as any).__error) {
        // Session expired or revoked — force a fresh login prompt.
        if (((resultsRes as any).__error?.status ?? 0) === 401 || ((accessRes as any).__error?.status ?? 0) === 401) {
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_token');
          setLoggedIn(false);
        } else {
          setError('Could not load your results. Please try again.');
        }
      } else {
        const all: CareerResultRow[] = resultsRes.results || [];
        setResults(all.filter((r) => (r.test_id || 'career') === 'career'));
        setEntitled(!!accessRes.entitled);
      }
      setLoading(false);
    });
  }, []);

  const viewResult = (id: string) => navigate(`/assessments/career?id=${encodeURIComponent(id)}`);
  const retake = () => navigate('/assessments/career?retake=1');

  // --- Logged out -----------------------------------------------------------
  if (!loading && !loggedIn) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-4 bg-[#F7EBD3] flex items-center justify-center">
        <FadeIn>
          <div className="bg-white max-w-md w-full p-10 rounded-[32px] shadow-xl border border-black/5 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-terracotta/10 border border-terracotta/20 text-terracotta mb-5">
              <Lock size={22} />
            </div>
            <h2 className="text-2xl font-black serif text-intel-dark mb-2">Login Required</h2>
            <p className="text-sm text-intel-dark/60 font-light leading-relaxed mb-8">
              Your saved career assessment results are tied to your account. Login to revisit or retake them.
            </p>
            <button
              onClick={() => navigate('/assessments/career')}
              className="w-full bg-terracotta text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Login & Continue <ArrowRight size={14} />
            </button>
          </div>
        </FadeIn>
      </div>
    );
  }

  // --- Loading ---------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F7F9] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-terracotta" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-16 px-4 bg-[#F7EBD3]">
      <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/career-assessment')}
        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-intel-dark/40 hover:text-intel-dark transition-colors mb-8"
      >
        <ArrowLeft size={14} /> Back to Career Guidance
      </button>

      <FadeIn>
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-intel-dark/5 border border-black/5 text-terracotta text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
            <Sparkles size={12} className="animate-pulse" /> Your Space
          </div>
          <h1 className="text-3xl md:text-4xl font-black serif text-intel-dark mb-3">My Results</h1>
          <p className="text-intel-dark/60 max-w-md mx-auto text-sm font-light leading-relaxed">
            Revisit any career assessment you've completed, or retake the test — your purchase covers unlimited retakes.
          </p>
        </div>
      </FadeIn>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium text-center mb-6">
          {error}
        </div>
      )}

      <ResultsList results={results} entitled={entitled} viewResult={viewResult} retake={retake} startTest={() => navigate('/assessments/career')} />
      </div>
    </div>
  );
};

interface ResultsListProps {
  results: CareerResultRow[];
  entitled: boolean;
  viewResult: (id: string) => void;
  retake: () => void;
  startTest: () => void;
}

const ResultsList: React.FC<ResultsListProps> = ({ results, entitled, viewResult, retake, startTest }) => {
  if (results.length === 0) {
    return (
      <FadeIn>
        <div className="bg-white p-10 rounded-[32px] shadow-xl border border-black/5 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-intel-dark/5 border border-black/5 text-intel-dark/40 mb-5">
            <FileText size={22} />
          </div>
          <h3 className="text-lg font-bold text-intel-dark serif mb-2">No results yet</h3>
          <p className="text-sm text-intel-dark/60 font-light mb-8">
            Once you complete the career guidance assessment, your results will appear here.
          </p>
          <button
            onClick={startTest}
            className="bg-terracotta text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
          >
            Start the Assessment <ArrowRight size={14} />
          </button>
        </div>
      </FadeIn>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((r, idx) => (
        <FadeIn key={r.id} delay={idx * 60}>
          <div className="bg-white p-6 md:p-7 rounded-[28px] shadow-lg border border-black/5 flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-intel-dark text-white flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-intel-dark serif text-base">
                  {TEST_LABELS[r.test_id || 'career'] || 'Assessment Result'}
                </h3>
                {r.order_id && (
                  <span className="inline-flex items-center gap-1 bg-serene-green/10 text-serene-green text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-serene-green/30">
                    <BadgeCheck size={10} /> Purchased
                  </span>
                )}
                {!r.order_id && entitled && (
                  <span className="bg-terracotta/10 text-terracotta text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-terracotta/30">
                    Retake
                  </span>
                )}
              </div>
              <p className="text-xs text-intel-dark/50 font-medium mt-1">Completed {formatDate(r.created_at)}</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button
                onClick={() => viewResult(r.id)}
                className="flex-1 md:flex-none px-6 py-3 bg-intel-dark text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                View Result <ArrowRight size={12} />
              </button>
              {entitled && (
                <button
                  onClick={retake}
                  className="flex-1 md:flex-none px-6 py-3 bg-white text-intel-dark border border-black/10 rounded-xl font-black uppercase tracking-widest text-[10px] hover:border-terracotta hover:text-terracotta transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={12} /> Retake
                </button>
              )}
            </div>
          </div>
        </FadeIn>
      ))}

      {entitled && (
        <FadeIn delay={120}>
          <div className="bg-intel-dark p-6 md:p-7 rounded-[28px] flex flex-col md:flex-row md:items-center gap-5 mt-8">
            <div className="flex-1">
              <h3 className="font-bold text-white serif text-base">Think your profile has changed?</h3>
              <p className="text-white/50 text-xs mt-1 leading-relaxed font-light">
                Retake the full assessment — a fresh report is generated and sent to you. No payment needed.
              </p>
            </div>
            <button
              onClick={retake}
              className="shrink-0 bg-terracotta text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} /> Retake Test
            </button>
          </div>
        </FadeIn>
      )}

      <p className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-intel-dark/30 flex items-center justify-center gap-1.5 mt-8">
        <ShieldCheck size={12} /> Results are private to your account
      </p>
    </div>
  );
};

export default MyResultsPage;
