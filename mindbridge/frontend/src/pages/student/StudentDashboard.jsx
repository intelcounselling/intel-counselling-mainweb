import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Clock } from 'lucide-react';
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
    <div className="space-y-8 animate-slide-up max-w-5xl">
      {/* Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl p-8"
        style={{ background: 'linear-gradient(135deg, #1C3F39 0%, #4F46E5 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10"
          style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(40%, -40%)' }} />
        <div className="relative z-10">
          <p className="text-primary-200 text-sm mb-1">Welcome back 👋</p>
          <h2 className="text-3xl font-bold text-white mb-2">{user?.firstName} {user?.lastName}</h2>
          <p className="text-primary-200">Grade {user?.grade || '—'} · Intel Student Success System™</p>
          {/* ISSS Progress */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white/80">{isssComplete ? '🎉 All 5 assessments complete!' : `${completedCategories.size} of 5 assessments done`}</p>
              <span className="text-sm font-bold text-white">{completionPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-white/80 to-white transition-all duration-700"
                style={{ width: `${completionPct}%` }} />
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {isssCategories.map(cat => (
                <span key={cat} className={`text-xs px-2 py-1 rounded-full border ${
                  completedCategories.has(cat)
                    ? 'bg-white/20 border-white/40 text-white'
                    : 'bg-white/5 border-white/20 text-white/50'
                }`}>
                  {ISSS_TOOLS[cat].icon} {ISSS_TOOLS[cat].label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Insights Strip (Replaces raw scores & severity) */}
      {latestByCategory.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-surface-900 mb-4">Your Insights</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestByCategory.map(result => (
              <Card key={result.id} className="flex flex-col gap-3 bg-white">
                <div className="flex items-center gap-3 border-b border-surface-100 pb-3">
                  <div className="text-2xl">{TEST_ICONS[result.test?.category] || '🧠'}</div>
                  <p className="font-semibold text-surface-900">{result.test?.category}</p>
                </div>
                <p className="text-sm text-surface-600 leading-relaxed">
                  {generateInsight(result)}
                </p>
                <div className="mt-auto pt-2">
                  <Link to="/student/results" className="text-xs text-primary-600 hover:underline font-medium">View detailed report →</Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-surface-900 mb-4">Upcoming Appointments</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingAppointments.map(appt => (
              <Card key={appt.id} className="border-l-4 border-l-primary-500">
                <div className="flex items-center gap-3 mb-3">
                  <img src={appt.psychiatrist?.avatarUrl || `https://ui-avatars.com/api/?name=${appt.psychiatrist?.firstName}+${appt.psychiatrist?.lastName}`} className="w-10 h-10 rounded-full" alt="Counsellor" />
                  <div>
                    <p className="text-sm font-semibold text-surface-900">Dr. {appt.psychiatrist?.lastName}</p>
                    <p className="text-xs text-surface-500">School Counsellor</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-surface-700 mb-4">
                  <Clock className="w-4 h-4 text-surface-400" />
                  <span>{formatDate(appt.slot)} at {new Date(appt.slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {appt.meetingLink ? (
                  <a href={appt.meetingLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="primary" size="sm" className="w-full">Join Meeting</Button>
                  </a>
                ) : (
                  <Button variant="outline" size="sm" className="w-full" disabled>In Person</Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick-Action Test Cards */}
      <div>
        <h3 className="text-lg font-semibold text-surface-900 mb-4">Available Assessments</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {tests.map(test => (
            <Link key={test.id} to={`/student/tests/${test.id}`}>
              <Card hover className="flex flex-col gap-3 h-full">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center text-2xl">
                  {TEST_ICONS[test.category] || '📋'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-surface-900">{test.name}</p>
                  <p className="text-sm text-surface-500 mt-1 line-clamp-2">{test.description}</p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-surface-100">
                  <div className="flex items-center gap-1 text-xs text-surface-400">
                    <Clock className="w-3 h-3" />
                    <span>~{test.estimatedMinutes} min</span>
                  </div>
                  <span className="text-primary-600 text-sm font-medium flex items-center gap-1">
                    Start <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <Card padding={false}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
            <h3 className="font-semibold text-surface-900">Recent Results</h3>
            <Link to="/student/results" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-surface-50">
            {recentResults.map(r => (
              <div key={r.id} className="flex items-center gap-4 px-6 py-4">
                <div className="text-2xl">{TEST_ICONS[r.test?.category] || '📋'}</div>
                <div className="flex-1">
                  <p className="font-medium text-surface-900 text-sm">{r.test?.name}</p>
                  <p className="text-xs text-surface-400">{formatRelative(r.takenAt)}</p>
                </div>
                <span className="font-medium text-surface-500 text-sm">Completed</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Concern Card */}
      <div className="bg-gradient-to-br from-surface-800 to-surface-900 rounded-3xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">💬 Something on your mind?</h3>
        <p className="text-surface-300 text-sm mb-4">
          Write it here — it goes directly to your school's mental health team. You're not alone.
        </p>
        <Link to="/student/concerns">
          <button className="bg-white text-surface-900 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-surface-100 transition-colors">
            Write a Concern
          </button>
        </Link>
        {concerns.length > 0 && (
          <p className="text-xs text-surface-400 mt-3">{concerns.length} concern{concerns.length > 1 ? 's' : ''} submitted</p>
        )}
      </div>
    </div>
  );
}
