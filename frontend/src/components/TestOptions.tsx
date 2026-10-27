import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Activity, HeartPulse, Moon, ArrowRight, History, Smartphone, Compass, Layers, Sparkles } from 'lucide-react';
import FadeIn from './FadeIn';
import { useAuthUser } from '../utils/auth';

interface TestOptionsProps {
  onBack: () => void;
  onSelectTest: (type: string) => void;
}

const TestOptions: React.FC<TestOptionsProps> = ({ onBack, onSelectTest }) => {
  const navigate = useNavigate();
  const user = useAuthUser();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const freeTests = [
    {
      id: 'phq9',
      title: 'Depression Screening',
      shortTitle: 'Mood',
      desc: 'A brief self-check to understand your emotional well-being and depressive symptoms.',
      icon: <HeartPulse size={22} />,
      color: 'bg-[#9C5B47]',
      tint: 'bg-lavender'
    },
    {
      id: 'gad7',
      title: 'Anxiety Screening',
      shortTitle: 'Worry',
      desc: 'Measure your feelings of anxiety, worry, and tension.',
      icon: <Activity size={22} />,
      color: 'bg-[#2D6A4F]',
      tint: 'bg-sage'
    },
    {
      id: 'pss10',
      title: 'Stress Self-Check',
      shortTitle: 'Stress',
      desc: 'Understand how stressful you have found your life during the past month.',
      icon: <Brain size={22} />,
      color: 'bg-[#B08968]',
      tint: 'bg-peach'
    },
    {
      id: 'sleep',
      title: 'Sleep Hygiene Check',
      shortTitle: 'Sleep',
      desc: 'Reflect on your sleep habits and bedtime routines to improve rest quality.',
      icon: <Moon size={22} />,
      color: 'bg-[#4A4E69]',
      tint: 'bg-sky'
    },
    {
      id: 'sas',
      title: 'Smartphone Addiction',
      shortTitle: 'Screen time',
      desc: 'Assess your smartphone usage and digital habits to find a healthy balance.',
      icon: <Smartphone size={22} />,
      color: 'bg-[#3E5C76]',
      tint: 'bg-lavender'
    }
  ];

  const premium = [
    { path: '/career-assessment', icon: <Compass size={22} />, tile: 'bg-white/10 text-white', tag: 'Career mapping', title: 'Career Guidance Assessment', desc: 'Multiple intelligences, vocational interests and career personality, with a detailed PDF report.', cta: 'Explore the career test' },
    { path: '/intell-assessment', icon: <Layers size={22} />, tile: 'bg-terracotta text-intel-dark', tag: 'Module A + Module B', title: 'Intel Student Assessments', desc: 'How you learn, study habits, feelings, screen time and personality, plus mood and worry screenings, in one integrated profile.', cta: 'Explore Intel assessments' },
  ];

  return (
    <div className="relative min-h-screen pt-24 md:pt-28 pb-16 md:pb-24 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 mb-10 text-sm font-semibold text-intel-dark/70 hover:text-intel-dark transition-colors"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" /> Back to home
        </button>

        <FadeIn>
          <header className="relative max-w-2xl mb-10">
            <span className="pointer-events-none absolute -left-10 -top-6 w-40 h-40 rounded-full bg-sage/70 blur-2xl" aria-hidden="true" />
            <span className="pointer-events-none absolute right-0 top-4 w-32 h-32 rounded-full bg-lavender/80 blur-2xl" aria-hidden="true" />
            <p className="relative inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-sm font-semibold text-[#8a6a3f] mb-3"><Sparkles size={14} /> Assessments</p>
            <h1 className="serif relative text-4xl md:text-5xl leading-tight text-intel-dark">Check in with yourself</h1>
            <p className="relative mt-4 text-base md:text-lg text-intel-dark/70 leading-relaxed">
              Quick, friendly self-checks and in-depth assessments to help you understand yourself and plan your next step.
            </p>
          </header>
        </FadeIn>

        {/* Results live in one place: the account dashboard */}
        <div className="mb-16 p-5 sm:p-6 rounded-3xl bg-white border border-black/5 flex flex-col sm:flex-row items-center gap-4">
          <History size={22} className="text-serene-green shrink-0" />
          <p className="flex-1 text-[15px] text-intel-dark/75 text-center sm:text-left">
            {user
              ? <>Signed in as <strong className="text-intel-dark">{user.name}</strong>. Every result you complete is saved to your account.</>
              : <>Sign in to keep every result in one place and retake tests anytime. Free screenings also work without an account.</>}
          </p>
          <button
            onClick={() => navigate(user ? '/my-results' : '/login?next=/assessments')}
            className="shrink-0 inline-flex items-center gap-2 h-10 px-5 rounded-full bg-intel-dark text-white text-sm font-semibold hover:bg-black transition-colors"
          >
            {user ? 'View my results' : 'Sign in'} <ArrowRight size={14} />
          </button>
        </div>

        {/* Premium assessments */}
        <section className="mb-16 md:mb-20" aria-labelledby="premium-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6 pb-4 border-b border-black/10">
            <h2 id="premium-heading" className="serif text-2xl md:text-3xl text-intel-dark">In-depth assessments</h2>
            <span className="text-sm text-intel-dark/55">One-time payment, PDF report included</span>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {premium.map((t, idx) => (
              <FadeIn key={t.path} delay={idx * 80} className="h-full">
                <button
                  onClick={() => navigate(t.path)}
                  className="group h-full w-full text-left flex flex-col rounded-3xl bg-intel-dark p-7 md:p-9 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(26,26,26,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
                >
                  <span className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-500 ease-bounce group-hover:-rotate-12 group-hover:scale-110 ${t.tile}`} aria-hidden="true">{t.icon}</span>
                  <span className="mt-6 text-sm text-white/55">{t.tag}</span>
                  <h3 className="serif text-2xl md:text-[1.75rem] text-white mt-1">{t.title}</h3>
                  <p className="mt-3 text-[15px] text-white/70 leading-relaxed flex-1">{t.desc}</p>
                  <span className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta">
                    {t.cta} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* Free screenings */}
        <section aria-labelledby="free-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6 pb-4 border-b border-black/10">
            <h2 id="free-heading" className="serif text-2xl md:text-3xl text-intel-dark">Free screenings</h2>
            <span className="text-sm text-intel-dark/55">Free, no sign-in needed</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {freeTests.map((test, idx) => (
              <FadeIn key={test.id} delay={idx * 60} className="h-full">
                <button
                  onClick={() => onSelectTest(test.id)}
                  className={`group relative overflow-hidden h-full w-full text-left flex flex-col rounded-[32px] border border-black/5 p-7 transition-all duration-500 ease-bounce hover:-translate-y-1.5 hover:-rotate-[0.6deg] hover:shadow-[0_14px_34px_rgba(26,26,26,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-serene-green ${test.tint}`}
                >
                  <span className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/50 transition-transform duration-700 group-hover:scale-125" aria-hidden="true" />
                  <span className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-500 ease-bounce group-hover:-rotate-12 group-hover:scale-110 text-white ${test.color}`} aria-hidden="true">{test.icon}</span>
                  <span className="relative mt-5 inline-flex self-start items-center rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-intel-dark/70">{test.shortTitle} · about 5 min</span>
                  <h3 className="serif relative text-xl text-intel-dark mt-3">{test.title}</h3>
                  <p className="relative mt-2 text-[15px] text-intel-dark/70 leading-relaxed flex-1">{test.desc}</p>
                  <span className="relative mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-serene-green">
                    Start free check <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              </FadeIn>
            ))}
          </div>
        </section>

        <section className="mt-16 md:mt-20 rounded-[28px] bg-serene-green text-white p-8 md:p-12 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
          <div className="flex-1">
            <h2 className="serif text-2xl md:text-3xl">Want to talk to someone?</h2>
            <p className="mt-3 text-white/75 leading-relaxed max-w-xl">
              Self-assessments are a good first step. A session with a counsellor gives you the depth and support you deserve.
            </p>
          </div>
          <button
            onClick={() => navigate('/services/personal')}
            className="shrink-0 h-12 px-6 rounded-full bg-terracotta text-intel-dark font-semibold hover:bg-[#cfac80] transition-colors"
          >
            Book a session
          </button>
        </section>
      </div>
    </div>
  );
};

export default TestOptions;
