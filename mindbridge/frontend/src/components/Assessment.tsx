import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, ArrowRight, ArrowLeft, Loader2, Sparkles, Download, CheckCircle, Brain, Target, UserCheck } from 'lucide-react';
import { MI_QUESTIONS, INTEREST_QUESTIONS, PERSONALITY_QUESTIONS, Question } from './TestQuestions';

interface AssessmentProps {
  type?: string;
  onClose: () => void;
}

const ALL_QUESTIONS: Question[] = [
  ...MI_QUESTIONS,
  ...INTEREST_QUESTIONS,
  ...PERSONALITY_QUESTIONS
];

const Assessment: React.FC<AssessmentProps> = ({ type, onClose }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [showSectionIntro, setShowSectionIntro] = useState(true);

  useEffect(() => {
    const resultId = searchParams.get('id');
    const rawAnswers = searchParams.get('r');

    if (resultId) {
      // Load from DB using UUID
      setLoading(true);
      fetch(`/api/load-answers?id=${encodeURIComponent(resultId)}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data.answers && data.answers.length === ALL_QUESTIONS.length) {
            const parsedAnswers = data.answers.split('').map(Number);
            setAnswers(parsedAnswers);
            setStep(ALL_QUESTIONS.length);
            setShowSectionIntro(false);
            processResults(parsedAnswers, true);
          } else {
            setLoading(false);
          }
        })
        .catch(err => {
          console.error('Failed to load answers from DB:', err);
          setLoading(false);
        });
    } else if (rawAnswers && rawAnswers.length === ALL_QUESTIONS.length) {
      // Legacy URL fallback: save to DB and update URL
      const parsedAnswers = rawAnswers.split('').map(Number);
      setAnswers(parsedAnswers);
      setStep(ALL_QUESTIONS.length);
      setShowSectionIntro(false);
      setLoading(true);
      let userId = null;
      try {
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) userId = JSON.parse(savedUser).id;
      } catch (e) {}
      fetch('/api/save-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: rawAnswers, userId })
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
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
    }
  }, []);

  useEffect(() => {
    if (result) {
      let registration = null;
      try {
        const savedReg = localStorage.getItem('assessment_registration');
        if (savedReg) registration = JSON.parse(savedReg);
      } catch (e) {
        console.error('Failed to parse registration details', e);
      }

      const sessionMode = localStorage.getItem('career_booked_session_mode') || '';
      const date = localStorage.getItem('career_booked_date') || '';
      const time = localStorage.getItem('career_booked_time') || '';

      if (registration) {
        fetch('/api/send-career-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registration,
            appointment: { sessionMode, date, time },
            result
          })
        })
        .then(res => {
          if (!res.ok) console.error('Failed to send career results email');
          else console.log('Career results email sent successfully.');
        })
        .catch(err => console.error('Error sending career results email:', err));
      }
    }
  }, [result]);

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
    
    if (step === answers.length || step < ALL_QUESTIONS.length - 1) {
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
    }
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
      let userId = null;
      try {
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) userId = JSON.parse(savedUser).id;
      } catch (e) {}
      // Save encrypted answers to DB and update URL with UUID
      fetch('/api/save-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers.join(''), userId })
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data.id) {
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

      const topInterests = Object.entries(interestScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name);

      const topIntelligence = Object.entries(miScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([name]) => name);

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

  if (showSectionIntro && !result && !loading) {
    return (
      <div className="min-h-screen bg-[#F6F7F9] pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="relative bg-white w-full max-w-2xl p-8 md:p-16 rounded-[40px] shadow-xl text-center animate-in fade-in duration-500">
          <button onClick={onClose} className="absolute left-6 top-6 md:left-8 md:top-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black/40 hover:text-black/80 transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="w-20 h-20 bg-intel-dark text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
             {currentPart === 1 ? <Brain size={40} /> : currentPart === 2 ? <Target size={40} /> : <UserCheck size={40} />}
          </div>
          <span className="text-terracotta font-black text-xs uppercase tracking-[0.3em] mb-4 block">Part {currentPart} of 3</span>
          <h2 className="text-3xl md:text-4xl font-black serif text-intel-dark mb-6">{getSectionTitle(currentPart)}</h2>
          <p className="text-intel-dark/60 leading-relaxed mb-10">{getSectionDesc(currentPart)}</p>
          <button 
            onClick={() => setShowSectionIntro(false)}
            className="w-full bg-terracotta text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
          >
            Begin Section
          </button>
        </div>
      </div>
    );
  }

  const getSectionProgress = () => {
    if (step < 40) return { current: step + 1, total: 40 };
    if (step < 140) return { current: step - 39, total: 100 };
    return { current: step - 139, total: 60 };
  };

  const sectionProg = getSectionProgress();

  return (
    <div className="min-h-screen bg-[#F6F7F9] pt-20 md:pt-28 pb-12 px-4 flex items-start justify-center">
      <div className={`relative bg-white w-full ${result ? 'max-w-4xl' : 'max-w-3xl'} md:rounded-[40px] shadow-xl flex flex-col overflow-hidden min-h-[60vh] border border-black/5 print:shadow-none print:max-h-none print:overflow-visible`}>
        
        {/* Navigation / Progress Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-black/5 flex items-center justify-between z-50 print:hidden">
          <div className="flex items-center gap-4">
            <button 
              onClick={goToPrevious}
              disabled={step === 0}
              className="p-2 hover:bg-black/5 rounded-full disabled:opacity-20 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="px-3 py-1 rounded-full bg-intel-dark text-white text-[10px] font-black uppercase tracking-widest">
              Part {currentPart}
            </div>
            <div className="h-1.5 w-32 md:w-48 bg-black/5 rounded-full overflow-hidden">
               <div className="h-full bg-terracotta transition-all duration-300" style={{ width: `${(sectionProg.current / sectionProg.total) * 100}%` }}></div>
            </div>
            <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">{sectionProg.current} / {sectionProg.total}</span>
            <button 
              onClick={goToNext}
              disabled={step >= answers.length || step === ALL_QUESTIONS.length - 1}
              className="p-2 hover:bg-black/5 rounded-full disabled:opacity-20 transition-all"
            >
              <ArrowRight size={20} />
            </button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 md:p-16">
          {!result && !loading ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-12">
                <p className="text-terracotta font-black text-xs uppercase tracking-[0.3em] mb-4">{currentQuestion?.category}</p>
                <h3 className="text-2xl md:text-4xl font-black text-intel-dark serif leading-tight">
                  {currentQuestion?.text}
                </h3>
              </div>

              <div className="grid gap-3 md:gap-4">
                 {options.map((opt) => (
                   <button 
                     key={opt.value} 
                     onClick={() => handleAnswer(opt.value)}
                     className={`group w-full text-left p-6 md:p-8 rounded-[2rem] border-2 transition-all flex justify-between items-center shadow-sm hover:shadow-md ${answers[step] === opt.value ? 'border-intel-dark bg-intel-dark text-white shadow-lg' : 'border-black/5 bg-white hover:border-terracotta hover:bg-terracotta/5'}`}
                   >
                     <span className={`font-bold text-sm md:text-base transition-colors ${answers[step] === opt.value ? 'text-white' : 'text-intel-dark/80 group-hover:text-intel-dark'}`}>
                       {opt.label}
                     </span>
                     {answers[step] === opt.value ? (
                       <CheckCircle size={24} className="text-white" />
                     ) : (
                       <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-all text-terracotta -translate-x-4 group-hover:translate-x-0" />
                     )}
                   </button>
                 ))}
              </div>
            </div>
          ) : loading ? (
            <div className="py-20 flex flex-col items-center text-center">
              <div className="relative mb-10">
                <Loader2 size={80} className="animate-spin text-terracotta opacity-20" />
                <Brain size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-terracotta animate-pulse" />
              </div>
              <h3 className="text-3xl font-black serif text-intel-dark mb-4">Compiling Results</h3>
              <p className="text-intel-dark/60 max-w-sm mx-auto">Analyzing your Multiple Intelligences, Vocational Interests, and Personality Profile...</p>
            </div>
          ) : (
            <div id="print-area" className="animate-in fade-in duration-1000 print:p-0">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 print:mb-8">
                 <div>
                   <h2 className="text-3xl md:text-5xl font-black serif text-intel-dark mb-2">Assessment Report</h2>
                   <p className="text-terracotta font-bold uppercase tracking-[0.2em] text-xs">Internal Reference: INTEL-CAREER-2024</p>
                 </div>
                  <div className="flex gap-3 print:hidden">
                    <button 
                      onClick={handlePrint}
                      className="flex items-center gap-3 px-6 py-3 bg-intel-dark text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
                    >
                      <Download size={16} /> Download Form
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                  <div className="p-6 bg-black/5 rounded-[32px] border border-black/5">
                    <h4 className="font-black text-xs uppercase tracking-widest text-terracotta mb-6 flex items-center gap-2">
                      <Brain size={16} /> Multiple Intelligences
                    </h4>
                    <div className="space-y-4">
                      {Object.entries(result.mi).map(([cat, score]: [any, any]) => (
                        <div key={cat}>
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5 px-1">
                            <span>{cat}</span>
                            <span>{Math.round((score / 20) * 100)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                            <div className="h-full bg-intel-dark" style={{ width: `${(score / 20) * 100}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-black/5 rounded-[32px] border border-black/5">
                    <h4 className="font-black text-xs uppercase tracking-widest text-terracotta mb-6 flex items-center gap-2">
                      <Target size={16} /> Vocational Interests
                    </h4>
                    <div className="space-y-4">
                      {Object.entries(result.interests).map(([cat, score]: [any, any]) => (
                        <div key={cat}>
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5 px-1">
                            <span>{cat}</span>
                            <span>{Math.round((score / 40) * 100)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                            <div className="h-full bg-terracotta" style={{ width: `${(score / 40) * 100}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-black/5 rounded-[32px] border border-black/5">
                    <h4 className="font-black text-xs uppercase tracking-widest text-terracotta mb-6 flex items-center gap-2">
                      <UserCheck size={16} /> Career Personality
                    </h4>
                    <div className="space-y-4">
                      {Object.entries(result.personality).map(([cat, score]: [any, any]) => (
                        <div key={cat}>
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5 px-1">
                            <span>{cat}</span>
                            <span>{Math.round((score / 40) * 100)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                            <div className="h-full bg-intel-dark" style={{ width: `${(score / 40) * 100}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-8 md:p-12 bg-intel-dark rounded-[50px] text-white mb-12">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-terracotta rounded-xl flex items-center justify-center">
                      <Sparkles size={20} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-black serif uppercase tracking-widest !text-white">Expert Summary</h3>
                  </div>
                  <p className="!text-white text-lg leading-relaxed mb-6">
                     Based on your results, you exhibit high proficiency in <span className="text-terracotta font-black uppercase">{result.summary.topIntelligence.join(' & ')}</span>. 
                     This cognitive foundation aligns exceptionally well with your top interest areas: <span className="text-terracotta font-black uppercase">{result.summary.topInterests.join(', ')}</span>.
                  </p>
                  <p className="!text-white text-base leading-relaxed italic">
                     Your profile suggests you would thrive in roles that demand both strategic thinking and a strong vocational identity. We recommend a one-on-one session to map these results to specific university courses and international career paths.
                  </p>
                </div>

                <div className="text-center p-12 bg-[#F7EBD3] rounded-[60px] border-2 border-dashed border-black/10 print:hidden flex flex-col items-center">
                  <h3 className="text-2xl font-black serif text-intel-dark mb-3">Assessment Completed Successfully</h3>
                  {type === 'career' ? (
                    <>
                      <p className="text-intel-dark/60 mb-8 max-w-md mx-auto font-medium">
                        Your report is ready. As part of your premium assessment, you are eligible for a <strong>FREE 1-on-1 expert counselling session</strong> (usually ₹1600+).
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button 
                          onClick={() => {
                            const currentId = searchParams.get('id') || '';
                            const assessmentUrl = window.location.origin + '/assessments/career?id=' + currentId;
                            navigate(`/booking?freeBooking=true&assessmentRef=${encodeURIComponent(assessmentUrl)}`);
                          }}
                          className="px-8 py-5 bg-serene-green text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all text-xs"
                        >
                          Schedule Free Session
                        </button>
                        <button 
                          onClick={() => {
                            setSearchParams({}, { replace: true });
                            window.location.reload();
                          }}
                          className="px-8 py-5 bg-intel-dark text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all text-xs"
                        >
                          Retake Assessment
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-intel-dark/60 mb-8 max-w-md mx-auto font-medium">Your results and scheduled appointment slot have been sent to our advisors. We will contact you soon!</p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button 
                          onClick={onClose}
                          className="px-8 py-5 bg-terracotta text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all text-xs"
                        >
                          Finish & Close
                        </button>
                        <button 
                          onClick={() => {
                            setSearchParams({}, { replace: true });
                            window.location.reload();
                          }}
                          className="px-8 py-5 bg-intel-dark text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all text-xs"
                        >
                          Retake Assessment
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
          )}
        </div>
      </div>
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Assessment;
