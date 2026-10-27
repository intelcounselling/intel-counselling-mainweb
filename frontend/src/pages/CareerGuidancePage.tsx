import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, ArrowRight, Brain, Target, UserCheck, Calendar, FileText } from 'lucide-react';
import SpotlightCard from '../components/SpotlightCard';
import FadeIn from '../components/FadeIn';
import { usePricing, formatPrice } from '../utils/pricing';

const CareerGuidancePage: React.FC = () => {
  const navigate = useNavigate();
  const { demoMode, prices } = usePricing();

  return (
    <div className="relative min-h-screen pt-24 pb-12 md:pt-32 md:pb-24 px-6 bg-[#F7EBD3]">
      {/* Background accents */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-[10%] w-[40%] h-[40%] bg-terracotta/5 rounded-full blur-[120px] opacity-30" />
        <div className="absolute bottom-0 right-[10%] w-[40%] h-[40%] bg-terracotta/5 rounded-full blur-[120px] opacity-30" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <button 
          onClick={() => navigate('/')}
          className="group inline-flex items-center gap-2 mb-10 text-sm font-semibold text-intel-dark/70 hover:text-intel-dark transition-colors"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Back to home
        </button>

        <FadeIn>
          <header className="max-w-2xl mb-10 md:mb-12">
            <p className="text-sm font-semibold text-[#8a6a3f] mb-3">Career guidance</p>
            <h1 className="serif text-4xl md:text-5xl leading-tight text-intel-dark">Find the career path that fits you</h1>
            <p className="mt-4 text-base md:text-lg text-intel-dark/70 leading-relaxed">
              Explore your cognitive strengths, vocational interests and personality, and plan your next step with confidence.
            </p>
          </header>
        </FadeIn>

        <FadeIn delay={200}>
          <SpotlightCard className="bg-[#1C1F22] border-2 border-terracotta/20 p-8 md:p-16 rounded-[28px] md:rounded-[32px] shadow-2xl transition-all duration-700 flex flex-col gap-10 text-left relative overflow-hidden">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 bg-intel-dark text-white rounded-3xl flex items-center justify-center shadow-xl border border-white/10">
                <Compass size={26} />
              </div>
              
              <div className="flex-grow">
                <span className="text-sm text-white/55 mb-1 block">
                  Three assessments in one sitting
                </span>
                <h3 className="serif text-3xl md:text-4xl text-white mb-5 leading-tight">
                  Career Guidance Assessment
                </h3>
                <p className="text-white/75 leading-relaxed text-[15px] md:text-base mb-8">
                  Evaluate your Multiple Intelligences, Vocational Interests, and Career Personality in one sitting. Select Assessment Only (with detailed PDF report) or Assessment + Result Explanation (includes 1-on-1 session).
                </p>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="flex gap-3 items-start">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-terracotta shrink-0">
                      <Brain size={18} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">Multiple Intelligences</h4>
                      <p className="text-white/60 text-sm leading-relaxed">Identify natural cognitive strengths and learning styles.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-terracotta shrink-0">
                      <Target size={18} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">Vocational Interests</h4>
                      <p className="text-white/60 text-sm leading-relaxed">Map preferences across major career streams and domains.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-terracotta shrink-0">
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">Career Personality</h4>
                      <p className="text-white/60 text-sm leading-relaxed">Evaluate professional behavior and decision-making style.</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <span className="bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-bold text-white/80">Detailed PDF report</span>
                  <span className="bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-bold text-white/80">Research-based tools</span>
                  <span className="bg-serene-green/30 border border-serene-green/50 px-3.5 py-1.5 rounded-full text-xs font-black text-white flex items-center gap-1.5">
                    <Calendar size={12} /> Optional 1-on-1 session
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-white/10">
              <div className="text-left">
                <span className="text-sm text-white/55 block mb-1">Packages from</span>
                <span className="serif text-4xl md:text-5xl text-white">₹{formatPrice(prices.career_assessment)}</span>
                {demoMode && (
                  <span className="ml-3 align-middle bg-amber-100 text-amber-700 text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-amber-200">
                    Demo Mode
                  </span>
                )}
              </div>

              <button 
                onClick={() => navigate('/assessments/career')}
                className="w-full sm:w-auto h-12 px-7 bg-terracotta hover:bg-[#cfac80] text-intel-dark rounded-full font-semibold transition-colors text-sm flex items-center justify-center gap-3"
              >
                Get access and start <ArrowRight size={16} />
              </button>
            </div>

            <div className="flex justify-center pt-6">
              <button
                onClick={() => navigate('/my-results')}
                className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-terracotta transition-colors uppercase tracking-widest"
              >
                <FileText size={13} /> Already purchased? View & retake your results
              </button>
            </div>
          </SpotlightCard>
        </FadeIn>
      </div>
    </div>
  );
};

export default CareerGuidancePage;
