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

  const onboardingTests = (testsData || []).filter(t => ISSS_CATEGORIES.includes(t.category));
  const currentTest = onboardingTests[currentTestIndex];
  const questions = currentTest?.questions || [];
  const currentQuestion = questions[currentQ];
  const answered = answers[currentQuestion?.id] !== undefined;

  // Submit test mutation
  const submitMutation = useMutation({
    mutationFn: () => api.post(`/student/tests/${currentTest.id}/submit`, {
      answers: Object.entries(answers).map(([questionId, value]) => ({ questionId: parseInt(questionId), value })),
      shareWithTherapist: true, // During onboarding, we assume sharing for baseline
    }),
    onSuccess: () => {
      if (currentTestIndex < onboardingTests.length - 1) {
        // Next test
        setCurrentTestIndex(i => i + 1);
        setCurrentQ(0);
        setAnswers({});
      } else {
        // All done
        setStep('done');
        completeOnboardingMutation.mutate();
      }
    }
  });

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: () => api.put('/student/onboard'),
    onSuccess: () => {
      // Update local auth state
      setAuth({ user: { ...user, isOnboarded: true }, accessToken: null });
    }
  });

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  const startAssessments = () => {
    if (onboardingTests.length === 0) {
      setStep('done');
      completeOnboardingMutation.mutate();
    } else {
      setStep('test');
    }
  };

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNextQ = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      submitMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      
      {step === 'welcome' && (
        <Card className="max-w-2xl w-full p-10 animate-slide-up text-center">
          <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-surface-900 mb-4">Welcome to MindBridge, {user?.firstName}!</h1>
          <p className="text-surface-600 text-lg leading-relaxed mb-8">
            Before you access your dashboard, we need to ask you a few questions. This helps us understand your learning style, emotional wellness, and personality.
          </p>
          
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-left mb-8">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Your Privacy is Protected
            </h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              Your answers are securely stored and only shared with your school's designated mental health team (like your counsellor). They are <strong>not</strong> shared with other students or regular teachers. This space is designed to support you.
            </p>
          </div>

          <Button size="lg" className="w-full sm:w-auto px-10" onClick={startAssessments} icon={<ArrowRight className="w-5 h-5" />}>
            I understand, let's begin
          </Button>
        </Card>
      )}

      {step === 'test' && currentTest && (
        <Card className="max-w-3xl w-full p-8 animate-slide-up">
          <div className="mb-8 flex justify-between items-end border-b border-surface-100 pb-4">
            <div>
              <p className="text-sm font-medium text-primary-600 uppercase tracking-wider mb-1">
                Assessment {currentTestIndex + 1} of {onboardingTests.length}
              </p>
              <h2 className="text-2xl font-bold text-surface-900">{currentTest.name}</h2>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-surface-500">Question {currentQ + 1} of {questions.length}</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-medium text-surface-900 leading-relaxed">
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

          <div className="mt-8 flex justify-end">
            <Button
              size="lg"
              onClick={handleNextQ}
              disabled={!answered}
              loading={submitMutation.isPending}
              icon={currentQ === questions.length - 1 ? <CheckCircle className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            >
              {currentQ === questions.length - 1 ? 'Submit Assessment' : 'Next Question'}
            </Button>
          </div>
        </Card>
      )}

      {step === 'done' && (
        <Card className="max-w-2xl w-full p-10 animate-slide-up text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-surface-900 mb-4">All done! 🎉</h2>
          <p className="text-surface-600 text-lg mb-8">
            Thank you for completing your intake assessments. We've set up your dashboard with personalized insights.
          </p>
          <Button size="lg" onClick={() => navigate('/student', { replace: true })}>
            Go to my Dashboard
          </Button>
        </Card>
      )}

    </div>
  );
}
