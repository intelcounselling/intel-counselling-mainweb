import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown, Clock, Sparkles, MessageCircle, Calendar } from 'lucide-react';
import { Card, Spinner, EmptyState, Badge, Button } from '../../components/ui';
import useAuthStore from '../../store/authStore';
import api from '../../lib/axios';
import { formatRelative, formatDate } from '../../utils/formatters';

// ISSS Tool display metadata
const ISSS_TOOLS = {
  LearningPattern: { icon: '🧠', label: 'Learning Pattern' },
  StudyBehaviour: { icon: '📚', label: 'Study Behaviour' },
  EmotionalWellness: { icon: '💙', label: 'Emotional Wellness' },
  InternetUsage: { icon: '📱', label: 'Internet Usage' },
  PersonalityDimensions: { icon: '✨', label: 'Personality Dimensions' },
};

const TEST_ICONS = {
  LearningPattern: '🧠',
  StudyBehaviour: '📚',
  EmotionalWellness: '💙',
  InternetUsage: '📱',
  PersonalityDimensions: '✨',
  // Legacy
  Depression: '😔',
  Anxiety: '😰',
  Stress: '😤',
};

export default function StudentDashboard() {
  const user = useAuthStore(s => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: () => api.get('/student/dashboard').then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  const { tests = [], recentResults = [], latestByCategory = [], concerns = [], upcomingAppointments = [] } = data || {};

  // Generate insights based on completed assessments
  const generateInsight = (result) => {
    const cat = result.test?.category;
    if (cat === 'LearningPattern') return 'Discover how to leverage your unique learning style for better retention.';
    if (cat === 'StudyBehaviour') return 'Try the Pomodoro technique to break down long study sessions into manageable chunks.';
    if (cat === 'EmotionalWellness') return 'Remember to take breaks. Your mental health is just as important as your grades.';
    if (cat === 'InternetUsage') return 'Setting digital boundaries can improve your sleep and focus.';
    if (cat === 'PersonalityDimensions') return 'Your unique personality traits are your strengths. Lean into what makes you, you!';
    return 'Great job completing this assessment. Every step helps us understand you better.';
  };

  // ISSS completion tracking
  const isssCategories = Object.keys(ISSS_TOOLS);
  const completedCategories = new Set(latestByCategory.map(r => r.test?.category).filter(c => isssCategories.includes(c)));
  const isssComplete = isssCategories.every(c => completedCategories.has(c));
  const completionPct = Math.round((completedCategories.size / isssCategories.length) * 100);

  const scrollToAssessments = () => {
    document.getElementById('assessments-grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="-m-6 p-6 md:p-10 min-h-[calc(100vh-64px)] bg-[#1c1a3b] text-white animate-fade-in overflow-x-hidden font-sans relative">
      <div className="w-full max-w-[1400px] mx-auto pb-24 space-y-24 relative z-10">
        
        {/* 1. Full-Height Welcome Hero */}
        <section className="relative w-full min-h-[60vh] flex flex-col justify-center items-center text-center">
          <div className="flex flex-col items-center max-w-3xl">
            <div className="bg-[#eff0ff] text-[#5551ff] text-[10px] font-bold px-3 py-1.5 rounded-full mb-8 uppercase tracking-widest shadow-sm">
              Welcome to MindBridge
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>
              Hi, {user?.firstName}
            </h1>
            <p className="text-xl md:text-2xl text-[#b3aaa0] mb-12 max-w-2xl leading-relaxed">
              Ready to explore your mind? Complete your assessments to unlock personalized insights about your learning and wellness.
            </p>

            <button 
              onClick={scrollToAssessments}
              className="group relative inline-flex items-center justify-center gap-3 bg-[#e5ddd0] text-[#786c5c] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#d9d0c2] transition-all duration-300 active:scale-95 shadow-md"
            >
              Explore Assessments 
              <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center group-hover:translate-y-1 transition-transform">
                <ArrowDown className="w-5 h-5 text-[#786c5c]" />
              </div>
            </button>
          </div>

          {/* ISSS Journey Tracker */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl">
            <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-[#f0eee9]">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                <p className="text-base font-bold text-[#111111]" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>
                  {isssComplete ? '🎉 All 5 core assessments complete!' : 'Your ISSS Journey Progress'}
                </p>
                <span className="text-sm font-bold bg-[#eff0ff] text-[#5551ff] px-4 py-1.5 rounded-full">
                  {completionPct}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#f2efeb] overflow-hidden">
                <div className="h-full rounded-full bg-[#8c8270] transition-all duration-1000 ease-out" style={{ width: `${completionPct}%` }} />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Primary Assessment Grid */}
        <section id="assessments-grid" className="scroll-mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>Available Assessments</h2>
            <div className="w-16 h-1 bg-[#8c8270] mx-auto rounded-full mb-6" />
            <p className="text-lg text-[#b3aaa0] max-w-2xl mx-auto">
              Choose an assessment below. These are confidential, clinically validated tools designed to help you understand yourself better.
            </p>
          </div>

          {!tests.length ? (
            <div className="flex flex-col items-center justify-center p-16 text-center border-dashed border-2 border-[#8c8270]/30 bg-white/5 max-w-3xl mx-auto rounded-[2rem]">
              <div className="text-5xl mb-6 opacity-50">📋</div>
              <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>No tests available right now</h3>
              <p className="text-[#b3aaa0]">Check back later for new assessments.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {tests.map(test => (
                <Link key={test.id} to={`/student/tests/${test.id}`} className="group block h-full">
                  <div className="relative rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-2 bg-white h-full flex flex-col border border-[#f0eee9]">
                    
                    {/* Header Section */}
                    <div className="p-8 pb-4 flex flex-col items-center text-center border-b border-[#f0eee9] bg-[#faf8f5]">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm border border-[#e4dcd0] group-hover:scale-110 transition-transform duration-300">
                        {TEST_ICONS[test.category] || '📋'}
                      </div>
                      <h3 className="text-xl font-bold text-[#111111] mb-1 leading-tight" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>
                        {test.name}
                      </h3>
                    </div>

                    {/* Body Section */}
                    <div className="p-6 flex-1 flex flex-col">
                      <p className="text-[#555555] leading-relaxed mb-6 flex-1 line-clamp-3 text-sm">{test.description}</p>
                      
                      <div className="flex items-center justify-between pt-4 mt-auto">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#8c8270] bg-[#f5f2eb] px-3 py-1.5 rounded-lg border border-[#e4dcd0]">
                          <Clock className="w-3 h-3" />
                          <span>~{test.estimatedMinutes}m</span>
                        </div>
                        <span className="text-[#111111] font-bold text-sm flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                          Start <ArrowRight className="w-4 h-4 text-[#8c8270]" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="w-full h-[1px] bg-white/10" />

        {/* 3. Secondary Info: Insights, Concerns, Appointments, Results */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column: Insights & Concerns */}
          <div className="md:col-span-8 space-y-12">
            {/* Insights Strip */}
            {latestByCategory.length > 0 && (
              <div>
                <h3 className="text-3xl font-bold text-white mb-6" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>Your Insights</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {latestByCategory.map(result => (
                    <div key={result.id} className="flex flex-col gap-4 bg-white shadow-xl border border-[#f0eee9] rounded-[2rem] p-6 hover:shadow-2xl transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#faf8f5] flex items-center justify-center text-2xl border border-[#e4dcd0]">
                          {TEST_ICONS[result.test?.category] || '📋'}
                        </div>
                        <div>
                          <p className="font-bold text-[#111111]">{result.test?.category}</p>
                        </div>
                      </div>
                      <p className="text-sm text-[#444444] leading-relaxed bg-[#fdfaf5] p-4 rounded-xl flex-1 border border-[#f2efeb]">
                        {generateInsight(result)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Concern Card */}
            <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border border-[#f0eee9]">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                <MessageCircle className="w-32 h-32 text-[#1c1a3b]" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 text-center md:text-left">
                  <div className="bg-[#eff0ff] w-14 h-14 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0 shadow-sm border border-[#d6d8ff]">
                    <Sparkles className="w-7 h-7 text-[#5551ff]" />
                  </div>
                  <h3 className="text-3xl font-bold mb-3 text-[#111111]" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>Something on your mind?</h3>
                  <p className="text-[#555555] text-base max-w-md mx-auto md:mx-0 leading-relaxed">
                    Write it here — it goes directly to your school's mental health team. Your privacy is strictly protected.
                  </p>
                </div>
                <div className="w-full md:w-auto">
                  <Link to="/student/concerns">
                    <button className="w-full bg-[#1c1a3b] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#2c2957] transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-3">
                      Write a Concern <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Appointments & Recent Results */}
          <div className="md:col-span-4 space-y-12 flex flex-col">
            
            {/* Upcoming Appointments */}
            <div className="flex flex-col flex-1">
              <h3 className="text-3xl font-bold text-white mb-6" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>Appointments</h3>
              {!upcomingAppointments.length ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/5 border border-dashed border-white/20 rounded-[2rem]">
                   <Calendar className="w-10 h-10 text-white/30 mb-3" />
                   <p className="font-semibold text-[#b3aaa0]">No appointments</p>
                 </div>
              ) : (
                <div className="space-y-4 flex-1">
                  {upcomingAppointments.map(appt => (
                    <div key={appt.id} className="bg-white border-l-[6px] border-l-[#8c8270] shadow-xl p-5 rounded-[1.5rem] flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img src={appt.psychiatrist?.avatarUrl || `https://ui-avatars.com/api/?name=${appt.psychiatrist?.firstName}+${appt.psychiatrist?.lastName}&background=random`} className="w-12 h-12 rounded-full border border-[#f0eee9]" alt="Counsellor" />
                        <div>
                          <p className="font-bold text-[#111111] text-sm">Dr. {appt.psychiatrist?.lastName}</p>
                          <div className="flex items-center gap-1.5 text-xs text-[#8c8270] font-bold mt-1 bg-[#f5f2eb] px-2 py-0.5 rounded-md inline-flex">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(appt.slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                      {appt.meetingLink ? (
                        <a href={appt.meetingLink} target="_blank" rel="noopener noreferrer">
                          <button className="bg-[#1c1a3b] text-white px-4 py-2 text-sm rounded-lg font-bold shadow-md hover:bg-[#2c2957] transition-colors">Join</button>
                        </a>
                      ) : (
                        <div className="bg-[#f0eee9] text-[#786c5c] px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest">In Person</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Results */}
            <div className="flex flex-col">
              <h3 className="text-3xl font-bold text-white mb-6" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>Activity</h3>
              {!recentResults.length ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/5 border border-dashed border-white/20 rounded-[2rem]">
                    <p className="font-semibold text-[#b3aaa0]">No recent activity</p>
                 </div>
              ) : (
                <div className="bg-white rounded-[2rem] shadow-xl border border-[#f0eee9] overflow-hidden">
                  <div className="divide-y divide-[#f0eee9]">
                    {recentResults.slice(0, 3).map(r => (
                      <div key={r.id} className="flex items-center gap-4 p-5 hover:bg-[#faf8f5] transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-[#fdfaf5] border border-[#e4dcd0] flex items-center justify-center text-lg">
                          {TEST_ICONS[r.test?.category] || '📋'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#111111] text-sm truncate">{r.test?.name}</p>
                          <p className="text-[10px] text-[#8c8270] font-bold mt-1 uppercase tracking-wider">{formatRelative(r.takenAt)}</p>
                        </div>
                        <Link to="/student/results" className="w-8 h-8 rounded-full bg-[#f5f2eb] flex items-center justify-center group hover:bg-[#e4dcd0] transition-colors">
                          <ArrowRight className="w-4 h-4 text-[#786c5c] group-hover:text-[#111111] transition-colors" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </section>
        
      </div>
    </div>
  );
}
