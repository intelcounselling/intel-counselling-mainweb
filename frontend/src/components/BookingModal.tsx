import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2, ChevronRight, ArrowLeft, ShieldCheck, MapPin, Monitor, Loader2, X, Check, Sparkles,
  User, HeartPulse, PenLine, Gauge, LifeBuoy, Target, CalendarDays, CreditCard,
} from 'lucide-react';
import { MI_QUESTIONS, INTEREST_QUESTIONS, PERSONALITY_QUESTIONS } from './TestQuestions';
import { CLINICAL_CONFIGS } from './ClinicalQuestions';
import { apiClient } from '../utils/api';
import { useAuthUser } from '../utils/auth';
import { usePricing } from '../utils/pricing';
import { payWithRazorpay, PaymentCancelledError } from '../utils/payments';

const ALL_QUESTIONS = [...MI_QUESTIONS, ...INTEREST_QUESTIONS, ...PERSONALITY_QUESTIONS];

const getAvailableSlots = (date: string) => [
  '09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'
];

interface BookingModalProps {
  onClose: () => void;
}

const STEPS_META = [
  { title: 'Basic details', icon: User, tint: 'bg-lavender' },
  { title: 'Main concern', icon: HeartPulse, tint: 'bg-sage' },
  { title: 'Brief details', icon: PenLine, tint: 'bg-peach' },
  { title: 'Current state', icon: Gauge, tint: 'bg-sky' },
  { title: 'Safety check', icon: LifeBuoy, tint: 'bg-[#F9D9D4]' },
  { title: 'Expectations', icon: Target, tint: 'bg-lavender' },
  { title: 'Consent', icon: ShieldCheck, tint: 'bg-sage' },
  { title: 'Schedule session', icon: CalendarDays, tint: 'bg-sky' },
  { title: 'Payment', icon: CreditCard, tint: 'bg-terracotta' },
];

const CHIP_TINTS = ['bg-lavender', 'bg-sage', 'bg-peach', 'bg-sky'];

const FIELD =
  'w-full bg-white/10 border-2 border-transparent rounded-2xl px-4 py-3.5 text-white placeholder:text-white/35 outline-none focus:border-terracotta focus:bg-white/[0.14] transition-colors [color-scheme:dark]';
const LABEL = 'block text-sm font-semibold text-white/70 mb-1.5 ml-1';

// A pastel choice chip for checkboxes and radios. The input stays in the DOM (visually hidden)
// so keyboard use, validation and screen readers keep working.
const Choice: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { checked: boolean; tint: string; children: React.ReactNode }
> = ({ checked, tint, children, ...input }) => (
  <label className="cursor-pointer block">
    <input {...input} checked={checked} className="peer sr-only" />
    <span
      className={`flex items-center gap-2.5 rounded-2xl border-2 px-4 py-3.5 text-[15px] font-semibold transition-all duration-300 ease-bounce peer-focus-visible:ring-2 peer-focus-visible:ring-terracotta ${
        checked
          ? `${tint} border-terracotta text-intel-dark -rotate-1 scale-[1.02] shadow-[0_4px_0_rgba(193,155,108,0.45)]`
          : 'border-transparent bg-white/[0.07] text-white/80 hover:bg-white/[0.12]'
      }`}
    >
      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${checked ? 'bg-intel-dark text-terracotta' : 'border-2 border-white/30'}`}>
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      {children}
    </span>
  </label>
);

const StepIntro: React.FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <div>
    <h4 className="serif text-2xl md:text-[1.75rem] text-white leading-tight">{title}</h4>
    {hint && <p className="mt-1.5 text-sm text-white/55">{hint}</p>}
  </div>
);

const Progress: React.FC<{ step: number }> = ({ step }) => {
  const n = Math.min(step, 9);
  const meta = STEPS_META[n - 1];
  const Icon = meta.icon;
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-3 mb-3 text-sm pr-12">
        <span className="inline-flex items-center gap-2.5 font-semibold text-white">
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-intel-dark ${meta.tint}`} aria-hidden="true"><Icon size={18} /></span>
          {meta.title}
        </span>
        <span className="text-white/50 font-semibold">Step {n} of 9</span>
      </div>
      <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={9} aria-valuenow={n} aria-label="Booking progress">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className={`bk-wave h-2.5 flex-1 rounded-full transition-colors duration-500 ${i < n ? 'bg-terracotta' : 'bg-white/10'} ${i === n - 1 ? 'scale-y-125' : ''}`}
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
};

const PaymentStep: React.FC<{
  bookingDetails: any,
  onSuccess: (gmeetLink: string, orderId?: string) => void,
  onBack: () => void
}> = ({ bookingDetails, onSuccess, onBack }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      // Resolves only after the server has verified the payment with Razorpay
      const orderId = await payWithRazorpay({
        serviceId: bookingDetails.service.id,
        serviceName: bookingDetails.service.name,
        customer: { name: bookingDetails.name, email: bookingDetails.email, phone: bookingDetails.phone },
      });
      onSuccess('', orderId);
    } catch (err: any) {
      if (!(err instanceof PaymentCancelledError)) setError(err?.message || 'The payment could not be completed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <StepIntro title="Almost there" hint="One quick payment and your session is booked." />
      <div className="rounded-[28px] bg-peach text-intel-dark p-6 md:p-7">
        <div className="flex items-end justify-between gap-4 pb-5 border-b border-intel-dark/10">
          <span className="text-sm font-semibold text-intel-dark/65">Total amount</span>
          <span className="serif text-4xl md:text-5xl">₹{bookingDetails.service.price}</span>
        </div>
        <div className="pt-5 flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-white/70 flex items-center justify-center shrink-0" aria-hidden="true"><ShieldCheck size={24} className="text-serene-green" /></span>
          <div>
            <h5 className="font-semibold">Secure checkout via Razorpay</h5>
            <p className="text-sm text-intel-dark/65 leading-snug">Industry-standard encryption protects your payment.</p>
          </div>
        </div>
      </div>
      {error && <div role="alert" className="text-red-800 text-sm bg-[#F9D9D4] p-4 rounded-2xl">{error}</div>}
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="px-6 h-14 rounded-full font-semibold text-white bg-white/10 hover:bg-white/15 flex items-center gap-2"><ArrowLeft size={18} /> Back</button>
        <button onClick={handlePayment} disabled={isProcessing} className="flex-1 h-14 rounded-full bg-terracotta text-intel-dark text-lg font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:bg-[#cfac80] disabled:opacity-50 inline-flex items-center justify-center gap-2">
          {isProcessing ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <>Pay &amp; book <ChevronRight size={18} /></>}
        </button>
      </div>
    </div>
  );
};


const BookingModal: React.FC<BookingModalProps> = ({ onClose }) => {
  const { prices } = usePricing();
  const sessionPrices = { online: prices.session_online, inperson: prices.session_inperson };
  const [searchParams] = useSearchParams();
  const isFreeBooking = searchParams.get('freeBooking') === 'true';
  const [step, setStep] = useState<number>(1);
  const [meetLink, setMeetLink] = useState('');
  const [isFreeProcessing, setIsFreeProcessing] = useState(false);
  const [freeBookingError, setFreeBookingError] = useState<string | null>(null);
  // Paid booking after payment: emails are the only record of the booking, so
  // don't show "Thank You" until the server has confirmed them.
  const [paidConfirm, setPaidConfirm] = useState<{ orderId: string; link: string; failed: boolean } | null>(null);
  const user = useAuthUser();
  const [details, setDetails] = useState(() => {
    const savedSessionMode = (localStorage.getItem('career_booked_session_mode') as 'online' | 'inperson' | '') || '';
    const savedDate = localStorage.getItem('career_booked_date') || '';
    const savedTime = localStorage.getItem('career_booked_time') || '';

    return {
      name: user?.name || '',
      age: '',
      phone: user?.phone || '',
      email: user?.email || '',
      gender: '',
      mainConcerns: [] as string[],
      briefDetails: '',
      currentState: { stress: '', sleep: '', focus: '' },
      riskCheck: '',
      expectations: [] as string[],
      consent: false,
      sessionMode: savedSessionMode,
      date: savedDate,
      time: savedTime,
      shareAssessmentResult: true
    };
  });

  const [careerResult, setCareerResult] = useState<any | null>(null);
  // Intel Student Assessments buyer with at least one result: offer to share the report
  const [intellReady, setIntellReady] = useState(false);
  const [shareIntell, setShareIntell] = useState(true);

  // Signed in: pre-fill from the saved intake so details aren't typed twice
  useEffect(() => {
    if (!user) return;
    apiClient.get<any>('/api/intell/status')
      .then((s) => setIntellReady(!!s.entitled && (s.tests || []).some((t: any) => t.done)))
      .catch(() => {});
    apiClient.get<any>('/api/profile')
      .then((d) => {
        const p = d.profile || {};
        setDetails((prev) => ({
          ...prev,
          name: prev.name || d.user?.name || '',
          email: prev.email || d.user?.email || '',
          phone: prev.phone || p.phone || d.user?.phone || '',
          age: prev.age || p.age || '',
          gender: prev.gender || p.gender || '',
          briefDetails: prev.briefDetails || p.reason || '',
        }));
      })
      .catch(() => {});
  }, [user?.id]);
  const [clinicalResult, setClinicalResult] = useState<any | null>(null);

  useEffect(() => {
    const assessmentRef = searchParams.get('assessmentRef');
    if (assessmentRef) {
      try {
        const url = new URL(assessmentRef);
        const pathParts = url.pathname.split('/');
        const testId = pathParts[pathParts.length - 1];

        if (testId === 'career') {
          const id = url.searchParams.get('id') || '';
          if (id) {
            apiClient.get<any>(`/api/load-answers?id=${encodeURIComponent(id)}`)
              .then(data => {
                if (data.answers && data.answers.length === ALL_QUESTIONS.length) {
                  const parsed = data.answers.split('').map(Number);
                  const miScores: Record<string, number> = {};
                  const interestScores: Record<string, number> = {};
                  const personalityScores: Record<string, number> = {};

                  parsed.forEach((val: number, idx: number) => {
                    const q = ALL_QUESTIONS[idx];
                    if (idx < 40) {
                      miScores[q.category] = (miScores[q.category] || 0) + val;
                    } else if (idx < 140) {
                      interestScores[q.category] = (interestScores[q.category] || 0) + val;
                    } else {
                      personalityScores[q.category] = (personalityScores[q.category] || 0) + val;
                    }
                  });

                  const topInterests = Object.entries(interestScores)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([name]) => name);

                  const topIntelligence = Object.entries(miScores)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 2)
                    .map(([name]) => name);

                  setCareerResult({
                    mi: miScores,
                    interests: interestScores,
                    personality: personalityScores,
                    summary: {
                      topInterests,
                      topIntelligence,
                      profile: "Comprehensive Career Pioneer"
                    },
                    questions: ALL_QUESTIONS.map(q => q.text),
                    answers: parsed,
                    options: [
                      { label: "Strongly Disagree / No Interest", value: 0 },
                      { label: "Disagree / Low Interest", value: 1 },
                      { label: "Neutral / Moderate", value: 2 },
                      { label: "Agree / High Interest", value: 3 },
                      { label: "Strongly Agree / Very High", value: 4 }
                    ]
                  });
                }
              })
              .catch(err => console.error("Error loading assessment answers:", err));
          }
        } else if (CLINICAL_CONFIGS[testId]) {
          const rawAnswers = url.searchParams.get('r') || '';
          if (rawAnswers) {
            const parsed = rawAnswers.split('').map(Number);
            const config = CLINICAL_CONFIGS[testId];
            if (parsed.length === config.questions.length) {
              let totalScore = 0;
              parsed.forEach((val, idx) => {
                const q = config.questions[idx];
                if (q.reverseScore) {
                  const maxVal = config.options.length - 1;
                  totalScore += (maxVal - val);
                } else {
                  totalScore += val;
                }
              });
              const matchedBand = config.bands.find(b => totalScore >= b.min && totalScore <= b.max) || config.bands[0];
              const resultObj = {
                testId,
                title: config.title,
                score: totalScore,
                band: matchedBand,
                answers: parsed,
                questions: config.questions.map(q => q.text),
                options: config.options
              };
              console.log("Successfully parsed clinicalResult:", resultObj);
              setClinicalResult(resultObj);
            } else {
              console.log("Answer length mismatch:", parsed.length, "vs config:", config.questions.length);
            }
          } else {
            console.log("No rawAnswers parameter found in assessmentRef URL");
          }
        }
      } catch (e) {
        console.error("Error parsing assessmentRef:", e);
        // Fallback for direct IDs or legacy references
        const id = assessmentRef;
        if (id && id.length > 10) {
          apiClient.get<any>(`/api/load-answers?id=${encodeURIComponent(id)}`)
            .then(data => {
              if (data.answers && data.answers.length === ALL_QUESTIONS.length) {
                const parsed = data.answers.split('').map(Number);
                const miScores: Record<string, number> = {};
                const interestScores: Record<string, number> = {};
                const personalityScores: Record<string, number> = {};

                parsed.forEach((val: number, idx: number) => {
                  const q = ALL_QUESTIONS[idx];
                  if (idx < 40) {
                    miScores[q.category] = (miScores[q.category] || 0) + val;
                  } else if (idx < 140) {
                    interestScores[q.category] = (interestScores[q.category] || 0) + val;
                  } else {
                    personalityScores[q.category] = (personalityScores[q.category] || 0) + val;
                  }
                });

                const topInterests = Object.entries(interestScores)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([name]) => name);

                const topIntelligence = Object.entries(miScores)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 2)
                  .map(([name]) => name);

                setCareerResult({
                  mi: miScores,
                  interests: interestScores,
                  personality: personalityScores,
                  summary: {
                    topInterests,
                    topIntelligence,
                    profile: "Comprehensive Career Pioneer"
                  },
                  questions: ALL_QUESTIONS.map(q => q.text),
                  answers: parsed,
                  options: [
                    { label: "Strongly Disagree / No Interest", value: 0 },
                    { label: "Disagree / Low Interest", value: 1 },
                    { label: "Neutral / Moderate", value: 2 },
                    { label: "Agree / High Interest", value: 3 },
                    { label: "Strongly Agree / Very High", value: 4 }
                  ]
                });
              }
            })
            .catch(() => {});
        }
      }
    }
  }, [searchParams]);

  const today = new Date().toISOString().split('T')[0];
  const availableSlots = details.date ? getAvailableSlots(details.date) : [];

  // The free-session entitlement comes from the paid career assessment result:
  // assessmentRef is an encoded URL like /assessments/career?id=<uuid>.
  const extractFreeResultId = (): string | null => {
    const assessmentRef = searchParams.get('assessmentRef');
    if (!assessmentRef) return null;
    try {
      return new URL(assessmentRef).searchParams.get('id');
    } catch (e) {
      return null;
    }
  };

  const handleBookingSuccess = async (link: string, orderId?: string) => {
    const isOnline = details.sessionMode === 'online';
    const serviceName = details.mainConcerns.join(', ') || 'Consultation';

    const emailBody = {
      toName: details.name,
      customerEmail: details.email,
      serviceName: serviceName,
      appointmentDate: details.date,
      appointmentTime: details.time,
      sessionMode: isOnline ? 'Online (Virtual)' : 'In-Person',
      meetLink: isOnline ? link : null,
      rescheduleInfo: 'If you need to change your timing, please reply to this email to reschedule at least 24 hours in advance.',
      fullDetails: details, // Pass complete form structure for PDF generation
      assessmentUrl: new URLSearchParams(window.location.search).get('assessmentRef') || null,
      shareAssessmentResult: details.shareAssessmentResult && (!!careerResult || !!clinicalResult),
      careerResult: careerResult,
      clinicalResult: clinicalResult,
      shareIntellReport: intellReady && shareIntell,
      orderId: orderId || null,
      isFree: isFreeBooking,
      freeResultId: isFreeBooking ? extractFreeResultId() : undefined
    };

    const confirmBooking = (serverLink?: string | null) => {
      localStorage.removeItem('career_booked_session_mode');
      localStorage.removeItem('career_booked_date');
      localStorage.removeItem('career_booked_time');
      setMeetLink(serverLink || link);
      setStep(10); // Final Confirmation Step
    };

    if (isFreeBooking) {
      // Free bookings are gated server-side — wait for the verdict before
      // showing the success screen.
      setFreeBookingError(null);
      try {
        await apiClient.post('/api/send-booking-email', emailBody);
        console.log("Confirmation emails sent via Brevo.");
      } catch (error: any) {
        console.error("Failed to send confirmation emails:", error);
        if (error.status === 402) {
          setFreeBookingError('This free session link is not valid. The complimentary session is only available with the Career Assessment + Session package. Please book a regular session instead, or contact us if you believe this is a mistake.');
          return;
        }
      }
      confirmBooking();
      return;
    }

    // Paid flow: the server claims the order and sends the emails. If that
    // fails the order is released, so the customer can retry without paying again.
    setPaidConfirm({ orderId: orderId || '', link, failed: false });
    try {
      const data = await apiClient.post<any>('/api/send-booking-email', emailBody);
      setPaidConfirm(null);
      confirmBooking(data?.meetLink);
    } catch (error) {
      console.error("Failed to send confirmation emails:", error);
      setPaidConfirm({ orderId: orderId || '', link, failed: true });
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFreeBooking && step === 8) {
      // Skip payment entirely for free bookings (post career assessment)
      handleFreeBookingConfirm();
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleFreeBookingConfirm = async () => {
    setIsFreeProcessing(true);
    try {
      await handleBookingSuccess('');
    } catch (err) {
      console.error('Free booking confirm error:', err);
      await handleBookingSuccess('');
    } finally {
      setIsFreeProcessing(false);
    }
  };

  const toggleArrayItem = (field: 'mainConcerns' | 'expectations', value: string) => {
    setDetails(prev => {
      const current = prev[field];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const modeLabel = details.sessionMode === 'online' ? 'Online (Google Meet)' : 'In person';

  return (
    <div className="relative w-full max-w-2xl">
      {/* Tilted pastel cards peeking out from behind */}
      <span className="pointer-events-none absolute inset-0 rounded-[32px] bg-peach rotate-[2.5deg] translate-x-2 translate-y-2" aria-hidden="true" />
      <span className="pointer-events-none absolute inset-0 rounded-[32px] bg-sage -rotate-[2deg] -translate-x-1 translate-y-1" aria-hidden="true" />

      <div className="relative w-full bg-[#1F1E1B] rounded-[32px] shadow-[0_24px_60px_rgba(26,26,26,0.3)] overflow-hidden border border-white/10 animate-in fade-in slide-in-from-bottom-8 duration-500 max-h-[90vh] flex flex-col">
        <div className="relative p-6 md:p-10 overflow-y-auto overflow-x-hidden flex-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {step < 10 && (
            <button
              type="button"
              onClick={() => {
                if (step === 1 || window.confirm('Leave the booking form? Your answers will not be saved.')) onClose();
              }}
              aria-label="Close booking form"
              className="absolute right-4 top-4 md:right-6 md:top-6 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 hover:rotate-90 text-white/70 hover:text-white flex items-center justify-center transition-all duration-300"
            >
              <X size={18} />
            </button>
          )}

          {step === 1 && (
            <div className="mb-8 pr-10">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta mb-2"><Sparkles size={14} /> Let&rsquo;s get you booked</p>
              <h3 className="serif text-3xl md:text-4xl text-white leading-tight">Book a <span className="italic text-terracotta">session</span></h3>
              <p className="mt-3 text-white/60 leading-relaxed">This confidential form helps us understand your concern. It takes 3–5 minutes.</p>
            </div>
          )}

          {step < 10 && <Progress step={step} />}

          {/* --- QUESTIONNAIRE SECTIONS --- */}
          <form onSubmit={handleNext}>

            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <StepIntro title="First, a little about you" />
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="bk-name" className={LABEL}>Full name</label>
                    <input id="bk-name" required type="text" value={details.name} onChange={e => setDetails({ ...details, name: e.target.value })} className={FIELD} />
                  </div>
                  <div>
                    <label htmlFor="bk-age" className={LABEL}>Age</label>
                    <input id="bk-age" required type="number" min="12" max="100" value={details.age} onChange={e => setDetails({ ...details, age: e.target.value })} className={FIELD} />
                  </div>
                  <div>
                    <label htmlFor="bk-phone" className={LABEL}>Phone number</label>
                    <input id="bk-phone" required type="tel" value={details.phone} onChange={e => setDetails({ ...details, phone: e.target.value })} className={FIELD} />
                  </div>
                  <div>
                    <label htmlFor="bk-email" className={LABEL}>Email</label>
                    <input id="bk-email" required type="email" value={details.email} onChange={e => setDetails({ ...details, email: e.target.value })} className={FIELD} />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="bk-gender" className={LABEL}>Gender</label>
                    <select id="bk-gender" required value={details.gender} onChange={e => setDetails({ ...details, gender: e.target.value })} className={FIELD}>
                      <option className="text-black" value="">Select gender...</option>
                      <option className="text-black" value="Male">Male</option>
                      <option className="text-black" value="Female">Female</option>
                      <option className="text-black" value="Non-Binary">Non-Binary</option>
                      <option className="text-black" value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <StepIntro title="What's on your mind?" hint="Select all that apply." />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['Stress', 'Anxiety', 'Low mood', 'Relationship issues', 'Academic / Work issues', 'Sleep issues', 'Career confusion', 'Other'].map((concern, i) => (
                    <Choice key={concern} type="checkbox" checked={details.mainConcerns.includes(concern)} onChange={() => toggleArrayItem('mainConcerns', concern)} tint={CHIP_TINTS[i % CHIP_TINTS.length]}>
                      {concern}
                    </Choice>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <StepIntro title="Tell us a little more" hint="Share only what you are comfortable with." />
                <div>
                  <label htmlFor="bk-brief" className={LABEL}>What is bothering you currently?</label>
                  <textarea id="bk-brief" required rows={5} value={details.briefDetails} onChange={e => setDetails({ ...details, briefDetails: e.target.value })} className={`${FIELD} resize-none`} placeholder="Please share a brief overview..."></textarea>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <StepIntro title="How are things right now?" hint="Please rate the following areas." />
                <div className="space-y-3">
                  {['Stress', 'Sleep', 'Focus'].map((area) => (
                    <div key={area} role="radiogroup" aria-label={area} className="rounded-3xl bg-white/[0.06] p-4 md:p-5">
                      <span className="block font-semibold text-white mb-3">{area}</span>
                      <div className="grid grid-cols-3 gap-2">
                        {['Low', 'Moderate', 'High'].map((level, i) => (
                          <Choice
                            key={level}
                            type="radio"
                            required
                            name={`state-${area}`}
                            checked={details.currentState[area.toLowerCase() as keyof typeof details.currentState] === level}
                            onChange={() => setDetails(prev => ({ ...prev, currentState: { ...prev.currentState, [area.toLowerCase()]: level } }))}
                            tint={['bg-sage', 'bg-sky', 'bg-peach'][i]}
                          >
                            {level}
                          </Choice>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <StepIntro title="A quick safety check" hint="We ask everyone this. Your answer helps us look after you." />
                <div className="rounded-[28px] bg-[#F9D9D4] p-6">
                  <p className="font-semibold text-intel-dark mb-4">Are you experiencing thoughts of self-harm?</p>
                  <div className="space-y-2.5" role="radiogroup" aria-label="Thoughts of self-harm">
                    {['No', 'Sometimes', 'Yes'].map(option => (
                      <label key={option} className="cursor-pointer block">
                        <input required type="radio" name="riskCheck" value={option} checked={details.riskCheck === option} onChange={e => setDetails({ ...details, riskCheck: e.target.value })} className="peer sr-only" />
                        <span className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 font-semibold text-intel-dark transition-all duration-300 ease-bounce peer-focus-visible:ring-2 peer-focus-visible:ring-intel-dark ${details.riskCheck === option ? 'bg-white border-intel-dark scale-[1.02] shadow-[0_4px_0_rgba(26,26,26,0.2)]' : 'bg-white/50 border-transparent hover:bg-white/70'}`}>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${details.riskCheck === option ? 'bg-intel-dark text-white' : 'border-2 border-intel-dark/30'}`}>
                            {details.riskCheck === option && <Check size={12} strokeWidth={3} />}
                          </span>
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <p className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <LifeBuoy size={16} className="shrink-0 mt-0.5 text-terracotta" />
                  If you need to talk to someone right now, please call 112 or the Tele-MANAS helpline on 14416. You do not have to wait for your session.
                </p>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <StepIntro title="What would help most?" hint="What are you hoping to get out of these sessions?" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['Emotional support', 'Guidance', 'Stress management', 'Clarity', 'Other'].map((exp, i) => (
                    <Choice key={exp} type="checkbox" checked={details.expectations.includes(exp)} onChange={() => toggleArrayItem('expectations', exp)} tint={CHIP_TINTS[(i + 1) % CHIP_TINTS.length]}>
                      {exp}
                    </Choice>
                  ))}
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <StepIntro title="Before we begin" />
                <div className="rounded-[28px] bg-white/[0.06] p-6 space-y-5">
                  <p className="text-[15px] text-white/75 leading-relaxed">
                    By proceeding, you agree to engage in counselling services. You understand that your information will remain strictly confidential, except in circumstances where there is an imminent risk of harm to yourself or others.
                  </p>
                  <Choice type="checkbox" required checked={details.consent} onChange={e => setDetails({ ...details, consent: e.target.checked })} tint="bg-sage">
                    I agree to counselling and confidentiality terms.
                  </Choice>
                  {careerResult && (
                    <Choice type="checkbox" checked={details.shareAssessmentResult} onChange={e => setDetails({ ...details, shareAssessmentResult: e.target.checked })} tint="bg-lavender">
                      Share my Career Assessment report PDF with the counselor.
                    </Choice>
                  )}
                  {clinicalResult && (
                    <Choice type="checkbox" checked={details.shareAssessmentResult} onChange={e => setDetails({ ...details, shareAssessmentResult: e.target.checked })} tint="bg-lavender">
                      Share my {clinicalResult.title} report PDF with the counselor.
                    </Choice>
                  )}
                  {intellReady && (
                    <Choice type="checkbox" checked={shareIntell} onChange={e => setShareIntell(e.target.checked)} tint="bg-peach">
                      Share my Intel Student Assessment report (all tests, profile and answers) with the counsellor.
                    </Choice>
                  )}
                </div>
              </div>
            )}

            {step === 8 && (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <StepIntro title="Pick your time" hint="Choose how you would like to meet, then a day and slot." />
                <div className="space-y-6">
                  <div>
                    <span className={LABEL}>Session format</span>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { mode: 'online', label: 'Online', price: sessionPrices.online, icon: Monitor, tint: 'bg-sky' },
                        { mode: 'inperson', label: 'In-Person', price: sessionPrices.inperson, icon: MapPin, tint: 'bg-sage' },
                      ].map(({ mode, label, price, icon: Icon, tint }) => {
                        const on = details.sessionMode === mode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setDetails({ ...details, sessionMode: mode as 'online' | 'inperson' })}
                            className={`flex flex-col items-center gap-2 p-5 rounded-3xl border-2 transition-all duration-300 ease-bounce ${on ? `${tint} border-terracotta text-intel-dark -translate-y-1 shadow-[0_6px_0_rgba(193,155,108,0.5)]` : 'border-transparent bg-white/[0.07] text-white hover:bg-white/[0.12]'}`}
                          >
                            <span className={`w-12 h-12 rounded-2xl flex items-center justify-center ${on ? 'bg-white/70' : 'bg-white/10'}`}><Icon size={24} /></span>
                            <span className="font-semibold">{label}</span>
                            <span className={`text-sm font-semibold rounded-full px-3 py-0.5 ${on ? 'bg-intel-dark text-terracotta' : 'bg-white/10 text-white/70'}`}>₹{price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {details.sessionMode === 'inperson' && (
                    <div className="p-4 bg-white/[0.06] rounded-3xl space-y-3">
                      <div className="flex items-center gap-2 text-white font-medium text-sm">
                        <MapPin size={16} className="text-terracotta" />
                        <span>Clinic location: Ayappakkam, Chennai</span>
                      </div>
                      <iframe
                        src="https://maps.google.com/maps?q=144,%20Seetha%20Patabi%20Nagar,%20Maruthi%20Nagar,%20Ayappakkam,%20Chennai,%20Tamil%20Nadu%20600077&t=&z=14&ie=UTF8&iwloc=&output=embed"
                        width="100%"
                        height="200"
                        style={{ border: 0, borderRadius: '16px' }}
                        allowFullScreen={false}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Clinic Location Map"
                      ></iframe>
                    </div>
                  )}

                  <div>
                    <label htmlFor="bk-date" className={LABEL}>Date</label>
                    <input id="bk-date" required type="date" min={today} value={details.date} onChange={e => setDetails({ ...details, date: e.target.value, time: '' })} className={FIELD} />
                  </div>

                  <div>
                    <span className={LABEL}>Preferred time</span>
                    {details.date ? (
                      <div className="flex flex-wrap gap-2" role="group" aria-label="Available time slots">
                        {availableSlots.map((t, i) => {
                          const on = details.time === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              aria-pressed={on}
                              onClick={() => setDetails({ ...details, time: t })}
                              className={`inline-flex items-center gap-1.5 rounded-full border-2 px-5 py-2.5 text-[15px] font-semibold transition-all duration-300 ease-bounce ${on ? `${CHIP_TINTS[i % CHIP_TINTS.length]} border-terracotta text-intel-dark -translate-y-0.5 shadow-[0_4px_0_rgba(193,155,108,0.5)]` : 'border-transparent bg-white/[0.07] text-white/80 hover:bg-white/[0.12]'}`}
                            >
                              {on && <Check size={14} strokeWidth={3} />} {t}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-white/50 rounded-2xl bg-white/[0.05] px-4 py-3">Pick a date to see the available times.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 8 && freeBookingError && (
              <div role="alert" className="mt-6 text-red-800 text-sm bg-[#F9D9D4] p-4 rounded-2xl">
                {freeBookingError}
              </div>
            )}

            {step < 9 && (
              <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
                {step > 1 && (
                  <button type="button" onClick={() => setStep(prev => prev - 1)} className="px-6 h-14 rounded-full font-semibold text-white bg-white/10 hover:bg-white/15 flex items-center gap-2">
                    <ArrowLeft size={18} /> Back
                  </button>
                )}
                {/* Ensure array selections are not empty before proceeding */}
                <button
                  type="submit"
                  className="flex-1 h-14 rounded-full bg-terracotta text-intel-dark text-lg font-semibold flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:bg-[#cfac80] disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={
                    (step === 2 && details.mainConcerns.length === 0) ||
                    (step === 6 && details.expectations.length === 0) ||
                    (step === 8 && (!details.sessionMode || !details.date || !details.time))
                  }
                >
                  {isFreeProcessing ? (
                    <><Loader2 size={18} className="animate-spin" /> Confirming...</>
                  ) : step === 8 ? (
                    isFreeBooking ? "Confirm free booking" : "Proceed to payment"
                  ) : "Next"}
                  {!isFreeProcessing && <ChevronRight size={18} />}
                </button>
              </div>
            )}
          </form>

          {/* --- STEP 9: PAYMENT (only shown for paid bookings) --- */}
          {step === 9 && paidConfirm && (
            <div className="py-8 text-center">
              {paidConfirm.failed ? (
                <div role="alert" className="text-red-800 text-sm bg-[#F9D9D4] p-5 rounded-3xl">
                  <p className="mb-4">
                    Your payment went through, but we couldn't confirm your booking just now.
                    Please retry — you won't be charged again. If it keeps failing, contact us
                    with order ID <strong>{paidConfirm.orderId}</strong>.
                  </p>
                  <button
                    onClick={() => handleBookingSuccess(paidConfirm.link, paidConfirm.orderId)}
                    className="bg-intel-dark text-white px-6 h-12 rounded-full font-semibold"
                  >
                    Retry confirmation
                  </button>
                </div>
              ) : (
                <p className="text-white/60 flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" /> Confirming your booking...
                </p>
              )}
            </div>
          )}

          {step === 9 && !isFreeBooking && !paidConfirm && (
            <PaymentStep
              bookingDetails={{
                ...details,
                service: {
                  id: details.sessionMode === 'online' ? 'session_online' : 'session_inperson',
                  name: details.mainConcerns.length ? details.mainConcerns.join(', ') : 'General Consultation',
                  // Display only — the charged amount is decided server-side from the id
                  price: details.sessionMode === 'online' ? sessionPrices.online : sessionPrices.inperson
                }
              }}
              onSuccess={(link, orderId) => handleBookingSuccess(details.sessionMode === 'online' ? link : '', orderId)}
              onBack={() => setStep(8)}
            />
          )}

          {/* --- STEP 10: CONFIRMATION --- */}
          {step === 10 && (
            <div className="text-center py-8 animate-in zoom-in duration-500">
              <div className="relative w-28 h-28 mx-auto mb-8">
                {[['#F6DCC8', -70, -50], ['#DCE8DC', 70, -55], ['#E6DEEC', -80, 20], ['#DCE6EE', 80, 25], ['#C19B6C', -30, 75], ['#F6DCC8', 35, 78], ['#DCE8DC', 0, -85]].map(([c, dx, dy], i) => (
                  <span key={i} className="bk-confetti absolute left-1/2 top-1/2 w-3 h-3 rounded-full" style={{ background: c as string, ['--dx' as string]: `${dx}px`, ['--dy' as string]: `${dy}px`, animationDelay: `${0.2 + i * 0.05}s` }} aria-hidden="true" />
                ))}
                <div className="bk-pop w-28 h-28 bg-sage text-serene-green rounded-full flex items-center justify-center">
                  <CheckCircle2 size={52} />
                </div>
              </div>
              <h3 className="serif text-4xl md:text-5xl text-white mb-4">Thank <span className="italic text-terracotta">you.</span></h3>
              <p className="text-white/65 mb-8 max-w-sm mx-auto leading-relaxed">
                We have received your form securely and your session is confirmed.
                {details.sessionMode === 'online'
                  ? (meetLink ? ' Your Google Meet link is below and in your confirmation email.' : ' The counselor will send the meeting link to your email prior to the session.')
                  : ' We will contact you shortly.'}
              </p>

              <div className="grid grid-cols-3 gap-2 max-w-md mx-auto mb-8 text-left">
                {[
                  { label: 'Date', value: details.date, tint: 'bg-lavender' },
                  { label: 'Time', value: details.time, tint: 'bg-sage' },
                  { label: 'Format', value: modeLabel, tint: 'bg-peach' },
                ].map(({ label, value, tint }) => (
                  <div key={label} className={`rounded-2xl ${tint} text-intel-dark px-3 py-3`}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-intel-dark/55">{label}</p>
                    <p className="text-sm font-semibold leading-snug mt-0.5 break-words">{value}</p>
                  </div>
                ))}
              </div>

              {meetLink && (
                <a
                  href={meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full mb-4 bg-terracotta text-intel-dark h-14 leading-[3.5rem] rounded-full font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:bg-[#cfac80] truncate px-4"
                >
                  Open Google Meet link
                </a>
              )}
              {!meetLink && details.sessionMode === 'inperson' && (
                <div className="bg-white/[0.06] p-5 rounded-3xl mb-8 text-left space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-sage p-3 rounded-2xl text-serene-green">
                      <MapPin size={22} />
                    </div>
                    <div>
                      <h5 className="font-semibold text-white text-sm sm:text-base">Clinic location</h5>
                      <p className="text-white/60 text-xs leading-relaxed mt-1">
                        144, Seetha Patabi Nagar, Maruthi Nagar, Ayappakkam, Chennai, Tamil Nadu 600077
                      </p>
                    </div>
                  </div>
                  <iframe
                    src="https://maps.google.com/maps?q=144,%20Seetha%20Patabi%20Nagar,%20Maruthi%20Nagar,%20Ayappakkam,%20Chennai,%20Tamil%20Nadu%20600077&t=&z=14&ie=UTF8&iwloc=&output=embed"
                    width="100%"
                    height="200"
                    style={{ border: 0, borderRadius: '16px' }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Clinic Location Map"
                  ></iframe>
                </div>
              )}
              <button onClick={onClose} className="w-full h-14 rounded-full bg-white/10 hover:bg-white/15 text-white text-lg font-semibold">Done</button>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes bkWave { 0%, 100% { translate: 0 0; } 50% { translate: 0 -3px; } }
        .bk-wave { animation: bkWave 2.8s ease-in-out infinite; }
        @keyframes bkPop { 0% { transform: scale(0.3) rotate(-20deg); opacity: 0; } 60% { transform: scale(1.12) rotate(5deg); opacity: 1; } 100% { transform: scale(1) rotate(0); } }
        .bk-pop { animation: bkPop 0.8s 0.1s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        @keyframes bkConfetti { 0% { opacity: 0; transform: translate(-50%, -50%) scale(0.2); } 20% { opacity: 1; } 100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1); } }
        .bk-confetti { animation: bkConfetti 1.2s cubic-bezier(0.2, 0.8, 0.3, 1) both; }
        @media (prefers-reduced-motion: reduce) { .bk-pop, .bk-confetti, .bk-wave { animation: none; } }
      `}</style>
    </div>
  );
};

export default BookingModal;
