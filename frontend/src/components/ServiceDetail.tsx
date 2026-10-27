import React, { useEffect } from 'react';
import { SCHOOL_PORTAL_URL } from '../utils/site';
import { ArrowLeft, CheckCircle, User, GraduationCap, Briefcase, Calendar, ShieldCheck, Heart, Brain, Zap, Monitor, Users, Sprout } from 'lucide-react';
import { LazyImage } from './ui/LazyImage';

export type ViewType = 'personal' | 'student' | 'hr';

interface Specialization {
  category: string;
  icon: React.ReactNode;
  items: string[];
}

interface ServiceDetailProps {
  view: ViewType;
  onBack: () => void;
  onBook: () => void;
}

const ServiceDetail: React.FC<ServiceDetailProps> = ({ view, onBack, onBook }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [view]);

  const content = {
    personal: {
      title: "Personal Therapy",
      tagline: "Individual Healing & Discovery",
      icon: <User size={40} />,
      hero: "/assets/imgs/personaltherapy_bg.png",
      isCompact: true,
      intro: "Our individual sessions are a sanctuary for your mind. We combine modern clinical techniques with deep compassion to help you unravel complex emotions and build a foundation of lasting peace.",
      specializations: [
        {
          category: "Emotional & Mental Health Support",
          icon: <Brain className="text-serene-green" size={24} />,
          items: ["Depression", "Anxiety", "Panic attacks", "Mood disturbances", "Emotional numbness", "Stress overload", "Suicidal ideation support", "Trauma support (mild to moderate)"]
        },
        {
          category: "Academic & Career Pressure",
          icon: <GraduationCap className="text-serene-green" size={24} />,
          items: ["Exam anxiety (NEET, IIT, Board exams)", "Academic burnout", "Concentration issues", "Dropout thoughts", "Motivation loss", "Career confusion"]
        },
        {
          category: "Addiction & Behavioural Patterns",
          icon: <Monitor className="text-serene-green" size={24} />,
          items: ["Mobile addiction", "Social media dependency", "Smoking", "Alcohol use", "Emotional dependency", "Habit control difficulties"]
        },
        {
          category: "Relationships & Family Life",
          icon: <Users className="text-serene-green" size={24} />,
          items: ["Marital conflicts", "Pre-marital counselling", "Communication issues", "Trust issues", "Emotional distance", "Family conflicts", "Parent–child relationship", "In-law relationship stress"]
        },
        {
          category: "Life Transitions & Adjustment",
          icon: <Sprout className="text-serene-green" size={24} />,
          items: ["Grief & loss", "Divorce adjustment", "Retirement adjustment", "Cultural adaptation (Indians abroad)", "Loneliness", "Midlife crisis", "Identity confusion"]
        }
      ],
      features: [
        "One-on-one confidential counseling",
        "Cognitive Behavioral Therapy (CBT)",
        "Trauma-informed recovery plans",
        "Anxiety & depression management",
        "Emotional resilience building"
      ]
    },
    student: {
      title: "Student Growth",
      tagline: "Navigating Academic Life",
      icon: <GraduationCap size={40} />,
      hero: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200",
      isCompact: false,
      intro: "Academic pressure shouldn't define your youth. Our specialized student packages provide the tools to manage exam anxiety, social transitions, and the unique stresses of educational environments.",
      specializations: [],
      features: [
        "Specialized student pricing",
        "Exam anxiety workshops",
        "Social transition support",
        "Time management & focus tools",
        "Class-friendly scheduling"
      ]
    },
    hr: {
      title: "Corporate Wellness",
      tagline: "Building Resilient Teams",
      icon: <Briefcase size={40} />,
      hero: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200",
      isCompact: false,
      intro: "A healthy workplace culture starts with mental health. We partner with HR leaders to implement systemic support, crisis management, and leadership training that prioritizes human well-being.",
      specializations: [],
      features: [
        "Employee Assistance Programs (EAP)",
        "Leadership mental health training",
        "Strategic stress audits",
        "Crisis intervention support",
        "Corporate workshops & seminars"
      ]
    }
  }[view as 'personal' | 'student' | 'hr'];

  if (!content) return null;

  return (
    <div className="relative min-h-screen pt-24 md:pt-28 pb-16 md:pb-24 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 mb-8 text-sm font-semibold text-intel-dark/70 hover:text-intel-dark transition-colors"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" /> Back to services
        </button>

        {/* Banner */}
        <div className={`relative rounded-[28px] overflow-hidden mb-12 md:mb-16 ${content.isCompact ? 'h-[220px] md:h-[300px]' : 'h-[280px] md:h-[380px]'}`}>
          <LazyImage src={content.hero} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/85 via-[#1A1A1A]/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 flex items-end gap-4">
            <span className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/10 backdrop-blur text-white items-center justify-center shrink-0" aria-hidden="true">
              {content.icon}
            </span>
            <div>
              <p className="text-sm text-white/75 mb-1">{content.tagline}</p>
              <h1 className="serif text-3xl md:text-5xl text-white leading-tight">{content.title}</h1>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-8">
            <h2 className="serif text-2xl md:text-3xl text-intel-dark mb-4">Our approach to healing</h2>
            <p className="text-intel-dark/75 text-base md:text-lg leading-relaxed mb-12">{content.intro}</p>

            {content.specializations.length > 0 && (
              <section className="mb-12" aria-labelledby="specialisations">
                <h3 id="specialisations" className="serif text-xl md:text-2xl text-intel-dark mb-6">Areas of specialisation</h3>
                <div className="grid md:grid-cols-2 gap-5">
                  {content.specializations.map((spec) => (
                    <article key={spec.category} className="bg-white rounded-3xl border border-black/5 p-7">
                      <span className="w-11 h-11 rounded-xl bg-serene-green/10 text-serene-green flex items-center justify-center mb-5" aria-hidden="true">
                        {spec.icon}
                      </span>
                      <h4 className="serif text-lg text-intel-dark mb-3">{spec.category}</h4>
                      <ul className="space-y-2">
                        {spec.items.map((item) => (
                          <li key={item} className="flex items-start gap-2.5 text-[15px] text-intel-dark/75 leading-relaxed">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-serene-green/50 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <div className="grid sm:grid-cols-2 gap-5">
              {[
                { icon: ShieldCheck, title: 'Safe and secure', text: 'Confidential sessions, with your records kept private and encrypted.' },
                { icon: Heart, title: 'Care without judgement', text: 'We listen carefully and without judgement, so you feel supported.' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-3xl bg-serene-green text-white p-7">
                  <Icon size={24} className="text-terracotta" />
                  <h4 className="font-semibold mt-4">{title}</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1.5">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="bg-intel-dark text-white rounded-[28px] p-7 md:p-8">
              <h3 className="font-semibold text-white/90 mb-5">What's included</h3>
              <ul className="space-y-3.5 mb-8">
                {content.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/80 leading-relaxed">
                    <CheckCircle size={18} className="text-terracotta shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>

              <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
                {view === 'student' ? (
                  <>
                    <p className="text-sm text-white/75 leading-relaxed">
                      For student packages, email us at{' '}
                      <a href="mailto:intelcounselling@gmail.com" className="text-terracotta underline underline-offset-2">intelcounselling@gmail.com</a>.
                    </p>
                    <button
                      onClick={() => window.open(SCHOOL_PORTAL_URL, '_blank', 'noopener')}
                      className="w-full h-12 rounded-full bg-terracotta text-intel-dark font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#cfac80] transition-colors"
                    >
                      <User size={18} /> Log in to the school portal
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onBook}
                    className="w-full h-12 rounded-full bg-terracotta text-intel-dark font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#cfac80] transition-colors"
                  >
                    <Calendar size={18} /> Book a session
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
