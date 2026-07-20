import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Brain, Activity, HeartPulse, Moon, ArrowRight, History, Loader2, Calendar, Smartphone } from 'lucide-react';
import SpotlightCard from './SpotlightCard';
import FadeIn from './FadeIn';

interface TestOptionsProps {
  onBack: () => void;
  onSelectTest: (type: string) => void;
}

const TestOptions: React.FC<TestOptionsProps> = ({ onBack, onSelectTest }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [pastResults, setPastResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });

    const checkUser = () => {
      try {
        const saved = localStorage.getItem('auth_user');
        const parsed = saved ? JSON.parse(saved) : null;
        setUser(parsed);
        if (parsed) {
          fetchResults(parsed.id);
        } else {
          setPastResults([]);
        }
      } catch (e) {
        setUser(null);
      }
    };
    checkUser();
  }, []);

  const fetchResults = async (userId: string) => {
    setLoadingResults(true);
    try {
      const res = await fetch(`/api/user-results?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.results) {
        setPastResults(data.results);
      }
    } catch (e) {
      console.error('Failed to fetch user results:', e);
    } finally {
      setLoadingResults(false);
    }
  };

  const freeTests = [
    {
      id: 'phq9',
      title: 'Depression Screening',
      shortTitle: 'PHQ-9',
      desc: 'A brief self-check to understand your emotional well-being and depressive symptoms.',
      icon: <HeartPulse size={28} />,
      color: 'bg-terracotta'
    },
    {
      id: 'gad7',
      title: 'Anxiety Screening',
      shortTitle: 'GAD-7',
      desc: 'Measure your feelings of anxiety, worry, and tension.',
      icon: <Activity size={28} />,
      color: 'bg-[#2D6A4F]'
    },
    {
      id: 'pss10',
      title: 'Stress Self-Check',
      shortTitle: 'PSS-10',
      desc: 'Understand how stressful you have found your life during the past month.',
      icon: <Brain size={28} />,
      color: 'bg-[#B08968]'
    },
    {
      id: 'sleep',
      title: 'Sleep Hygiene Check',
      shortTitle: 'InterSleek',
      desc: 'Reflect on your sleep habits and bedtime routines to improve rest quality.',
      icon: <Moon size={28} />,
      color: 'bg-[#4A4E69]'
    },
    {
      id: 'sas',
      title: 'Smartphone Addiction',
      shortTitle: 'SAS',
      desc: 'Assess your smartphone usage and digital habits to find a healthy balance.',
      icon: <Smartphone size={28} />,
      color: 'bg-[#4361EE]'
    }
  ];

  return (
    <div className="relative min-h-screen pt-24 pb-12 md:pt-32 md:pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={onBack}
          className="group flex items-center gap-3 text-white font-black transition-all mb-12 md:mb-16 uppercase tracking-[0.2em] text-xs bg-serene-green hover:bg-[#2D6A4F] px-5 py-3 rounded-full shadow-sm"
        >
          <div className="w-7 h-7 rounded-full bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition-all duration-300">
            <ArrowLeft size={14} />
          </div>
          Back to Home
        </button>

        <div className="text-center mb-16 md:mb-24">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-intel-dark border border-white/10 text-white text-[10px] font-bold uppercase tracking-[0.3em] mb-6 shadow-xl">
              <Sparkles size={14} className="animate-pulse" />
              Testing Tools & Screenings
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-intel-dark serif mb-8 leading-tight">
              Start your journey <br /> to <span className="italic text-serene-green">clarity.</span>
            </h1>
            <p className="text-intel-dark/60 max-w-2xl mx-auto text-base md:text-xl font-light leading-relaxed">
              Explore our validated diagnostic assessment and emotional screenings. Gain insights and take control of your path.
            </p>
          </FadeIn>
        </div>

        {/* User's Past Saved Results */}
        {user && (
          <FadeIn>
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8 border-b border-black/5 pb-4">
                <History size={24} className="text-terracotta" />
                <h2 className="text-xl md:text-3xl font-black serif text-intel-dark">Your Assessment Reports</h2>
              </div>
              
              {loadingResults ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="animate-spin text-terracotta" size={24} />
                  <span className="ml-2.5 text-sm font-semibold text-intel-dark/60">Retrieving your reports...</span>
                </div>
              ) : pastResults.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {pastResults.map((res: any, idx: number) => {
                    const dateObj = new Date(res.created_at);
                    const formattedDate = dateObj.toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                    const formattedTime = dateObj.toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div 
                        key={res.id}
                        onClick={() => navigate(`/assessments/career?id=${res.id}`)}
                        className="group cursor-pointer bg-white border border-black/5 p-6 rounded-3xl hover:border-terracotta/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                      >
                        <div>
                          <div className="w-10 h-10 bg-terracotta/10 text-terracotta rounded-2xl flex items-center justify-center mb-4">
                            <Sparkles size={18} />
                          </div>
                          <span className="text-[9px] font-black text-terracotta uppercase tracking-wider font-inter mb-1 block">
                            Attempt #{pastResults.length - idx}
                          </span>
                          <h4 className="font-bold text-sm text-intel-dark mb-1">
                            Career Guidance Assessment
                          </h4>
                          <p className="text-[10px] text-intel-dark/50 flex items-center gap-1">
                            <Calendar size={10} /> {formattedDate} at {formattedTime}
                          </p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between text-xs font-bold text-terracotta group-hover:translate-x-1 transition-transform">
                          <span>View Detailed Report</span>
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white/40 border border-black/5 p-8 rounded-3xl text-center">
                  <p className="text-sm text-intel-dark/60">You haven't completed any assessments yet. Start your premium or free tests below!</p>
                </div>
              )}
            </div>
          </FadeIn>
        )}


        {/* Free Assessments Section */}
        <div>
          <FadeIn>
            <div className="flex items-center gap-3 mb-10 border-b border-black/5 pb-4">
              <h2 className="text-2xl md:text-4xl font-black serif text-intel-dark">Free Screenings</h2>
              <span className="bg-serene-green text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Complimentary</span>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 md:gap-10 lg:gap-12">
              {freeTests.map((test, idx) => (
                <FadeIn key={test.id} delay={idx * 150}>
                  <div 
                    onClick={() => onSelectTest(test.id)}
                    className="group cursor-pointer h-full"
                  >
                    <SpotlightCard className="bg-[#1C1F22] border border-white/10 h-full p-8 md:p-12 rounded-[40px] md:rounded-[60px] shadow-2xl transition-all duration-700 hover:scale-[1.02] flex flex-col items-start text-left">
                      <div className={`w-14 h-14 md:w-20 md:h-20 ${test.color} text-white rounded-[2rem] flex items-center justify-center mb-8 shadow-xl transition-all duration-700 group-hover:rotate-12 group-hover:scale-110`}>
                        {test.icon}
                      </div>
                      
                      <div className="flex-grow">
                        <span className="text-[10px] md:text-xs font-black text-terracotta uppercase tracking-[0.3em] mb-3 block font-inter">
                          {test.shortTitle}
                        </span>
                        <h3 className="text-2xl md:text-4xl font-black text-white serif mb-4 group-hover:text-terracotta transition-colors">
                          {test.title}
                        </h3>
                        <p className="text-white/60 font-light leading-relaxed text-sm md:text-lg mb-10 group-hover:text-white/80 transition-colors">
                          {test.desc}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-white font-black text-xs md:text-sm uppercase tracking-widest mt-auto border-b-2 border-transparent group-hover:border-terracotta transition-all">
                        Start Free Check <ArrowRight size={16} />
                      </div>
                    </SpotlightCard>
                  </div>
                </FadeIn>
              ))}
            </div>
          </FadeIn>
        </div>

        <div className="mt-16 md:mt-24 p-8 md:p-16 bg-intel-dark rounded-[50px] md:rounded-[80px] text-white text-center relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-bl-[120px] -mr-32 -mt-32 opacity-40"></div>
           <div className="relative z-10">
             <h3 className="text-2xl md:text-4xl font-black serif mb-6">Need immediate support?</h3>
             <p className="text-white/60 text-sm md:text-lg font-light max-w-xl mx-auto mb-10 leading-relaxed">
               Self-assessments are a great first step, but speaking with a professional provides the depth you deserve.
             </p>
             <button 
               onClick={() => navigate('/services/personal')}
               className="bg-terracotta text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
             >
               Book a Professional Session
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TestOptions;
