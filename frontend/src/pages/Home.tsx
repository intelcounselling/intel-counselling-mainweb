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
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <FadeIn>
            <blockquote className="max-w-3xl mx-auto mb-14 md:mb-20 text-center serif italic font-normal text-2xl sm:text-3xl md:text-4xl leading-snug text-[#E9DCC3]">
              “The first step towards healing is recognising that you do not have to carry the burden alone.”
            </blockquote>
          </FadeIn>
          <div className="max-w-2xl mx-auto">
            <InquiryForm />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
