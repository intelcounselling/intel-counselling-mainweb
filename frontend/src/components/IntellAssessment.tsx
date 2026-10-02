import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft, ArrowRight, Shield, CheckCircle, Clock, PartyPopper, Brain, Loader2 } from 'lucide-react';
import { apiClient } from '../utils/api';
import { INTELL_META, INTELL_ORDER, INTELL_HUB, IntellIcon, LEVEL_STYLE, capitalise, intellTestPath } from '../utils/intellMeta';

interface Option { label: string; value: number }
interface TestDef {
  id: string;
  name: string;
  description: string;
  estimatedMinutes: number;
  questions?: { id: string; text: string }[];
  options?: Option[];
}

interface Props {
  testId: string;
  onClose: () => void;
}

// One of the five Intell assessments: 12 statements on a 1–5 agree scale.
// Scoring happens on the server; afterwards the result comes back from the profile.
const IntellAssessment: React.FC<Props> = ({ testId, onClose }) => {
  const navigate = useNavigate();
  const meta = INTELL_META[testId];
  const [def, setDef] = useState<TestDef | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState(-1); // -1 = intro
  const [answers, setAnswers] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [status, setStatus] = useState<any | null>(null);

  useEffect(() => {
    apiClient.get<any>('/api/intell/tests')
      .then((d) => setDef((d.tests || []).find((t: TestDef) => t.id === testId) || null))
      .catch(() => setLoadError('Could not load this assessment. Please try again.'));
  }, [testId]);

  const questions = def?.questions || [];
  const options = def?.options || [];

  const submit = async (final: number[]) => {
    setSaving(true);
    setSaveError(null);
    try {
      await apiClient.post('/api/save-answers', { answers: final.join(''), testId });
      setStatus(await apiClient.get<any>('/api/intell/status'));
    } catch (e: any) {
      setSaveError(e?.data?.error || e?.message || 'Could not save your answers. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const answer = (value: number) => {
    const next = [...answers];
    next[step] = value;
    setAnswers(next);
    setTimeout(() => {
      if (step < questions.length - 1) setStep(step + 1);
      else submit(next);
    }, 250);
  };

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-[#F6F7F9] pt-20 md:pt-28 pb-12 px-4 flex items-start justify-center">
      <div className="relative bg-white w-full max-w-3xl rounded-[32px] md:rounded-[40px] shadow-xl border border-black/5 overflow-hidden">{children}</div>
    </div>
  );

  if (loadError) {
    return shell(
      <div className="p-10 text-center">
        <p className="text-intel-dark/70 mb-6">{loadError}</p>
        <button onClick={onClose} className="px-6 py-3 bg-intel-dark text-white rounded-xl font-black uppercase tracking-widest text-[10px]">Back</button>
      </div>
    );
  }
  if (!def) {
    return shell(<div className="p-16 flex justify-center"><Loader2 className="animate-spin text-terracotta" size={28} /></div>);
  }

  // ── Intro ─────────────────────────────────────────────
  if (step === -1) {
    return shell(
      <div className="p-8 md:p-14">
        <button onClick={onClose} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black/40 hover:text-black/80 transition-colors mb-8">
          <ArrowLeft size={16} /> Back
        </button>
        <IntellIcon id={testId} size="lg" />
        <span className="text-terracotta font-black text-xs uppercase tracking-[0.3em] mt-8 mb-3 block">{meta?.label} · Module A</span>
        <h2 className="text-3xl md:text-4xl font-black serif text-intel-dark mb-4">{def.name}</h2>
        <p className="text-intel-dark/70 mb-8 leading-relaxed">{def.description}</p>
        <div className="grid sm:grid-cols-3 gap-3 mb-10 text-sm">
          <div className="flex items-center gap-2 bg-black/[0.03] rounded-2xl p-4 text-intel-dark/70"><Clock size={18} className="text-serene-green shrink-0" /> About {def.estimatedMinutes} minutes</div>
          <div className="flex items-center gap-2 bg-black/[0.03] rounded-2xl p-4 text-intel-dark/70"><CheckCircle size={18} className="text-serene-green shrink-0" /> {questions.length} short statements</div>
          <div className="flex items-center gap-2 bg-black/[0.03] rounded-2xl p-4 text-intel-dark/70"><Shield size={18} className="text-serene-green shrink-0" /> Private to your account</div>
        </div>
        <p className="text-sm text-intel-dark/60 mb-8">There are no right or wrong answers — go with what's true for you most of the time.</p>
        <button onClick={() => setStep(0)} className="w-full bg-terracotta text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
          Let's begin
        </button>
      </div>
    );
  }

  // ── Result ────────────────────────────────────────────
  if (status) {
    const profile = status.profile;
    const result = profile?.tests?.find((t: any) => t.name === def.name);
    const tests = status.tests || [];
    const done = tests.filter((t: any) => t.done).length;
    const nextId = INTELL_ORDER.find((id) => !tests.find((t: any) => t.id === id)?.done);
    const allDone = !nextId;
    return shell(
      <div className="p-8 md:p-14 text-center">
        <div className="flex justify-center mb-6">
          {allDone
            ? <span className="w-20 h-20 rounded-full bg-terracotta text-white flex items-center justify-center shadow-xl"><PartyPopper size={36} /></span>
            : <IntellIcon id={testId} size="lg" />}
        </div>
        <p className="text-terracotta font-black text-xs uppercase tracking-[0.3em] mb-3">{allDone ? 'All 7 done — amazing!' : `${done} of 7 done`}</p>
        <h2 className="text-3xl md:text-4xl font-black serif text-intel-dark mb-6">{def.name}</h2>

        {result && (
          <div className="bg-black/[0.03] rounded-[32px] p-6 md:p-8 mb-8 text-left">
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border mb-3 ${LEVEL_STYLE[result.level] || LEVEL_STYLE.ok}`}>{capitalise(result.severity)}</span>
            {result.category === 'LearningPattern' && result.subScores && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {['Visual', 'Auditory', 'Kinesthetic'].map((d) => (
                  <div key={d} className="bg-white rounded-2xl p-3 text-center border border-black/5">
                    <p className="text-2xl font-black text-intel-dark">{result.subScores[d]}<span className="text-xs text-intel-dark/40">/20</span></p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-intel-dark/50">{d}</p>
                  </div>
                ))}
              </div>
            )}
            <p className="text-intel-dark/80 text-lg leading-relaxed">{result.note}</p>
          </div>
        )}

        <div className="h-2 rounded-full bg-black/5 overflow-hidden mb-8 max-w-md mx-auto">
          <div className="h-full bg-terracotta rounded-full transition-all duration-700" style={{ width: `${(done / 7) * 100}%` }} />
        </div>

        <div className="flex flex-col md:flex-row gap-3 justify-center">
          {nextId ? (
            <button onClick={() => navigate(intellTestPath(nextId))} className="px-8 py-5 bg-terracotta text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
              Next: {INTELL_META[nextId].label} <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={() => navigate(INTELL_HUB)} className="px-8 py-5 bg-terracotta text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
              <Brain size={16} /> See my full profile
            </button>
          )}
          <button onClick={() => navigate(INTELL_HUB)} className="px-8 py-5 bg-white text-intel-dark border-2 border-black/10 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black/5 transition-all">
            All my assessments
          </button>
        </div>
      </div>
    );
  }

  // ── Questions ─────────────────────────────────────────
  const q = questions[step];
  return shell(
    <>
      <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || saving} aria-label="Previous question" className="p-2 hover:bg-black/5 rounded-full disabled:opacity-20 transition-all">
            <ArrowLeft size={20} />
          </button>
          <IntellIcon id={testId} size="sm" />
          <div className="h-1.5 w-20 md:w-48 bg-black/5 rounded-full overflow-hidden">
            <div className={`h-full ${meta?.color || 'bg-terracotta'} transition-all duration-300`} style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
          </div>
          <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest whitespace-nowrap">{step + 1} / {questions.length}</span>
        </div>
        <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-black/5 rounded-full transition-colors"><X size={20} /></button>
      </div>

      <div className="p-6 md:p-14 max-w-xl mx-auto">
        {saving ? (
          <div className="py-16 flex flex-col items-center gap-4 text-intel-dark/60">
            <Loader2 className="animate-spin text-terracotta" size={28} /> Saving your answers…
          </div>
        ) : saveError ? (
          <div className="py-10 text-center">
            <p className="text-red-600 mb-6">{saveError}</p>
            <button onClick={() => submit(answers)} className="px-6 py-3 bg-terracotta text-white rounded-xl font-black uppercase tracking-widest text-[10px]">Try again</button>
          </div>
        ) : (
          <>
            <p className="text-black/40 font-semibold text-xs uppercase tracking-wider mb-4 text-center">How much do you agree?</p>
            <h3 className="text-2xl md:text-3xl font-black text-intel-dark serif leading-snug text-center mb-10">{q.text}</h3>
            <div className="grid gap-3">
              {options.map((opt) => {
                const picked = answers[step] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => answer(opt.value)}
                    className={`group w-full text-left p-5 rounded-[1.5rem] border-2 transition-all flex justify-between items-center shadow-sm hover:shadow-md ${picked ? 'border-intel-dark bg-intel-dark text-white' : 'border-black/5 bg-white hover:border-black/10'}`}
                  >
                    <span className={`font-bold text-sm md:text-base ${picked ? 'text-white' : 'text-intel-dark/80 group-hover:text-intel-dark'}`}>{opt.label}</span>
                    {picked ? <CheckCircle size={22} className="text-white" /> : <span className="w-6 h-6 rounded-full border-2 border-black/10 group-hover:border-black/20" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default IntellAssessment;
