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
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-[#1c1a3b]">
      <div className="max-w-[700px] w-full p-10 animate-slide-up bg-white rounded-[2rem] shadow-xl relative z-10 min-h-[400px] flex flex-col">
        
        {/* Header */}
        <div className="mb-8">
          <div className="inline-block bg-[#eff0ff] text-[#5551ff] text-[10px] font-bold px-3 py-1.5 rounded-full mb-4 uppercase tracking-widest">
            Assessment {currentQ === 0 ? 1 : 1} of 5
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-[#f0eee9] pb-6 gap-4">
            <h2 className="text-3xl font-bold text-[#111111] font-serif tracking-tight" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>
              {test.name}
            </h2>
            <div className="text-right flex-shrink-0">
              <p className="text-[#8c8270] text-sm font-bold tracking-wide">Question {currentQ + 1} of {totalQ}</p>
              <div className="w-full h-1 bg-[#e4dcd0] mt-2 rounded-full" />
            </div>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-2xl font-bold text-[#222222] font-serif leading-relaxed mb-10" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>
            {currentQuestion?.text}
          </h3>

          <div className="space-y-3 mb-10">
            {(currentQuestion?.options || []).map(option => {
              const isSelected = answers[currentQuestion.id] === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(currentQuestion.id, option.value)}
                  className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.01] ${
                    isSelected
                      ? 'border-[#c7bca7] bg-[#fdfaf5] shadow-sm'
                      : 'border-[#f2efeb] hover:border-[#e0d6c3] hover:bg-[#faf8f5] text-[#444444]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      isSelected ? 'border-[#8c8270] bg-[#8c8270]' : 'border-[#d1cac0]'
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className={`text-lg ${isSelected ? 'text-[#333333] font-semibold' : 'text-[#555555]'}`}>{option.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between mt-auto gap-4">
          <button 
            onClick={handlePrev} 
            disabled={currentQ === 0}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              currentQ === 0 ? 'opacity-0 pointer-events-none' : 'text-[#8c8270] hover:bg-[#f5f2eb]'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!answered || mutation.isPending}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
              !answered 
                ? 'bg-[#f0ece5] text-[#b3aaa0] cursor-not-allowed'
                : 'bg-[#e5ddd0] text-[#786c5c] hover:bg-[#d9d0c2] hover:shadow-md active:scale-95'
            }`}
          >
            {currentQ === totalQ - 1 ? 'Submit Assessment' : 'Next Question'}
            {currentQ === totalQ - 1 ? <CheckCircle className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
