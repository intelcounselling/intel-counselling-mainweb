
import React, { useState } from 'react';
import { Linkedin, Twitter, Mail, Target, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import FadeIn from './FadeIn';

interface Founder {
  name: string;
  title: string;
  desc: string;
  img: string;
  detailedBio: string;
  specialties: string[];
  philosophy: string;
  socials: { icon: React.ReactNode; label: string }[];
}

interface FoundersProps {
  onExpandChange?: (isExpanded: boolean) => void;
}

const Founders: React.FC<FoundersProps> = ({ onExpandChange }) => {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const founders: Founder[] = [
    {
      name: "Priyanka R.",
      title: "COUNSELING PSYCHOLOGIST & SENIOR STUDENT COUNSELOR",
      desc: "Founder of Intel Counselling with 10+ years of experience, Priyanka supports students with a calm presence.",
      img: "/assets/imgs/pfp_priyanka.png",
      detailedBio: "With over 10 years of dedicated clinical experience, Priyanka R. is the founder of Intell Counselling. She currently serves as a Senior Student Counselor at Rajalakshmi Engineering College. Her calm presence and deep listening make people feel safe, seen, and supported, allowing for genuine emotional breakthroughs.",
      specialties: ["Anxiety", "Depression", "Academic Stress", "Addiction"],
      philosophy: "To help people feel lighter, think clearer, and live fuller.",
      socials: [
        { icon: <Linkedin size={16} />, label: "LinkedIn" },
        { icon: <Twitter size={16} />, label: "Twitter" },
        { icon: <Mail size={16} />, label: "Email" }
      ]
    },
    {
      name: "Gayathri Gokulakrishnan",
      title: "CO-FOUNDER & OPERATIONS MANAGER",
      desc: "Gayathri Gokulakrishnan drives the strategic vision and operational excellence of Intell Counselling.",
      img: "/assets/imgs/pfp_gayathri.png",
      detailedBio: "As Co-Founder, Gayathri Gokulakrishnan drives the strategic vision and operational excellence of Intell Counselling. She oversees the organization's digital infrastructure and marketing outreach. Her role ensures that professional mental healthcare remains accessible and secure.",
      specialties: ["Oversees daily operations", "Managing administrative processes", "Strategic growth"],
      philosophy: "Her structured approach and commitment to efficiency help maintain a supportive, well-organized environment that enables the center to deliver quality counselling services.",
      socials: [
        { icon: <Linkedin size={16} />, label: "LinkedIn" },
        { icon: <Twitter size={16} />, label: "Twitter" },
        { icon: <Mail size={16} />, label: "Email" }
      ]
    }
  ];

  const toggleExpand = (idx: number) => {
    const nextIdx = expandedIdx === idx ? null : idx;
    setExpandedIdx(nextIdx);
    onExpandChange?.(nextIdx !== null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-28">
      <FadeIn>
        <div className="text-center sm:text-left mb-8 sm:mb-12 md:mb-16 px-0 sm:px-4">
          <h2 className="text-2xl sm:text-4xl md:text-6xl font-black mb-3 sm:mb-4 md:mb-6 text-[#1F1E1B] serif">
            The Minds Behind Intel.
          </h2>
          <p className="text-sm sm:text-base md:text-xl text-[#1F1E1B]/60 leading-relaxed font-light max-w-2xl">
            Our founders combine clinical rigor with radical empathy to redefine the modern therapy experience.
          </p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-10 items-start">
        {founders.map((f, idx) => {
          const isExpanded = expandedIdx === idx;

          return (
            <FadeIn key={idx} delay={idx * 200}>
              <div
                onClick={() => toggleExpand(idx)}
                className={`bg-[#2A2825] rounded-2xl sm:rounded-3xl md:rounded-[48px]
                             p-4 sm:p-6 md:p-10
                             shadow-2xl border border-white/5 hover:border-white/10
                             transition-all duration-700 relative overflow-hidden flex flex-col cursor-pointer
                             ${isExpanded ? 'ring-2 sm:ring-4 ring-terracotta/20' : ''}`}
              >
                {/* Decorative corner */}
                <div className={`absolute top-0 right-0 w-20 h-20 sm:w-28 sm:h-28 bg-white/5
                                  rounded-bl-[50px] sm:rounded-bl-[80px] -mr-6 -mt-6 sm:-mr-8 sm:-mt-8
                                  transition-all duration-700 ${isExpanded ? 'opacity-0 scale-150' : 'opacity-100'}`} />

                {/* Header row */}
                <div className={`flex gap-3 sm:gap-5 mb-4 sm:mb-6 transition-all duration-700
                                  ${isExpanded ? 'flex-col items-center text-center' : 'flex-row items-center'}`}>
                  {/* Avatar */}
                  <div className={`shrink-0 overflow-hidden rounded-xl sm:rounded-2xl border-2 border-white/10 shadow-xl
                                    transition-all duration-700
                                    ${isExpanded
                                      ? 'w-20 h-20 sm:w-32 sm:h-32 md:w-48 md:h-48 mb-1'
                                      : 'w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28'}`}>
                    <img
                      src={f.img}
                      alt={f.name}
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                    />
                  </div>

                  {/* Name & title */}
                  <div className={`min-w-0 transition-all duration-500 ${isExpanded ? 'text-center' : ''}`}>
                    <h3 className={`font-black text-white serif leading-tight transition-all duration-700
                                     ${isExpanded ? 'text-xl sm:text-2xl md:text-3xl' : 'text-base sm:text-xl md:text-2xl'}
                                     ${!isExpanded ? 'truncate' : ''}`}>
                      {f.name}
                    </h3>
                    <p className="text-[9px] sm:text-[10px] md:text-xs font-bold text-terracotta
                                   tracking-[0.1em] sm:tracking-[0.15em] uppercase mt-1 sm:mt-2
                                   leading-snug">
                      {f.title}
                    </p>
                  </div>
                </div>

                {/* Bio */}
                <p className={`text-white/60 font-light leading-relaxed transition-all duration-500
                                text-sm sm:text-sm md:text-base mb-3 sm:mb-5
                                ${isExpanded ? 'text-center max-w-lg mx-auto' : 'line-clamp-3'}`}>
                  {isExpanded ? f.detailedBio : f.desc}
                </p>

                {/* Expanded details */}
                <div className={`overflow-hidden transition-all duration-700 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 border-t border-white/10">
                    {/* Specialties */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Target size={13} className="text-terracotta" />
                        <h4 className="font-bold text-white text-[9px] sm:text-xs uppercase tracking-widest">
                          {idx === 1 ? 'Focus' : 'Expertise'}
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {f.specialties.map((s, i) => (
                          <span key={i} className="text-[10px] sm:text-xs font-semibold
                                                     bg-white/5 px-3 py-1.5 rounded-lg
                                                     text-white/80 border border-white/5">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Philosophy */}
                    <div className="bg-white/[0.03] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <Heart size={13} className="text-terracotta" />
                        <h4 className="font-bold text-white text-[9px] sm:text-xs uppercase tracking-widest">Philosophy</h4>
                      </div>
                      <p className="text-sm sm:text-base md:text-lg text-white/70 italic leading-relaxed serif font-medium">
                        "{f.philosophy}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer row */}
                <div className={`flex items-center justify-between mt-4 sm:mt-5 pt-3 sm:pt-5
                                  ${isExpanded ? 'border-t border-white/10' : ''}`}>
                  <div className="flex items-center gap-2">
                    {f.socials.map((social, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={e => e.stopPropagation()}
                        aria-label={social.label}
                        className="w-8 h-8 bg-white/5 text-white/60 rounded-xl flex items-center justify-center
                                   hover:bg-terracotta hover:text-white transition-all border border-white/5"
                      >
                        {React.isValidElement(social.icon) &&
                          React.cloneElement(social.icon as React.ReactElement<any>, { size: 13 })}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-terracotta font-bold text-[10px] uppercase tracking-widest">
                    {isExpanded
                      ? <><span>Collapse</span><ChevronUp size={13} /></>
                      : <><span>Profile</span><ChevronDown size={13} /></>}
                  </div>
                </div>
              </div>
            </FadeIn>
          );
        })}
      </div>
    </div>
  );
};

export default Founders;
