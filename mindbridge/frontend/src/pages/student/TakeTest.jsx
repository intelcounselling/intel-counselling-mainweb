import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { Card, Button, Spinner } from '../../components/ui';
import SeverityBadge from '../../components/charts/SeverityBadge';
import api from '../../lib/axios';

export default function TakeTest() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [shareWithTherapist, setShareWithTherapist] = useState(false);
  const [result, setResult] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['test', testId],
    queryFn: () => api.get('/student/tests').then(r => r.data.tests?.find(t => t.id === testId)),
  });

  const mutation = useMutation({
    mutationFn: () => api.post(`/student/tests/${testId}/submit`, {
      answers: Object.entries(answers).map(([questionId, value]) => ({ questionId: parseInt(questionId), value })),
      shareWithTherapist,
    }),
    onSuccess: ({ data }) => setResult(data),
  });

  const test = data;

  // Fix JSON parsing bug for questions
  const parseQuestions = (q) => {
    if (typeof q === 'string') {
      try { return JSON.parse(q); } catch (e) { return []; }
    }
    return q || [];
  };

  const questions = parseQuestions(test?.questions);
  const totalQ = questions.length;
  const progress = totalQ ? Math.round((Object.keys(answers).length / totalQ) * 100) : 0;
  const currentQuestion = questions[currentQ];
  const answered = answers[currentQuestion?.id] !== undefined;

  const handleAnswer = (questionId, value) => setAnswers(prev => ({ ...prev, [questionId]: value }));

  const handleNext = () => {
    if (currentQ < totalQ - 1) setCurrentQ(q => q + 1);
    else mutation.mutate();
  };

  const handlePrev = () => setCurrentQ(q => Math.max(0, q - 1));

  if (isLoading) return <div className="min-h-screen bg-surface-900 flex justify-center items-center"><Spinner size="xl" /></div>;
  if (!test) return <div className="min-h-screen flex items-center justify-center text-surface-500">Test not found</div>;

  // ── Result View ───────────────────────────────────────────────
  if (result) {
    const isLow = result.isLow;
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #312e81 100%)' }}>
        <div className="max-w-2xl mx-auto space-y-6 animate-slide-up relative z-10 w-full">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] shadow-2xl p-10 text-center">
            <div className="text-6xl mb-6">{isLow ? '💙' : '✅'}</div>
            <h2 className="text-3xl font-bold text-white mb-2">Assessment Complete</h2>
            <p className="text-indigo-200 mb-8 font-medium">{test.name}</p>

            <div className="bg-white/5 rounded-3xl p-8 mb-8 border border-white/10">
              <p className="text-sm text-indigo-300 font-bold uppercase tracking-widest mb-3">Your Score</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-6xl font-extrabold text-white">{result.result?.score}</span>
                <span className="text-2xl text-indigo-300 font-medium">/ {result.result?.maxScore}</span>
              </div>
              <div className="mt-6 flex justify-center">
                <SeverityBadge severity={result.severity} size="lg" className="shadow-lg" />
              </div>
            </div>

            {isLow && (
              <div className="bg-amber-500/20 border border-amber-400/30 rounded-2xl p-6 mb-8 text-left backdrop-blur-md">
                <p className="font-bold text-amber-200 mb-2 flex items-center gap-2">💛 You're not alone</p>
                <p className="text-sm text-amber-100/90 leading-relaxed">
                  Your score suggests you might benefit from talking to someone.
                  We've notified your school's mental health team, who will reach out soon.
                </p>
              </div>
            )}

            {/* Share toggle */}
            <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl mb-8 border border-white/10">
              <div className="text-left">
                <p className="text-base font-bold text-white mb-1">Share with therapist</p>
                <p className="text-sm text-indigo-200">Allow your school's psychiatrist to view this result</p>
              </div>
              <button
                onClick={() => setShareWithTherapist(v => !v)}
                className={`relative w-14 h-7 rounded-full transition-colors ${shareWithTherapist ? 'bg-indigo-500' : 'bg-white/20'}`}
              >
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${shareWithTherapist ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => navigate('/student/results')} className="flex-1 px-6 py-4 bg-white/10 text-white border border-white/20 rounded-full font-bold hover:bg-white/20 transition-all">
                View All Results
              </button>
              <button onClick={() => navigate('/student')} className="flex-1 px-6 py-4 bg-white text-indigo-900 rounded-full font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Test View ─────────────────────────────────────────────────
  const progressPct = totalQ ? Math.round(((currentQ) / totalQ) * 100) : 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #312e81 100%)' }}>

      {/* Animated Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000" />

      <div className="max-w-3xl w-full p-10 animate-slide-up bg-white rounded-[2.5rem] shadow-2xl relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-surface-100 pb-6 mb-8 gap-4">
          <div className="flex flex-col items-start gap-2">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-surface-400 hover:text-indigo-600 transition-colors text-sm font-bold bg-surface-50 px-3 py-1.5 rounded-lg mb-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h2 className="text-3xl font-extrabold text-surface-900 tracking-tight">{test.name}</h2>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <p className="text-sm font-bold text-surface-400 mb-2">Question {currentQ + 1} of {totalQ}</p>
            <div className="w-full sm:w-32 h-2 bg-surface-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        <div className="mb-10">
          <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
            Question {currentQ + 1}
          </span>
          <h3 className="text-2xl font-bold text-surface-800 leading-relaxed">
            {currentQuestion?.text}
          </h3>
        </div>

        <div className="space-y-4">
          {(currentQuestion?.options || []).map(option => {
            const isSelected = answers[currentQuestion.id] === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleAnswer(currentQuestion.id, option.value)}
                className={`w-full text-left px-6 py-5 rounded-2xl border-2 transition-all duration-200 transform hover:scale-[1.01] ${isSelected
                    ? 'border-indigo-600 bg-indigo-50 shadow-md'
                    : 'border-surface-200 hover:border-indigo-300 hover:bg-surface-50 text-surface-700'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-surface-300'
                    }`}>
                    {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                  </div>
                  <span className={`text-lg font-medium ${isSelected ? 'text-indigo-900' : 'text-surface-700'}`}>{option.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between mt-10 gap-4">
          <button
            onClick={handlePrev}
            disabled={currentQ === 0}
            className={`w-full sm:w-auto px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${currentQ === 0 ? 'opacity-0 pointer-events-none' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
          >
            <ArrowLeft className="w-5 h-5" /> Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!answered || mutation.isPending}
            className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 ${!answered
                ? 'bg-surface-100 text-surface-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg active:scale-95'
              }`}
          >
            {currentQ === totalQ - 1 ? 'Submit Assessment' : 'Next Question'}
            {currentQ === totalQ - 1 ? <CheckCircle className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          </button>
        </div>

        {/* Question dots */}
        <div className="flex justify-center gap-2 flex-wrap mt-10">
          {questions.map((q, i) => (
            <button key={q.id} onClick={() => setCurrentQ(i)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${i === currentQ ? 'bg-indigo-600 w-8' :
                  answers[q.id] !== undefined ? 'bg-emerald-400' : 'bg-surface-200'
                }`} />
          ))}
        </div>
      </div>
    </div>
  );
}
