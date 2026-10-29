import React from 'react';
import { Check } from 'lucide-react';

// Shared look for every assessment screen (intake, consent, payment, the three test
// runners and their results): a cream page with soft glows, a card with pastel cards
// peeking out behind it, chunky progress, and pastel answer buttons.

// Answer buttons cycle through these. Class names are written out in full so Tailwind keeps them.
export const OPTION_STYLES = [
  { picked: 'bg-sage', hover: 'hover:bg-sage/50' },
  { picked: 'bg-sky', hover: 'hover:bg-sky/60' },
  { picked: 'bg-lavender', hover: 'hover:bg-lavender/60' },
  { picked: 'bg-peach', hover: 'hover:bg-peach/60' },
  { picked: 'bg-[#F0E4C8]', hover: 'hover:bg-[#F0E4C8]/70' },
];

export const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-full bg-terracotta text-intel-dark font-semibold h-14 px-8 text-base shadow-[0_8px_24px_rgba(26,26,26,0.18)] hover:bg-[#cfac80] disabled:opacity-40 disabled:cursor-not-allowed';
export const BTN_GREEN =
  'inline-flex items-center justify-center gap-2 rounded-full bg-serene-green text-white font-semibold h-14 px-8 text-base shadow-[0_8px_24px_rgba(28,63,57,0.28)] hover:bg-[#24524a] disabled:opacity-40 disabled:cursor-not-allowed';
export const BTN_DARK =
  'inline-flex items-center justify-center gap-2 rounded-full bg-intel-dark text-white font-semibold h-14 px-8 text-base shadow-[0_8px_24px_rgba(26,26,26,0.25)] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed';
export const BTN_SOFT =
  'inline-flex items-center justify-center gap-2 rounded-full bg-white text-intel-dark font-semibold h-14 px-7 text-base border-2 border-black/10 hover:border-black/25 hover:bg-white';

export const FIELD =
  'w-full bg-white border-2 border-black/[0.06] rounded-2xl px-5 py-3.5 text-base text-intel-dark font-medium outline-none shadow-[0_2px_0_rgba(26,26,26,0.05)] focus:border-terracotta focus:ring-4 focus:ring-terracotta/15 transition-all';
export const FIELD_LABEL = 'flex items-center gap-2 text-sm font-semibold text-intel-dark/60 mb-1.5 ml-1';

// ── Page: cream with soft pastel glows ──────────────────────────────
export const AssessmentPage: React.FC<{
  children: React.ReactNode;
  align?: 'start' | 'center';
  className?: string;
}> = ({ children, align = 'start', className = '' }) => (
  <div
    className={`relative overflow-hidden min-h-screen bg-[#F7EBD3] print:bg-white pt-20 md:pt-28 pb-12 px-4 flex justify-center ${
      align === 'center' ? 'items-center' : 'items-start'
    } ${className}`}
  >
    <div className="as-bob pointer-events-none absolute top-24 -left-24 w-80 h-80 rounded-full bg-lavender/80 blur-3xl print:hidden" aria-hidden="true" />
    <div className="as-bob-alt pointer-events-none absolute bottom-0 -right-24 w-96 h-80 rounded-full bg-sky/80 blur-3xl print:hidden" aria-hidden="true" />
    <div className="as-bob pointer-events-none absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-peach/60 blur-3xl print:hidden" aria-hidden="true" />
    <div className="relative z-10 w-full flex justify-center">{children}</div>
  </div>
);

// ── Card with two pastel cards tilted behind it ─────────────────────
export const StackedCard: React.FC<{
  children: React.ReactNode;
  maxW?: string;
  className?: string;
}> = ({ children, maxW = 'max-w-3xl', className = '' }) => (
  <div className={`relative w-full ${maxW}`}>
    <span className="pointer-events-none absolute inset-0 rounded-[36px] bg-peach rotate-[2deg] translate-x-2 translate-y-2 print:hidden" aria-hidden="true" />
    <span className="pointer-events-none absolute inset-0 rounded-[36px] bg-sage -rotate-[1.6deg] -translate-x-1 translate-y-1 print:hidden" aria-hidden="true" />
    <div className={`relative bg-[#FFFDF8] rounded-[36px] shadow-[0_20px_50px_rgba(26,26,26,0.12)] border border-black/5 overflow-hidden print:shadow-none ${className}`}>
      {children}
    </div>
  </div>
);

// ── Header controls ─────────────────────────────────────────────────
export const RoundButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', children, ...props }) => (
  <button
    type="button"
    {...props}
    className={`w-10 h-10 rounded-full bg-black/[0.05] hover:bg-black/10 text-intel-dark/70 hover:text-intel-dark flex items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed transition-colors ${className}`}
  >
    {children}
  </button>
);

export const BackPill: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string }> = ({ onClick, children, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-full bg-black/[0.05] hover:bg-black/10 px-4 py-2 text-sm font-semibold text-intel-dark/70 hover:text-intel-dark transition-colors ${className}`}
  >
    {children}
  </button>
);

// ── Progress: chunky bar + a "3 / 9" pill ───────────────────────────
export const ProgressPill: React.FC<{ value: number; total: number; color?: string; label?: string }> = ({ value, total, color = 'bg-terracotta', label }) => (
  <div className="flex items-center gap-3 min-w-0">
    <div
      className="h-3 w-20 md:w-44 rounded-full bg-black/[0.07] overflow-hidden"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={value}
      aria-label={label || 'Progress'}
    >
      <div className={`h-full rounded-full ${color} transition-all duration-500 ease-bounce`} style={{ width: `${(value / total) * 100}%` }} />
    </div>
    <span className="rounded-full bg-black/[0.05] px-3 py-1 text-[11px] font-bold text-intel-dark/60 whitespace-nowrap">
      {value} / {total}
    </span>
  </div>
);

// ── Question + answers ──────────────────────────────────────────────
export const QuestionHead: React.FC<{ eyebrow?: string; text: string; chip?: string; align?: 'center' | 'left' }> = ({ eyebrow, text, chip = 'bg-lavender', align = 'center' }) => (
  <div className={`mb-8 md:mb-10 ${align === 'center' ? 'text-center' : ''}`}>
    {eyebrow && <span className={`inline-block rounded-full ${chip} px-4 py-1.5 text-[12px] font-semibold text-intel-dark/80 mb-5`}>{eyebrow}</span>}
    <h3 className="serif text-2xl md:text-[2rem] leading-snug text-intel-dark">{text}</h3>
  </div>
);

export const OptionButton: React.FC<{
  label: string;
  picked: boolean;
  index: number;
  onClick: () => void;
}> = ({ label, picked, index, onClick }) => {
  const style = OPTION_STYLES[index % OPTION_STYLES.length];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={picked}
      className={`group w-full text-left flex items-center justify-between gap-4 rounded-3xl border-2 px-5 py-4 md:px-6 md:py-5 transition-all duration-300 ease-bounce ${
        picked
          ? `${style.picked} border-intel-dark -rotate-[0.6deg] scale-[1.015] shadow-[0_5px_0_rgba(26,26,26,0.85)]`
          : `bg-white border-black/[0.06] hover:-translate-y-0.5 hover:border-intel-dark/30 hover:shadow-md ${style.hover}`
      }`}
    >
      <span className="font-semibold text-intel-dark text-[15px] md:text-base leading-snug">{label}</span>
      <span
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ease-bounce ${
          picked ? 'bg-intel-dark text-white scale-110' : 'border-2 border-black/15 group-hover:border-intel-dark/40'
        }`}
      >
        {picked && <Check size={16} strokeWidth={3} />}
      </span>
    </button>
  );
};

// ── Intro / result pieces ───────────────────────────────────────────
export const IconTile: React.FC<{ children: React.ReactNode; tint?: string; size?: 'md' | 'lg'; className?: string }> = ({ children, tint = 'bg-lavender', size = 'lg', className = '' }) => (
  <span
    className={`as-bob inline-flex items-center justify-center text-intel-dark shadow-[0_10px_24px_rgba(26,26,26,0.12)] ${tint} ${
      size === 'lg' ? 'w-20 h-20 rounded-[28px]' : 'w-14 h-14 rounded-2xl'
    } ${className}`}
    aria-hidden="true"
  >
    {children}
  </span>
);

export const InfoChip: React.FC<{ icon: React.ReactNode; tint?: string; children: React.ReactNode; className?: string }> = ({ icon, tint = 'bg-white', children, className = '' }) => (
  <div className={`flex items-start gap-3 rounded-2xl ${tint} px-4 py-3 text-sm text-intel-dark/80 leading-snug ${className}`}>
    <span className="mt-0.5 shrink-0 text-serene-green">{icon}</span>
    <span>{children}</span>
  </div>
);

const CONFETTI = [
  ['#F6DCC8', -90, -60], ['#DCE8DC', 90, -65], ['#E6DEEC', -105, 25], ['#DCE6EE', 105, 30],
  ['#C19B6C', -45, 95], ['#F6DCC8', 50, 98], ['#DCE8DC', 0, -105], ['#E6DEEC', 70, -100],
];

// A small burst of pastel dots around whatever sits at the centre
export const Confetti: React.FC = () => (
  <>
    {CONFETTI.map(([color, dx, dy], i) => (
      <span
        key={i}
        className="as-confetti absolute left-1/2 top-1/2 w-3 h-3 rounded-full print:hidden"
        style={{ background: color as string, ['--dx' as string]: `${dx}px`, ['--dy' as string]: `${dy}px`, animationDelay: `${0.15 + i * 0.05}s` }}
        aria-hidden="true"
      />
    ))}
  </>
);
