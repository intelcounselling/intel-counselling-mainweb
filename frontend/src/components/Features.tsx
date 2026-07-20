
import React, { useState } from 'react';
import { Activity, Lock, HelpCircle, ChevronRight, Brain, Shield, Leaf } from 'lucide-react';
import SpotlightCard from './SpotlightCard';
import FadeIn from './FadeIn';
import SplitText from './SplitText';

const Features: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const approaches = [
    {
      icon: <Activity className="text-terracotta" size={28} />,
      subIcon: <Brain size={18} />,
      title: "Evidence-Based Care",
      desc: "Clinical techniques grounded in the latest psychological research.",
      details: ["CBT & DBT Integration", "Research-Backed Protocols", "Customized Care Plans"]
    },
    {
      icon: <Lock className="text-terracotta" size={28} />,
      subIcon: <Shield size={18} />,
      title: "Patient Privacy",
      desc: "Your safety and confidentiality are our highest priorities.",
      details: ["Discreet Consultation", "Bank-Level Security", "Total Confidentiality"]
    },
    {
      icon: <HelpCircle className="text-terracotta" size={28} />,
      subIcon: <Leaf size={18} />,
      title: "Holistic Wellness",
      desc: "Addressing the mind, body, and spirit in your healing process.",
      details: ["Mind-Body Connection", "Wellness Integration", "Sustained Vitality"]
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
      {/* Background accents */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-[10%] w-[40%] h-[40%] bg-terracotta/5 rounded-full blur-[120px] opacity-30" />
        <div className="absolute bottom-0 right-[10%] w-[40%] h-[40%] bg-terracotta/5 rounded-full blur-[120px] opacity-30" />
      </div>

      <div className="text-center relative z-10">
        <FadeIn delay={100}>
          <div className="mb-4 sm:mb-6 flex justify-center">
            <span className="text-terracotta font-bold text-[9px] sm:text-[10px] tracking-widest uppercase
                             bg-white/5 px-4 sm:px-6 py-2 rounded-full border border-white/10
                             backdrop-blur-sm shadow-xl">
              Our Methodology
            </span>
          </div>
        </FadeIn>

        <SplitText
          text="Scientific, Yet Human."
          className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-white mb-4 sm:mb-6 md:mb-8 leading-tight serif tracking-tighter text-center justify-center"
          delay={300}
          animationDelay={150}
        />

        <FadeIn delay={800}>
          <p className="text-white/50 max-w-2xl mx-auto text-sm sm:text-base md:text-xl mb-10 sm:mb-16 md:mb-24 leading-relaxed font-light text-center px-4">
            We bridge the gap between clinical excellence and compassionate understanding.
          </p>
        </FadeIn>

        {/* Card grid — single col on mobile, 3 cols on md+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-12">
          {approaches.map((item, idx) => (
            <FadeIn key={idx} delay={1000 + (idx * 200)}>
              <div
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
                onTouchStart={() => setActiveIdx(idx === activeIdx ? null : idx)}
                className="h-full"
              >
                <SpotlightCard className="h-full bg-white/[0.02] border-white/5 hover:bg-white/[0.05] transition-all duration-700 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[48px]">
                  <div className="flex flex-row md:flex-col items-center md:items-center text-left md:text-center gap-4 md:gap-0">
                    {/* Icon */}
                    <div className="relative shrink-0 mb-0 md:mb-10" style={{ transformStyle: 'preserve-3d' }}>
                      <div className="w-12 h-12 md:w-20 md:h-20 bg-white/5 rounded-2xl md:rounded-[32px] flex items-center justify-center border border-white/5
                                      transition-all duration-700 group-hover:scale-110 group-hover:bg-terracotta/10">
                        <div className="transition-transform duration-700">
                          {item.icon}
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 w-6 h-6 md:w-10 md:h-10
                                      bg-intel-dark border border-white/10 rounded-lg md:rounded-2xl
                                      flex items-center justify-center text-white/40 shadow-2xl">
                        <span className="scale-75 md:scale-100">{item.subIcon}</span>
                      </div>
                    </div>

                    {/* Text */}
                    <div className="flex-1 md:flex-none md:mt-6 md:w-full">
                      <h3 className="text-base md:text-2xl font-black text-white mb-1 md:mb-4 serif tracking-tight">
                        {item.title}
                      </h3>

                      <div className="relative overflow-hidden">
                        <p className={`text-white/40 text-sm md:text-base font-light leading-relaxed transition-all duration-500
                                       ${activeIdx === idx ? 'opacity-0 -translate-y-4 scale-95 h-0' : 'opacity-100 translate-y-0 scale-100'}`}>
                          {item.desc}
                        </p>

                        <div className={`transition-all duration-500 ${activeIdx === idx ? 'opacity-100 mt-1' : 'opacity-0 h-0 overflow-hidden'}`}>
                          <ul className="space-y-2 text-left md:text-center">
                            {item.details.map((detail, dIdx) => (
                              <li key={dIdx} className="flex items-center gap-2 text-white/80 text-xs md:text-sm font-bold md:justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-terracotta shrink-0" />
                                {detail}
                              </li>
                            ))}
                          </ul>
                          <div className="mt-4 hidden md:flex items-center gap-2 text-[10px] font-black text-terracotta uppercase tracking-[0.4em] justify-center cursor-pointer hover:text-white transition-colors">
                            Learn More <ChevronRight size={12} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
