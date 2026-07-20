import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import Assessment from '../components/Assessment';
import ClinicalAssessment from '../components/ClinicalAssessment';
import AssessmentRegistration from '../components/AssessmentRegistration';
import CareerPaymentGate from '../components/CareerPaymentGate';
import { CLINICAL_CONFIGS } from '../components/ClinicalQuestions';

const AssessmentTestPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resultId = searchParams.get('id');
  const [registration, setRegistration] = useState<any>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('assessment_registration');
    if (saved) {
      try {
        setRegistration(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse registration details', e);
      }
    }
    // Check if career test was already paid this session
    const paid = sessionStorage.getItem('career_paid');
    if (paid === 'true') setIsPaid(true);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F7F9] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-terracotta border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!testId || (testId !== 'career' && !CLINICAL_CONFIGS[testId])) {
    return <Navigate to="/assessments" replace />;
  }

  // Step 1: Registration gate (all tests)
  if (!registration && !resultId) {
    return (
      <AssessmentRegistration
        testId={testId}
        onComplete={(data) => setRegistration(data)}
        onClose={() => navigate('/assessments')}
      />
    );
  }

  // Step 2: Payment gate (career test only)
  if (testId === 'career' && !isPaid && !resultId) {
    return (
      <CareerPaymentGate
        registration={registration}
        onSuccess={() => {
          sessionStorage.setItem('career_paid', 'true');
          setIsPaid(true);
        }}
        onClose={() => navigate('/assessments')}
      />
    );
  }

  // Step 3: Render the actual test
  const renderTest = () => {
    if (testId === 'career') {
      return (
        <Assessment
          type="career"
          onClose={() => navigate('/assessments')}
        />
      );
    }
    return (
      <ClinicalAssessment
        config={CLINICAL_CONFIGS[testId]}
        onClose={() => navigate('/assessments')}
      />
    );
  };

  return (
    <div className="relative min-h-screen">
      {/* Persistent Client Registration Status Badge */}
      <div className="fixed bottom-4 left-4 z-[999] flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-intel-dark/60 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full border border-black/5 shadow-md print:hidden">
        {registration && <span>Testing as: <strong className="text-intel-dark">{registration.name}</strong></span>}
        {registration && <span className="opacity-40">|</span>}
        <button
          onClick={() => {
            if (window.confirm("Changing details will restart your current assessment. Would you like to continue?")) {
              localStorage.removeItem('assessment_registration');
              sessionStorage.removeItem('career_paid');
              setRegistration(null);
              setIsPaid(false);
            }
          }}
          className="text-terracotta hover:opacity-75 transition-opacity font-black uppercase"
        >
          Change Details
        </button>
      </div>

      {renderTest()}
    </div>
  );
};

export default AssessmentTestPage;
