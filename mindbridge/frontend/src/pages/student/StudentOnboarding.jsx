import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';
import { Card, Button, Spinner } from '../../components/ui';
import api from '../../lib/axios';
import useAuthStore from '../../store/authStore';

const ISSS_CATEGORIES = ['LearningPattern', 'StudyBehaviour', 'EmotionalWellness', 'InternetUsage', 'PersonalityDimensions'];

export default function StudentOnboarding() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const setAuth = useAuthStore(s => s.setAuth);

  const [step, setStep] = useState('welcome'); // 'welcome', 'test', 'done'
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});

  // Fetch tests
  const { data: testsData, isLoading } = useQuery({
    queryKey: ['student-tests-onboarding'],
    queryFn: () => api.get('/student/tests').then(r => r.data.tests || []),
  });

  // Fix JSON parsing bug for questions
  const parseQuestions = (q) => {
    if (typeof q === 'string') {
      try { return JSON.parse(q); } catch (e) { return []; }
    }
    return q || [];
  };

  const onboardingTests = (testsData || []).filter(t => ISSS_CATEGORIES.includes(t.category));
  const currentTest = onboardingTests[currentTestIndex];
  const questions = parseQuestions(currentTest?.questions);
  const currentQuestion = questions[currentQ];
  const answered = answers[currentQuestion?.id] !== undefined;

  // Submit test mutation
  const submitMutation = useMutation({
    mutationFn: () => api.post(`/student/tests/${currentTest.id}/submit`, {
      answers: Object.entries(answers).map(([questionId, value]) => ({ questionId: parseInt(questionId), value })),
      shareWithTherapist: true,
    }),
    onSuccess: () => {
      if (currentTestIndex < onboardingTests.length - 1) {
        setCurrentTestIndex(i => i + 1);
        setCurrentQ(0);
        setAnswers({});
      } else {
        setStep('done');
        completeOnboardingMutation.mutate();
      }
    }
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: () => api.put('/student/onboard'),
    onSuccess: () => setAuth({ user: { ...user, isOnboarded: true }, accessToken: null })
  });

  if (isLoading) return <div className="min-h-screen bg-surface-900 flex justify-center items-center"><Spinner size="xl" /></div>;

  const startAssessments = () => {
    if (onboardingTests.length === 0) {
      setStep('done');
      completeOnboardingMutation.mutate();
    } else {
      setStep('test');
    }
  };

  const handleAnswer = (questionId, value) => setAnswers(prev => ({ ...prev, [questionId]: value }));

  const handleNextQ = () => {
    if (currentQ < questions.length - 1) setCurrentQ(q => q + 1);
    else submitMutation.mutate();
  };

  // Progress calculations
  const progressPct = questions.length ? Math.round(((currentQ) / questions.length) * 100) : 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #312e81 100%)' }}>
      
      {/* Animated Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000" />

      {step === 'welcome' && (
        <div className="max-w-2xl w-full p-10 animate-slide-up text-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] shadow-2xl relative z-10">
          <div className="w-24 h-24 bg-white/20 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-white/30 transform hover:scale-110 transition-transform duration-300">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-6 tracking-tight">Welcome to MindBridge, {user?.firstName}!</h1>
          <p className="text-indigo-100 text-lg leading-relaxed mb-10">
            Before you access your dashboard, we need to ask you a few questions. This helps us understand your learning style, emotional wellness, and personality.
          </p>
          
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-left mb-10 backdrop-blur-sm">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2 text-lg">
              <ShieldCheck className="w-6 h-6 text-indigo-300" />
              Your Privacy is Protected
            </h3>
            <p className="text-sm text-indigo-100 leading-relaxed">
              Your answers are securely stored and only shared with your school's designated mental health team. They are <strong className="text-white">not</strong> shared with other students or regular teachers.
            </p>
          </div>

          <button onClick={startAssessments} className="w-full sm:w-auto px-12 py-4 bg-white text-indigo-900 rounded-full font-bold text-lg hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300 flex items-center justify-center gap-3 mx-auto">
            I understand, let's begin <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {step === 'test' && currentTest && (
        <div className="max-w-3xl w-full p-10 animate-slide-up bg-white rounded-[2.5rem] shadow-2xl relative z-10">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-surface-100 pb-6 gap-4">
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2 bg-indigo-50 inline-block px-3 py-1 rounded-full">
                Assessment {currentTestIndex + 1} of {onboardingTests.length}
              </p>
              <h2 className="text-3xl font-extrabold text-surface-900 tracking-tight">{currentTest.name}</h2>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <p className="text-sm font-bold text-surface-400 mb-2">Question {currentQ + 1} of {questions.length}</p>
              <div className="w-full sm:w-32 h-2 bg-surface-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>

          <div className="mb-10">
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
                  className={`w-full text-left px-6 py-5 rounded-2xl border-2 transition-all duration-200 transform hover:scale-[1.01] ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 shadow-md'
                      : 'border-surface-200 hover:border-indigo-300 hover:bg-surface-50 text-surface-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-surface-300'
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </div>
                    <span className={`text-lg font-medium ${isSelected ? 'text-indigo-900' : 'text-surface-700'}`}>{option.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-10 flex justify-end">
            <button
              onClick={handleNextQ}
              disabled={!answered || submitMutation.isPending}
              className={`px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all duration-300 ${
                !answered 
                  ? 'bg-surface-100 text-surface-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg active:scale-95'
              }`}
            >
              {currentQ === questions.length - 1 ? 'Submit Assessment' : 'Next Question'}
              {currentQ === questions.length - 1 ? <CheckCircle className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="max-w-2xl w-full p-12 animate-slide-up text-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] shadow-2xl relative z-10">
          <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-500/30 animate-bounce">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-4">All done! 🎉</h2>
          <p className="text-emerald-100 text-lg mb-10">
            Thank you for completing your intake assessments. We've set up your dashboard with personalized insights.
          </p>
          <button onClick={() => navigate('/student', { replace: true })} className="px-10 py-4 bg-white text-emerald-900 rounded-full font-bold text-lg hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300">
            Go to my Dashboard
          </button>
        </div>
      )}

    </div>
  );
}
