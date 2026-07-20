import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, ChevronRight, ArrowLeft, Video, ShieldCheck, MapPin, Monitor, Loader2 } from 'lucide-react';
import { MI_QUESTIONS, INTEREST_QUESTIONS, PERSONALITY_QUESTIONS } from './TestQuestions';
import { CLINICAL_CONFIGS } from './ClinicalQuestions';

const ALL_QUESTIONS = [...MI_QUESTIONS, ...INTEREST_QUESTIONS, ...PERSONALITY_QUESTIONS];

const SESSION_PRICES = {
  online: 1,
  inperson: 1
};

const getAvailableSlots = (date: string) => [
  '09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'
];

interface BookingModalProps {
  onClose: () => void;
}

const loadCashfreeScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CashfreePaymentStep: React.FC<{
  bookingDetails: any,
  onSuccess: (gmeetLink: string) => void,
  onBack: () => void
}> = ({ bookingDetails, onSuccess, onBack }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCashfreePayment = async () => {
    setIsProcessing(true);
    setError(null);
    const isLoaded = await loadCashfreeScript();
    if (!isLoaded) {
      setError("Failed to load Cashfree. Please check your internet connection.");
      setIsProcessing(false);
      return;
    }

    try {
      const response = await fetch('/api/create-cashfree-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: bookingDetails.service.price,
          serviceName: bookingDetails.service.name,
          customerName: bookingDetails.name,
          customerEmail: bookingDetails.email,
          customerPhone: bookingDetails.phone || '9999999999'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize payment order.");
      }

      const cashfree = await (window as any).Cashfree({
        mode: "production",
      });

      let checkoutOptions = {
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_modal",
      };

      cashfree.checkout(checkoutOptions).then((result: any) => {
        if (result.error) {
          setError(result.error.message || "Payment has failed.");
          setIsProcessing(false);
        } else if (result.redirect) {
          console.log("Payment will be redirected");
          setIsProcessing(false);
          onSuccess('');
        }
      });
    } catch (err: any) {
      setError(err.message || "Failed to start Cashfree checkout.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="bg-white/5/50 p-6 rounded-2xl border border-black/5 space-y-5">
        <div className="flex justify-between items-center text-sm font-medium border-b border-white/10 pb-4">
          <span className="text-white/60">Total Amount:</span>
          <span className="text-2xl font-black text-white">₹{bookingDetails.service.price}.00</span>
        </div>
        <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center border border-blue-500/20">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h4 className="font-bold text-lg text-white mb-1">Secure Checkout via Cashfree</h4>
            <p className="text-xs text-white/50 mx-auto max-w-[200px]">Standard industry-grade encryption applies to your transaction.</p>
          </div>
        </div>
      </div>
      {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
      <div className="flex gap-4">
        <button type="button" onClick={onBack} className="px-6 py-4 rounded-xl font-bold text-white border border-white/10 flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
        <button onClick={handleCashfreePayment} disabled={isProcessing} className="flex-1 bg-serene-green text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50">
          {isProcessing ? "Processing..." : "Pay & Book"}
        </button>
      </div>
    </div>
  );
};

const BookingModal: React.FC<BookingModalProps> = ({ onClose }) => {
  const [searchParams] = useSearchParams();
  const isFreeBooking = searchParams.get('freeBooking') === 'true';
  const [step, setStep] = useState<number>(1);
  const [meetLink, setMeetLink] = useState('');
  const [isFreeProcessing, setIsFreeProcessing] = useState(false);
  const [details, setDetails] = useState(() => {
    let savedReg = null;
    try {
      const saved = localStorage.getItem('assessment_registration');
      if (saved) savedReg = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse registration details', e);
    }

    const savedSessionMode = (localStorage.getItem('career_booked_session_mode') as 'online' | 'inperson' | '') || '';
    const savedDate = localStorage.getItem('career_booked_date') || '';
    const savedTime = localStorage.getItem('career_booked_time') || '';

    return {
      name: savedReg?.name || '',
      age: savedReg?.age || '',
      phone: savedReg?.phone || '',
      email: savedReg?.email || '',
      gender: savedReg?.gender || '',
      mainConcerns: [] as string[],
      briefDetails: savedReg?.reason || '',
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
            fetch(`/api/load-answers?id=${encodeURIComponent(id)}`)
              .then(res => res.json())
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
          fetch(`/api/load-answers?id=${encodeURIComponent(id)}`)
            .then(res => res.json())
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

  const handleBookingSuccess = async (link: string) => {
    localStorage.removeItem('career_booked_session_mode');
    localStorage.removeItem('career_booked_date');
    localStorage.removeItem('career_booked_time');
    
    setMeetLink(link);
    setStep(10); // Final Confirmation Step

    const isOnline = details.sessionMode === 'online';
    const serviceName = details.mainConcerns.join(', ') || 'Consultation';

    try {
      await fetch('/api/send-booking-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          clinicalResult: clinicalResult
        }),
      });
      console.log("Confirmation emails sent via Brevo.");
    } catch (error) {
      console.error("Failed to send confirmation emails:", error);
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

  return (
    <div className="w-full max-w-2xl bg-[#1F1E1B] rounded-3xl md:rounded-[40px] shadow-2xl overflow-hidden border border-white/20 animate-in fade-in slide-in-from-bottom-8 duration-500 max-h-[90vh] flex flex-col">
      <div className="p-6 md:p-12 overflow-y-auto overflow-x-hidden flex-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        {step === 1 && (
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold mb-2 serif text-white">Booking Request</h3>
            <p className="text-white/60 font-light">This confidential form helps us understand your concern.<br />Takes 3–5 minutes.</p>
          </div>
        )}

        {/* Progress Bar for all Questionnaire steps + Scheduling + Payment */}
        {step < 10 && (
          <div className="mb-10">
            <div className="flex justify-between text-xs font-bold text-white/50 mb-2 uppercase tracking-widest">
              <span>Section {Math.min(step, 8)}</span>
              <span>{Math.min(step, 9)} / 9</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-serene-green transition-all duration-500" style={{ width: `${(step / 9) * 100}%` }}></div>
            </div>
          </div>
        )}

        {/* --- QUESTIONNAIRE SECTIONS --- */}
        <form onSubmit={handleNext}>

          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <h4 className="text-xl font-black text-white uppercase flex items-center gap-2"><span className="w-4 h-4 bg-serene-green rounded-sm block"></span> Basic Details</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white opacity-60 uppercase tracking-wider">Full Name</label>
                  <input required type="text" value={details.name} onChange={e => setDetails({ ...details, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 outline-none focus:border-serene-green" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white opacity-60 uppercase tracking-wider">Age</label>
                  <input required type="number" min="12" max="100" value={details.age} onChange={e => setDetails({ ...details, age: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 outline-none focus:border-serene-green" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white opacity-60 uppercase tracking-wider">Phone Number</label>
                  <input required type="tel" value={details.phone} onChange={e => setDetails({ ...details, phone: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 outline-none focus:border-serene-green" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white opacity-60 uppercase tracking-wider">Email</label>
                  <input required type="email" value={details.email} onChange={e => setDetails({ ...details, email: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 outline-none focus:border-serene-green" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-white opacity-60 uppercase tracking-wider">Gender</label>
                  <select required value={details.gender} onChange={e => setDetails({ ...details, gender: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/30 outline-none focus:border-serene-green">
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
              <h4 className="text-xl font-black text-white uppercase flex items-center gap-2"><span className="w-4 h-4 bg-serene-green rounded-sm block"></span> Main Concern</h4>
              <p className="text-sm text-white/60">Select all that apply.</p>
              <div className="grid grid-cols-2 gap-4">
                {['Stress', 'Anxiety', 'Low mood', 'Relationship issues', 'Academic / Work issues', 'Sleep issues', 'Career confusion', 'Other'].map(concern => (
                  <label key={concern} className="flex items-center gap-3 bg-[#F4EFE6] text-[#1A1A1A] p-4 rounded-xl border border-[#F4EFE6]/50 cursor-pointer hover:border-serene-green hover:shadow-lg transition-all">
                    <input type="checkbox" checked={details.mainConcerns.includes(concern)} onChange={() => toggleArrayItem('mainConcerns', concern)} className="w-5 h-5 rounded border-[#1A1A1A]/20 text-serene-green focus:ring-serene-green" />
                    <span className="text-sm font-bold">{concern}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <h4 className="text-xl font-black text-white uppercase flex items-center gap-2"><span className="w-4 h-4 bg-serene-green rounded-sm block"></span> Brief Details</h4>
              <div className="space-y-2">
                <label className="text-sm font-bold opacity-80">What is bothering you currently?</label>
                <textarea required rows={5} value={details.briefDetails} onChange={e => setDetails({ ...details, briefDetails: e.target.value })} className="w-full bg-[#F4EFE6] border border-[#F4EFE6]/50 rounded-xl px-5 py-4 text-[#1A1A1A] placeholder:text-black/50 outline-none focus:border-serene-green resize-none transition-colors" placeholder="Please share a brief overview..."></textarea>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <h4 className="text-xl font-black text-white uppercase flex items-center gap-2"><span className="w-4 h-4 bg-serene-green rounded-sm block"></span> Current State</h4>
              <p className="text-sm text-white/60 mb-2">Please rate the following areas.</p>
              <div className="space-y-4">
                {['Stress', 'Sleep', 'Focus'].map((area) => (
                  <div key={area} className="flex flex-col sm:flex-row justify-between sm:items-center bg-white/5 p-5 rounded-xl border border-white/10 gap-4 sm:gap-0">
                    <span className="font-bold text-white">{area}</span>
                    <div className="flex gap-4 sm:justify-end">
                      {['Low', 'Moderate', 'High'].map(level => (
                        <label key={level} className="flex flex-1 sm:flex-none justify-center items-center gap-2 cursor-pointer bg-white/5 hover:bg-serene-green/10 p-2 px-4 rounded-lg transition-colors">
                          <input type="radio" required name={`state-${area}`} checked={details.currentState[area.toLowerCase() as keyof typeof details.currentState] === level} onChange={() => setDetails(prev => ({ ...prev, currentState: { ...prev.currentState, [area.toLowerCase()]: level } }))} className="text-serene-green focus:ring-serene-green" />
                          <span className="text-xs text-white font-bold">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <h4 className="text-xl font-black text-white uppercase flex items-center gap-2"><span className="w-4 h-4 bg-red-500 rounded-sm block"></span> Risk Check ⚠️</h4>
              <div className="bg-red-200 p-6 rounded-2xl border border-red-300 shadow-inner">
                <label className="block font-bold text-[#1A1A1A] mb-4">Are you experiencing thoughts of self-harm?</label>
                <div className="space-y-3">
                  {['No', 'Sometimes', 'Yes'].map(option => (
                    <label key={option} className="flex items-center gap-3 bg-white/40 p-4 rounded-xl border border-red-300/50 cursor-pointer hover:bg-white/60 transition-colors">
                      <input required type="radio" name="riskCheck" value={option} checked={details.riskCheck === option} onChange={e => setDetails({ ...details, riskCheck: e.target.value })} className="w-5 h-5 text-red-600 focus:ring-red-600 border-red-400" />
                      <span className="font-bold text-[#1A1A1A]">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <h4 className="text-xl font-black text-white uppercase flex items-center gap-2"><span className="w-4 h-4 bg-serene-green rounded-sm block"></span> Expectation</h4>
              <p className="text-sm text-white/60">What are you hoping to get out of these sessions?</p>
              <div className="grid grid-cols-2 gap-4">
                {['Emotional support', 'Guidance', 'Stress management', 'Clarity', 'Other'].map(exp => (
                  <label key={exp} className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10 cursor-pointer hover:border-serene-green transition-colors">
                    <input type="checkbox" checked={details.expectations.includes(exp)} onChange={() => toggleArrayItem('expectations', exp)} className="w-5 h-5 rounded border-white/20 text-serene-green focus:ring-serene-green" />
                    <span className="text-sm font-medium text-white">{exp}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <h4 className="text-xl font-black text-white uppercase flex items-center gap-2"><span className="w-4 h-4 bg-serene-green rounded-sm block"></span> Consent</h4>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
                <p className="text-sm text-white/70 leading-relaxed">
                  By proceeding, you agree to engage in counselling services. You understand that your information will remain strictly confidential, except in circumstances where there is an imminent risk of harm to yourself or others.
                </p>
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-serene-green/5 rounded-xl border border-serene-green/20">
                  <input required type="checkbox" checked={details.consent} onChange={e => setDetails({ ...details, consent: e.target.checked })} className="w-6 h-6 rounded border-white/20 text-serene-green focus:ring-serene-green flex-shrink-0" />
                  <span className="text-sm font-bold text-white">I agree to counselling and confidentiality terms.</span>
                </label>
                {careerResult && (
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-serene-green/5 rounded-xl border border-serene-green/20 mt-4">
                    <input type="checkbox" checked={details.shareAssessmentResult} onChange={e => setDetails({ ...details, shareAssessmentResult: e.target.checked })} className="w-6 h-6 rounded border-white/20 text-serene-green focus:ring-serene-green flex-shrink-0" />
                    <span className="text-sm font-bold text-white">Share my Career Assessment report PDF with the counselor.</span>
                  </label>
                )}
                {clinicalResult && (
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-serene-green/5 rounded-xl border border-serene-green/20 mt-4">
                    <input type="checkbox" checked={details.shareAssessmentResult} onChange={e => setDetails({ ...details, shareAssessmentResult: e.target.checked })} className="w-6 h-6 rounded border-white/20 text-serene-green focus:ring-serene-green flex-shrink-0" />
                    <span className="text-sm font-bold text-white">Share my {clinicalResult.title} report PDF with the counselor.</span>
                  </label>
                )}
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <h4 className="text-xl font-black text-white uppercase flex items-center gap-2"><span className="w-4 h-4 bg-serene-green rounded-sm block"></span> Schedule Session</h4>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white opacity-60 uppercase tracking-wider text-white">Session Format</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setDetails({ ...details, sessionMode: 'online' })} className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all font-bold text-sm ${details.sessionMode === 'online' ? 'border-serene-green bg-serene-green text-white shadow-lg' : 'border-white/10 bg-white/5 text-white hover:border-white/20'}`}>
                      <Monitor size={24} /> 
                      <div className="flex flex-col items-center">
                        <span>Online</span>
                        <span className="text-[10px] opacity-60 font-normal">₹{SESSION_PRICES.online}</span>
                      </div>
                    </button>
                    <button type="button" onClick={() => setDetails({ ...details, sessionMode: 'inperson' })} className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all font-bold text-sm ${details.sessionMode === 'inperson' ? 'border-serene-green bg-serene-green text-white shadow-lg' : 'border-white/10 bg-white/5 text-white hover:border-white/20'}`}>
                      <MapPin size={24} />
                      <div className="flex flex-col items-center">
                        <span>In-Person</span>
                        <span className="text-[10px] opacity-60 font-normal">₹{SESSION_PRICES.inperson}</span>
                      </div>
                    </button>
                  </div>
                </div>

                {details.sessionMode === 'inperson' && (
                  <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-white font-medium text-sm">
                      <MapPin size={16} className="text-serene-green" />
                      <span>Clinic Location: Ayappakkam, Chennai</span>
                    </div>
                    <iframe
                      src="https://maps.google.com/maps?q=144,%20Seetha%20Patabi%20Nagar,%20Maruthi%20Nagar,%20Ayappakkam,%20Chennai,%20Tamil%20Nadu%20600077&t=&z=14&ie=UTF8&iwloc=&output=embed"
                      width="100%"
                      height="200"
                      style={{ border: 0, borderRadius: '12px' }}
                      allowFullScreen={false}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Clinic Location Map"
                    ></iframe>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white opacity-60 uppercase tracking-wider">Date</label>
                    <input required type="date" min={today} value={details.date} onChange={e => setDetails({ ...details, date: e.target.value })} className="w-full bg-[#F4EFE6] border border-[#F4EFE6]/50 rounded-xl px-4 py-3.5 text-[#1A1A1A] placeholder:text-black/50 outline-none focus:border-serene-green" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white opacity-60 uppercase tracking-wider">Preferred Time</label>
                    <select required disabled={!details.date} value={details.time} onChange={e => setDetails({ ...details, time: e.target.value })} className="w-full bg-[#F4EFE6] border border-[#F4EFE6]/50 rounded-xl px-4 py-3.5 text-[#1A1A1A] outline-none focus:border-serene-green disabled:opacity-50">
                      <option className="text-black" value="">Select a slot</option>
                      {availableSlots.map(t => <option className="text-black" key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step < 9 && (
            <div className="flex gap-4 mt-8 pt-6 border-t border-black/5">
              {step > 1 && (
                <button type="button" onClick={() => setStep(prev => prev - 1)} className="px-6 py-4 rounded-xl font-bold text-white bg-white/5 hover:bg-white/10 flex items-center gap-2 transition-colors">
                  <ArrowLeft size={18} /> Back
                </button>
              )}
              {/* Ensure array selections are not empty before proceeding */}
              <button
                type="submit"
                className="flex-1 bg-serene-green text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all disabled:opacity-50"
                disabled={
                  (step === 2 && details.mainConcerns.length === 0) ||
                  (step === 6 && details.expectations.length === 0) ||
                  (step === 8 && (!details.sessionMode || !details.date || !details.time))
                }
              >
                {isFreeProcessing ? (
                  <><Loader2 size={18} className="animate-spin" /> Confirming...</>
                ) : step === 8 ? (
                  isFreeBooking ? "Confirm Free Booking" : "Proceed to Payment"
                ) : "Next"}
                {!isFreeProcessing && <ChevronRight size={18} />}
              </button>
            </div>
          )}
        </form>

        {/* --- STEP 9: PAYMENT (only shown for paid bookings) --- */}
        {step === 9 && !isFreeBooking && (
          <CashfreePaymentStep
            bookingDetails={{
              ...details,
              service: {
                name: details.mainConcerns.length ? details.mainConcerns.join(', ') : 'General Consultation',
                price: details.sessionMode === 'online' ? SESSION_PRICES.online : SESSION_PRICES.inperson
              }
            }}
            onSuccess={(link) => handleBookingSuccess(details.sessionMode === 'online' ? link : '')}
            onBack={() => setStep(8)}
          />
        )}

        {/* --- STEP 10: CONFIRMATION --- */}
        {step === 10 && (
          <div className="text-center py-12 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-serene-green/10 text-serene-green rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-4xl font-bold mb-4 serif text-white">Thank You.</h3>
            <p className="text-white/60 mb-10 max-w-sm mx-auto font-light leading-relaxed">
              We have received your form securely and your session is confirmed.
              {details.sessionMode === 'online' ? ' The counselor will send the meeting link to your email prior to the session.' : ' We will contact you shortly.'}
            </p>
            {!meetLink && details.sessionMode === 'inperson' && (
              <div className="bg-white/5 p-6 rounded-3xl border border-black/5 mb-10 text-left space-y-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-3 rounded-full text-serene-green">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm sm:text-base">Clinic Location Map</h5>
                    <p className="text-white/60 text-xs leading-relaxed mt-1">
                      144, Seetha Patabi Nagar, Maruthi Nagar, Ayappakkam, Chennai, Tamil Nadu 600077
                    </p>
                  </div>
                </div>
                <iframe
                  src="https://maps.google.com/maps?q=144,%20Seetha%20Patabi%20Nagar,%20Maruthi%20Nagar,%20Ayappakkam,%20Chennai,%20Tamil%20Nadu%20600077&t=&z=14&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="200"
                  style={{ border: 0, borderRadius: '12px' }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Clinic Location Map"
                ></iframe>
              </div>
            )}
            <button onClick={onClose} className="w-full bg-intel-dark text-white py-5 rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Done</button>
          </div>
        )}

      </div>
    </div>
  );
};

export default BookingModal;
