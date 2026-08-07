import React, { useState } from 'react';
import { Linkedin, Twitter, Mail, Target, Heart, ChevronRight, X, Star } from 'lucide-react';
import { LazyImage } from './ui/LazyImage';
import FadeIn from './FadeIn';

interface Founder {
  name: string;
  title: string;
  desc: string;
  img: string;
  detailedBio: string;
  specialties: string[];
  philosophy: string;
  badge: string;
  socials: { icon: React.ReactNode; label: string }[];
}

interface FoundersProps {
  onExpandChange?: (isExpanded: boolean) => void;
}

const Founders: React.FC<FoundersProps> = ({ onExpandChange }) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const founders: Founder[] = [
    {
      name: "Priyanka R.",
      title: "Counseling Psychologist",
      badge: "10+ Years Experience",
      desc: "Founder of Intel Counselling with 10+ years of experience, Priyanka supports students with a calm presence.",
      img: "/assets/imgs/pfp_priyanka.png",
      detailedBio: "With over 10 years of dedicated clinical experience, Priyanka R. is the founder of Intel Counselling. She currently serves as a Senior Student Counselor at Rajalakshmi Engineering College. Her calm presence and deep listening make people feel safe, seen, and supported, allowing for genuine emotional breakthroughs.",
      specialties: ["Anxiety", "Depression", "Academic Stress", "Addiction"],
      philosophy: "To help people feel lighter, think clearer, and live fuller.",
      socials: [
        { icon: <Linkedin size={16} />, label: "LinkedIn" },
        { icon: <Twitter size={16} />, label: "Twitter" },
        { icon: <Mail size={16} />, label: "Email" },
      ],
    },
    {
      name: "Gayathri Gokulakrishnan",
      title: "Co-Founder & Operations",
      badge: "Strategic Growth",
      desc: "Gayathri drives the strategic vision and operational excellence of Intel Counselling.",
      img: "/assets/imgs/pfp_gayathri.png",
      detailedBio: "As Co-Founder, Gayathri Gokulakrishnan drives the strategic vision and operational excellence of Intel Counselling. She oversees the organization's digital infrastructure and marketing outreach. Her role ensures that professional mental healthcare remains accessible and secure.",
      specialties: ["Oversees daily operations", "Managing administrative processes", "Strategic growth"],
      philosophy: "Her structured approach and commitment to efficiency help maintain a supportive, well-organized environment that enables the center to deliver quality counselling services.",
      socials: [
        { icon: <Linkedin size={16} />, label: "LinkedIn" },
        { icon: <Twitter size={16} />, label: "Twitter" },
        { icon: <Mail size={16} />, label: "Email" },
      ],
    },
  ];

  const activeFounder = activeIdx !== null ? founders[activeIdx] : null;
  const isOpen = activeFounder !== null;

  const open = (idx: number) => { setActiveIdx(idx); onExpandChange?.(true); };
  const close = () => { setActiveIdx(null); onExpandChange?.(false); };

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

      <div className="flex gap-4 md:gap-6 items-stretch overflow-hidden">

        {/* ── LEFT: Founder cards ── */}
        <div
          className="flex flex-col gap-4 sm:gap-5 shrink-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: isOpen ? 'min(340px, 42%)' : '100%' }}
        >
          {founders.map((f, idx) => {
            const isActive = activeIdx === idx;
            return (
              <FadeIn key={idx} delay={idx * 200}>
                <div
                  onClick={() => (isActive ? close() : open(idx))}
                  className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer
                               transition-all duration-500 shadow-2xl
                               ${isActive
                                 ? 'ring-2 ring-[#C19B6C]/50 shadow-[0_0_40px_rgba(193,155,108,0.15)]'
                                 : 'hover:shadow-[0_0_40px_rgba(255,255,255,0.05)]'}`}
                >
                  {/* Card background with subtle gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2E2C29] via-[#2A2825] to-[#232120]" />

                  {/* Subtle noise texture overlay */}
                  <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

                  {/* Glow orb on hover */}
                  <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl transition-all duration-700
                                   ${isActive ? 'bg-[#C19B6C]/20 opacity-100' : 'bg-[#C19B6C]/10 opacity-0 group-hover:opacity-100'}`} />

                  {/* Active indicator line */}
                  <div className={`absolute top-0 left-0 h-0.5 bg-gradient-to-r from-[#C19B6C] to-transparent
                                   transition-all duration-500 ${isActive ? 'w-full' : 'w-0 group-hover:w-1/2'}`} />

                  {/* Border */}
                  <div className={`absolute inset-0 rounded-2xl sm:rounded-3xl border transition-all duration-500
                                   ${isActive ? 'border-[#C19B6C]/25' : 'border-white/[0.06] group-hover:border-white/[0.12]'}`} />

                  {/* Content */}
                  <div className="relative p-5 sm:p-7">

                    {/* Top row: Avatar + Name + Badge */}
                    <div className="flex items-start gap-4 mb-4">
                      {/* Avatar with gradient ring */}
                      <div className="relative shrink-0">
                        <div className={`absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#C19B6C] to-[#1C3F39]
                                         transition-all duration-500 ${isActive ? 'opacity-70' : 'opacity-0 group-hover:opacity-50'}`}
                             style={{ padding: '2px', borderRadius: 'inherit' }} />
                        <div className={`relative overflow-hidden shadow-xl transition-all duration-500
                                         ${isOpen
                                           ? 'w-14 h-14 rounded-xl'
                                           : 'w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl'}`}>
                          <LazyImage
                            src={f.img}
                            alt={f.name}
                            className={`w-full h-full object-cover transition-all duration-700
                                        ${isActive ? 'grayscale-0 scale-105' : 'grayscale group-hover:grayscale-0'}`}
                          />
                        </div>
                      </div>

                      {/* Name, title, badge */}
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex items-center gap-2 mb-1">
                          <Star size={9} className="text-[#C19B6C] fill-[#C19B6C] shrink-0" />
                          <span className="text-[8px] font-bold text-[#C19B6C]/80 uppercase tracking-[0.2em]">{f.badge}</span>
                        </div>
                        <h3 className={`font-black text-white serif leading-tight transition-all duration-300
                                         ${isOpen ? 'text-sm' : 'text-base sm:text-xl'}`}>
                          {f.name}
                        </h3>
                        <p className={`font-semibold text-white/40 mt-0.5 leading-snug transition-all duration-300
                                        ${isOpen ? 'text-[8px]' : 'text-[9px] sm:text-[10px]'}`}>
                          {f.title}
                        </p>
                      </div>
                    </div>

                    {/* Short bio — only when panel is closed */}
                    {!isOpen && (
                      <p className="text-white/50 font-light leading-relaxed text-xs sm:text-sm mb-4 line-clamp-2">
                        {f.desc}
                      </p>
                    )}

                    {/* Specialty pills — only when panel is closed */}
                    {!isOpen && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {f.specialties.slice(0, 3).map((s, i) => (
                          <span key={i}
                            className="text-[9px] font-semibold px-2.5 py-1 rounded-full
                                       bg-white/[0.05] text-white/50 border border-white/[0.07]">
                            {s}
                          </span>
                        ))}
                        {f.specialties.length > 3 && (
                          <span className="text-[9px] font-semibold px-2.5 py-1 rounded-full
                                           bg-white/[0.05] text-white/30 border border-white/[0.07]">
                            +{f.specialties.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Divider */}
                    <div className="h-px bg-white/[0.06] mb-4" />

                    {/* Footer: socials + CTA */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {f.socials.slice(0, isOpen ? 2 : 3).map((social, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={e => e.stopPropagation()}
                            aria-label={social.label}
                            className="w-7 h-7 bg-white/[0.05] text-white/40 rounded-lg flex items-center justify-center
                                       hover:bg-[#C19B6C] hover:text-white transition-all border border-white/[0.06]"
                          >
                            {React.isValidElement(social.icon) &&
                              React.cloneElement(social.icon as React.ReactElement<any>, { size: 11 })}
                          </button>
                        ))}
                      </div>

                      <button className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em]
                                          px-3 py-1.5 rounded-lg transition-all duration-300
                                          ${isActive
                                            ? 'bg-white/10 text-white/70'
                                            : 'bg-[#C19B6C]/15 text-[#C19B6C] hover:bg-[#C19B6C]/25'}`}>
                        {isActive
                          ? <><X size={10} /><span>Close</span></>
                          : <><span>View Profile</span><ChevronRight size={10} /></>
                        }
                      </button>
                    </div>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>

        {/* ── RIGHT: detail panel ── */}
        <div
          className={`flex-1 min-w-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                       ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'}`}
          style={{ display: isOpen ? 'block' : 'none' }}
        >
          {activeFounder && (
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden h-full shadow-2xl">
              {/* Panel background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#2E2C29] via-[#2A2825] to-[#232120]" />
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-white/[0.07]" />
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#C19B6C] via-[#C19B6C]/50 to-transparent" />
              {/* Glow */}
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#C19B6C]/10 rounded-full blur-3xl" />

              <div className="relative h-full overflow-y-auto p-6 sm:p-8
                               [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

                {/* Hero: large avatar + name */}
                <div className="flex flex-col items-center text-center mb-7">
                  {/* Avatar with brass ring */}
                  <div className="relative mb-5">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[#C19B6C] via-[#1C3F39] to-[#C19B6C]/30 opacity-60" />
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                      <LazyImage
                        src={activeFounder.img}
                        alt={activeFounder.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Star size={9} className="text-[#C19B6C] fill-[#C19B6C]" />
                    <span className="text-[9px] font-bold text-[#C19B6C]/80 uppercase tracking-[0.2em]">
                      {activeFounder.badge}
                    </span>
                  </div>
                  <h3 className="font-black text-xl sm:text-2xl text-white serif leading-tight mb-1">
                    {activeFounder.name}
                  </h3>
                  <p className="text-[9px] sm:text-[10px] font-bold text-white/40 tracking-[0.15em] uppercase leading-snug max-w-xs">
                    {activeFounder.title}
                  </p>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

                {/* Bio */}
                <p className="text-white/65 font-light leading-relaxed text-sm sm:text-base mb-6">
                  {activeFounder.detailedBio}
                </p>

                {/* Expertise */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={12} className="text-[#C19B6C]" />
                    <h4 className="font-bold text-white text-[9px] sm:text-[10px] uppercase tracking-widest">
                      {activeIdx === 1 ? 'Focus Areas' : 'Expertise'}
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeFounder.specialties.map((s, i) => (
                      <span key={i}
                        className="text-[10px] sm:text-xs font-semibold
                                   bg-[#C19B6C]/10 px-3 py-1.5 rounded-lg
                                   text-[#C19B6C]/90 border border-[#C19B6C]/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Philosophy */}
                <div className="bg-white/[0.04] border border-white/[0.07] p-5 rounded-xl mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart size={12} className="text-[#C19B6C]" />
                    <h4 className="font-bold text-white text-[9px] sm:text-[10px] uppercase tracking-widest">
                      Philosophy
                    </h4>
                  </div>
                  <p className="text-sm sm:text-base text-white/60 italic leading-relaxed serif font-medium">
                    "{activeFounder.philosophy}"
                  </p>
                </div>

                {/* Socials */}
                <div className="flex items-center gap-2">
                  {activeFounder.socials.map((social, sIdx) => (
                    <button key={sIdx} aria-label={social.label}
                      className="w-9 h-9 bg-white/[0.05] text-white/50 rounded-xl flex items-center justify-center
                                 hover:bg-[#C19B6C] hover:text-white transition-all border border-white/[0.07]">
                      {React.isValidElement(social.icon) &&
                        React.cloneElement(social.icon as React.ReactElement<any>, { size: 14 })}
                    </button>
                  ))}
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quote */}
      <div className="mt-10 sm:mt-14 text-center px-4">
        <p className="text-[#1F1E1B]/20 font-serif italic text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          "Every session is a step toward a life that feels more like your own."
        </p>
      </div>
    </div>
  );
};

export default Founders;
