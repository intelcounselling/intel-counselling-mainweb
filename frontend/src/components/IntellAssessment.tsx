import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft, ArrowRight, Shield, CheckCircle, Clock, PartyPopper, Brain, Loader2 } from 'lucide-react';
import { apiClient } from '../utils/api';
import {
  AssessmentPage, StackedCard, RoundButton, BackPill, ProgressPill, QuestionHead, OptionButton, InfoChip, Confetti,
  BTN_PRIMARY, BTN_DARK, BTN_SOFT,
} from './AssessmentUI';
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

// One of the five Intel assessments: 12 statements on a 1–5 agree scale.
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
    <AssessmentPage>
      <StackedCard>{children}</StackedCard>
    </AssessmentPage>
  );

  if (loadError) {
    return shell(
      <div className="p-10 text-center">
        <p className="text-intel-dark/70 mb-6">{loadError}</p>
        <button onClick={onClose} className={BTN_DARK}>Back</button>
      </div>
    );
  }
  if (!def) {
    return shell(<div className="p-16 flex justify-center"><Loader2 className="animate-spin text-terracotta" size={28} /></div>);
  }

  // ── Intro ─────────────────────────────────────────────
  if (step === -1) {
    return shell(
      <div className="as-pop p-7 md:p-12">
        <BackPill onClick={onClose}><ArrowLeft size={16} /> Back</BackPill>
        <div className="mt-8 flex items-center gap-4">
          <span className="as-bob inline-block"><IntellIcon id={testId} size="lg" /></span>
          <span className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-[12px] font-semibold text-[#8a6a3f] shadow-sm">{meta?.label} · Module A</span>
        </div>
        <h2 className="serif text-3xl md:text-4xl text-intel-dark mt-6 mb-4 leading-tight">{def.name}</h2>
        <p className="text-intel-dark/70 mb-8 leading-relaxed">{def.description}</p>
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          <InfoChip icon={<Clock size={18} />} tint="bg-sky/70">About {def.estimatedMinutes} minutes</InfoChip>
          <InfoChip icon={<CheckCircle size={18} />} tint="bg-sage/70">{questions.length} short statements</InfoChip>
          <InfoChip icon={<Shield size={18} />} tint="bg-lavender/70">Private to your account</InfoChip>
        </div>
        <p className="text-sm text-intel-dark/60 mb-8">There are no right or wrong answers — go with what's true for you most of the time.</p>
        <button onClick={() => setStep(0)} className={`${BTN_PRIMARY} w-full`}>
          Let's begin <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  // ── Result ────────────────────────────────────────────
  if (status) {
    const profile = status.profile;
    const result = profile?.tests?.find((t: any) => t.name === def.name);
    const tests = status.tests || [];
    // Module A buyers work through the five Intel tests; Module B adds PHQ-9 and GAD-7
    const mine = INTELL_ORDER.filter((id) => status.moduleB || INTELL_META[id].module === 'A');
    const total = mine.length;
    const done = tests.filter((t: any) => t.done && mine.includes(t.id)).length;
    const nextId = mine.find((id) => !tests.find((t: any) => t.id === id)?.done);
    const allDone = !nextId;
    return shell(
      <div className="as-pop p-7 md:p-14 text-center">
        <div className="relative inline-block mb-6">
          <Confetti />
          <span className="as-hop inline-block">
            {allDone
              ? <span className="w-20 h-20 rounded-[28px] bg-terracotta text-intel-dark flex items-center justify-center shadow-[0_10px_24px_rgba(26,26,26,0.15)]"><PartyPopper size={36} /></span>
              : <IntellIcon id={testId} size="lg" />}
          </span>
        </div>
        <p className="inline-block rounded-full bg-white px-4 py-1.5 text-[12px] font-semibold text-[#8a6a3f] shadow-sm mb-4">{allDone ? `All ${total} done — amazing!` : `${done} of ${total} done`}</p>
        <h2 className="serif text-3xl md:text-4xl text-intel-dark mb-6 leading-tight">{def.name}</h2>

        {result && (
          <div className="bg-lavender/70 rounded-[32px] p-6 md:p-8 mb-8 text-left">
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border mb-3 ${LEVEL_STYLE[result.level] || LEVEL_STYLE.ok}`}>{capitalise(result.severity)}</span>
            {result.category === 'LearningPattern' && result.subScores && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {['Visual', 'Auditory', 'Kinesthetic'].map((d, i) => (
                  <div key={d} className={`${['bg-sage', 'bg-sky', 'bg-peach'][i]} rounded-2xl p-3 text-center`}>
                    <p className="serif text-2xl text-intel-dark">{result.subScores[d]}<span className="text-xs text-intel-dark/50">/20</span></p>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-intel-dark/60">{d}</p>
                  </div>
                ))}
              </div>
            )}
            <p className="text-intel-dark/80 text-lg leading-relaxed">{result.note}</p>
          </div>
        )}

        <div className="h-3 rounded-full bg-black/[0.07] overflow-hidden mb-8 max-w-md mx-auto" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Assessments completed">
          <div className="h-full bg-terracotta rounded-full transition-all duration-700 ease-bounce" style={{ width: `${(done / total) * 100}%` }} />
        </div>

        <div className="flex flex-col md:flex-row gap-3 justify-center">
          {nextId ? (
            <button onClick={() => navigate(intellTestPath(nextId))} className={BTN_PRIMARY}>
              Next: {INTELL_META[nextId].label} <ArrowRight size={18} />
            </button>
          ) : (
            <button onClick={() => navigate(INTELL_HUB)} className={BTN_PRIMARY}>
              <Brain size={18} /> See my full profile
            </button>
          )}
          <button onClick={() => navigate(INTELL_HUB)} className={BTN_SOFT}>All my assessments</button>
        </div>
      </div>
    );
  }

  // ── Questions ─────────────────────────────────────────
  const q = questions[step];
  return shell(
    <>
      <div className="px-5 md:px-6 py-4 border-b border-black/5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <RoundButton onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || saving} aria-label="Previous question"><ArrowLeft size={18} /></RoundButton>
          <IntellIcon id={testId} size="sm" />
          <ProgressPill value={step + 1} total={questions.length} color={meta?.color || 'bg-terracotta'} />
        </div>
        <RoundButton onClick={onClose} aria-label="Close"><X size={18} /></RoundButton>
      </div>

      <div className="p-6 md:p-14 max-w-xl mx-auto">
        {saving ? (
          <div className="py-16 flex flex-col items-center gap-4 text-intel-dark/60">
            <Loader2 className="animate-spin text-terracotta" size={28} /> Saving your answers…
          </div>
        ) : saveError ? (
          <div className="py-10 text-center">
            <p className="text-red-700 bg-[#F9D9D4] rounded-2xl p-4 mb-6" role="alert">{saveError}</p>
            <button onClick={() => submit(answers)} className={BTN_PRIMARY}>Try again</button>
          </div>
        ) : (
          <div key={step} className="as-pop">
            <QuestionHead eyebrow="How much do you agree?" text={q.text} />
            <div className="grid gap-3">
              {options.map((opt, i) => (
                <OptionButton key={opt.value} label={opt.label} picked={answers[step] === opt.value} index={i} onClick={() => answer(opt.value)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default IntellAssessment;
