import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Founders from '../components/Founders';
import Services from '../components/Services';
import Gallery from '../components/Gallery';
import InquiryForm from '../components/InquiryForm';
import { Layer, ApproachLayer } from '../components/Layers';

const ReadingQuote: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const quoteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    if (quoteRef.current) observer.observe(quoteRef.current);
    return () => observer.disconnect();
  }, []);

  const words = [
    "The", "first", "step", "towards", "healing", "is", "recognizing",
    "that", "you", "do not", "have", "to", "carry", "the", "burden", "alone."
  ];

  return (
    <>
      <style>{`
        @keyframes elegantFadeIn {
          0%   { opacity: 0; transform: translateY(16px); filter: blur(3px); }
          100% { opacity: 1; transform: translateY(0);   filter: blur(0); }
        }
        .animate-elegant-read { animation: elegantFadeIn 1.1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      `}</style>
      <div
        ref={quoteRef}
        className="mb-10 sm:mb-16 md:mb-24 relative z-10
                   text-center px-4 max-w-4xl mx-auto
                   flex flex-wrap justify-center items-baseline
                   gap-x-2 sm:gap-x-4 md:gap-x-6 gap-y-2 sm:gap-y-3 md:gap-y-5"
      >
        {words.map((word, i) => {
          const cleanWord = word.replace(/["\.]/g, '').toLowerCase();
          const isEmphasized = ["first", "step", "healing", "recognizing", "alone"].includes(cleanWord);
          return (
            <span
              key={i}
              className={`inline-block opacity-0 ${isVisible ? 'animate-elegant-read' : ''}
                ${isEmphasized
                  ? 'font-serif italic text-xl sm:text-3xl md:text-5xl font-light text-terracotta lowercase tracking-tight'
                  : 'font-sans font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[10px] sm:text-xs md:text-sm text-white/50'
                }`}
              style={{ animationDelay: isVisible ? `${i * 100}ms` : '0ms' }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </>
  );
};

const Home: React.FC = () => {
  const [isFounderExpanded, setIsFounderExpanded] = useState(false);
  const navigate = useNavigate();

  return (
    <main className="relative">
      <Layer zIndex={0} className="bg-transparent" id="top">
        <Hero
          onStartTest={() => navigate('/assessments')}
          onLearnMore={() => {
            const el = document.getElementById('approach');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      </Layer>

      <ApproachLayer id="approach" zIndex={10}>
        <Features />
      </ApproachLayer>

      <section id="services" className="relative z-[15] bg-[#F7EBD3] py-12 sm:py-20 md:py-32 scroll-mt-20">
        <Services onSelectService={(view) => navigate(`/services/${view}`)} />
      </section>

      <Gallery />

      <Layer
        id="founders"
        zIndex={20}
        className="bg-[#F7EBD3] shadow-[0_-50px_100px_rgba(0,0,0,0.1)]"
        noFade={isFounderExpanded}
        scrollAnimateIn={true}
      >
        <Founders onExpandChange={setIsFounderExpanded} />
      </Layer>

      {/* Inquiry section */}
      <section
        id="inquiry"
        className="relative z-30 bg-[#1F1E1B]
                   shadow-[0_-20px_50px_rgba(0,0,0,0.3)]
                   min-h-screen flex items-center justify-center
                   py-14 sm:py-20 md:py-32 scroll-mt-20"
      >
        <div className="w-full">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <ReadingQuote />
            <div className="max-w-2xl mx-auto">
              <InquiryForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
