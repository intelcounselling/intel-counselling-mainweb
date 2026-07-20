import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, ArrowRight, Brain, Target, UserCheck, Calendar } from 'lucide-react';
import SpotlightCard from '../components/SpotlightCard';
import FadeIn from '../components/FadeIn';

const CareerGuidancePage: React.FC = () => {
  const navigate = useNavigate();

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
          className="group flex items-center gap-3 text-white font-black transition-all mb-12 md:mb-16 uppercase tracking-[0.2em] text-xs bg-serene-green hover:bg-[#2D6A4F] px-5 py-3 rounded-full shadow-sm w-fit"
        >
          <div className="w-7 h-7 rounded-full bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition-all duration-300">
            <ArrowLeft size={14} />
          </div>
          Back to Home
        </button>

        <div className="text-center mb-16 md:mb-20">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-intel-dark border border-white/10 text-white text-[10px] font-bold uppercase tracking-[0.3em] mb-6 shadow-xl">
              <Sparkles size={14} className="animate-pulse" />
              Premium Mapping Suite
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-intel-dark serif mb-6 leading-tight">
              Unlock your professional <br /><span className="italic text-serene-green">potential.</span>
            </h1>
            <p className="text-intel-dark/60 max-w-xl mx-auto text-base md:text-lg font-light leading-relaxed">
              Explore your cognitive strengths, vocational interests, and personality metrics to chart a successful path forward.
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={200}>
          <SpotlightCard className="bg-[#1C1F22] border-2 border-terracotta/20 p-8 md:p-16 rounded-[40px] md:rounded-[60px] shadow-2xl transition-all duration-700 hover:scale-[1.01] flex flex-col gap-10 text-left relative overflow-hidden">
            {/* Promo Corner Ribbon */}
            <div className="absolute top-0 right-0 bg-terracotta text-white font-black text-[10px] uppercase tracking-widest px-8 py-2 rotate-45 translate-x-6 translate-y-3 shadow-md">
              Promo ₹1
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 bg-intel-dark text-white rounded-3xl flex items-center justify-center shadow-xl border border-white/10">
                <Sparkles size={28} />
              </div>
              
              <div className="flex-grow">
                <span className="text-[10px] md:text-xs font-black text-terracotta uppercase tracking-[0.3em] mb-3 block font-inter">
                  COMPREHENSIVE MAPPING &bull; FULL SUITE
                </span>
                <h3 className="text-3xl md:text-5xl font-black text-white serif mb-6 leading-tight">
                  Career Guidance Assessment
                </h3>
                <p className="text-white/70 font-light leading-relaxed text-sm md:text-lg mb-8">
                  Evaluate your Multiple Intelligences, Vocational Interests, and Career Personality in one sitting. Select Assessment Only (with detailed PDF report) or Assessment + Result Explanation (includes 1-on-1 session).
                </p>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="flex gap-3 items-start">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-terracotta shrink-0">
                      <Brain size={18} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">Multiple Intelligences</h4>
                      <p className="text-white/40 text-xs font-light">Identify natural cognitive strengths and learning styles.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-terracotta shrink-0">
                      <Target size={18} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">Vocational Interests</h4>
                      <p className="text-white/40 text-xs font-light">Map preferences across major career streams and domains.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-terracotta shrink-0">
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">Career Personality</h4>
                      <p className="text-white/40 text-xs font-light">Evaluate professional behavior and decision-making style.</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <span className="bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-bold text-white/80">Premium PDF Report</span>
                  <span className="bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-bold text-white/80">Valid Diagnostics</span>
                  <span className="bg-serene-green/30 border border-serene-green/50 px-3.5 py-1.5 rounded-full text-xs font-black text-white flex items-center gap-1.5">
                    <Calendar size={12} /> 1-on-1 Session Option Included
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-white/10">
              <div className="text-left">
                <span className="text-xs font-bold text-white/40 block mb-1 uppercase tracking-wider">Special Price</span>
                <span className="text-4xl md:text-5xl font-black text-white serif tracking-tight">₹1<span className="text-xs font-bold text-white/60 ml-1">only</span></span>
              </div>

              <button 
                onClick={() => navigate('/assessments/career')}
                className="w-full sm:w-auto px-10 py-5 bg-terracotta hover:bg-terracotta/90 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all text-xs flex items-center justify-center gap-3"
              >
                Get Access & Start <ArrowRight size={16} />
              </button>
            </div>
          </SpotlightCard>
        </FadeIn>
      </div>
    </div>
  );
};

export default CareerGuidancePage;
