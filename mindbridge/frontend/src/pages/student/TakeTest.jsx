import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle, Check, Heart, ShieldCheck } from 'lucide-react';
import { Button, Spinner } from '../../components/ui';
import SeverityBadge from '../../components/charts/SeverityBadge';
import ResultInsights from '../../components/charts/ResultInsights';
import { getIntellTone } from '../../utils/formatters';
import api from '../../lib/axios';

// Pastel answer buttons (classes written out in full so Tailwind keeps them)
const OPTION_TINTS = [
  { picked: 'bg-sage', hover: 'hover:bg-sage/50' },
  { picked: 'bg-sky', hover: 'hover:bg-sky/60' },
  { picked: 'bg-lavender', hover: 'hover:bg-lavender/60' },
  { picked: 'bg-peach', hover: 'hover:bg-peach/60' },
  { picked: 'bg-[#F0E4C8]', hover: 'hover:bg-[#F0E4C8]/70' },
];

const CONFETTI = [
  ['#F6DCC8', -90, -60], ['#DCE8DC', 90, -65], ['#E6DEEC', -105, 25], ['#DCE6EE', 105, 30],
  ['#C19B6C', -45, 95], ['#F6DCC8', 50, 98], ['#DCE8DC', 0, -105], ['#E6DEEC', 70, -100],
];

export default function TakeTest() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['test', testId],
    queryFn: () => api.get('/student/tests').then(r => r.data.tests?.find(t => t.id === testId)),
  });

  const mutation = useMutation({
    mutationFn: () => api.post(`/student/tests/${testId}/submit`, {
      answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
    }),
    onSuccess: ({ data }) => setResult(data),
    onError: (err) => alert("Submission failed: " + (err.response?.data?.error || err.message)),
  });

  const test = data;
  
  // Fix JSON parsing bug for questions
  const parseQuestions = (q) => {
    let parsed = q;
    while (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch (e) { return []; }
    }
    return Array.isArray(parsed) ? parsed : [];
  };

  const questions = parseQuestions(test?.questions);
  const totalQ = questions.length;
  const currentQuestion = questions[currentQ];
  const answered = answers[currentQuestion?.id] !== undefined;

  const handleAnswer = (questionId, value) => setAnswers(prev => ({ ...prev, [questionId]: value }));

  const handleNext = () => {
    if (currentQ < totalQ - 1) setCurrentQ(q => q + 1);
    else mutation.mutate();
  };

  const handlePrev = () => setCurrentQ(q => Math.max(0, q - 1));

  if (isLoading) return <div className="min-h-screen bg-surface-50 flex justify-center items-center"><Spinner size="xl" /></div>;
  if (!test) return <div className="min-h-screen bg-surface-50 flex items-center justify-center text-surface-500">Test not found</div>;

  // ── Result View ───────────────────────────────────────────────
  if (result) {
    // isLow here = "needs the counselling team" (server-side rule), not just a low band
    const isLow = result.isLow;
    const row = result.result;
    const isLearning = row?.test?.category === 'LearningPattern';
    return (
      <div className="min-h-screen relative overflow-hidden bg-[#1F1E1B] flex items-center justify-center p-4 py-10">
        <div className="blob-drift pointer-events-none absolute top-10 -left-24 w-80 h-80 rounded-full bg-lavender/15 blur-3xl" aria-hidden="true" />
        <div className="blob-drift-alt pointer-events-none absolute bottom-0 -right-24 w-96 h-80 rounded-full bg-sage/15 blur-3xl" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-2xl animate-slide-up">
          <span className="pointer-events-none absolute inset-0 rounded-[36px] bg-peach rotate-[2deg] translate-x-2 translate-y-2" aria-hidden="true" />
          <span className="pointer-events-none absolute inset-0 rounded-[36px] bg-sage -rotate-[1.6deg] -translate-x-1 translate-y-1" aria-hidden="true" />

          <div className="relative bg-[#FFFDF8] rounded-[36px] shadow-[0_24px_60px_rgba(0,0,0,0.35)] p-8 md:p-12 text-center">
            <div className="relative inline-block mb-6">
              {CONFETTI.map(([color, dx, dy], i) => (
                <span
                  key={i}
                  className="splash-confetti absolute left-1/2 top-1/2 w-3 h-3 rounded-full"
                  style={{ background: color, '--dx': `${dx}px`, '--dy': `${dy}px`, animationDelay: `${0.2 + i * 0.05}s` }}
                  aria-hidden="true"
                />
              ))}
              <span className={`splash-logo inline-flex w-20 h-20 rounded-[28px] items-center justify-center text-surface-900 shadow-[0_10px_24px_rgba(26,26,26,0.12)] ${isLow ? 'bg-lavender' : 'bg-sage'}`}>
                {isLow ? <Heart className="w-9 h-9" /> : <CheckCircle className="w-9 h-9" />}
              </span>
            </div>

            <h2 className="font-serif text-3xl md:text-4xl text-surface-900 mb-3">Assessment <span className="italic text-primary-800">complete</span></h2>
            <p className="inline-block rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-accent-700 shadow-sm mb-8">{test.name}</p>

            <div className="bg-lavender/70 rounded-[32px] p-7 md:p-9 mb-6">
              {isLearning ? (
                <>
                  <p className="text-xs text-surface-600 font-semibold uppercase tracking-widest mb-3">Your learning style</p>
                  <p className="font-serif text-3xl text-surface-900">{result.severity}</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-surface-600 font-semibold uppercase tracking-widest mb-3">Your score</p>
                  <div className="flex items-end justify-center gap-2">
                    <span className="font-serif text-6xl text-surface-900 leading-none">{row?.score}</span>
                    <span className="text-xl text-surface-500 font-medium pb-1">/ {row?.maxScore}</span>
                  </div>
                  <div className="mt-5 flex justify-center">
                    <SeverityBadge severity={result.severity} size="md" tone={getIntellTone(row)} />
                  </div>
                </>
              )}
            </div>

            <div className="mb-6 text-left">
              <ResultInsights result={row} tone="light" />
            </div>

            {isLow && (
              <div className="bg-peach rounded-[28px] p-6 mb-6 text-left">
                <p className="font-serif text-lg text-surface-900 mb-2 flex items-center gap-2"><Heart className="w-5 h-5 text-red-700" /> You're not alone</p>
                <p className="text-sm text-surface-800 leading-relaxed">
                  Your score suggests you might benefit from talking to someone.
                  We've notified your school's mental health team, who will reach out soon.
                </p>
                <p className="text-sm text-surface-800 leading-relaxed mt-3">
                  If you feel unsafe or need to talk right now, call{' '}
                  <a href="tel:14416" className="font-bold underline">Tele-MANAS 14416</a> (free, 24×7) or{' '}
                  <a href="tel:112" className="font-bold underline">112</a> in an emergency.
                </p>
              </div>
            )}

            {/* Who sees this — stated plainly instead of a toggle that did nothing */}
            <p className="flex items-start gap-3 text-sm text-surface-700 bg-sky/70 rounded-2xl p-5 mb-8 text-left">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-primary-800" />
              <span>Your result is private to you, your parent or guardian, and your school's counselling team, so they can support you.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => navigate('/student/results')}>View all results</Button>
              <Button variant="primary" size="lg" className="flex-1" onClick={() => navigate('/student')}>Back to dashboard</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Test View ─────────────────────────────────────────────────
  const options = currentQuestion?.options || [
    { label: 'Never', value: 1 },
    { label: 'Rarely', value: 2 },
    { label: 'Sometimes', value: 3 },
    { label: 'Often', value: 4 },
    { label: 'Always', value: 5 },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-surface-50 flex items-center justify-center p-4 py-10">
      <div className="blob-drift pointer-events-none absolute top-16 -left-24 w-80 h-80 rounded-full bg-lavender/80 blur-3xl" aria-hidden="true" />
      <div className="blob-drift-alt pointer-events-none absolute bottom-0 -right-24 w-96 h-80 rounded-full bg-sky/80 blur-3xl" aria-hidden="true" />
      <div className="blob-drift pointer-events-none absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-peach/60 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-[700px] animate-slide-up">
        <span className="pointer-events-none absolute inset-0 rounded-[36px] bg-peach rotate-[2deg] translate-x-2 translate-y-2" aria-hidden="true" />
        <span className="pointer-events-none absolute inset-0 rounded-[36px] bg-sage -rotate-[1.6deg] -translate-x-1 translate-y-1" aria-hidden="true" />

        <div className="relative bg-[#FFFDF8] rounded-[36px] shadow-[0_20px_50px_rgba(26,26,26,0.12)] p-6 md:p-10 min-h-[420px] flex flex-col">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="inline-flex items-center rounded-full bg-lavender px-3.5 py-1 text-xs font-semibold text-surface-800">Assessment</span>
              <span className="rounded-full bg-black/[0.05] px-3 py-1 text-xs font-bold text-surface-600 whitespace-nowrap">Question {currentQ + 1} of {totalQ}</span>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl text-surface-900 leading-tight mb-5">{test.name}</h2>
            <div
              className="h-3 w-full rounded-full bg-black/[0.07] overflow-hidden"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={totalQ}
              aria-valuenow={currentQ + 1}
              aria-label="Assessment progress"
            >
              <div className="h-full rounded-full bg-accent-600 transition-all duration-500" style={{ width: `${totalQ ? ((currentQ + 1) / totalQ) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="flex-1" key={currentQ}>
            <h3 className="font-serif text-2xl md:text-[1.75rem] text-surface-900 leading-snug mb-8 animate-slide-up">
              {currentQuestion?.text}
            </h3>

            <div className="space-y-3 mb-10">
              {options.map((option, i) => {
                const isSelected = answers[currentQuestion.id] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleAnswer(currentQuestion.id, option.value)}
                    aria-pressed={isSelected}
                    className={`group w-full text-left flex items-center justify-between gap-4 rounded-3xl border-2 px-5 py-4 md:px-6 md:py-5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                      isSelected
                        ? `${OPTION_TINTS[i % OPTION_TINTS.length].picked} border-surface-900 -rotate-[0.6deg] scale-[1.015] shadow-[0_5px_0_rgba(26,26,26,0.85)]`
                        : `bg-white border-black/[0.06] hover:-translate-y-0.5 hover:border-surface-900/30 hover:shadow-md ${OPTION_TINTS[i % OPTION_TINTS.length].hover}`
                    }`}
                  >
                    <span className="font-semibold text-surface-900 text-base md:text-lg leading-snug">{option.label}</span>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${isSelected ? 'bg-surface-900 text-white scale-110' : 'border-2 border-black/15 group-hover:border-surface-900/40'}`}>
                      {isSelected && <Check className="w-4 h-4" strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-between mt-auto gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentQ === 0}
              className={`w-full sm:w-auto h-12 px-6 rounded-full font-semibold flex items-center justify-center gap-2 bg-black/[0.05] text-surface-700 hover:bg-black/10 transition-colors ${currentQ === 0 ? 'opacity-0 pointer-events-none' : ''}`}
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!answered || mutation.isPending}
              className="w-full sm:w-auto h-14 px-8 rounded-full font-semibold text-base flex items-center justify-center gap-2 bg-accent-600 text-surface-900 shadow-[0_8px_24px_rgba(26,26,26,0.18)] hover:bg-[#cfac80] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {currentQ === totalQ - 1 ? 'Submit assessment' : 'Next question'}
              {currentQ === totalQ - 1 ? <CheckCircle className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
