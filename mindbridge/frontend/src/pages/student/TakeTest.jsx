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
  const questions = test?.questions || [];
  const totalQ = questions.length;
  const progress = totalQ ? Math.round((Object.keys(answers).length / totalQ) * 100) : 0;
  const currentQuestion = questions[currentQ];
  const answered = answers[currentQuestion?.id] !== undefined;

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQ < totalQ - 1) setCurrentQ(q => q + 1);
    else mutation.mutate();
  };

  const handlePrev = () => setCurrentQ(q => Math.max(0, q - 1));

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;
  if (!test) return <div className="text-center py-20 text-surface-500">Test not found</div>;

  // ── Result View ───────────────────────────────────────────────
  if (result) {
    const isLow = result.isLow;
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
        <Card className="text-center">
          <div className="text-6xl mb-4">{isLow ? '💙' : '✅'}</div>
          <h2 className="text-2xl font-bold text-surface-900 mb-2">Assessment Complete</h2>
          <p className="text-surface-500 mb-6">{test.name}</p>

          <div className="bg-surface-50 rounded-2xl p-6 mb-6">
            <p className="text-sm text-surface-500 mb-1">Your Score</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl font-bold text-surface-900">{result.result?.score}</span>
              <span className="text-xl text-surface-400">/ {result.result?.maxScore}</span>
            </div>
            <div className="mt-3 flex justify-center">
              <SeverityBadge severity={result.severity} size="md" />
            </div>
          </div>

          {isLow && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 text-left">
              <p className="font-semibold text-amber-900 mb-1">💛 You're not alone</p>
              <p className="text-sm text-amber-700">
                Your score suggests you might benefit from talking to someone.
                We've notified your school's mental health team, who will reach out soon.
              </p>
            </div>
          )}

          {/* Share toggle */}
          <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl mb-5">
            <div className="text-left">
              <p className="text-sm font-medium text-primary-900">Share with therapist</p>
              <p className="text-xs text-primary-600">Allow your school's psychiatrist to view this result</p>
            </div>
            <button
              onClick={() => setShareWithTherapist(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${shareWithTherapist ? 'bg-primary-600' : 'bg-surface-300'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${shareWithTherapist ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/student/results')}>
              View All Results
            </Button>
            <Button variant="primary" className="flex-1" onClick={() => navigate('/student')}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ── Test View ─────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate(-1)}>Back</Button>
        <div className="flex-1">
          <p className="text-sm font-medium text-surface-500">{test.name}</p>
          <p className="text-xs text-surface-400">Question {currentQ + 1} of {totalQ}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Question Card */}
      <Card>
        <div className="mb-8">
          <span className="inline-block bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Question {currentQ + 1}
          </span>
          <h3 className="text-lg font-semibold text-surface-900 leading-relaxed">
            {currentQuestion?.text}
          </h3>
        </div>

        <div className="space-y-3">
          {(currentQuestion?.options || []).map(option => {
            const isSelected = answers[currentQuestion.id] === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleAnswer(currentQuestion.id, option.value)}
                className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-150 ${
                  isSelected
                    ? 'border-primary-600 bg-primary-50 text-primary-900'
                    : 'border-surface-200 hover:border-primary-300 hover:bg-primary-50/30 text-surface-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    isSelected ? 'border-primary-600 bg-primary-600' : 'border-surface-300'
                  }`}>
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className="font-medium">{option.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-8">
          <Button variant="ghost" onClick={handlePrev} disabled={currentQ === 0}
            icon={<ArrowLeft className="w-4 h-4" />}>Previous</Button>

          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!answered}
            loading={mutation.isPending}
            icon={currentQ === totalQ - 1 ? <CheckCircle className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          >
            {currentQ === totalQ - 1 ? 'Submit' : 'Next'}
          </Button>
        </div>
      </Card>

      {/* Question dots */}
      <div className="flex justify-center gap-1.5 flex-wrap">
        {questions.map((q, i) => (
          <button key={q.id} onClick={() => setCurrentQ(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === currentQ ? 'bg-primary-600 w-6' :
              answers[q.id] !== undefined ? 'bg-green-500' : 'bg-surface-300'
            }`} />
        ))}
      </div>
    </div>
  );
}
