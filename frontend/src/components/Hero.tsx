import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Clock, Globe, Wind, CloudRain, Moon, Waves } from 'lucide-react';
import { LazyImage } from './ui/LazyImage';

// Each mood opens the matching free screening (see TestOptions)
const MOODS = [
  { label: 'Anxious', test: 'gad7', icon: Wind, tint: 'bg-sky' },
  { label: 'Stressed', test: 'pss10', icon: Waves, tint: 'bg-peach' },
  { label: 'Feeling low', test: 'phq9', icon: CloudRain, tint: 'bg-lavender' },
  { label: "Can't sleep", test: 'sleep', icon: Moon, tint: 'bg-sage' },
];

interface HeroProps {
  onStartTest: () => void;
  onStartCareerTest: () => void;
  onLearnMore: () => void;
}

const TRUST = [
  { icon: Clock, text: '8+ years in practice' },
  { icon: Globe, text: 'Online and in person' },
  { icon: ShieldCheck, text: 'Confidential, always' },
];

// Two slow, layered green waves along the bottom of the hero.
const HeroWaves: React.FC = () => (
  <div className="absolute bottom-0 left-0 right-0 pointer-events-none leading-[0]" aria-hidden="true">
    <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
         className="w-full h-[60px] sm:h-[80px] md:h-[100px] lg:h-[120px]">
      <path d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z"
            fill="#9EC4A3" fillOpacity="0.35" className="hero-wave-back" />
      <path d="M0,80 C200,40 400,110 600,75 C800,40 1000,105 1200,70 C1320,50 1380,80 1440,72 L1440,120 L0,120 Z"
            fill="#78A083" fillOpacity="0.55" className="hero-wave-front" />
      {/* Final layer in the next section's colour, so the hero melts into it */}
      <path d="M0,104 C240,92 480,116 720,104 C960,92 1200,116 1440,104 L1440,120 L0,120 Z" fill="#1F1E1B" />
    </svg>
  </div>
);

const delay = (ms: number) => ({ '--d': `${ms}ms` } as React.CSSProperties);

// Calm hero: one headline, one sentence, two clear actions — with a short
// staggered entrance, a floating privacy badge and gently moving waves.
const Hero: React.FC<HeroProps> = ({ onStartTest, onStartCareerTest }) => {
  const navigate = useNavigate();
  return (
  <section id="hero" className="relative w-full overflow-hidden bg-[#F7EBD3]">
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-terracotta/10 blur-[120px]" />
      <div className="absolute -bottom-40 right-0 w-[560px] h-[420px] rounded-full bg-serene-green/10 blur-[140px]" />
    </div>

    <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-28 pb-28 md:pt-36 md:pb-36 lg:min-h-[88vh] flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
      {/* Text */}
      <div className="flex-1 text-center lg:text-left">
        <h1 className="hero-in serif text-intel-dark leading-[1.08] text-[2.5rem] sm:text-5xl lg:text-[3.6rem]" style={delay(60)}>
          Find peace with
          <span className="relative inline-block text-serene-green">
            Intel Counselling
            {/* Hand-drawn squiggle that draws itself in */}
            <svg className="absolute left-0 -bottom-3 w-full h-4" viewBox="0 0 300 16" preserveAspectRatio="none" aria-hidden="true">
              <path className="squiggle" d="M3,10 C40,2 70,15 105,8 C140,1 170,14 205,8 C235,3 265,13 297,6"
                    fill="none" stroke="#C19B6C" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
        </h1>

        <p className="hero-in mt-6 text-base sm:text-lg text-intel-dark/70 leading-relaxed max-w-[34rem] mx-auto lg:mx-0" style={delay(180)}>
          A safe, confidential space where your well-being comes first, with expert
          counsellors available online and in person.
        </p>

        <div className="hero-in mt-9 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start" style={delay(300)}>
          <button
            onClick={onStartTest}
            className="group relative overflow-hidden inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-serene-green text-white font-semibold whitespace-nowrap shadow-[0_6px_20px_rgba(28,63,57,0.25)] hover:bg-[#24524a] hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_10px_28px_rgba(28,63,57,0.32)] transition-all duration-300 ease-bounce focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-serene-green focus-visible:ring-offset-[#F7EBD3]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden="true" />
            <span className="relative">Take a free assessment</span>
            <ArrowRight size={16} className="relative transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          <button
            onClick={onStartCareerTest}
            className="inline-flex items-center justify-center h-12 px-6 rounded-full border border-intel-dark/20 text-intel-dark font-semibold whitespace-nowrap hover:border-intel-dark/40 hover:bg-white/60 hover:-translate-y-0.5 hover:scale-[1.03] transition-all duration-300 ease-bounce focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-intel-dark"
          >
            Career guidance test
          </button>
        </div>

        {/* Gentle way in: pick how you feel, land on the matching free check */}
        <div className="hero-in mt-9" style={delay(380)}>
          <p className="text-sm text-intel-dark/60 mb-3">How are you feeling today?</p>
          <div className="flex flex-wrap justify-center lg:justify-start gap-2">
            {MOODS.map((m) => (
              <button
                key={m.label}
                onClick={() => navigate(`/assessments/${m.test}`)}
                className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-medium text-intel-dark ${m.tint} transition-transform duration-300 ease-bounce hover:-translate-y-0.5 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-serene-green`}
              >
                <m.icon size={15} /> {m.label}
              </button>
            ))}
          </div>
        </div>

        <ul className="hero-in mt-8 flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-intel-dark/65" style={delay(460)}>
          {TRUST.map(({ icon: Icon, text }) => (
            <li key={text} className="inline-flex items-center gap-2">
              <Icon size={16} className="text-serene-green shrink-0" /> {text}
            </li>
          ))}
        </ul>
      </div>

      {/* Image */}
      <div className="hero-in shrink-0" style={delay(140)}>
        <div className="relative w-[260px] h-[260px] sm:w-[340px] sm:h-[340px] lg:w-[420px] lg:h-[420px]">
          {/* Soft pastel shapes drifting behind the photo */}
          <div className="blob-drift absolute -top-6 -right-8 w-32 h-32 sm:w-40 sm:h-40 bg-peach rounded-[42%_58%_63%_37%/45%_40%_60%_55%]" aria-hidden="true" />
          <div className="blob-drift-alt absolute -bottom-8 right-10 w-24 h-24 sm:w-28 sm:h-28 bg-sage rounded-[58%_42%_38%_62%/52%_60%_40%_48%]" aria-hidden="true" />
          <div className="absolute -inset-4 rounded-full border border-serene-green/15" aria-hidden="true" />
          <div className="group absolute inset-0 rounded-full overflow-hidden border-[6px] border-white shadow-[0_24px_60px_rgba(28,63,57,0.18)]">
            <LazyImage
              src="/assets/imgs/hero_img.png"
              alt="A counsellor in conversation with a client"
              className="w-full h-full object-cover transition-transform duration-[2500ms] ease-out group-hover:scale-[1.04]"
            />
          </div>

          {/* Floating privacy badge */}
          <div className="badge-float absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-6 bg-white rounded-2xl px-4 py-3 shadow-[0_8px_28px_rgba(0,0,0,0.12)] flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-terracotta/15 text-[#8a6a3f] flex items-center justify-center shrink-0" aria-hidden="true">
              <ShieldCheck size={18} />
            </span>
            <span className="text-left">
              <span className="block text-xs text-intel-dark/55">Your privacy</span>
              <span className="block text-sm font-semibold text-serene-green leading-tight">Safe and confidential</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <HeroWaves />

    <style>{`
      .hero-in { opacity: 0; animation: heroIn 0.8s cubic-bezier(0.16,1,0.3,1) forwards; animation-delay: var(--d, 0ms); }
      @keyframes heroIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }

      @keyframes badgeFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
      .badge-float { animation: badgeFloat 6s ease-in-out infinite; }

      @keyframes waveBack {
        0%,100% { d: path("M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z"); }
        50%     { d: path("M0,75 C240,30 480,105 720,70 C960,35 1200,105 1440,65 L1440,120 L0,120 Z"); }
      }
      @keyframes waveFront {
        0%,100% { d: path("M0,80 C200,40 400,110 600,75 C800,40 1000,105 1200,70 C1320,50 1380,80 1440,72 L1440,120 L0,120 Z"); }
        50%     { d: path("M0,65 C200,100 400,45 600,88 C800,110 1000,50 1200,85 C1320,100 1380,62 1440,88 L1440,120 L0,120 Z"); }
      }
      .hero-wave-back  { animation: waveBack 9s ease-in-out infinite; }
      .hero-wave-front { animation: waveFront 7s ease-in-out infinite; animation-delay: -2s; }

      .squiggle { stroke-dasharray: 340; stroke-dashoffset: 340; animation: squiggleDraw 1.1s ease-out 0.7s forwards; }
      @keyframes squiggleDraw { to { stroke-dashoffset: 0; } }

      @keyframes blobDrift {
        0%,100% { transform: translate(0,0) rotate(0deg); }
        50%     { transform: translate(-10px,12px) rotate(12deg); }
      }
      .blob-drift     { animation: blobDrift 11s ease-in-out infinite; }
      .blob-drift-alt { animation: blobDrift 14s ease-in-out infinite reverse; }

      @media (prefers-reduced-motion: reduce) {
        .hero-in { animation: none; opacity: 1; }
        .squiggle { animation: none; stroke-dashoffset: 0; }
        .badge-float, .hero-wave-back, .hero-wave-front, .blob-drift, .blob-drift-alt { animation: none; }
      }
    `}</style>
  </section>
  );
};

export default Hero;
