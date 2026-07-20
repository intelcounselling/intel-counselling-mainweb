
import React, { useEffect } from 'react';
import { ArrowLeft, CheckCircle, User, GraduationCap, Briefcase, Calendar, ShieldCheck, Heart, Brain, Zap, Monitor, Users, Sparkles, Sprout } from 'lucide-react';
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
    <div className="relative min-h-screen bg-transparent pt-16 md:pt-24 pb-12 md:pb-24 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            background: '#0E0E0E',
            border: '1px solid rgba(232,224,204,0.12)',
            borderRadius: '9999px',
            padding: '8px 20px 8px 10px',
            marginBottom: '2.5rem',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '10px',
            letterSpacing: '0.30em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'border-color 0.25s ease, background 0.25s ease',
          }}
          onMouseEnter={e => {
            const arrow = e.currentTarget.querySelector('.btn-arrow') as HTMLElement;
            if (arrow) arrow.style.transform = 'translateX(-3px)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(184,168,122,0.35)';
            (e.currentTarget as HTMLButtonElement).style.background = '#141414';
          }}
          onMouseLeave={e => {
            const arrow = e.currentTarget.querySelector('.btn-arrow') as HTMLElement;
            if (arrow) arrow.style.transform = 'translateX(0)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(232,224,204,0.12)';
            (e.currentTarget as HTMLButtonElement).style.background = '#0E0E0E';
          }}
        >
          <span className="btn-arrow" style={{ color: '#B8A87A', transition: 'transform 0.25s ease', display: 'flex' }}>
            <ArrowLeft size={14} />
          </span>
          Back to Overview
        </button>

        <div className={`relative rounded-[40px] md:rounded-[60px] overflow-hidden mb-10 md:mb-16 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] ${content.isCompact ? 'h-[250px] md:h-[350px]' : 'h-[450px] md:h-[600px]'} transition-all duration-700 group/hero`}>
          <img
            src={content.hero}
            alt={content.title}
            className="w-full h-full object-cover opacity-90 transition-transform duration-[2000ms] group-hover/hero:scale-105"
          />
          {/* Lighter gradient overlay for dark text legibility */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
            <div className="bg-[#080808]/90 backdrop-blur-md inline-flex items-center gap-4 md:gap-6 p-4 md:p-7 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-[rgba(232,224,204,0.12)] w-fit transition-all duration-500 hover:border-[rgba(184,168,122,0.35)] hover:bg-[#0E0E0E]/90 group">
              <div className="w-12 h-12 md:w-20 md:h-20 bg-[#071F15] rounded-2xl md:rounded-[2.5rem] flex items-center justify-center text-[#B8A87A] shadow-lg shrink-0 border border-[rgba(232,224,204,0.12)] group-hover:border-[rgba(184,168,122,0.35)] transition-colors duration-500">
                {content.icon}
              </div>
              <div className="pr-4 md:pr-8">
                <span className="text-[rgba(232,224,204,0.35)] font-['Courier_New',monospace] uppercase tracking-[0.20em] text-[8px] md:text-[10px] mb-2 block leading-none">{content.tagline}</span>
                <h1 className="text-2xl md:text-5xl font-light text-[#E8E0CC] serif leading-tight tracking-[-0.02em]">{content.title}</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 md:gap-20 items-start">
          <div className="lg:col-span-8">
            <div className="mb-12">
              <h2 className="text-2xl md:text-4xl font-black text-intel-dark serif mb-6">Our Approach to Healing</h2>
              <p className="text-intel-dark/70 text-lg md:text-xl leading-relaxed font-light">
                {content.intro}
              </p>
            </div>

            {content.specializations.length > 0 && (
              <div className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                  <Sparkles size={20} className="text-serene-green" />
                  <h3 className="text-xl md:text-2xl font-black text-intel-dark serif uppercase tracking-tight">Areas of Specialization</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {content.specializations.map((spec, i) => (
                    <div key={i} className="bg-[#1F1E1B] p-8 rounded-[40px] border border-white/10 shadow-2xl hover:border-serene-green/30 transition-all group">
                      <div className="w-12 h-12 bg-[#F5E9D1] /10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
                        <div style={{ color: 'white' }}>
                          {spec.icon}
                        </div>
                      </div>
                      <h4 className="text-lg md:text-xl font-black text-white serif mb-4">{spec.category}</h4>
                      <ul className="space-y-3">
                        {spec.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-white/60 font-medium leading-relaxed">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-serene-green/40 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-8 bg-serene-green rounded-[40px] border border-white/10 flex flex-col gap-4 transition-transform hover:scale-[1.02] shadow-xl group">
                <ShieldCheck className="text-white" size={28} />
                <h4 className="font-bold text-white">Safe & Secure</h4>
                <p className="text-sm text-white/60 font-medium leading-relaxed">Fully confidential and encrypted sessions for your absolute peace of mind.</p>
              </div>
              <div className="p-8 bg-serene-green rounded-[40px] border border-white/10 flex flex-col gap-4 transition-transform hover:scale-[1.02] shadow-xl group">
                <Heart className="text-white" size={28} />
                <h4 className="font-bold text-white">Radical Empathy</h4>
                <p className="text-sm text-white/60 font-medium leading-relaxed">We listen with care and without judgment, fostering a truly supportive environment.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 sticky top-32">
            <div className="bg-intel-dark rounded-[40px] md:rounded-[50px] p-8 md:p-12 shadow-2xl relative overflow-hidden group/card">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-16 -mt-16 group-hover/card:scale-150 transition-transform duration-1000 opacity-50"></div>

              <h3 className="font-black text-white uppercase tracking-[0.3em] text-[10px] mb-8 opacity-60">Package Benefits</h3>
              <ul className="space-y-5 mb-10">
                {content.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-4 text-white/80">
                    <div className="shrink-0 w-5 h-5 rounded-full bg-serene-green flex items-center justify-center text-white mt-0.5 shadow-sm">
                      <CheckCircle size={12} />
                    </div>
                    <span className="font-medium text-xs md:text-sm leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-8 border-t border-white/10 flex flex-col gap-6">
                {view === 'student' ? (
                  <>
                    <p className="text-white/80 text-sm font-medium leading-relaxed text-center">
                      For student package directly contact <a href="mailto:intelcounselling@gmail.com" className="text-serene-green hover:underline">intelcounselling@gmail.com</a>
                    </p>
                    <button
                      onClick={() => window.open('https://intel-counselling-frontend.vercel.app/login', '_blank')}
                      className="w-full bg-serene-green text-[#FFFFFF] font-black py-4 md:py-5 rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-[0.98] shadow-xl text-sm md:text-base !text-white"
                    >
                      <span className="!text-white">Login to Portal</span> <User size={18} className="text-white" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onBook}
                    className="w-full bg-serene-green text-[#FFFFFF] font-black py-4 md:py-5 rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-[0.98] shadow-xl text-sm md:text-base !text-white"
                  >
                    <span className="!text-white">Book Session</span> <Calendar size={18} className="text-white" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
