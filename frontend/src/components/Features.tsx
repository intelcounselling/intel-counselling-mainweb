import React from 'react';
import { Brain, ShieldCheck, Leaf, Check } from 'lucide-react';
import FadeIn from './FadeIn';
import { TiltCard } from '@/components/unlumen-ui/tilt-card';

const APPROACHES = [
  {
    icon: Brain,
    tint: "bg-peach text-[#8a6a3f]",
    circle: 'bg-peach',
    title: 'Evidence-based care',
    desc: 'Clinical techniques grounded in current psychological research.',
    details: ['CBT and DBT informed', 'Research-backed protocols', 'Care plans tailored to you'],
  },
  {
    icon: ShieldCheck,
    tint: "bg-sage text-serene-green",
    circle: 'bg-sage',
    title: 'Your privacy, protected',
    desc: 'Your safety and confidentiality come before everything else.',
    details: ['Discreet consultations', 'Secure, encrypted records', 'Strict confidentiality'],
  },
  {
    icon: Leaf,
    tint: "bg-lavender text-[#6E5675]",
    circle: 'bg-lavender',
    title: 'Whole-person wellbeing',
    desc: 'Care that considers your mind, body and daily life together.',
    details: ['Mind–body connection', 'Healthy routines', 'Long-term resilience'],
  },
];

const Features: React.FC = () => (
  <div className="w-full max-w-6xl mx-auto px-5 sm:px-8">
    <FadeIn>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-terracotta mb-3">Our approach</p>
        <h2 className="serif text-3xl md:text-[2.75rem] leading-tight text-white">Scientific, yet human.</h2>
        <p className="mt-4 text-base md:text-lg text-white/65 leading-relaxed">
          We bring clinical rigour and genuine compassion to every session.
        </p>
      </div>
    </FadeIn>

    <div className="mt-12 grid md:grid-cols-3 gap-5">
      {APPROACHES.map(({ icon: Icon, tint, circle, title, desc, details }, idx) => (
        <FadeIn key={title} delay={idx * 80} className="h-full">
          <TiltCard
            tone="dark"
            rounded="rounded-[32px]"
            titleAs="h3"
            title={title}
            description={desc}
            circleClassName={circle}
            circleSize={900}
            contentClassName="p-7 md:p-8"
            icon={
              <span className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-500 ease-bounce group-hover:-rotate-12 group-hover:scale-110 ${tint}`} aria-hidden="true">
                <Icon size={22} />
              </span>
            }
          >
            <ul className="mt-3 pt-5 border-t border-white/10 group-data-[circle=on]:border-black/10 space-y-2.5 transition-colors duration-300">
              {details.map((d) => (
                <li key={d} className="flex items-center gap-2.5 text-sm text-white/80 group-data-[circle=on]:text-intel-dark transition-colors duration-300">
                  <Check size={15} className="text-terracotta shrink-0" /> {d}
                </li>
              ))}
            </ul>
          </TiltCard>
        </FadeIn>
      ))}
    </div>
  </div>
);

export default Features;
