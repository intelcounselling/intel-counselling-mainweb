import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, ArrowRight, ArrowLeft, Loader2, Sparkles, Download, PartyPopper, Brain, Target, UserCheck } from 'lucide-react';
import { MI_QUESTIONS, INTEREST_QUESTIONS, PERSONALITY_QUESTIONS, Question } from './TestQuestions';
import { apiClient } from '../utils/api';
import {
  AssessmentPage, StackedCard, RoundButton, BackPill, ProgressPill, QuestionHead, OptionButton, IconTile, Confetti,
  BTN_PRIMARY, BTN_GREEN, BTN_DARK,
} from './AssessmentUI';

interface AssessmentProps {
  type?: string;
  onClose: () => void;
}

const ALL_QUESTIONS: Question[] = [
  ...MI_QUESTIONS,
  ...INTEREST_QUESTIONS,
  ...PERSONALITY_QUESTIONS
];

const PROGRESS_KEY = 'career_progress';

const Assessment: React.FC<AssessmentProps> = ({ type, onClose }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [showSectionIntro, setShowSectionIntro] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savedResultId, setSavedResultId] = useState<string | null>(null);
  const [freeSessionAvailable, setFreeSessionAvailable] = useState(false);
  const shouldSendEmailRef = useRef(false);

  useEffect(() => {
    const resultId = searchParams.get('id');
    const rawAnswers = searchParams.get('r');

    if (resultId) {
      // Load from DB using UUID
      setLoading(true);
      apiClient.get<any>(`/api/load-answers?id=${encodeURIComponent(resultId)}`)
        .then(data => {
          if (data.answers && data.answers.length === ALL_QUESTIONS.length) {
            setFreeSessionAvailable(!!data.freeSessionAvailable);
            const parsedAnswers = data.answers.split('').map(Number);
            setAnswers(parsedAnswers);
            setStep(ALL_QUESTIONS.length);
            setShowSectionIntro(false);
            processResults(parsedAnswers, true);
          } else {
            setLoading(false);
            setLoadError('Could not load this saved result.');
          }
        })
        .catch(err => {
          console.error('Failed to load answers from DB:', err);
          setLoading(false);
          setLoadError('Could not load this saved result.');
        });
    } else if (rawAnswers && rawAnswers.length === ALL_QUESTIONS.length) {
      // Legacy URL fallback: save to DB and update URL
      const parsedAnswers = rawAnswers.split('').map(Number);
      setAnswers(parsedAnswers);
      setStep(ALL_QUESTIONS.length);
      setShowSectionIntro(false);
      setLoading(true);
      apiClient.post<any>('/api/save-answers', { answers: rawAnswers })
        .then(data => {
          if (data.id) {
            setSearchParams({ id: data.id }, { replace: true });
          }
          processResults(parsedAnswers, true);
        })
        .catch(err => {
          console.error('Failed to save legacy answers to DB:', err);
          processResults(parsedAnswers, true);
        });
    } else {
      // Resume an in-progress attempt — a refresh shouldn't wipe 200 answers
      try {
        const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
        if (saved && Array.isArray(saved.answers) && saved.answers.length > 0 && saved.answers.length < ALL_QUESTIONS.length) {
          setAnswers(saved.answers);
          setStep(saved.answers.length);
          setShowSectionIntro(false);
        }
      } catch (e) {
        console.error('Failed to restore assessment progress', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!result && answers.length > 0 && answers.length < ALL_QUESTIONS.length && !searchParams.get('id')) {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ answers }));
    }
  }, [answers, result]);

  useEffect(() => {
    // Wait until both the computed results and the saved result id are available —
    // the server derives identity and payment status from the stored result.
    if (result && savedResultId && shouldSendEmailRef.current) {
      shouldSendEmailRef.current = false;

      const sessionMode = localStorage.getItem('career_booked_session_mode') || '';
      const date = localStorage.getItem('career_booked_date') || '';
      const time = localStorage.getItem('career_booked_time') || '';

      apiClient.post('/api/send-career-results', {
        resultId: savedResultId,
        appointment: { sessionMode, date, time }
      })
      .then(() => {
        console.log('Career results email sent successfully.');
      })
      .catch(err => {
        if (err.status === 402) console.error('Career results email not sent: payment not verified for this result.');
        else if (err.status === 400) console.error('Career results email not sent: no registration on file for this result.');
        else console.error('Error sending career results email:', err);
      });
    }
  }, [result, savedResultId]);

  const currentQuestion = ALL_QUESTIONS[step];
  
  const getPart = () => {
    if (step < 40) return 1;
    if (step < 140) return 2;
    return 3;
  };

  const currentPart = getPart();

  const getSectionTitle = (part: number) => {
    switch(part) {
      case 1: return "Multiple Intelligence Mapping";
      case 2: return "Vocational Interest Profile";
      case 3: return "Career Personality Assessment";
      default: return "";
    }
  };

  const getSectionDesc = (part: number) => {
    switch(part) {
      case 1: return "Identifying your natural cognitive strengths and learning styles across 8 intelligence types.";
      case 2: return "100 choices to map your interests across diverse vocational sectors like Engineering, Arts, and Law.";
      case 3: return "Mapping your professional behavior, decision-making style, and workplace personality.";
      default: return "";
    }
  };

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[step] = value;
    setAnswers(newAnswers);
    
    setTimeout(() => {
      if (step === 39 || step === 139) {
        setShowSectionIntro(true);
      }
      if (step < ALL_QUESTIONS.length - 1) {
        setStep(step + 1);
      } else {
        processResults(newAnswers);
      }
    }, 300);
  };

  const goToPrevious = () => {
    if (step > 0) setStep(step - 1);
  };

  const goToNext = () => {
    if (step < answers.length && step < ALL_QUESTIONS.length - 1) {
      setStep(step + 1);
    }
  };

  const processResults = (finalAnswers: number[], isInitialLoad?: boolean) => {
    setLoading(true);

    if (!isInitialLoad) {
      // Only send the results email for a live test completion, not saved-result loads
      shouldSendEmailRef.current = true;
      localStorage.removeItem(PROGRESS_KEY);

      // Attach the verified payment order so the server can mark this result as paid
      const orderId = localStorage.getItem('career_order_id');

      // Save encrypted answers to DB and update URL with UUID. Identity and
      // intake details are attached server-side from the signed-in account.
      apiClient.post<any>('/api/save-answers', {
        answers: finalAnswers.join(''),
        ...(orderId ? { orderId } : {})
      })
        .then(data => {
          if (data.id) {
            // The order is single-use — it is now linked to this result server-side
            localStorage.removeItem('career_order_id');
            localStorage.removeItem('career_paid');
            setSavedResultId(data.id);
            setFreeSessionAvailable(!!data.freeSessionAvailable);
            setSearchParams({ id: data.id }, { replace: true });
          }
        })
        .catch(err => console.error('Failed to save answers to DB:', err));
    }

    setTimeout(() => {
      const miScores: Record<string, number> = {};
      const interestScores: Record<string, number> = {};
      const personalityScores: Record<string, number> = {};

      finalAnswers.forEach((val, idx) => {
        const q = ALL_QUESTIONS[idx];
        if (idx < 40) {
          miScores[q.category] = (miScores[q.category] || 0) + val;
        } else if (idx < 140) {
          interestScores[q.category] = (interestScores[q.category] || 0) + val;
        } else {
          personalityScores[q.category] = (personalityScores[q.category] || 0) + val;
        }
      });

      const maxInterest = Math.max(...Object.values(interestScores));
      const topInterests = maxInterest > 0 
        ? Object.entries(interestScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name)
        : ["No clear dominant preference"];

      const maxIntelligence = Math.max(...Object.values(miScores));
      const topIntelligence = maxIntelligence > 0
        ? Object.entries(miScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([name]) => name)
        : ["No clear dominant preference"];

      setResult({
        mi: miScores,
        interests: interestScores,
        personality: personalityScores,
        summary: {
          topInterests,
          topIntelligence,
          profile: "Comprehensive Career Pioneer"
        }
      });
      setLoading(false);
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  const options = [
    { label: "Strongly Disagree / No Interest", value: 0 },
    { label: "Disagree / Low Interest", value: 1 },
    { label: "Neutral / Moderate", value: 2 },
    { label: "Agree / High Interest", value: 3 },
    { label: "Strongly Agree / Very High", value: 4 },
  ];

  if (loadError) {
    return (
      <AssessmentPage align="center">
        <StackedCard maxW="max-w-2xl" className="as-pop">
          <div className="p-8 md:p-14 text-center">
            <IconTile tint="bg-peach" className="mx-auto mb-8"><X size={38} /></IconTile>
            <h2 className="serif text-3xl md:text-4xl text-intel-dark mb-5">Result not found</h2>
            <p className="text-intel-dark/65 leading-relaxed mb-10">{loadError} The link may be invalid or the saved result is no longer available.</p>
            <button onClick={onClose} className={`${BTN_PRIMARY} w-full`}>Go back</button>
          </div>
        </StackedCard>
      </AssessmentPage>
    );
  }

  const PART_TINTS = ['bg-lavender', 'bg-sage', 'bg-peach'];

  if (showSectionIntro && !result && !loading) {
    return (
      <AssessmentPage align="center">
        <StackedCard maxW="max-w-2xl" className="as-pop">
          <div className="p-8 md:p-14 text-center">
            <BackPill onClick={onClose} className="mb-8"><ArrowLeft size={16} /> Back</BackPill>
            <div className="flex justify-center mb-8">
              <IconTile tint={PART_TINTS[currentPart - 1]}>
                {currentPart === 1 ? <Brain size={38} /> : currentPart === 2 ? <Target size={38} /> : <UserCheck size={38} />}
              </IconTile>
            </div>
            <span className="inline-block rounded-full bg-white px-4 py-1.5 text-[12px] font-semibold text-[#8a6a3f] shadow-sm mb-5">Part {currentPart} of 3</span>
            <h2 className="serif text-3xl md:text-4xl text-intel-dark mb-5 leading-tight">{getSectionTitle(currentPart)}</h2>
            <p className="text-intel-dark/65 leading-relaxed mb-10">{getSectionDesc(currentPart)}</p>
            <button onClick={() => setShowSectionIntro(false)} className={`${BTN_PRIMARY} w-full`}>
              Begin section <ArrowRight size={18} />
            </button>
          </div>
        </StackedCard>
      </AssessmentPage>
    );
  }

  const getSectionProgress = () => {
    if (step < 40) return { current: step + 1, total: 40 };
    if (step < 140) return { current: step - 39, total: 100 };
    return { current: step - 139, total: 60 };
  };

  const sectionProg = getSectionProgress();
  const partTint = PART_TINTS[currentPart - 1] || 'bg-lavender';

  return (
    <AssessmentPage>
      <StackedCard maxW={result ? 'max-w-4xl' : 'max-w-3xl'} className="flex flex-col min-h-[60vh] print:max-h-none print:overflow-visible">

        {/* Navigation / progress header */}
        <div className="sticky top-0 bg-[#FFFDF8]/90 backdrop-blur-md px-5 md:px-6 py-4 border-b border-black/5 flex items-center justify-between gap-3 z-50 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            {!result ? (
              <>
                <RoundButton onClick={goToPrevious} disabled={step === 0} aria-label="Previous question"><ArrowLeft size={18} /></RoundButton>
                <span className={`hidden sm:inline-flex rounded-full ${partTint} px-3 py-1 text-[11px] font-semibold text-intel-dark/80`}>Part {currentPart}</span>
                <ProgressPill value={sectionProg.current} total={sectionProg.total} />
                <RoundButton onClick={goToNext} disabled={step >= answers.length || step === ALL_QUESTIONS.length - 1} aria-label="Next question"><ArrowRight size={18} /></RoundButton>
              </>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-sage px-4 py-1.5 text-[12px] font-semibold text-intel-dark/80"><Sparkles size={13} /> Your report is ready</span>
            )}
          </div>
          <RoundButton onClick={onClose} aria-label="Close"><X size={18} /></RoundButton>
        </div>

        <div className="p-6 md:p-14">
          {!result && !loading ? (
            <div key={step} className="as-pop max-w-2xl mx-auto">
              <QuestionHead eyebrow={currentQuestion?.category} text={currentQuestion?.text || ''} chip={partTint} />
              <div className="grid gap-3">
                {options.map((opt, i) => (
                  <OptionButton key={opt.value} label={opt.label} picked={answers[step] === opt.value} index={i} onClick={() => handleAnswer(opt.value)} />
                ))}
              </div>
            </div>
          ) : loading ? (
            <div className="py-20 flex flex-col items-center text-center">
              <div className="relative mb-10 w-24 h-24">
                <Loader2 size={96} className="animate-spin text-terracotta opacity-30" />
                <Brain size={34} className="as-bob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-terracotta" />
              </div>
              <h3 className="serif text-3xl text-intel-dark mb-4">Putting it all together</h3>
              <p className="text-intel-dark/60 max-w-sm mx-auto">Analyzing your Multiple Intelligences, Vocational Interests, and Personality Profile...</p>
            </div>
          ) : (
            <div id="print-area" className="as-pop print:p-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 print:mb-8">
                <div>
                  <h2 className="serif text-3xl md:text-5xl text-intel-dark mb-3">Assessment <span className="italic text-serene-green">report</span></h2>
                  <p className="inline-block rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#8a6a3f] shadow-sm">Internal reference: INTEL-CAREER-2024</p>
                </div>
                <div className="flex gap-3 print:hidden">
                  <button onClick={handlePrint} className={`${BTN_DARK} h-12 px-6 text-sm`}>
                    <Download size={16} /> Download form
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
                {[
                  { title: 'Multiple intelligences', icon: <Brain size={18} />, tint: 'bg-lavender', data: result.mi, max: 20, bar: 'bg-intel-dark' },
                  { title: 'Vocational interests', icon: <Target size={18} />, tint: 'bg-sage', data: result.interests, max: 40, bar: 'bg-terracotta' },
                  { title: 'Career personality', icon: <UserCheck size={18} />, tint: 'bg-peach', data: result.personality, max: 40, bar: 'bg-intel-dark' },
                ].map(({ title, icon, tint, data, max, bar }) => (
                  <div key={title} className={`p-6 ${tint} rounded-[32px]`}>
                    <h4 className="serif text-lg text-intel-dark mb-5 flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center">{icon}</span> {title}
                    </h4>
                    <div className="space-y-4">
                      {Object.entries(data).map(([cat, score]: [any, any]) => (
                        <div key={cat}>
                          <div className="flex justify-between text-[12px] font-semibold text-intel-dark/80 mb-1.5 px-1">
                            <span>{cat}</span>
                            <span>{Math.round((score / max) * 100)}%</span>
                          </div>
                          <div className="h-2.5 w-full bg-white/70 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${bar}`} style={{ width: `${(score / max) * 100}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 md:p-12 bg-intel-dark rounded-[36px] text-white mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 bg-terracotta rounded-2xl flex items-center justify-center">
                    <Sparkles size={20} className="text-intel-dark" />
                  </div>
                  <h3 className="serif text-2xl !text-white">Expert summary</h3>
                </div>
                <p className="!text-white text-lg leading-relaxed mb-6">
                  Based on your results, you exhibit high proficiency in <span className="text-terracotta font-semibold">{result.summary.topIntelligence.join(' & ')}</span>.
                  This cognitive foundation aligns exceptionally well with your top interest areas: <span className="text-terracotta font-semibold">{result.summary.topInterests.join(', ')}</span>.
                </p>
                <p className="!text-white/80 text-base leading-relaxed italic">
                  Your profile suggests you would thrive in roles that demand both strategic thinking and a strong vocational identity. We recommend a one-on-one session to map these results to specific university courses and international career paths.
                </p>
              </div>

              <div className="relative text-center p-10 md:p-12 bg-sage rounded-[36px] print:hidden flex flex-col items-center">
                <div className="relative mb-5">
                  <Confetti />
                  <span className="as-hop inline-block"><IconTile tint="bg-white" size="md"><PartyPopper size={26} /></IconTile></span>
                </div>
                <h3 className="serif text-2xl md:text-3xl text-intel-dark mb-3">Assessment completed</h3>
                {type === 'career' ? (
                  <>
                    <p className="text-intel-dark/70 mb-8 max-w-md mx-auto">
                      {freeSessionAvailable ? (
                        <>Your report is ready. As part of your premium assessment, you are eligible for a <strong>free 1-on-1 expert counselling session</strong> (usually ₹1600+).</>
                      ) : (
                        <>Your report is ready.</>
                      )}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      {freeSessionAvailable && <button
                        onClick={() => {
                          const currentId = searchParams.get('id') || '';
                          const assessmentUrl = window.location.origin + '/assessments/career?id=' + currentId;
                          navigate(`/booking?freeBooking=true&assessmentRef=${encodeURIComponent(assessmentUrl)}`);
                        }}
                        className={BTN_GREEN}
                      >
                        Schedule free session
                      </button>}
                      <button
                        onClick={() => {
                          setSearchParams({}, { replace: true });
                          window.location.reload();
                        }}
                        className={BTN_DARK}
                      >
                        Retake assessment
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-intel-dark/70 mb-8 max-w-md mx-auto">Your results and scheduled appointment slot have been sent to our advisors. We will contact you soon!</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      <button onClick={onClose} className={BTN_PRIMARY}>Finish &amp; close</button>
                      <button
                        onClick={() => {
                          setSearchParams({}, { replace: true });
                          window.location.reload();
                        }}
                        className={BTN_DARK}
                      >
                        Retake assessment
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </StackedCard>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </AssessmentPage>
  );
};

export default Assessment;
