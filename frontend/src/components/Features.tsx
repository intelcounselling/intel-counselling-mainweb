import React from 'react';
import { Brain, ShieldCheck, Leaf, Check } from 'lucide-react';
import FadeIn from './FadeIn';

const APPROACHES = [
  {
    icon: Brain,
    tint: "bg-peach text-[#8a6a3f]",
    title: 'Evidence-based care',
    desc: 'Clinical techniques grounded in current psychological research.',
    details: ['CBT and DBT informed', 'Research-backed protocols', 'Care plans tailored to you'],
  },
  {
    icon: ShieldCheck,
    tint: "bg-sage text-serene-green",
    title: 'Your privacy, protected',
    desc: 'Your safety and confidentiality come before everything else.',
    details: ['Discreet consultations', 'Secure, encrypted records', 'Strict confidentiality'],
  },
  {
    icon: Leaf,
    tint: "bg-lavender text-[#6E5675]",
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
      {APPROACHES.map(({ icon: Icon, tint, title, desc, details }, idx) => (
        <FadeIn key={title} delay={idx * 80} className="h-full">
          <article className="group h-full rounded-[32px] bg-white/[0.04] border border-white/10 p-7 md:p-8 transition-all duration-500 ease-bounce hover:-translate-y-1.5 hover:bg-white/[0.06] hover:border-white/20">
            <span className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-500 ease-bounce group-hover:-rotate-12 group-hover:scale-110 ${tint}`} aria-hidden="true">
              <Icon size={22} />
            </span>
            <h3 className="serif text-xl text-white mt-6">{title}</h3>
            <p className="mt-2 text-[15px] text-white/65 leading-relaxed">{desc}</p>
            <ul className="mt-5 pt-5 border-t border-white/10 space-y-2.5">
              {details.map((d) => (
                <li key={d} className="flex items-center gap-2.5 text-sm text-white/80">
                  <Check size={15} className="text-terracotta shrink-0" /> {d}
                </li>
              ))}
            </ul>
          </article>
        </FadeIn>
      ))}
    </div>
  </div>
);

export default Features;
