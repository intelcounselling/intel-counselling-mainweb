import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Clock, Sparkles, MessageCircle, Calendar } from 'lucide-react';
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

  return (
    <div className="animate-slide-up max-w-6xl mx-auto pb-12">
      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Welcome Card (Hero) - Spans 8 cols */}
        <div className="md:col-span-8 relative overflow-hidden rounded-[2rem] p-8 shadow-xl"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #312e81 100%)' }}>
          {/* Glassmorphic decorative elements */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="text-indigo-200 text-sm font-medium mb-1 tracking-wider uppercase">Welcome back</p>
              <h2 className="text-4xl font-extrabold text-white mb-2 tracking-tight">{user?.firstName} {user?.lastName}</h2>
              <p className="text-indigo-200/80 font-medium">Grade {user?.grade || '—'} · Intel Student Success System™</p>
            </div>
            
            {/* ISSS Progress (Glassmorphic Container) */}
            <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-inner">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">
                  {isssComplete ? '🎉 All 5 assessments complete!' : 'Your ISSS Journey'}
                </p>
                <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full text-white backdrop-blur-sm">
                  {completionPct}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-black/20 overflow-hidden shadow-inner">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 transition-all duration-1000 ease-out relative"
                  style={{ width: `${completionPct}%` }}>
                  <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                {isssCategories.map(cat => (
                  <div key={cat} className="group relative">
                    <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all duration-300 ${
                      completedCategories.has(cat)
                        ? 'bg-white/20 border-white/30 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                        : 'bg-black/10 border-white/10 text-white/40'
                    }`}>
                      <span className="text-sm">{ISSS_TOOLS[cat].icon}</span>
                      <span className="hidden sm:inline font-medium">{ISSS_TOOLS[cat].label}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Concern Card - Spans 4 cols */}
        <div className="md:col-span-4 bg-gradient-to-br from-rose-500 to-orange-500 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
            <MessageCircle className="w-24 h-24" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div>
              <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm mb-6 shadow-sm">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 leading-tight">Something on your mind?</h3>
              <p className="text-rose-100 text-sm mb-8 leading-relaxed">
                Write it here — it goes directly to your school's mental health team. You're never alone.
              </p>
            </div>
            <Link to="/student/concerns" className="mt-auto">
              <button className="w-full bg-white text-rose-600 px-6 py-3.5 rounded-xl font-bold hover:bg-rose-50 transition-colors shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2">
                Write a Concern <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            {concerns.length > 0 && (
              <p className="text-xs text-rose-200 mt-4 text-center font-medium">
                {concerns.length} concern{concerns.length > 1 ? 's' : ''} submitted
              </p>
            )}
          </div>
        </div>

        {/* Insights Strip (Replaces raw scores & severity) */}
        {latestByCategory.length > 0 && (
          <div className="md:col-span-12 mt-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-surface-900 tracking-tight">Your Insights</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestByCategory.map(result => (
                <Card key={result.id} hover className="flex flex-col gap-4 bg-white/70 backdrop-blur-md border border-white shadow-lg rounded-[1.5rem]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center text-2xl shadow-inner border border-white">
                      {TEST_ICONS[result.test?.category] || '🧠'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-0.5">Category</p>
                      <p className="font-bold text-surface-900">{result.test?.category}</p>
                    </div>
                  </div>
                  <p className="text-sm text-surface-600 leading-relaxed bg-surface-50 p-4 rounded-2xl flex-1 border border-surface-100">
                    {generateInsight(result)}
                  </p>
                  <div className="mt-2 flex justify-end">
                    <Link to="/student/results" className="text-sm text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1 group">
                      View report <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick-Action Test Cards */}
        <div className="md:col-span-12 mt-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-surface-900 tracking-tight">Available Assessments</h3>
            <Link to="/student/tests" className="text-primary-600 font-semibold hover:underline flex items-center gap-1 text-sm">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.slice(0, 3).map(test => (
              <Link key={test.id} to={`/student/tests/${test.id}`} className="block h-full group">
                <Card className="flex flex-col h-full bg-white border border-surface-200 shadow-md hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2 rounded-[1.5rem] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-accent-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                      {TEST_ICONS[test.category] || '📋'}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-bold text-surface-900 text-lg leading-tight">{test.name}</p>
                    </div>
                  </div>
                  <p className="text-sm text-surface-500 mb-6 line-clamp-2 leading-relaxed flex-1">{test.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-surface-100">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-surface-500 bg-surface-100 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5" />
                      <span>~{test.estimatedMinutes} min</span>
                    </div>
                    <span className="text-primary-600 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Start <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Row: Upcoming Appointments & Recent Results */}
        <div className="md:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          
          {/* Upcoming Appointments */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-surface-900 tracking-tight">Appointments</h3>
            </div>
            
            {!upcomingAppointments.length ? (
               <Card className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-surface-50/50 border border-dashed border-surface-200 rounded-[1.5rem]">
                 <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                   <Calendar className="w-8 h-8 text-surface-300" />
                 </div>
                 <p className="font-semibold text-surface-700">No upcoming appointments</p>
                 <p className="text-sm text-surface-400 mt-1">You're all caught up!</p>
               </Card>
            ) : (
              <div className="space-y-4 flex-1">
                {upcomingAppointments.map(appt => (
                  <Card key={appt.id} className="border-l-[6px] border-l-primary-500 shadow-md hover:shadow-lg transition-shadow rounded-[1.25rem]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img src={appt.psychiatrist?.avatarUrl || `https://ui-avatars.com/api/?name=${appt.psychiatrist?.firstName}+${appt.psychiatrist?.lastName}&background=random`} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt="Counsellor" />
                        <div>
                          <p className="font-bold text-surface-900">Dr. {appt.psychiatrist?.lastName}</p>
                          <div className="flex items-center gap-1.5 text-xs text-surface-500 font-medium mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-primary-500" />
                            <span>{formatDate(appt.slot)} · {new Date(appt.slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        {appt.meetingLink ? (
                          <a href={appt.meetingLink} target="_blank" rel="noopener noreferrer">
                            <Button variant="primary" size="sm" className="rounded-xl shadow-md hover:shadow-lg font-bold">Join</Button>
                          </a>
                        ) : (
                          <Badge variant="outline" className="bg-surface-50 text-surface-500 border-surface-200">In Person</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Recent Results */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-surface-900 tracking-tight">Recent Activity</h3>
              {recentResults.length > 0 && (
                <Link to="/student/results" className="text-sm text-primary-600 font-semibold hover:underline">View all</Link>
              )}
            </div>

            {!recentResults.length ? (
               <Card className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-surface-50/50 border border-dashed border-surface-200 rounded-[1.5rem]">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-3xl">
                   📋
                  </div>
                  <p className="font-semibold text-surface-700">No recent activity</p>
                  <p className="text-sm text-surface-400 mt-1">Take an assessment to see results here.</p>
               </Card>
            ) : (
              <Card padding={false} className="flex-1 rounded-[1.5rem] shadow-md border border-surface-100 overflow-hidden">
                <div className="divide-y divide-surface-50">
                  {recentResults.slice(0, 4).map(r => (
                    <div key={r.id} className="flex items-center gap-4 p-5 hover:bg-surface-50 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-xl shadow-inner border border-white">
                        {TEST_ICONS[r.test?.category] || '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-surface-900 text-sm truncate">{r.test?.name}</p>
                        <p className="text-xs text-surface-400 font-medium mt-0.5">{formatRelative(r.takenAt)}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200">Completed</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
