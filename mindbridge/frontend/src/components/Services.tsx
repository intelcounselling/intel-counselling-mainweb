
import React, { useState, useEffect } from 'react';
import { User, GraduationCap, Briefcase, ArrowRight, Sparkles } from 'lucide-react';
import SpotlightCard from './SpotlightCard';
import FadeIn from './FadeIn';
import { ViewType } from '../App';

interface RotatingTextProps {
  texts: string[];
}

const RotatingText: React.FC<RotatingTextProps> = ({ texts }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <span className="relative inline-flex flex-col h-[1.15em] overflow-hidden align-bottom">
      <div className="invisible pointer-events-none h-0 flex flex-col items-center select-none" aria-hidden="true">
        {texts.map((t, i) => (
          <span key={i} className="italic whitespace-nowrap px-1 md:px-2">{t}</span>
        ))}
      </div>

      {texts.map((text, i) => {
        const letters = text.split("");
        const isActive = i === index;
        const isPast = i === (index - 1 + texts.length) % texts.length;

        return (
          <span
            key={i}
            className="absolute inset-0 flex items-center justify-center whitespace-nowrap pointer-events-none"
            aria-hidden={!isActive}
          >
            {letters.map((char, charIdx) => {
              return (
                <span
                  key={charIdx}
                  className={`inline-block italic text-serene-green transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isActive
                    ? 'translate-y-0 opacity-100'
                    : isPast
                      ? 'translate-y-[100%] opacity-0'
                      : '-translate-y-[100%] opacity-0'
                    }`}
                  style={{
                    transitionDelay: `${charIdx * 40}ms`
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              );
            })}
          </span>
        );
      })}
    </span>
  );
};

interface ServicesProps {
  onSelectService: (view: ViewType) => void;
}

const Services: React.FC<ServicesProps> = ({ onSelectService }) => {
  const serviceItems = [
    {
      id: 'personal' as ViewType,
      title: 'Personal Therapy',
      desc: 'Deeply personal, evidence-based sessions focused on individual growth.',
      icon: <User size={32} />,
      tag: 'Individual',
      color: 'bg-terracotta',
      glow: 'shadow-terracotta/10',
      cardBg: '!bg-zinc-900',
      accent: 'border-white/10'
    },
    {
      id: 'student' as ViewType,
      title: 'Student Growth',
      desc: 'Affordable, specialized care for students navigating transitions.',
      icon: <GraduationCap size={32} />,
      tag: 'Academic',
      color: 'bg-[#2D6A4F]',
      iconColor: 'text-white',
      glow: 'shadow-black/5',
      cardBg: '!bg-zinc-900',
      accent: 'border-white/10'
    },
    {
      id: 'hr' as ViewType,
      title: 'Corporate Wellness',
      desc: 'Strategic mental health support for organizations and resilience.',
      icon: <Briefcase size={32} />,
      tag: 'Business',
      color: 'bg-terracotta',
      glow: 'shadow-terracotta/10',
      cardBg: '!bg-zinc-900',
      accent: 'border-white/10'
    }
  ];

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  return (
    <div className="w-full bg-transparent px-2 sm:px-6 relative overscroll-none">
      <div className="max-w-6xl w-full mx-auto relative z-10">
        <FadeIn>
          <div className="text-center mb-8 sm:mb-12 md:mb-24 px-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 md:px-5 md:py-2.5 rounded-full bg-intel-dark border border-white/10 text-white text-[8px] md:text-[10px] font-bold uppercase tracking-[0.3em] mb-4 md:mb-8 shadow-xl">
              <Sparkles size={isMobile ? 12 : 14} className="animate-pulse" />
              Our Clinical Pathways
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-6xl lg:text-8xl font-black serif mb-4 md:mb-8 leading-[1.1] text-[#2A2825] flex flex-col items-center">
              <span className="block mb-1 md:mb-4">Tailored for your</span>
              <div className="flex items-center justify-center gap-x-2 md:gap-x-4">
                <RotatingText texts={['"unique"', '"personal"', '"academic"', '"career"']} />
                <span>journey.</span>
              </div>
            </h2>

            <p className="text-[#2A2825]/70 max-w-2xl mx-auto text-xs md:text-xl font-light leading-relaxed">
              We provide specialized care pathways designed to meet the specific emotional and cognitive needs of our community.
            </p>
          </div>
        </FadeIn>

        {/* Responsive grid: stacks on mobile, 3 columns on md+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-12">
          {serviceItems.map((item, idx) => (
            <FadeIn key={item.id} delay={idx * 150}>
              <div
                onClick={() => onSelectService(item.id)}
                className="group cursor-pointer h-full"
              >
                <SpotlightCard
                  className={`h-full ${item.cardBg} border ${item.accent} group-hover:border-white/30 transition-all duration-700 flex flex-col p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl md:rounded-[64px] shadow-[0_16px_32px_-8px_rgba(0,0,0,0.3)] md:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)]`}
                  spotlightColor="rgba(120, 160, 131, 0.08)"
                >
                  <div className="mb-4 md:mb-8 relative">
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 md:w-20 md:h-20 ${item.color} ${item.iconColor || 'text-white'} rounded-[35%_65%_70%_30%_/_30%_54%_46%_70%] flex items-center justify-center transition-all duration-700 group-hover:rounded-full group-hover:rotate-12 group-hover:scale-110 shadow-lg ${item.glow}`}>
                      {React.cloneElement(item.icon as React.ReactElement<any>, { size: isMobile ? 18 : 32 })}
                    </div>
                  </div>

                  <div className="flex-grow flex flex-col">
                    <span className="text-[7px] sm:text-[9px] md:text-[11px] font-black text-terracotta uppercase tracking-[0.15em] sm:tracking-[0.3em] mb-1.5 md:mb-5 block font-inter">
                      {item.tag}
                    </span>
                    <h3 className="text-base sm:text-xl md:text-4xl font-black text-white serif mb-2 md:mb-7 group-hover:text-terracotta transition-colors leading-tight md:line-clamp-none">
                      {item.title}
                    </h3>
                    <p className="text-white/60 font-light leading-snug md:leading-relaxed mb-4 md:mb-10 text-xs sm:text-sm md:text-lg group-hover:text-white/80 transition-colors line-clamp-3 md:line-clamp-none">
                      {item.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 md:gap-4 text-white/80 font-bold mt-auto group-hover:gap-3 md:group-hover:gap-6 transition-all">
                    <span className="hidden sm:inline border-b-2 border-transparent group-hover:border-terracotta transition-all text-[8px] sm:text-xs md:text-base font-bold tracking-tight">Discover</span>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-terracotta group-hover:border-terracotta group-hover:text-white group-hover:scale-110 transition-all shadow-sm">
                      <span className="text-white group-hover:text-white transition-colors">
                        <ArrowRight size={isMobile ? 12 : 22} />
                      </span>
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

export default Services;
