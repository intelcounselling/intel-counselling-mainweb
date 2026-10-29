import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import Assessment from '../components/Assessment';
import ClinicalAssessment from '../components/ClinicalAssessment';
import AssessmentRegistration from '../components/AssessmentRegistration';
import CareerPaymentGate from '../components/CareerPaymentGate';
import IntellAssessment from '../components/IntellAssessment';
import GuardianConsent from '../components/GuardianConsent';
import { AssessmentPage } from '../components/AssessmentUI';
import { isIntellTest, INTELL_HUB } from '../utils/intellMeta';
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
  // Under 18 with no parent consent yet (DPDP Act): nothing can be saved until a parent confirms
  const [guardianRequired, setGuardianRequired] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paidChecked, setPaidChecked] = useState(false);
  // Intel assessments: one purchase on the account unlocks all of them
  const [intellAccess, setIntellAccess] = useState<boolean | null>(null);
  const isIntell = isIntellTest(testId);
  const fromIntell = searchParams.get('from') === 'intell';

  useEffect(() => {
    if (!isIntell || !user) return;
    let alive = true;
    apiClient.get<{ entitled: boolean }>('/api/intell/status')
      .then((s) => alive && setIntellAccess(!!s.entitled))
      .catch(() => alive && setIntellAccess(false));
    return () => { alive = false; };
  }, [isIntell, user?.id]);

  // Intake status for the signed-in account
  useEffect(() => {
    if (!user) {
      setProfileComplete(null);
      return;
    }
    let alive = true;
    apiClient.get<any>('/api/profile')
      .then((d) => { if (alive) { setProfileComplete(!!d.complete); setGuardianRequired(!!d.guardianRequired); } })
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

  if (!testId || (testId !== 'career' && !CLINICAL_CONFIGS[testId] && !isIntell)) {
    return <Navigate to="/assessments" replace />;
  }

  // Leaving a test: signed-in users go back to their dashboard
  const exit = () => navigate(isIntell || fromIntell ? INTELL_HUB : user ? '/my-results' : '/assessments');
  const isCareer = testId === 'career';
  const testTitle = isCareer ? 'Career Guidance Assessment' : isIntell ? 'Intel Student Assessments' : CLINICAL_CONFIGS[testId].title;

  // Step 1: account — required for the paid career test
  if ((isCareer || isIntell) && !user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  const spinner = (
    <AssessmentPage align="center">
      <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading"></div>
    </AssessmentPage>
  );

  if (user && (profileComplete === null || (isCareer && !paidChecked) || (isIntell && intellAccess === null))) return spinner;

  // Not bought yet: the Intel hub explains the assessments and takes the payment
  if (isIntell && !intellAccess) return <Navigate to={INTELL_HUB} replace />;

  // Step 2: intake, once per account (not needed to view a saved result)
  if (user && !profileComplete && !resultId) {
    return (
      <AssessmentRegistration
        testTitle={testTitle}
        onComplete={() => apiClient.get<any>('/api/profile').then((d) => { setGuardianRequired(!!d.guardianRequired); setProfileComplete(true); }).catch(() => setProfileComplete(true))}
        onClose={exit}
      />
    );
  }

  // Step 2b: a parent confirms consent for under-18 accounts
  if (user && guardianRequired && !resultId) {
    return <GuardianConsent onVerified={() => setGuardianRequired(false)} onClose={exit} />;
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
        <div className="fixed bottom-4 left-4 z-[999] hidden md:flex items-center gap-2 text-xs font-semibold text-intel-dark/65 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full border border-black/5 shadow-md print:hidden">
          <span>Signed in as <strong className="text-intel-dark">{user.name}</strong></span>
          <span className="opacity-40">|</span>
          <Link to="/my-results" className="text-terracotta hover:opacity-75 transition-opacity">My Results</Link>
        </div>
      )}

      {isCareer ? (
        <Assessment type="career" onClose={exit} />
      ) : isIntell ? (
        <IntellAssessment key={testId} testId={testId!} onClose={exit} />
      ) : (
        <ClinicalAssessment config={CLINICAL_CONFIGS[testId]} onClose={exit} />
      )}
    </div>
  );
};

export default AssessmentTestPage;
