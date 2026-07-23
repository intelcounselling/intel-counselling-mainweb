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
  LearningPattern:       { icon: '🧠', label: 'Learning Pattern',       color: 'from-indigo-400 to-indigo-600' },
  StudyBehaviour:        { icon: '📚', label: 'Study Behaviour',        color: 'from-emerald-400 to-emerald-600' },
  EmotionalWellness:     { icon: '💙', label: 'Emotional Wellness',     color: 'from-rose-400 to-rose-600' },
  InternetUsage:         { icon: '📱', label: 'Internet Usage',         color: 'from-amber-400 to-amber-600' },
  PersonalityDimensions: { icon: '✨', label: 'Personality Dimensions', color: 'from-purple-400 to-purple-600' },
};

const TEST_ICONS = {
  LearningPattern:       '🧠',
  StudyBehaviour:        '📚',
  EmotionalWellness:     '💙',
  InternetUsage:         '📱',
  PersonalityDimensions: '✨',
  // Legacy
  Depression: '😔',
  Anxiety: '😰',
  Stress: '😤',
};

const TEST_COLORS = {
  Depression: 'from-indigo-500 to-purple-600',
  Anxiety:    'from-amber-500 to-orange-600',
  Stress:     'from-rose-500 to-pink-600',
  LearningPattern: 'from-blue-500 to-indigo-600',
  StudyBehaviour: 'from-emerald-500 to-teal-600',
  EmotionalWellness: 'from-sky-400 to-blue-500',
  InternetUsage: 'from-violet-500 to-fuchsia-600',
  PersonalityDimensions: 'from-fuchsia-500 to-pink-600'
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
    <div className="animate-slide-up w-full max-w-[1400px] mx-auto pb-24 space-y-16">
      
      {/* 1. Full-Height Welcome Hero */}
      <section className="relative w-full min-h-[75vh] rounded-[3rem] p-8 md:p-16 shadow-2xl flex flex-col justify-center items-center text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #312e81 100%)' }}>
        
        {/* Animated Background Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000" />
        
        <div className="relative z-10 flex flex-col items-center max-w-3xl">
          <Badge className="bg-white/10 text-indigo-200 border-white/20 backdrop-blur-sm mb-6 px-4 py-1.5 text-sm uppercase tracking-widest">
            Welcome to MindBridge
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            Hi, {user?.firstName}
          </h1>
          <p className="text-xl md:text-2xl text-indigo-100/90 font-medium mb-12 max-w-2xl leading-relaxed">
            Ready to explore your mind? Complete your assessments to unlock personalized insights about your learning and wellness.
          </p>

          <button 
            onClick={scrollToAssessments}
            className="group relative inline-flex items-center justify-center gap-3 bg-white text-indigo-900 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300 active:scale-95"
          >
            Explore Assessments 
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center group-hover:translate-y-1 transition-transform">
              <ArrowDown className="w-5 h-5 text-indigo-700" />
            </div>
          </button>
        </div>

        {/* ISSS Journey Floating Tracker */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
              <p className="text-base font-semibold text-white">
                {isssComplete ? '🎉 All 5 core assessments complete!' : 'Your ISSS Journey Progress'}
              </p>
              <span className="text-sm font-bold bg-white/20 px-4 py-1.5 rounded-full text-white backdrop-blur-sm shadow-inner">
                {completionPct}%
              </span>
            </div>
            <div className="h-3 rounded-full bg-black/20 overflow-hidden shadow-inner">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 transition-all duration-1000 ease-out relative"
                style={{ width: `${completionPct}%` }}>
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Primary Assessment Grid */}
      <section id="assessments-grid" className="pt-8 scroll-mt-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-surface-900 tracking-tight mb-4">Available Assessments</h2>
          <p className="text-lg text-surface-500 max-w-2xl mx-auto">
            Choose an assessment below. These are confidential, clinically validated tools designed to help you understand yourself better.
          </p>
        </div>

        {!tests.length ? (
          <Card className="flex flex-col items-center justify-center p-16 text-center border-dashed border-2 border-surface-200 bg-surface-50 max-w-3xl mx-auto rounded-[2rem]">
            <div className="text-6xl mb-6 opacity-80">📋</div>
            <h3 className="text-2xl font-bold text-surface-800 mb-2">No tests available right now</h3>
            <p className="text-surface-500">Check back later for new assessments.</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {tests.map(test => (
              <Link key={test.id} to={`/student/tests/${test.id}`} className="group block h-full">
                <div className="relative rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-2 bg-white h-full flex flex-col border border-surface-100">
                  
                  {/* Header Section */}
                  <div className={`relative p-8 bg-gradient-to-br ${TEST_COLORS[test.category] || 'from-primary-600 to-accent-600'} overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full mix-blend-overlay filter blur-xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-5xl mb-5 shadow-inner border border-white/30 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                        {TEST_ICONS[test.category] || '🧠'}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-1 leading-tight">{test.name}</h3>
                    </div>
                  </div>

                  {/* Body Section */}
                  <div className="p-6 flex-1 flex flex-col bg-white">
                    <p className="text-surface-600 leading-relaxed mb-6 flex-1 line-clamp-3">{test.description}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-surface-100 mt-auto">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-surface-500 bg-surface-50 px-3 py-1.5 rounded-xl border border-surface-200">
                        <Clock className="w-4 h-4" />
                        <span>~{test.estimatedMinutes}m</span>
                      </div>
                      <span className="text-primary-600 font-bold flex items-center gap-1.5 group-hover:gap-2.5 transition-all bg-primary-50 px-4 py-1.5 rounded-xl group-hover:bg-primary-100">
                        Start <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <hr className="border-surface-200 my-16" />

      {/* 3. Secondary Info: Insights, Concerns, Appointments, Results */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Insights & Concerns */}
        <div className="md:col-span-8 space-y-8">
          {/* Insights Strip */}
          {latestByCategory.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-surface-900 tracking-tight mb-6">Your Insights</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {latestByCategory.map(result => (
                  <Card key={result.id} hover className="flex flex-col gap-4 bg-white shadow-md border-surface-100 rounded-[1.5rem]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center text-2xl border border-surface-200">
                        {TEST_ICONS[result.test?.category] || '🧠'}
                      </div>
                      <div>
                        <p className="font-bold text-surface-900">{result.test?.category}</p>
                      </div>
                    </div>
                    <p className="text-sm text-surface-600 leading-relaxed bg-surface-50 p-4 rounded-xl flex-1 border border-surface-100">
                      {generateInsight(result)}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Concern Card */}
          <div className="bg-gradient-to-br from-rose-500 to-orange-500 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
              <MessageCircle className="w-24 h-24" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 text-center md:text-left">
                <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm mb-4 shadow-sm mx-auto md:mx-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Something on your mind?</h3>
                <p className="text-rose-100 text-sm max-w-md mx-auto md:mx-0">
                  Write it here — it goes directly to your school's mental health team.
                </p>
              </div>
              <div className="w-full md:w-auto">
                <Link to="/student/concerns">
                  <button className="w-full bg-white text-rose-600 px-8 py-4 rounded-xl font-bold hover:bg-rose-50 transition-colors shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2">
                    Write a Concern <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Appointments & Recent Results */}
        <div className="md:col-span-4 space-y-8 flex flex-col">
          
          {/* Upcoming Appointments */}
          <div className="flex flex-col flex-1">
            <h3 className="text-2xl font-bold text-surface-900 tracking-tight mb-6">Appointments</h3>
            {!upcomingAppointments.length ? (
               <Card className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-surface-50 border border-dashed border-surface-200 rounded-[1.5rem]">
                 <Calendar className="w-10 h-10 text-surface-300 mb-3" />
                 <p className="font-semibold text-surface-700">No appointments</p>
               </Card>
            ) : (
              <div className="space-y-4 flex-1">
                {upcomingAppointments.map(appt => (
                  <Card key={appt.id} className="border-l-[6px] border-l-primary-500 shadow-md rounded-[1.25rem]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img src={appt.psychiatrist?.avatarUrl || `https://ui-avatars.com/api/?name=${appt.psychiatrist?.firstName}+${appt.psychiatrist?.lastName}&background=random`} className="w-10 h-10 rounded-full" alt="Counsellor" />
                        <div>
                          <p className="font-bold text-surface-900 text-sm">Dr. {appt.psychiatrist?.lastName}</p>
                          <div className="flex items-center gap-1.5 text-xs text-surface-500 font-medium mt-0.5">
                            <Clock className="w-3 h-3 text-primary-500" />
                            <span>{new Date(appt.slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                      {appt.meetingLink ? (
                        <a href={appt.meetingLink} target="_blank" rel="noopener noreferrer">
                          <Button variant="primary" size="sm" className="rounded-lg shadow-md font-bold">Join</Button>
                        </a>
                      ) : (
                        <Badge variant="outline" className="bg-surface-50 text-surface-500">In Person</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Recent Results */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-surface-900 tracking-tight">Recent Activity</h3>
            </div>
            {!recentResults.length ? (
               <Card className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-surface-50 border border-dashed border-surface-200 rounded-[1.5rem]">
                  <p className="font-semibold text-surface-700">No recent activity</p>
               </Card>
            ) : (
              <Card padding={false} className="rounded-[1.5rem] shadow-md border border-surface-100 overflow-hidden">
                <div className="divide-y divide-surface-50">
                  {recentResults.slice(0, 3).map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-4 hover:bg-surface-50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center text-lg">
                        {TEST_ICONS[r.test?.category] || '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-surface-900 text-sm truncate">{r.test?.name}</p>
                        <p className="text-[10px] text-surface-400 font-medium mt-0.5 uppercase tracking-wider">{formatRelative(r.takenAt)}</p>
                      </div>
                      <Link to="/student/results">
                        <ArrowRight className="w-4 h-4 text-surface-300 hover:text-primary-600 transition-colors" />
                      </Link>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

        </div>
      </section>
      
    </div>
  );
}
