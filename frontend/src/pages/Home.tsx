import React from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Founders from '../components/Founders';
import Services from '../components/Services';
import Gallery from '../components/Gallery';
import InquiryForm from '../components/InquiryForm';
import FadeIn from '../components/FadeIn';
import WaveDivider from '../components/WaveDivider';
import { Layer, ApproachLayer } from '../components/Layers';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="relative">
      <Layer zIndex={0} id="top">
        <Hero
          onStartTest={() => navigate('/assessments')}
          onStartCareerTest={() => navigate('/career-assessment')}
          onLearnMore={() => document.getElementById('approach')?.scrollIntoView({ behavior: 'smooth' })}
        />
      </Layer>

      <ApproachLayer id="approach" zIndex={10}>
        <Features />
      </ApproachLayer>

      <WaveDivider from="#1F1E1B" to="#F7EBD3" />
      <section id="services" className="relative z-[15] bg-[#F7EBD3] pt-12 pb-16 md:pt-16 md:pb-24 scroll-mt-20">
        <Services onSelectService={(view) => navigate(`/services/${view}`)} />
      </section>

      <WaveDivider from="#F7EBD3" to="#1A1A1A" flip />
      <Gallery />

      <WaveDivider from="#1A1A1A" to="#F7EBD3" />
      <Layer id="founders" zIndex={20} className="bg-[#F7EBD3]">
        <Founders />
      </Layer>

      <WaveDivider from="#F7EBD3" to="#1F1E1B" flip />

      {/* Inquiry section */}
      <section id="inquiry" className="relative z-30 bg-[#1F1E1B] pt-12 pb-20 md:pt-16 md:pb-28 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <FadeIn>
            <figure className="relative max-w-3xl mx-auto mb-16 md:mb-24 text-center">
              <blockquote>
                <p className="text-base sm:text-lg md:text-xl font-light tracking-[0.04em] leading-relaxed text-white/70">
                  The first step towards healing is recognising that
                </p>
                <p className="serif italic mt-3 md:mt-4 text-3xl sm:text-4xl md:text-[3.25rem] leading-[1.25] md:leading-[1.2] text-[#F4EFE6]">
                  you do not have to carry the <span className="text-terracotta">burden alone.</span>
                </p>
              </blockquote>
              <div className="mt-8 flex items-center justify-center gap-3" aria-hidden="true">
                <span className="h-px w-10 bg-terracotta/40" />
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta" />
                <span className="h-px w-10 bg-terracotta/40" />
              </div>
            </figure>
          </FadeIn>
          <InquiryForm />
        </div>
      </section>
    </main>
  );
};

export default Home;
