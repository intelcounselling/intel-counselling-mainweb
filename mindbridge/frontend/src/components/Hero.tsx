import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ShieldCheck, Star, Clock, Globe } from 'lucide-react';

interface HeroProps {
  onStartTest: () => void;
  onLearnMore: () => void;
}

const NoiseOverlay: React.FC = () => (
  <div
    className="absolute inset-0 pointer-events-none z-[2] opacity-[0.028]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '180px 180px',
    }}
  />
);

const HeroWaves: React.FC = () => (
  <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10 leading-[0]">
    <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
         className="w-full h-[60px] sm:h-[80px] md:h-[100px] lg:h-[120px]">
      <path d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z"
            fill="#9EC4A3" fillOpacity="0.35" className="hero-wave-back" />
      <path d="M0,80 C200,40 400,110 600,75 C800,40 1000,105 1200,70 C1320,50 1380,80 1440,72 L1440,120 L0,120 Z"
            fill="#78A083" fillOpacity="0.55" className="hero-wave-front" />
    </svg>
  </div>
);

const Hero: React.FC<HeroProps> = ({ onStartTest, onLearnMore }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();
      setMousePos({ x: (e.clientX - left) / width - 0.5, y: (e.clientY - top) / height - 0.5 });
    };
    if (window.innerWidth > 768) window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const px = (f: number) => `translate(${mousePos.x * f}px, ${mousePos.y * f}px)`;

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative w-full overflow-hidden bg-[#F4EFE6] flex flex-col"
      style={{ minHeight: '100svh' }}
    >
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full bg-[#C19B6C]/10 blur-[140px]"
             style={{ transform: px(22) }} />
        <div className="absolute bottom-0 right-0 w-[400px] sm:w-[700px] h-[300px] sm:h-[500px] rounded-full bg-[#1C3F39]/8 blur-[160px]"
             style={{ transform: px(-18) }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[300px] sm:h-[400px] bg-white/30 rounded-full blur-[120px]" />
      </div>
      <NoiseOverlay />

      {/* Main layout — stacks on mobile, side-by-side on lg */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-between
                      w-full max-w-[1280px] mx-auto
                      px-5 sm:px-10 lg:px-16
                      pt-24 pb-24 sm:pt-28 sm:pb-28 lg:pt-36 lg:pb-32
                      gap-10 lg:gap-8 text-center lg:text-left">

        {/* ── Left ── */}
        <div className="flex-1 max-w-full lg:max-w-[560px] w-full flex flex-col items-center lg:items-start
                        transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
             style={{ transform: px(8) }}>

          {/* Eyebrow */}
          <div className="hero-reveal mb-6 sm:mb-8" style={{ '--d': '0ms' } as React.CSSProperties}>
            <div className="inline-flex items-center gap-2.5 px-4 py-[7px] rounded-full
                            border border-[#1C3F39]/20 bg-white/70 backdrop-blur-sm
                            shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
              <span className="w-[7px] h-[7px] rounded-full bg-[#1C3F39] shadow-[0_0_0_3px_rgba(28,63,57,0.15)] animate-pulse" />
              <span className="text-[10px] sm:text-[10.5px] font-bold text-[#1C3F39] uppercase tracking-[0.22em]">
                Personalized Therapy
              </span>
            </div>
          </div>

          {/* Headline */}
          <div className="hero-reveal mb-4 sm:mb-5" style={{ '--d': '80ms' } as React.CSSProperties}>
            <h1 className="serif font-black leading-[1.06] tracking-[-0.03em] text-[#1A1A1A]
                           text-[2.4rem] sm:text-[3rem] md:text-[3.5rem] lg:text-[3rem] xl:text-[3.8rem]
                           flex flex-col items-center lg:items-start">
              <span className="block">Find Peace with</span>
              <span className="block text-[#1C3F39] mt-[0.08em]">Intel&nbsp;Counselling</span>
            </h1>
          </div>

          {/* Gold rule */}
          <div className="hero-reveal mb-5 sm:mb-7 flex justify-center lg:justify-start"
               style={{ '--d': '160ms' } as React.CSSProperties}>
            <div className="flex items-center gap-3">
              <div className="h-[2px] w-8 sm:w-10 bg-gradient-to-r from-[#C19B6C] to-[#C19B6C]/30 rounded-full" />
              <div className="h-[5px] w-[5px] rounded-full bg-[#C19B6C]" />
            </div>
          </div>

          {/* Body */}
          <p className="hero-reveal text-[14px] sm:text-[15px] md:text-[16px] text-[#1A1A1A]/55
                        leading-[1.75] sm:leading-[1.8] font-light mb-8 sm:mb-10
                        max-w-[340px] sm:max-w-[440px] mx-auto lg:mx-0"
             style={{ '--d': '240ms' } as React.CSSProperties}>
            A safe, supportive, and confidential space where your well-being
            comes first — through expert online and in-person sessions,
            designed entirely around&nbsp;you.
          </p>

          {/* CTAs */}
          <div className="hero-reveal flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4
                          w-full sm:w-auto sm:justify-center lg:justify-start mb-8 sm:mb-12"
               style={{ '--d': '340ms' } as React.CSSProperties}>
            <button
              onClick={onStartTest}
              className="group relative overflow-hidden
                         w-full sm:w-auto sm:min-w-[210px]
                         bg-[#1C3F39] text-white
                         px-7 py-[15px] rounded-2xl
                         font-semibold text-[13.5px] tracking-[0.02em]
                         flex items-center justify-center gap-3
                         shadow-[0_4px_24px_rgba(28,63,57,0.32)]
                         transition-all duration-300
                         hover:shadow-[0_8px_32px_rgba(28,63,57,0.42)] hover:-translate-y-[2px]
                         active:translate-y-0"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                               -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10">Start Free Assessment</span>
              <ArrowRight size={15} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1 shrink-0" />
            </button>
            <button
              onClick={onLearnMore}
              className="w-full sm:w-auto sm:min-w-[120px]
                         bg-transparent text-[#1A1A1A]
                         px-7 py-[15px] rounded-2xl
                         font-semibold text-[13.5px] tracking-[0.02em]
                         border border-[#1A1A1A]/20
                         flex items-center justify-center
                         transition-all duration-300
                         hover:border-[#1A1A1A]/50 hover:bg-[#1A1A1A]/[0.04] hover:-translate-y-[2px]
                         active:translate-y-0"
            >
              Learn More
            </button>
          </div>

          {/* Trust stats */}
          <div className="hero-reveal flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6"
               style={{ '--d': '460ms' } as React.CSSProperties}>
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-[#1C3F39] shrink-0" />
              <span className="text-[11.5px] font-medium text-[#1A1A1A]/50 whitespace-nowrap">8+ Years</span>
            </div>
            <div className="w-px h-3.5 bg-[#1A1A1A]/12 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Globe size={12} className="text-[#1C3F39] shrink-0" />
              <span className="text-[11.5px] font-medium text-[#1A1A1A]/50 whitespace-nowrap">Online & In-Person</span>
            </div>
          </div>
        </div>

        {/* ── Right — Circle image ── */}
        <div className="flex-shrink-0 flex items-center justify-center hero-reveal w-full lg:w-auto"
             style={{ '--d': '100ms', transform: px(-10) } as React.CSSProperties}>

          {/* Responsive circle sizes */}
          <div className="relative
                          w-[220px] h-[220px]
                          sm:w-[300px] sm:h-[300px]
                          md:w-[350px] md:h-[350px]
                          lg:w-[400px] lg:h-[400px]
                          xl:w-[450px] xl:h-[450px]">

            {/* Rings */}
            <div className="absolute -inset-[24px] rounded-full border border-[#1C3F39]/[0.08] pointer-events-none" />
            <div className="absolute -inset-[12px] rounded-full border border-[#1C3F39]/[0.12] pointer-events-none" />
            <div className="absolute -inset-5 rounded-full bg-[#1C3F39]/[0.1] blur-3xl -z-10"
                 style={{ transform: px(-6) }} />

            {/* Image circle */}
            <div className="absolute inset-0 rounded-full overflow-hidden group
                            border-[5px] sm:border-[7px] md:border-[8px] border-[#1F1E1B]
                            shadow-[0_20px_60px_rgba(0,0,0,0.15),0_0_0_1px_rgba(28,63,57,0.08),inset_0_1px_0_rgba(255,255,255,0.2)]">
              <img src="/assets/imgs/hero_img.png" alt="Intel Counselling therapy session"
                   className="w-full h-full object-cover transition-transform duration-[3500ms] ease-out group-hover:scale-[1.04]" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-transparent to-[#1C3F39]/12 pointer-events-none" />
            </div>

            {/* Badge — bottom left */}
            <div className="absolute -bottom-3 -left-3 sm:-bottom-5 sm:-left-7
                            bg-white/96 backdrop-blur-2xl
                            px-3 py-2.5 sm:px-5 sm:py-3.5 rounded-[16px] sm:rounded-[18px]
                            shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.05)]
                            flex items-center gap-2.5 sm:gap-3 z-20 animate-badge-float">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-[8px] sm:rounded-[10px] bg-[#C19B6C]/12 flex items-center justify-center shrink-0">
                <ShieldCheck size={14} className="text-[#C19B6C] sm:hidden" />
                <ShieldCheck size={17} className="text-[#C19B6C] hidden sm:block" />
              </div>
              <div>
                <div className="text-[8px] sm:text-[9px] font-extrabold text-[#C19B6C] uppercase tracking-[0.18em] mb-0.5">Privacy</div>
                <div className="text-[11px] sm:text-[12.5px] font-extrabold text-[#1C3F39] leading-none tracking-tight">Safe & Confidential</div>
              </div>
            </div>

            {/* Top-right pill */}
            <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-4
                            bg-[#1C3F39] text-white
                            px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full z-20
                            shadow-[0_4px_16px_rgba(28,63,57,0.4)]
                            animate-badge-float-alt flex items-center gap-1.5">
              <Star size={8} fill="white" className="text-white shrink-0" />
              <span className="text-[8.5px] sm:text-[9.5px] font-bold tracking-wide">Top Rated</span>
            </div>
          </div>
        </div>
      </div>

      <HeroWaves />

      <style>{`
        .hero-reveal { opacity:0; transform:translateY(28px);
          animation: heroReveal 0.9s cubic-bezier(0.16,1,0.3,1) forwards;
          animation-delay: var(--d, 0ms); }
        @keyframes heroReveal { to { opacity:1; transform:translateY(0); } }

        @keyframes badgeFloat { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-7px);} }
        .animate-badge-float     { animation: badgeFloat 6s ease-in-out infinite; }
        .animate-badge-float-alt { animation: badgeFloat 7.5s ease-in-out infinite; animation-delay:1.2s; }

        @keyframes waveShift {
          0%  { d:path("M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z"); }
          50% { d:path("M0,75 C240,30 480,105 720,70 C960,35 1200,105 1440,65 L1440,120 L0,120 Z"); }
          100%{ d:path("M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z"); }
        }
        @keyframes waveFront {
          0%  { d:path("M0,80 C200,40 400,110 600,75 C800,40 1000,105 1200,70 C1320,50 1380,80 1440,72 L1440,120 L0,120 Z"); }
          50% { d:path("M0,65 C200,100 400,45 600,88 C800,110 1000,50 1200,85 C1320,100 1380,62 1440,88 L1440,120 L0,120 Z"); }
          100%{ d:path("M0,80 C200,40 400,110 600,75 C800,40 1000,105 1200,70 C1320,50 1380,80 1440,72 L1440,120 L0,120 Z"); }
        }
        .hero-wave-back  { animation: waveShift  9s ease-in-out infinite; }
        .hero-wave-front { animation: waveFront  7s ease-in-out infinite; animation-delay:-2s; }
      `}</style>
    </section>
  );
};

export default Hero;