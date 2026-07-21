import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Brain, BookOpen, Heart, Wifi, User,
  Users, CheckCircle, Clock, TrendingUp, Filter
} from 'lucide-react';
import { Card, Button, Spinner, EmptyState, Badge } from '../../components/ui';
import DonutChart from '../../components/charts/DonutChart';
import BarChart from '../../components/charts/BarChart';
import RadarChart from '../../components/charts/RadarChart';
import api from '../../lib/axios';
import useAuthStore from '../../store/authStore';

// ── Constants ─────────────────────────────────────────────────
const TOOL_META = {
  LearningPattern: {
    label: 'Intel Learning Pattern Tool™',
    icon: Brain,
    color: 'from-indigo-500 to-indigo-700',
    iconBg: 'bg-indigo-100 text-indigo-700',
    desc: 'Visual, Auditory, Kinesthetic & Multi-Modal distribution',
  },
  StudyBehaviour: {
    label: 'Intel Study Behaviour Scale™',
    icon: BookOpen,
    color: 'from-emerald-500 to-emerald-700',
    iconBg: 'bg-emerald-100 text-emerald-700',
    desc: 'Study habits, time management & academic discipline',
  },
  EmotionalWellness: {
    label: 'Intel Emotional Wellness Checklist™',
    icon: Heart,
    color: 'from-rose-500 to-rose-700',
    iconBg: 'bg-rose-100 text-rose-700',
    desc: 'Group-level emotional health distribution (privacy protected)',
    sensitive: true,
  },
  InternetUsage: {
    label: 'Intel Internet Usage Awareness™',
    icon: Wifi,
    color: 'from-amber-500 to-amber-700',
    iconBg: 'bg-amber-100 text-amber-700',
    desc: 'Digital balance and screen time habits',
  },
  PersonalityDimensions: {
    label: 'Intel Personality Dimensions™',
    icon: User,
    color: 'from-purple-500 to-purple-700',
    iconBg: 'bg-purple-100 text-purple-700',
    desc: 'Character strengths across 5 core dimensions',
  },
};

const DONUT_COLORS = {
  LearningPattern:    ['#4F46E5', '#0EA5E9', '#16A34A', '#C19B6C'],
  StudyBehaviour:     ['#DC2626', '#EA580C', '#16A34A'],
  EmotionalWellness:  ['#DC2626', '#EA580C', '#16A34A'],
  InternetUsage:      ['#16A34A', '#EA580C', '#DC2626'],
  PersonalityDimensions: ['#CA8A04', '#0EA5E9', '#16A34A'],
};

const COUNSELLING_NEEDS = [
  { key: 'academicSupport',    label: 'Academic Support',    icon: '📚', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  { key: 'emotionalSupport',   label: 'Emotional Support',   icon: '💙', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  { key: 'digitalBalance',     label: 'Digital Balance',     icon: '📱', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { key: 'confidenceBuilding', label: 'Confidence Building', icon: '🌟', color: 'text-purple-700 bg-purple-50 border-purple-200' },
];

// ── Completion Ring ───────────────────────────────────────────
function CompletionRing({ completed, total }) {
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="55" cy="55" r={r} fill="none"
          stroke="url(#ring-grad)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 55 55)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1C3F39" />
            <stop offset="100%" stopColor="#C19B6C" />
          </linearGradient>
        </defs>
        <text x="55" y="50" textAnchor="middle" fontSize="20" fontWeight="800" fill="#1A1A1A">{pct}%</text>
        <text x="55" y="66" textAnchor="middle" fontSize="10" fill="#64748b">Completed</text>
      </svg>
      <p className="text-sm text-surface-600 mt-2">
        <span className="font-semibold text-surface-900">{completed}</span> of{' '}
        <span className="font-semibold text-surface-900">{total}</span> students
      </p>
    </div>
  );
}

// ── Analytics Card ────────────────────────────────────────────
function AnalyticsCard({ category, data }) {
  const meta = TOOL_META[category] || {};
  const Icon = meta.icon || Brain;
  const dist = data?.distribution || [];
  const subScores = data?.subScores;

  return (
    <Card className="space-y-4">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-surface-900 text-sm leading-tight">{meta.label}</p>
          <p className="text-xs text-surface-500 mt-0.5">{meta.desc}</p>
        </div>
        <span className="text-xs text-surface-400 flex-shrink-0">{data?.total || 0} responses</span>
      </div>

      {meta.sensitive && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
          🔒 Individual data is privacy-protected. Group distribution shown only.
        </div>
      )}

      {dist.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 items-center">
          <DonutChart
            data={dist}
            height={180}
            colors={DONUT_COLORS[category]}
            showLegend={false}
          />
          <div className="space-y-2">
            {dist.map((band, i) => (
              <div key={band.label} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: (DONUT_COLORS[category] || ['#1C3F39'])[i % 4] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-surface-800 truncate">{band.label}</p>
                </div>
                <span className="text-xs font-semibold text-surface-900">{band.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-surface-400 text-sm">No responses yet</div>
      )}

      {/* Sub-score radar for learning pattern / personality */}
      {subScores && category === 'PersonalityDimensions' && (
        <div>
          <p className="text-xs font-semibold text-surface-600 mb-2">School Average by Dimension</p>
          <RadarChart data={subScores} maxScore={16} height={220} />
        </div>
      )}
      {subScores && category === 'LearningPattern' && (
        <div>
          <p className="text-xs font-semibold text-surface-600 mb-2">Learning Style Distribution</p>
          <BarChart
            data={Object.entries(subScores).map(([label, count]) => ({ label, count }))}
            horizontal
            height={160}
            colors={DONUT_COLORS.LearningPattern}
          />
        </div>
      )}
    </Card>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function SchoolDashboard() {
  const { id: schoolId } = useParams();
  const [selectedClass, setSelectedClass] = useState('');
  const user = useAuthStore(s => s.user);
  const isSchoolAdmin = user?.role === 'SCHOOL_ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['school-analytics', schoolId, selectedClass],
    queryFn: () => api.get(`/admin/schools/${schoolId}/analytics${selectedClass ? `?classId=${selectedClass}` : ''}`).then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  const { school, completion, classes = [], analytics = {}, counsellingNeeds = {} } = data || {};

  return (
    <div className="space-y-8 animate-slide-up max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        {!isSchoolAdmin && (
          <Link to="/admin/schools" className="p-2 hover:bg-surface-200 rounded-xl text-surface-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
              Package 1 — School Insight
            </span>
          </div>
          <h2 className="text-2xl font-bold text-surface-900">{school?.name} — Analytics Dashboard</h2>
          <p className="text-surface-500 text-sm mt-0.5">Intel Student Success System™ — Group-level assessment insights</p>
        </div>
        <Link to={`/admin/schools/${schoolId}/classes`}>
          <Button variant="outline" size="sm" icon={<Users className="w-4 h-4" />}>Manage Classes</Button>
        </Link>
      </div>

      {/* Class Filter */}
      {classes.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-surface-400" />
          <span className="text-sm text-surface-600">Filter by class:</span>
          <button
            onClick={() => setSelectedClass('')}
            className={`text-sm px-3 py-1.5 rounded-xl border transition-all ${
              !selectedClass ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-surface-700 border-surface-200 hover:border-primary-300'
            }`}
          >
            All Classes
          </button>
          {classes.map(cls => (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls.id)}
              className={`text-sm px-3 py-1.5 rounded-xl border transition-all ${
                selectedClass === cls.id ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-surface-700 border-surface-200 hover:border-primary-300'
              }`}
            >
              {cls.name} ({cls._count?.students || 0})
            </button>
          ))}
        </div>
      )}

      {/* Completion Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <Card className="sm:col-span-1 flex flex-col items-center justify-center py-6">
          <CompletionRing completed={completion?.completed || 0} total={completion?.total || 0} />
          <p className="text-xs text-surface-500 text-center mt-3">Assessment Completion Rate</p>
        </Card>

        <div className="sm:col-span-3 grid grid-cols-3 gap-4">
          {[
            { label: 'Total Students', value: completion?.total, icon: Users, color: 'bg-primary-600' },
            { label: 'Assessments Completed', value: completion?.completed, icon: CheckCircle, color: 'bg-green-600' },
            { label: 'Pending', value: completion?.pending, icon: Clock, color: 'bg-amber-500' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-surface-500 mb-1">{s.label}</p>
                  <p className="text-3xl font-bold text-surface-900">{s.value ?? '—'}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Counselling Planning Banner */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white" padding={false}>
        <div className="px-6 pt-5 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg">Counselling Planning Overview</h3>
          </div>
          <p className="text-slate-400 text-sm">Students who may benefit from additional support based on their assessment results.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y sm:divide-y-0 divide-white/10">
          {COUNSELLING_NEEDS.map(n => (
            <div key={n.key} className="px-6 py-5 text-center">
              <p className="text-3xl mb-1">{n.icon}</p>
              <p className="text-3xl font-bold text-white">{counsellingNeeds[n.key] ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">{n.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Assessment Analytics Grid */}
      <div>
        <h3 className="text-lg font-bold text-surface-900 mb-4">Assessment Results by Tool</h3>
        {Object.keys(analytics).length === 0 ? (
          <EmptyState
            icon="📊"
            title="No assessment data yet"
            description="Once students complete their assessments, analytics will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {Object.entries(analytics).map(([category, data]) => (
              <AnalyticsCard key={category} category={category} data={data} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
