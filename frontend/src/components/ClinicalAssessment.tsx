import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, ArrowRight, ArrowLeft, Shield, HeartPulse, Clock, Lock, Info, Sparkles, Phone, Siren } from 'lucide-react';
import { ClinicalConfig } from './ClinicalQuestions';
import { authHeaders, useAuthUser, PENDING_RESULT_KEY } from '../utils/auth';
import { apiClient } from '../utils/api';
import {
  AssessmentPage, StackedCard, RoundButton, BackPill, ProgressPill, QuestionHead, OptionButton, IconTile, InfoChip, Confetti,
  BTN_PRIMARY, BTN_GREEN, BTN_SOFT,
} from './AssessmentUI';

// Pastel behind each screening's icon and result
const TEST_TINTS: Record<string, string> = {
  phq9: 'bg-lavender',
  gad7: 'bg-sage',
  pss10: 'bg-peach',
  sleep: 'bg-sky',
  sas: 'bg-lavender',
};

interface ClinicalAssessmentProps {
  config: ClinicalConfig;
  onClose: () => void;
}

const ClinicalAssessment: React.FC<ClinicalAssessmentProps> = ({ config, onClose }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthUser();
  const [step, setStep] = useState(-1); // -1 is the intro page
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<any | null>(null);
  // Signed-out visitors confirm their age; under-18s sign in so a parent can consent (DPDP Act)
  const [adultConfirmed, setAdultConfirmed] = useState(false);

  useEffect(() => {
    const resultId = searchParams.get('id');
    if (resultId) {
      fetch(`/api/load-answers?id=${encodeURIComponent(resultId)}`, { headers: authHeaders() })
        .then(res => (res.ok ? res.json() : Promise.reject(new Error('load failed'))))
        .then(data => {
          const raw = String(data.answers || '');
          if (raw.length === config.questions.length) {
            const parsedAnswers = raw.split('').map(Number);
            setAnswers(parsedAnswers);
            setStep(config.questions.length);
            processResults(parsedAnswers, true);
          }
        })
        .catch(err => console.error('Failed to load saved clinical result:', err));
      return;
    }

    // Legacy links that carry raw answers in the URL — still readable, no longer generated
    const rawAnswers = searchParams.get('r');
    if (rawAnswers && rawAnswers.length === config.questions.length) {
      const parsedAnswers = rawAnswers.split('').map(Number);
      setAnswers(parsedAnswers);
      setStep(config.questions.length);
      processResults(parsedAnswers, true);
    }
  }, [config.id]);

  const handleStart = () => {
    setStep(0);
  };

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[step] = value;
    setAnswers(newAnswers);
    
    setTimeout(() => {
      if (step < config.questions.length - 1) {
        setStep(step + 1);
      } else {
        processResults(newAnswers);
      }
    }, 300);
  };

  const goToPrevious = () => {
    if (step > 0) setStep(step - 1);
  };

  const processResults = (finalAnswers: number[], isInitialLoad?: boolean) => {
    let totalScore = 0;
    
    if (!isInitialLoad) {
      // Save by opaque id only — raw answers (including the PHQ-9 self-harm item)
      // must never appear in the URL. Signed in → the result joins the account.
      apiClient.post<any>('/api/save-answers', { answers: finalAnswers.join(''), testId: config.id })
        .then(data => {
          if (data.id) {
            setSearchParams({ id: data.id }, { replace: true });
          }
        })
        .catch(err => console.error('Failed to save clinical answers:', err));
    }
    
    finalAnswers.forEach((val, idx) => {
      const q = config.questions[idx];
      if (q.reverseScore) {
        // Reverse scoring logic for 0-4 scales:
        // 0->4, 1->3, 2->2, 3->1, 4->0
        const maxVal = config.options.length - 1; 
        totalScore += (maxVal - val);
      } else {
        totalScore += val;
      }
    });

    const matchedBand = config.bands.find(b => totalScore >= b.min && totalScore <= b.max) || config.bands[0];
    
    setResult({
      score: totalScore,
      band: matchedBand,
      answers: finalAnswers
    });
  };

  // Soft tint behind each screening's icon (the test's own colour stays on the progress bar)
  const tint = TEST_TINTS[config.id] || 'bg-sage';
  const total = config.questions.length;

  // Intro Screen
  if (step === -1) {
    return (
      <AssessmentPage align="center">
        <StackedCard maxW="max-w-2xl" className="as-pop">
          <div className="p-7 md:p-12">
            <BackPill onClick={onClose}><ArrowLeft size={16} /> Back</BackPill>

            <div className="mt-8 flex items-center gap-4">
              <IconTile tint={tint}><HeartPulse size={38} /></IconTile>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-[12px] font-semibold text-[#8a6a3f] shadow-sm"><Sparkles size={13} /> Free self-check</span>
            </div>
            <h2 className="serif text-3xl md:text-4xl text-intel-dark mt-6 mb-4 leading-tight">{config.title}</h2>
            <p className="text-intel-dark/70 leading-relaxed mb-6"><strong>Purpose:</strong> {config.desc}</p>

            <div className="grid gap-3 mb-8">
              <InfoChip icon={<Clock size={18} />} tint="bg-sky/70">This is a brief self-screening tool to help you understand your emotional well-being. It takes about 2–5 minutes.</InfoChip>
              <InfoChip icon={<Lock size={18} />} tint="bg-sage/70"><strong>Confidential:</strong> Your responses are private.</InfoChip>
              <InfoChip icon={<Info size={18} />} tint="bg-peach/80"><strong>Not a diagnosis:</strong> This is an awareness tool and does not replace professional medical or psychiatric diagnosis.</InfoChip>
            </div>

            {!user && (
              <label className="mb-6 flex items-start gap-3 rounded-2xl bg-lavender/70 p-4 text-sm text-intel-dark/80 cursor-pointer">
                <input type="checkbox" checked={adultConfirmed} onChange={(e) => setAdultConfirmed(e.target.checked)} className="mt-1 h-4 w-4 accent-[#1C3F39]" />
                <span>I am 18 or older. <span className="text-intel-dark/60">Under 18? <a href="/login?next=/assessments" className="underline">Sign in</a> so a parent or guardian can give consent first.</span></span>
              </label>
            )}
            <button disabled={!user && !adultConfirmed} onClick={handleStart} className={`${BTN_PRIMARY} w-full`}>
              Start assessment <ArrowRight size={18} />
            </button>
          </div>
        </StackedCard>
      </AssessmentPage>
    );
  }

  return (
    <AssessmentPage>
      <StackedCard className="flex flex-col min-h-[60vh]">
        {/* Navigation / progress header */}
        <div className="px-5 md:px-6 py-4 border-b border-black/5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {!result && (
              <RoundButton onClick={goToPrevious} disabled={step === 0} aria-label="Previous question"><ArrowLeft size={18} /></RoundButton>
            )}
            <span className={`hidden sm:inline-flex rounded-full ${tint} px-3 py-1 text-[11px] font-semibold text-intel-dark/80`}>{config.title}</span>
            {!result && <ProgressPill value={step + 1} total={total} color={config.color} />}
          </div>
          <RoundButton onClick={onClose} aria-label="Close"><X size={18} /></RoundButton>
        </div>

        <div className="flex-1 p-6 md:p-14">
          {!result ? (
            <div key={step} className="as-pop max-w-xl mx-auto">
              <QuestionHead eyebrow={config.introPrefix} text={config.questions[step].text} chip={tint} />
              <div className="grid gap-3">
                {config.options.map((opt, i) => (
                  <OptionButton key={opt.value} label={opt.label} picked={answers[step] === opt.value} index={i} onClick={() => handleAnswer(opt.value)} />
                ))}
              </div>
            </div>
          ) : (
            <div className="as-pop max-w-2xl mx-auto text-center py-4">
              {!user && searchParams.get('id') && (
                <div className="mb-8 p-5 rounded-3xl bg-sage flex flex-col sm:flex-row items-center gap-4 text-left print:hidden">
                  <p className="flex-1 text-sm text-intel-dark/80 font-medium">
                    Want to keep this result? Sign in or create a free account to save it alongside your other assessments.
                  </p>
                  <button
                    onClick={() => {
                      try { localStorage.setItem(PENDING_RESULT_KEY, searchParams.get('id') || ''); } catch (e) { /* storage unavailable */ }
                      navigate('/login?next=/my-results');
                    }}
                    className={`${BTN_GREEN} h-11 px-6 text-sm shrink-0`}
                  >
                    Save to my account
                  </button>
                </div>
              )}

              <div className="relative inline-block mb-8">
                <Confetti />
                <span className="as-hop inline-block"><IconTile tint={tint}><Shield size={38} /></IconTile></span>
              </div>

              <h2 className="serif text-4xl md:text-5xl text-intel-dark mb-6 leading-tight">{result.band.label}</h2>

              <div className={`${tint} rounded-[32px] p-7 md:p-10 mb-8`}>
                <p className="text-intel-dark/80 text-lg md:text-xl leading-relaxed">{result.band.desc}</p>
              </div>

              {/* Crisis message for PHQ-9 item 9 */}
              {config.id === 'phq9' && result.answers[8] > 0 && (
                <div className="bg-[#F9D9D4] text-red-900 p-6 md:p-8 rounded-[32px] mb-8 text-left">
                  <p className="serif text-xl flex items-center gap-2 mb-3"><Siren size={22} className="shrink-0" /> Important notice</p>
                  <p className="text-base md:text-lg mb-4">If you are experiencing thoughts of self-harm, please know that you are not alone and help is available right now.</p>
                  <div className="bg-white/60 p-4 rounded-2xl">
                    <p className="font-semibold text-sm mb-2 opacity-80">Immediate support helplines</p>
                    <ul className="space-y-2 text-sm md:text-base font-semibold">
                      <li className="flex items-center gap-2"><Phone size={16} className="shrink-0" /> <span className="opacity-80">Tele-MANAS (Govt. of India, 24×7):</span> <a href="tel:14416" className="underline hover:text-red-700">14416</a></li>
                      <li className="flex items-center gap-2"><Phone size={16} className="shrink-0" /> <span className="opacity-80">Kiran Mental Health Helpline (India):</span> <a href="tel:18005990019" className="underline hover:text-red-700">1800-599-0019</a></li>
                      <li className="flex items-center gap-2"><Phone size={16} className="shrink-0" /> <span className="opacity-80">AASRA (Crisis Intervention):</span> <a href="tel:+919820466726" className="underline hover:text-red-700">+91-9820466726</a></li>
                      <li className="flex items-center gap-2"><Siren size={16} className="shrink-0" /> <span className="opacity-80">Emergency services:</span> Dial 112 or your local emergency number</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* SAS emotional reliance alert */}
              {config.id === 'sas' && (result.answers[0] >= 3 || result.answers[2] >= 3 || result.answers[6] >= 3 || result.answers[9] >= 3) && (
                <div className="bg-peach text-intel-dark p-6 md:p-8 rounded-[32px] mb-8 text-left">
                  <p className="serif text-xl flex items-center gap-2 mb-3"><Info size={22} className="shrink-0" /> Emotional reliance</p>
                  <p className="text-base md:text-lg">Your responses suggest emotional reliance on smartphone use. Support strategies can help you manage stress without over-dependence on devices.</p>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-3 items-center justify-center w-full">
                <button
                  onClick={() => {
                    const savedId = searchParams.get('id');
                    const ref = savedId
                      ? `${window.location.origin}${window.location.pathname}?id=${savedId}`
                      : window.location.href;
                    navigate('/booking?assessmentRef=' + encodeURIComponent(ref));
                  }}
                  className={`${BTN_GREEN} w-full md:w-auto`}
                >
                  {result.band.ctaText || 'Book a consultation'}
                </button>
                <button onClick={() => navigate(user ? '/my-results' : '/assessments')} className={`${BTN_SOFT} w-full md:w-auto`}>
                  {user ? 'My results' : 'Other assessments'}
                </button>
              </div>

              <div className="border-t border-black/10 pt-6 mt-8 text-center">
                <p className="text-intel-dark/45 text-xs leading-relaxed max-w-md mx-auto">
                  This screening tool is for self-awareness and early support only. It does not replace professional diagnosis or treatment.
                </p>
              </div>
            </div>
          )}
        </div>
      </StackedCard>
    </AssessmentPage>
  );
};

export default ClinicalAssessment;
