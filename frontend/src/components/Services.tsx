import React from 'react';
import { User, GraduationCap, Briefcase, ArrowRight } from 'lucide-react';
import FadeIn from './FadeIn';
import { ViewType } from './ServiceDetail';

interface ServicesProps {
  onSelectService: (view: ViewType) => void;
}

const SERVICES: { id: ViewType; audience: string; title: string; desc: string; icon: typeof User; tile: string; card: string }[] = [
  {
    id: 'personal',
    audience: 'For individuals',
    title: 'Personal therapy',
    desc: 'One-to-one, evidence-based sessions focused on your own growth and wellbeing.',
    icon: User,
    tile: "text-[#8a6a3f]", card: "bg-peach",
  },
  {
    id: 'student',
    audience: 'For students',
    title: 'Student growth',
    desc: 'Affordable, specialised support for students through exams, transitions and stress.',
    icon: GraduationCap,
    tile: "text-serene-green", card: "bg-sage",
  },
  {
    id: 'hr',
    audience: 'For organisations',
    title: 'Corporate wellness',
    desc: 'Mental health programmes that build resilience across your teams.',
    icon: Briefcase,
    tile: "text-[#3E5C76]", card: "bg-sky",
  },
];

const Services: React.FC<ServicesProps> = ({ onSelectService }) => (
  <div className="w-full max-w-6xl mx-auto px-5 sm:px-8">
    <FadeIn>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-[#8a6a3f] mb-3">Services</p>
        <h2 className="serif text-3xl md:text-[2.75rem] leading-tight text-intel-dark">Care tailored to your journey</h2>
        <p className="mt-4 text-base md:text-lg text-intel-dark/65 leading-relaxed">
          Specialised care pathways for the emotional and practical needs of individuals, students and organisations.
        </p>
      </div>
    </FadeIn>

    <div className="mt-12 grid md:grid-cols-3 gap-5">
      {SERVICES.map(({ id, audience, title, desc, icon: Icon, tile, card }, idx) => (
        <FadeIn key={id} delay={idx * 80} className="h-full">
          <button
            onClick={() => onSelectService(id)}
            className={`group h-full w-full text-left flex flex-col rounded-[32px] ${card} p-7 md:p-8 transition-all duration-500 ease-bounce hover:-translate-y-1.5 hover:shadow-[0_16px_36px_rgba(26,26,26,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-serene-green`}
          >
            <span className={`w-14 h-14 rounded-full bg-white/80 shadow-sm flex items-center justify-center transition-transform duration-500 ease-bounce group-hover:-rotate-12 group-hover:scale-110 ${tile}`} aria-hidden="true">
              <Icon size={24} />
            </span>
            <span className="mt-6 text-sm font-medium text-intel-dark/55">{audience}</span>
            <h3 className="serif text-2xl text-intel-dark mt-1">{title}</h3>
            <p className="mt-3 text-[15px] text-intel-dark/70 leading-relaxed flex-1">{desc}</p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-serene-green">
              Learn more <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        </FadeIn>
      ))}
    </div>
  </div>
);

export default Services;
