import React, { useState } from 'react';
import { ChevronDown, Mail } from 'lucide-react';
import { CLINIC } from '../utils/site';
import { LazyImage } from './ui/LazyImage';
import FadeIn from './FadeIn';

interface Founder {
  name: string;
  title: string;
  badge: string;
  desc: string;
  img: string;
  detailedBio: string;
  specialties: string[];
  specialtiesLabel: string;
  philosophy: string;
}

const FOUNDERS: Founder[] = [
  {
    name: 'Priyanka R.',
    title: 'Counselling Psychologist · Founder',
    badge: '10+ years of clinical experience',
    desc: 'Founder of Intel Counselling. Priyanka supports students and adults with a calm, attentive presence.',
    img: '/assets/imgs/pfp_priyanka.png',
    detailedBio:
      'With over 10 years of clinical experience, Priyanka R. founded Intel Counselling. She currently serves as a Senior Student Counsellor at Rajalakshmi Engineering College. Her calm presence and deep listening help people feel safe, seen and supported.',
    specialties: ['Anxiety', 'Depression', 'Academic stress', 'Addiction'],
    specialtiesLabel: 'Areas of expertise',
    philosophy: 'To help people feel lighter, think clearer, and live fuller.',
  },
  {
    name: 'Gayathri Gokulakrishnan',
    title: 'Co-Founder · Operations',
    badge: 'Strategy and operations',
    desc: 'Gayathri leads the strategy and day-to-day operations that keep care at Intel Counselling accessible and well run.',
    img: '/assets/imgs/pfp_gayathri.png',
    detailedBio:
      "As Co-Founder, Gayathri Gokulakrishnan drives Intel Counselling's strategic direction and operations, including its digital services and outreach, so that professional mental health care stays accessible and secure.",
    specialties: ['Daily operations', 'Administration', 'Strategic growth'],
    specialtiesLabel: 'Focus areas',
    philosophy:
      'A structured, efficient approach that keeps the centre supportive and well organised, so counsellors can focus on care.',
  },
];

const Founders: React.FC = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="w-full max-w-6xl mx-auto px-5 sm:px-8 py-12 md:py-16">
      <FadeIn>
        <div className="max-w-2xl mb-12">
          <h2 className="serif text-3xl md:text-[2.75rem] leading-tight text-intel-dark">Our team</h2>
          <p className="mt-4 text-base md:text-lg text-intel-dark/65 leading-relaxed">
            Clinical expertise and genuine care, from the people who run Intel Counselling.
          </p>
        </div>
      </FadeIn>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        {FOUNDERS.map((f, idx) => {
          const isOpen = open === idx;
          return (
            <FadeIn key={f.name} delay={idx * 100}>
              <article className="bg-white rounded-[32px] border border-black/5 p-6 sm:p-8 transition-all duration-500 ease-bounce hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(26,26,26,0.08)]">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 p-1 bg-peach rounded-[44%_56%_52%_48%/50%_44%_56%_50%]"><div className="w-full h-full overflow-hidden rounded-[44%_56%_52%_48%/50%_44%_56%_50%]">
                    <LazyImage src={f.img} alt={f.name} className="w-full h-full object-cover" /></div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="serif text-xl sm:text-2xl text-intel-dark leading-tight">{f.name}</h3>
                    <p className="mt-1 text-sm text-intel-dark/60">{f.title}</p>
                    <p className="mt-2 text-xs font-semibold text-[#8a6a3f]">{f.badge}</p>
                  </div>
                </div>

                <p className="mt-6 text-[15px] text-intel-dark/75 leading-relaxed">{f.desc}</p>

                <ul className="mt-5 flex flex-wrap gap-2" aria-label={f.specialtiesLabel}>
                  {f.specialties.map((s) => (
                    <li key={s} className="text-xs font-medium text-intel-dark/70 bg-[#F7EBD3] rounded-full px-3 py-1.5">{s}</li>
                  ))}
                </ul>

                {isOpen && (
                  <div className="mt-6 pt-6 border-t border-black/5 space-y-5">
                    <p className="text-[15px] text-intel-dark/75 leading-relaxed">{f.detailedBio}</p>
                    <blockquote className="border-l-2 border-terracotta pl-4 serif italic text-intel-dark/80 leading-relaxed">
                      “{f.philosophy}”
                    </blockquote>
                  </div>
                )}

                <div className="mt-6 pt-5 border-t border-black/5 flex items-center justify-between">
                  <button
                    onClick={() => setOpen(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-serene-green hover:text-[#24524a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-serene-green rounded"
                  >
                    {isOpen ? 'Show less' : 'Read full profile'}
                    <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <a
                    href={CLINIC.emailHref}
                    aria-label={`Email Intel Counselling about ${f.name}`}
                    className="inline-flex items-center gap-1.5 text-sm text-intel-dark/55 hover:text-intel-dark"
                  >
                    <Mail size={15} /> Contact
                  </a>
                </div>
              </article>
            </FadeIn>
          );
        })}
      </div>
    </div>
  );
};

export default Founders;
