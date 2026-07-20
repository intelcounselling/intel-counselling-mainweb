import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, ArrowRight, ArrowLeft, Shield, HeartPulse, CheckCircle, Link } from 'lucide-react';
import { ClinicalConfig } from './ClinicalQuestions';

interface ClinicalAssessmentProps {
  config: ClinicalConfig;
  onClose: () => void;
}

const ClinicalAssessment: React.FC<ClinicalAssessmentProps> = ({ config, onClose }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState(-1); // -1 is the intro page
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
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
      setSearchParams({ r: finalAnswers.join('') }, { replace: true });
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

  // Intro Screen
  if (step === -1) {
    return (
      <div className="min-h-screen bg-[#F6F7F9] pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="relative bg-white w-full max-w-2xl p-8 md:p-16 rounded-[40px] shadow-xl animate-in fade-in duration-500">
          <button onClick={onClose} className="absolute left-6 top-6 md:left-8 md:top-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black/40 hover:text-black/80 transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
          
          <div className={`w-20 h-20 ${config.color} text-white rounded-3xl flex items-center justify-center mb-8 shadow-xl mt-4`}>
             <HeartPulse size={40} />
          </div>
          <span className="text-terracotta font-black text-xs uppercase tracking-[0.3em] mb-4 block">Self-Assessment Tool</span>
          <h2 className="text-3xl md:text-4xl font-black serif text-intel-dark mb-6">{config.title}</h2>
          
          <div className="space-y-4 text-intel-dark/70 mb-10 text-sm md:text-base leading-relaxed">
            <p><strong>Purpose:</strong> {config.desc}</p>
            <p className="flex gap-2 items-start opacity-90"><Shield size={18} className="shrink-0 mt-0.5 text-serene-green" /> <span>This is a brief self-screening tool to help you understand your emotional well-being. It takes about 2–5 minutes.</span></p>
            <p className="flex gap-2 items-start opacity-90"><Shield size={18} className="shrink-0 mt-0.5 text-serene-green" /> <span><strong>Confidential:</strong> Your responses are private.</span></p>
            <p className="flex gap-2 items-start text-terracotta font-medium"><Shield size={18} className="shrink-0 mt-0.5" /> <span><strong>Not a Diagnosis:</strong> This is an awareness tool and DOES NOT replace professional medical or psychiatric diagnosis.</span></p>
          </div>
          
          <button 
            onClick={handleStart}
            className="w-full bg-terracotta text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
          >
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9] pt-20 md:pt-28 pb-12 px-4 flex items-start justify-center">
      <div className={`relative bg-white w-full max-w-3xl md:rounded-[40px] shadow-xl flex flex-col overflow-hidden min-h-[60vh] border border-black/5`}>
        
        {/* Navigation / Progress Header */}
        <div className="bg-white/80 backdrop-blur-md px-6 py-4 border-b border-black/5 flex items-center justify-between z-50 shrink-0">
          <div className="flex items-center gap-4">
            {!result && (
              <button 
                onClick={goToPrevious}
                disabled={step === 0}
                className="p-2 hover:bg-black/5 rounded-full disabled:opacity-20 transition-all"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            
            <div className={`px-3 py-1 rounded-full ${config.color} text-white text-[10px] font-black uppercase tracking-widest`}>
              {config.title}
            </div>
            
            {!result && (
              <>
                <div className="h-1.5 w-24 md:w-48 bg-black/5 rounded-full overflow-hidden">
                   <div className={`h-full ${config.color} transition-all duration-300`} style={{ width: `${((step + 1) / config.questions.length) * 100}%` }}></div>
                </div>
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">{step + 1} / {config.questions.length}</span>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-16 no-scrollbar">
          {!result ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl mx-auto">
              <div className="mb-10 text-center">
                <p className="text-black/40 font-semibold text-sm uppercase tracking-wider mb-4">{config.introPrefix}</p>
                <h3 className="text-2xl md:text-3xl font-black text-intel-dark serif leading-snug">
                  {config.questions[step].text}
                </h3>
              </div>

              <div className="grid gap-3">
                 {config.options.map((opt) => (
                   <button 
                     key={opt.value} 
                     onClick={() => handleAnswer(opt.value)}
                     className={`group w-full text-left p-5 md:p-6 rounded-[2rem] border-2 transition-all flex justify-between items-center shadow-sm hover:shadow-md ${answers[step] === opt.value ? 'border-intel-dark bg-intel-dark text-white rounded-3xl shadow-lg' : 'border-black/5 bg-white hover:border-black/10'}`}
                   >
                     <span className={`font-bold text-sm md:text-base transition-colors ${answers[step] === opt.value ? 'text-white' : 'text-intel-dark/80 group-hover:text-intel-dark'}`}>
                       {opt.label}
                     </span>
                     {answers[step] === opt.value ? (
                       <CheckCircle size={24} className="text-white" />
                     ) : (
                       <div className="w-6 h-6 rounded-full border-2 border-black/10 group-hover:border-black/20 transition-all" />
                     )}
                   </button>
                 ))}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-700 max-w-2xl mx-auto text-center py-8">
               <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${config.color} text-white mb-8 shadow-xl`}>
                 <Shield size={40} />
               </div>
               
               <h2 className="text-4xl md:text-5xl font-black serif text-intel-dark mb-4">{result.band.label}</h2>
               
               <div className="bg-black/5 rounded-[40px] p-8 md:p-12 mb-10">
                 <p className="text-intel-dark/80 text-lg md:text-xl leading-relaxed">
                   {result.band.desc}
                 </p>
               </div>

               {/* Crisis Message for PHQ-9 Item 9 */}
               {config.id === 'phq9' && result.answers[8] > 0 && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-6 md:p-8 rounded-[30px] mb-10 text-left shadow-lg">
                    <p className="font-black flex items-center gap-2 text-xl mb-3">
                       <Shield size={24} className="flex-shrink-0" /> IMPORTANT NOTICE
                    </p>
                    <p className="text-base md:text-lg mb-4">If you are experiencing thoughts of self-harm, please know that you are not alone and help is available right now.</p>
                    <div className="bg-white/60 p-4 rounded-2xl border border-red-100">
                      <p className="font-bold text-sm uppercase tracking-wider mb-2 opacity-80">Immediate Support Helplines:</p>
                      <ul className="space-y-2 text-sm md:text-base font-semibold">
                        <li className="flex items-center gap-2">📞 <span className="opacity-80">Kiran Mental Health Helpline (India):</span> <a href="tel:18005990019" className="underline hover:text-red-600">1800-599-0019</a></li>
                        <li className="flex items-center gap-2">📞 <span className="opacity-80">AASRA (Crisis Intervention):</span> <a href="tel:+919820466726" className="underline hover:text-red-600">+91-9820466726</a></li>
                        <li className="flex items-center gap-2">🚨 <span className="opacity-80">Emergency Services:</span> Dial 112 or your local emergency number</li>
                      </ul>
                    </div>
                  </div>
               )}

               {/* SAS Emotional Reliance Alert */}
               {config.id === 'sas' && (result.answers[0] >= 3 || result.answers[2] >= 3 || result.answers[6] >= 3 || result.answers[9] >= 3) && (
                  <div className="bg-orange-50 border border-orange-200 text-orange-800 p-6 md:p-8 rounded-[30px] mb-10 text-left shadow-lg">
                    <p className="font-black flex items-center gap-2 text-xl mb-3">
                       <Shield size={24} className="flex-shrink-0" /> EMOTIONAL RELIANCE
                    </p>
                    <p className="text-base md:text-lg">Your responses suggest emotional reliance on smartphone use. Support strategies can help you manage stress without over-dependence on devices.</p>
                  </div>
               )}

               <div className="flex flex-col md:flex-row gap-4 items-center justify-center w-full">
                 <button 
                   onClick={() => {
                     navigate('/booking?assessmentRef=' + encodeURIComponent(window.location.href));
                   }}
                   className={`w-full md:w-auto px-10 py-5 ${config.color} text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all md:mb-8`}
                 >
                   {result.band.ctaText || "Book a Consultation"}
                 </button>
                 
                 <button 
                     onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Result link copied to clipboard you can now share it!");
                     }}
                     className="flex items-center justify-center gap-3 w-full md:w-auto px-6 py-5 bg-white text-intel-dark border-2 border-black/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black/5 transition-all shadow-sm md:mb-8"
                   >
                     <Link size={16} /> Share Result
                 </button>
               </div>

               <div className="border-t border-black/10 pt-8 mt-4 text-center">
                 <p className="text-black/40 text-[11px] uppercase tracking-widest leading-relaxed max-w-md mx-auto">
                   This screening tool is for self-awareness and early support only. It does not replace professional diagnosis or treatment.
                 </p>
               </div>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ClinicalAssessment;
