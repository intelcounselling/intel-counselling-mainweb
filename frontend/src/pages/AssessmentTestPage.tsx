import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import Assessment from '../components/Assessment';
import ClinicalAssessment from '../components/ClinicalAssessment';
import AssessmentRegistration from '../components/AssessmentRegistration';
import CareerPaymentGate from '../components/CareerPaymentGate';
import { CLINICAL_CONFIGS } from '../components/ClinicalQuestions';
import { apiClient } from '../utils/api';
import { useAuthUser } from '../utils/auth';

// Flow: sign in → intake (once per account) → payment (career only) → test.
// Free clinical screenings can also be taken signed-out; the result screen
// then offers to save the result to an account.
const AssessmentTestPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const resultId = searchParams.get('id');
  // Retake flow: purchasers revisit via /my-results and skip the payment gate
  const isRetake = searchParams.get('retake') === '1';
  const user = useAuthUser();
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [paidChecked, setPaidChecked] = useState(false);

  // Intake status for the signed-in account
  useEffect(() => {
    if (!user) {
      setProfileComplete(null);
      return;
    }
    let alive = true;
    apiClient.get<any>('/api/profile')
      .then((d) => alive && setProfileComplete(!!d.complete))
      .catch(() => alive && setProfileComplete(false));
    return () => { alive = false; };
  }, [user?.id]);

  // Career payment status: paid on this device, or a confirmed retake purchase
  useEffect(() => {
    if (localStorage.getItem('career_paid') === 'true') {
      setIsPaid(true);
      setPaidChecked(true);
    } else if (isRetake && user) {
      // ?retake=1 is just a URL — confirm the purchase before skipping the gate
      apiClient.get<{ entitled: boolean }>('/api/career-access')
        .then((r) => setIsPaid(!!r.entitled))
        .catch(() => {})
        .finally(() => setPaidChecked(true));
    } else {
      setPaidChecked(true);
    }
  }, [isRetake, user?.id]);

  if (!testId || (testId !== 'career' && !CLINICAL_CONFIGS[testId])) {
    return <Navigate to="/assessments" replace />;
  }

  // Leaving a test: signed-in users go back to their dashboard
  const exit = () => navigate(user ? '/my-results' : '/assessments');
  const isCareer = testId === 'career';
  const testTitle = isCareer ? 'Career Guidance Assessment' : CLINICAL_CONFIGS[testId].title;

  // Step 1: account — required for the paid career test
  if (isCareer && !user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  const spinner = (
    <div className="min-h-screen bg-[#F6F7F9] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-terracotta border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (user && (profileComplete === null || (isCareer && !paidChecked))) return spinner;

  // Step 2: intake, once per account (not needed to view a saved result)
  if (user && !profileComplete && !resultId) {
    return (
      <AssessmentRegistration
        testTitle={testTitle}
        onComplete={() => setProfileComplete(true)}
        onClose={exit}
      />
    );
  }

  // Step 3: payment (career only)
  if (isCareer && !isPaid && !resultId) {
    return (
      <CareerPaymentGate
        customer={user!}
        onSuccess={() => {
          localStorage.setItem('career_paid', 'true');
          setIsPaid(true);
        }}
        onClose={exit}
      />
    );
  }

  // Step 4: the test itself
  return (
    <div className="relative min-h-screen">
      {user && (
        <div className="fixed bottom-4 left-4 z-[999] hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-intel-dark/60 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full border border-black/5 shadow-md print:hidden">
          <span>Signed in as <strong className="text-intel-dark">{user.name}</strong></span>
          <span className="opacity-40">|</span>
          <Link to="/my-results" className="text-terracotta hover:opacity-75 transition-opacity">My Results</Link>
        </div>
      )}

      {isCareer ? (
        <Assessment type="career" onClose={exit} />
      ) : (
        <ClinicalAssessment config={CLINICAL_CONFIGS[testId]} onClose={exit} />
      )}
    </div>
  );
};

export default AssessmentTestPage;
