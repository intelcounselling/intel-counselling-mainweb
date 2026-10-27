import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, Calendar, ShieldCheck, Heart, Brain, Monitor, Users, Sprout, GraduationCap,
  Sparkles, Globe, Lock, MessageCircle, Smile, Mail, Wind, Waves, CloudRain, Moon,
} from 'lucide-react';
import { LazyImage } from './ui/LazyImage';
import FadeIn from './FadeIn';
import WaveDivider from './WaveDivider';
import { CLINIC } from '../utils/site';

// The personal therapy page has its own layout, in the homepage's colours: sections
// alternate cream and charcoal, joined by the same waves, with pastels only on small
// tiles, chips and cards. Student and Corporate pages keep the shared ServiceDetail template.

const C = {
  cream: '#F7EBD3',
  dark: '#1F1E1B',
};

const TOPICS = [
  {
    id: 'emotional',
    label: 'Mind & mood',
    title: 'Emotional & Mental Health Support',
    icon: Brain,
    tint: 'bg-lavender',
    items: ['Depression', 'Anxiety', 'Panic attacks', 'Mood disturbances', 'Emotional numbness', 'Stress overload', 'Suicidal ideation support', 'Trauma support (mild to moderate)'],
  },
  {
    id: 'academic',
    label: 'Study & career',
    title: 'Academic & Career Pressure',
    icon: GraduationCap,
    tint: 'bg-sage',
    items: ['Exam anxiety (NEET, IIT, Board exams)', 'Academic burnout', 'Concentration issues', 'Dropout thoughts', 'Motivation loss', 'Career confusion'],
  },
  {
    id: 'habits',
    label: 'Habits',
    title: 'Addiction & Behavioural Patterns',
    icon: Monitor,
    tint: 'bg-sky',
    items: ['Mobile addiction', 'Social media dependency', 'Smoking', 'Alcohol use', 'Emotional dependency', 'Habit control difficulties'],
  },
  {
    id: 'relationships',
    label: 'Relationships',
    title: 'Relationships & Family Life',
    icon: Users,
    tint: 'bg-peach',
    items: ['Marital conflicts', 'Pre-marital counselling', 'Communication issues', 'Trust issues', 'Emotional distance', 'Family conflicts', 'Parent–child relationship', 'In-law relationship stress'],
  },
  {
    id: 'transitions',
    label: 'Life changes',
    title: 'Life Transitions & Adjustment',
    icon: Sprout,
    tint: 'bg-[#F0E4C8]',
    items: ['Grief & loss', 'Divorce adjustment', 'Retirement adjustment', 'Cultural adaptation (Indians abroad)', 'Loneliness', 'Midlife crisis', 'Identity confusion'],
  },
];

const STEPS = [
  { icon: Calendar, title: 'Pick a time', text: 'Choose a day and slot that suits you, online or in person.' },
  { icon: MessageCircle, title: 'Talk it through', text: 'Meet your counsellor and share at your own pace, with no pressure.' },
  { icon: Sprout, title: 'Grow from here', text: 'Build a plan that fits your life and take it one step at a time.' },
];

const FEATURES = [
  'One-on-one confidential counseling',
  'Cognitive Behavioral Therapy (CBT)',
  'Trauma-informed recovery plans',
  'Anxiety & depression management',
  'Emotional resilience building',
];

// Each mood opens the matching free check-in (same routes as the homepage chips)
const MOODS = [
  { label: 'Anxious', test: 'gad7', icon: Wind, tint: 'bg-sky' },
  { label: 'Stressed', test: 'pss10', icon: Waves, tint: 'bg-peach' },
  { label: 'Feeling low', test: 'phq9', icon: CloudRain, tint: 'bg-lavender' },
  { label: "Can't sleep", test: 'sleep', icon: Moon, tint: 'bg-sage' },
];

const Inner: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`max-w-6xl mx-auto px-5 sm:px-8 ${className}`}>{children}</div>
);

const Eyebrow: React.FC<{ icon?: React.ReactNode; children: React.ReactNode; dark?: boolean }> = ({ icon, children, dark }) => (
  <p className={`inline-flex items-center gap-1.5 text-sm font-semibold mb-3 ${dark ? 'text-terracotta' : 'text-[#8a6a3f]'}`}>{icon} {children}</p>
);

interface PersonalTherapyProps {
  onBack: () => void;
  onBook: () => void;
}

const PersonalTherapy: React.FC<PersonalTherapyProps> = ({ onBack, onBook }) => {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const topic = TOPICS[active];
  const TopicIcon = topic.icon;

  // Arrow keys move between topic tabs
  const onTabKey = (e: React.KeyboardEvent) => {
    const next = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!next) return;
    e.preventDefault();
    const i = (active + next + TOPICS.length) % TOPICS.length;
    setActive(i);
    document.getElementById(`topic-tab-${TOPICS[i].id}`)?.focus();
  };

  return (
    <div className="relative overflow-x-clip">
      {/* ── 1. Hero · lavender ─────────────────────────────── */}
      <section className="relative pt-24 md:pt-28 pb-6 md:pb-10" style={{ background: C.cream }}>
        <div className="pt-bob pointer-events-none absolute top-24 -left-20 w-72 h-72 rounded-full bg-terracotta/15 blur-3xl" aria-hidden="true" />
        <div className="pt-bob-alt pointer-events-none absolute bottom-0 right-0 w-80 h-64 rounded-full bg-serene-green/10 blur-3xl" aria-hidden="true" />
        <Inner className="relative">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 mb-8 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-intel-dark/80 shadow-sm hover:bg-white hover:text-intel-dark hover:shadow-md transition-all"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" /> Back to services
          </button>

          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center pb-10 md:pb-14">
            <div>
              <span className="inline-flex items-center gap-2.5 rounded-full bg-white/80 pl-1.5 pr-4 py-1.5 text-sm font-semibold text-[#8a6a3f] shadow-sm">
                <span className="w-8 h-8 rounded-full bg-terracotta/30 flex items-center justify-center" aria-hidden="true"><Heart size={16} /></span>
                Individual healing &amp; discovery
              </span>
              <h1 className="serif mt-6 text-5xl sm:text-6xl lg:text-[4.5rem] leading-[1.04] text-intel-dark">
                Personal{' '}
                <span className="relative inline-block italic text-serene-green">
                  Therapy
                  <svg className="absolute left-0 -bottom-2 w-full h-3 text-terracotta" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M2,8 C30,0 60,12 100,6 C140,0 170,11 198,5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  </svg>
                </span>
              </h1>
              <p className="mt-8 max-w-xl text-lg text-intel-dark/70 leading-relaxed">
                Our individual sessions are a sanctuary for your mind. We combine modern clinical techniques with deep compassion to help you unravel complex emotions and build a foundation of lasting peace.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <button
                  onClick={onBook}
                  className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-serene-green text-white font-semibold shadow-[0_6px_20px_rgba(28,63,57,0.25)] hover:bg-[#24524a]"
                >
                  <Calendar size={18} /> Book a session
                </button>
                <a
                  href="#feeling"
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-intel-dark text-white font-semibold shadow-[0_6px_20px_rgba(26,26,26,0.25)] hover:bg-black"
                >
                  <Smile size={18} /> How are you feeling?
                </a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-intel-dark/65">
                <li className="inline-flex items-center gap-2"><Globe size={16} className="text-serene-green" /> Online and in person</li>
                <li className="inline-flex items-center gap-2"><Lock size={16} className="text-serene-green" /> Confidential, always</li>
                <li className="inline-flex items-center gap-2"><Heart size={16} className="text-serene-green" /> No judgement</li>
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-[380px]">
              <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-t-[999px] rounded-b-[44px] bg-peach rotate-[4deg]" aria-hidden="true" />
              <div className="absolute inset-0 -translate-x-3 translate-y-2 rounded-t-[999px] rounded-b-[44px] bg-sage -rotate-[3deg]" aria-hidden="true" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[44px] border-[6px] border-intel-dark shadow-[0_24px_60px_rgba(26,26,26,0.25)]">
                <LazyImage src="/assets/imgs/personaltherapy_bg.png" alt="" className="w-full h-full object-cover" />
              </div>
              <span className="pt-bob absolute -top-3 -left-6 sm:-left-10 inline-flex items-center gap-1.5 rounded-full bg-terracotta text-intel-dark px-4 py-2 text-sm font-semibold shadow-[0_8px_18px_rgba(0,0,0,0.25)] -rotate-[6deg]" aria-hidden="true">
                <Heart size={15} /> A safe space
              </span>
              <span className="pt-bob-alt absolute bottom-10 -right-4 sm:-right-10 inline-flex items-center gap-1.5 rounded-full bg-white text-intel-dark px-4 py-2 text-sm font-semibold shadow-[0_8px_18px_rgba(0,0,0,0.18)] rotate-[5deg]" aria-hidden="true">
                <ShieldCheck size={15} className="text-serene-green" /> Private
              </span>
              <Sparkles className="pt-bob absolute -bottom-6 left-4 text-terracotta" size={28} aria-hidden="true" />
            </div>
          </div>
        </Inner>
      </section>

      <WaveDivider from={C.cream} to={C.dark} flip />

      {/* ── 2. What brings you here · cream ────────────────── */}
      <section className="py-14 md:py-20" style={{ background: C.dark }}>
        <Inner>
          <FadeIn>
            <div className="max-w-2xl mb-10">
              <Eyebrow dark icon={<Heart size={14} />}>You are not alone in this</Eyebrow>
              <h2 className="serif text-3xl md:text-[2.75rem] text-[#F4EFE6] leading-tight">
                What brings people <span className="italic text-terracotta">here</span>
              </h2>
              <p className="mt-4 text-white/60 text-lg leading-relaxed">Pick what feels closest. Every one of these is something we help with every week.</p>
            </div>
          </FadeIn>

          <div className="grid lg:grid-cols-[300px_1fr] gap-6 lg:gap-10 items-start">
            <div role="tablist" aria-label="Areas we help with" aria-orientation="vertical" className="flex lg:flex-col gap-2 overflow-x-auto pt-1 pb-3 lg:pb-0 -mx-5 px-5 lg:mx-0 lg:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {TOPICS.map((t, i) => {
                const Icon = t.icon;
                const on = i === active;
                return (
                  <button
                    key={t.id}
                    id={`topic-tab-${t.id}`}
                    role="tab"
                    aria-selected={on}
                    aria-controls="topic-panel"
                    tabIndex={on ? 0 : -1}
                    onClick={() => setActive(i)}
                    onKeyDown={onTabKey}
                    className={`shrink-0 flex items-center gap-3 rounded-full lg:rounded-2xl px-4 py-3 text-left text-[15px] font-semibold border-2 transition-all duration-300 ease-bounce
                      ${on ? `${t.tint} border-terracotta text-intel-dark shadow-[0_4px_0_rgba(193,155,108,0.55)] lg:translate-x-2` : 'bg-white/[0.06] border-transparent text-white/70 hover:bg-white/10 hover:text-white'}`}
                  >
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-intel-dark ${on ? 'bg-white/70' : t.tint}`} aria-hidden="true"><Icon size={18} /></span>
                    <span className="whitespace-nowrap lg:whitespace-normal">{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div
              key={topic.id}
              id="topic-panel"
              role="tabpanel"
              aria-labelledby={`topic-tab-${topic.id}`}
              className={`pt-pop rounded-[36px] p-7 md:p-10 ${topic.tint} shadow-[0_14px_34px_rgba(26,26,26,0.08)]`}
            >
              <span className="w-14 h-14 rounded-2xl bg-white/70 text-intel-dark flex items-center justify-center mb-5" aria-hidden="true">
                <TopicIcon size={26} />
              </span>
              <h3 className="serif text-2xl md:text-3xl text-intel-dark mb-6">{topic.title}</h3>
              <ul className="flex flex-wrap gap-2.5">
                {topic.items.map((item, i) => (
                  <li
                    key={item}
                    className="pt-chip rounded-full bg-white/75 px-4 py-2 text-[14.5px] font-medium text-intel-dark/85 hover:bg-white transition-colors"
                    style={{ animationDelay: `${i * 45}ms` }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Inner>
      </section>

      <WaveDivider from={C.dark} to={C.cream} />

      {/* ── 3. How it works · sage ─────────────────────────── */}
      <section className="py-14 md:py-20" style={{ background: C.cream }}>
        <Inner>
          <FadeIn>
            <div className="text-center max-w-xl mx-auto mb-14">
              <Eyebrow icon={<Sparkles size={14} />}>Simple to start</Eyebrow>
              <h2 className="serif text-3xl md:text-[2.75rem] text-intel-dark leading-tight">
                How it <span className="italic text-serene-green">works</span>
              </h2>
            </div>
          </FadeIn>
          <div className="relative grid md:grid-cols-3 gap-12 md:gap-8">
            <div className="hidden md:block absolute top-9 left-[17%] right-[17%] border-t-2 border-dashed border-intel-dark/30" aria-hidden="true" />
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <FadeIn key={title} delay={i * 100}>
                <div className="group relative text-center px-2">
                  <div className="relative mx-auto w-[72px] h-[72px] rounded-full bg-white shadow-[0_8px_20px_rgba(26,26,26,0.12)] flex items-center justify-center text-serene-green transition-transform duration-500 ease-bounce group-hover:-rotate-12 group-hover:scale-110">
                    <Icon size={30} />
                    <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-intel-dark text-terracotta serif text-base flex items-center justify-center" aria-hidden="true">{i + 1}</span>
                  </div>
                  <h3 className="serif text-2xl text-intel-dark mt-6">{title}</h3>
                  <p className="mt-2 text-[15px] text-intel-dark/70 leading-relaxed max-w-[260px] mx-auto">{text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </Inner>
      </section>

      <WaveDivider from={C.cream} to={C.dark} flip />

      {/* ── 4. What's included · deep green ────────────────── */}
      <section className="py-14 md:py-20 text-white" style={{ background: C.dark }}>
        <Inner>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <FadeIn>
              <Eyebrow dark icon={<Check size={14} />}>Every session</Eyebrow>
              <h2 className="serif text-3xl md:text-[2.75rem] leading-tight">
                What&rsquo;s <span className="italic text-terracotta">included</span>
              </h2>
              <ul className="mt-8 space-y-4">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3.5 text-[17px] text-white/85 leading-relaxed">
                    <span className="mt-0.5 w-7 h-7 rounded-full bg-terracotta text-intel-dark flex items-center justify-center shrink-0" aria-hidden="true"><Check size={15} strokeWidth={3} /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onBook}
                className="mt-10 inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-terracotta text-intel-dark font-semibold hover:bg-[#cfac80]"
              >
                <Calendar size={18} /> Book a session
              </button>
            </FadeIn>

            <div className="grid gap-5">
              {[
                { icon: ShieldCheck, title: 'Safe and secure', text: 'Confidential sessions, with your records kept private and encrypted.', tilt: '-rotate-[1.5deg]', tint: 'bg-lavender' },
                { icon: Heart, title: 'Care without judgement', text: 'We listen carefully and without judgement, so you feel supported.', tilt: 'rotate-[1.5deg]', tint: 'bg-peach' },
              ].map(({ icon: Icon, title, text, tilt, tint }) => (
                <FadeIn key={title}>
                  <div className={`group rounded-[32px] ${tint} text-intel-dark p-7 ${tilt} transition-transform duration-500 ease-bounce hover:rotate-0 hover:-translate-y-1.5`}>
                    <span className="w-12 h-12 rounded-2xl bg-white/70 flex items-center justify-center transition-transform duration-500 ease-bounce group-hover:-rotate-12 group-hover:scale-110"><Icon size={22} /></span>
                    <h3 className="serif text-xl mt-5">{title}</h3>
                    <p className="text-[15px] text-intel-dark/70 leading-relaxed mt-2">{text}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </Inner>
      </section>

      <WaveDivider from={C.dark} to={C.cream} />

      {/* ── 5. How are you feeling · peach ─────────────────── */}
      <section id="feeling" className="py-14 md:py-20 scroll-mt-20" style={{ background: C.cream }}>
        <Inner>
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto">
              <Eyebrow icon={<Smile size={14} />}>Not sure where to begin?</Eyebrow>
              <h2 className="serif text-3xl md:text-[2.75rem] text-intel-dark leading-tight">
                How are you feeling <span className="italic text-serene-green">today?</span>
              </h2>
              <p className="mt-4 text-intel-dark/70 text-lg leading-relaxed">
                Pick what feels closest. A short, free check-in will help you put it into words, and a counsellor is here whenever you are ready.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {MOODS.map(({ label, test, icon: Icon, tint }) => (
                <button
                  key={test}
                  onClick={() => navigate(`/assessments/${test}`)}
                  className="group inline-flex items-center gap-3 rounded-full bg-white pl-2 pr-6 py-2 text-lg font-semibold text-intel-dark shadow-[0_6px_0_rgba(26,26,26,0.12)] hover:-translate-y-1 active:translate-y-0.5 active:shadow-[0_2px_0_rgba(26,26,26,0.12)] transition-all duration-300 ease-bounce"
                >
                  <span className={`w-11 h-11 rounded-full flex items-center justify-center ${tint} transition-transform duration-500 ease-bounce group-hover:-rotate-12 group-hover:scale-110`} aria-hidden="true"><Icon size={20} /></span>
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-intel-dark/60">
              Or see <button onClick={() => navigate('/assessments')} className="font-semibold text-serene-green underline underline-offset-4">all the free check-ins</button>.
            </p>
          </FadeIn>
        </Inner>
      </section>

      <WaveDivider from={C.cream} to={C.dark} flip />

      {/* ── 6. Ready when you are · charcoal ──────────────── */}
      <section className="relative pt-4 pb-20 md:pb-28" style={{ background: C.dark }}>
        <Sparkles className="pt-bob-alt absolute top-6 right-[12%] text-terracotta/60 hidden sm:block" size={34} aria-hidden="true" />
        <Inner>
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="serif text-4xl md:text-6xl text-[#F4EFE6] leading-[1.1]">
                Ready when <span className="italic text-terracotta">you are.</span>
              </h2>
              <p className="mt-5 text-white/65 text-lg md:text-xl leading-relaxed max-w-xl mx-auto">
                Take the first step at your own pace. We will meet you wherever you are.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={onBook}
                  className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-terracotta text-intel-dark text-lg font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:bg-[#cfac80]"
                >
                  <Calendar size={20} /> Book a session <ArrowRight size={18} />
                </button>
                <a
                  href={CLINIC.emailHref}
                  className="inline-flex items-center justify-center gap-2 h-14 px-7 rounded-full border-2 border-white/25 text-white font-semibold hover:bg-white/10"
                >
                  <Mail size={18} /> Write to us
                </a>
              </div>
            </div>
          </FadeIn>
        </Inner>
      </section>

      <style>{`
        @keyframes ptBob { 0%, 100% { translate: 0 0; } 50% { translate: 0 -8px; } }
        .pt-bob { animation: ptBob 5s ease-in-out infinite; }
        .pt-bob-alt { animation: ptBob 6.5s ease-in-out infinite reverse; }
        @keyframes ptPop { from { opacity: 0; transform: translateY(14px) scale(0.98); } to { opacity: 1; transform: none; } }
        .pt-pop { animation: ptPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        @keyframes ptChip { from { opacity: 0; transform: translateY(8px) scale(0.92); } to { opacity: 1; transform: none; } }
        .pt-chip { animation: ptChip 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        @media (prefers-reduced-motion: reduce) { .pt-bob, .pt-bob-alt, .pt-pop, .pt-chip { animation: none; } }
      `}</style>
    </div>
  );
};

export default PersonalTherapy;
