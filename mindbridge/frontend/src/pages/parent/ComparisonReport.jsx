import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarPlus } from 'lucide-react';
import { Card, Button, Spinner, EmptyState } from '../../components/ui';
import RadarChart from '../../components/charts/RadarChart';
import api from '../../lib/axios';
import { formatDate } from '../../utils/formatters';

// ── Category display info ──────────────────────────────────────
const CAT_META = {
  LearningPattern:       { label: 'Learning Pattern',       icon: '🧠', tip: 'How your child learns vs. how you perceive they learn.' },
  StudyBehaviour:        { label: 'Study Behaviour',        icon: '📚', tip: 'Academic habits self-reported vs. parent-observed.' },
  EmotionalWellness:     { label: 'Emotional Wellness',     icon: '💙', tip: 'Emotional health self-perception vs. parent perspective.' },
  InternetUsage:         { label: 'Internet Usage',         icon: '📱', tip: 'Digital habits self-reported vs. parent-observed.' },
  PersonalityDimensions: { label: 'Personality Dimensions', icon: '✨', tip: 'Character self-assessment vs. parent observation.' },
};

// ── Understanding Index Badge ──────────────────────────────────
function UnderstandingBadge({ index }) {
  const config = {
    STRONG:      { label: 'Strong Understanding',    bg: 'bg-green-50 text-green-700 border-green-200' },
    MODERATE:    { label: 'Moderate Gap',            bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    SIGNIFICANT: { label: 'Significant Difference',  bg: 'bg-red-50 text-red-700 border-red-200' },
  };
  const c = config[index] || config.MODERATE;
  return (
    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${c.bg}`}>
      {c.label}
    </span>
  );
}

// ── Score Bar ─────────────────────────────────────────────────
function ScoreBar({ score, label, color }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-surface-500">{label}</span>
        <span className="text-sm font-bold text-surface-900">{score?.pct ?? '—'}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${score?.pct ?? 0}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Guidance tips by category ─────────────────────────────────
const GUIDANCE = {
  LearningPattern: [
    '🎯 Align study materials with your child\'s dominant learning style.',
    '👁️ For visual learners: use flashcards, mind maps, and colour-coded notes.',
    '👂 For auditory learners: encourage reading aloud or recorded explanations.',
    '🤸 For kinesthetic learners: try hands-on experiments and movement-based study breaks.',
  ],
  StudyBehaviour: [
    '📅 Help your child create a visual weekly study schedule.',
    '🎯 Set one specific academic goal together each week.',
    '⏰ Try the Pomodoro method: 25 min focus, 5 min break.',
    '💬 Ask daily "What did you learn today?" to reinforce retention.',
  ],
  EmotionalWellness: [
    '💙 Create a safe space for your child to express emotions without judgment.',
    '🌿 Practice mindfulness or breathing exercises together.',
    '🤝 Be present — sometimes listening is more powerful than advice.',
    '🔍 If concerns are significant, consider professional support from a counsellor.',
  ],
  InternetUsage: [
    '📱 Establish device-free zones: dinner table and bedroom after 9pm.',
    '📊 Use parental controls to set daily screen time limits.',
    '🎮 Replace passive scrolling with active digital activities (coding, creative apps).',
    '🌳 Schedule at least 1 hour of outdoor activity per day.',
  ],
  PersonalityDimensions: [
    '🌟 Celebrate effort and growth, not just results.',
    '💬 Encourage your child to share opinions in family discussions.',
    '📖 Read stories about resilient role models together.',
    '🤝 Give your child age-appropriate responsibilities to build confidence.',
  ],
};

// ── Comparison Row ────────────────────────────────────────────
function ComparisonRow({ item }) {
  const meta = CAT_META[item.category] || { label: item.category, icon: '📋', tip: '' };
  const guidance = GUIDANCE[item.category] || [];

  return (
    <Card className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-2xl">{meta.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h4 className="font-bold text-surface-900">{meta.label}</h4>
            {item.understandingIndex && <UnderstandingBadge index={item.understandingIndex} />}
          </div>
          {item.indexDesc && <p className="text-sm text-surface-500 mt-1">{item.indexDesc}</p>}
        </div>
        {item.percentageDiff !== null && (
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-surface-900">{item.percentageDiff}%</p>
            <p className="text-xs text-surface-400">gap</p>
          </div>
        )}
      </div>

      {/* Score Bars */}
      <div className="space-y-3">
        {item.studentScore && (
          <ScoreBar score={item.studentScore} label="Your Child's Self-Report" color="#1C3F39" />
        )}
        {item.parentScore && (
          <ScoreBar score={item.parentScore} label="Your (Parent) Perspective" color="#C19B6C" />
        )}
        {!item.studentScore && (
          <p className="text-sm text-surface-400 italic">Child hasn't completed this assessment yet.</p>
        )}
        {!item.parentScore && (
          <p className="text-sm text-surface-400 italic">You haven't completed the parent perspective for this tool yet.</p>
        )}
      </div>

      {/* Guidance */}
      {guidance.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-primary-700 hover:text-primary-800 flex items-center gap-1.5">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            Guidance & Tips for {meta.label}
          </summary>
          <ul className="mt-3 space-y-2">
            {guidance.map((tip, i) => (
              <li key={i} className="text-sm text-surface-700 pl-2 border-l-2 border-primary-200">{tip}</li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function ComparisonReport() {
  const { childId } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['comparison-report', childId],
    queryFn: () => api.get(`/parent/children/${childId}/comparison`).then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="xl" /></div>;

  const { comparison = [] } = data || {};

  // Build radar data for overview chart
  const studentRadar = {};
  const parentRadar = {};
  comparison.forEach(c => {
    if (c.studentScore) studentRadar[CAT_META[c.category]?.label || c.category] = c.studentScore.pct;
    if (c.parentScore) parentRadar[CAT_META[c.category]?.label || c.category] = c.parentScore.pct;
  });

  const overallGap = comparison.filter(c => c.percentageDiff !== null).reduce((sum, c) => sum + c.percentageDiff, 0);
  const avgGap = comparison.length ? Math.round(overallGap / comparison.filter(c => c.percentageDiff !== null).length) : null;
  const overallIndex = avgGap === null ? null : avgGap <= 5 ? 'STRONG' : avgGap <= 15 ? 'MODERATE' : 'SIGNIFICANT';

  return (
    <div className="space-y-6 animate-slide-up max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/parent" className="p-2 hover:bg-surface-200 rounded-xl text-surface-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-100 text-accent-700">
              Package 2 — Parent Insight
            </span>
          </div>
          <h2 className="text-2xl font-bold text-surface-900">Parent–Child Comparison Report</h2>
          <p className="text-surface-500 text-sm">Understanding your child's world vs. your perspective</p>
        </div>
        <Link to="/parent/appointments">
          <Button variant="primary" icon={<CalendarPlus className="w-4 h-4" />} size="sm">Book Counselling</Button>
        </Link>
      </div>

      {/* Overall Understanding Score */}
      {overallIndex && (
        <div className={`rounded-2xl p-5 border ${
          overallIndex === 'STRONG' ? 'bg-green-50 border-green-200' :
          overallIndex === 'MODERATE' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-surface-600 mb-1">Overall Understanding Index</p>
              <UnderstandingBadge index={overallIndex} />
              <p className="text-sm text-surface-600 mt-2 max-w-md">
                {overallIndex === 'STRONG' && 'You and your child have a strong alignment in how you perceive their strengths and challenges. Keep the communication going!'}
                {overallIndex === 'MODERATE' && 'There are some meaningful differences between your perceptions. Use this report to spark deeper conversations.'}
                {overallIndex === 'SIGNIFICANT' && 'There are significant differences between how your child sees themselves and how you see them. This is a valuable opportunity for connection and understanding.'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-surface-900">{avgGap}%</p>
              <p className="text-xs text-surface-400">avg perception gap</p>
            </div>
          </div>
        </div>
      )}

      {/* Radar Overview Chart */}
      {(Object.keys(studentRadar).length > 0 || Object.keys(parentRadar).length > 0) && (
        <Card>
          <h3 className="font-semibold text-surface-900 mb-4">Overview: All Dimensions</h3>
          <RadarChart
            maxScore={100}
            height={300}
            series={[
              { label: 'Child (Self)', data: studentRadar, color: '#1C3F39' },
              { label: 'Parent Perspective', data: parentRadar, color: '#C19B6C' },
            ]}
          />
          <div className="flex items-center justify-center gap-6 mt-2">
            <span className="flex items-center gap-2 text-sm text-surface-600">
              <span className="w-3 h-3 rounded-full bg-[#1C3F39] inline-block" /> Child's Self-Report
            </span>
            <span className="flex items-center gap-2 text-sm text-surface-600">
              <span className="w-3 h-3 rounded-full bg-[#C19B6C] inline-block" /> Parent Perspective
            </span>
          </div>
        </Card>
      )}

      {/* Per-Category Breakdowns */}
      {!comparison.length ? (
        <EmptyState
          icon="📊"
          title="No assessments completed yet"
          description="Once your child completes their assessments and you submit your perspective, the comparison report will appear here."
        />
      ) : (
        <div className="space-y-4">
          {comparison.map(item => (
            <ComparisonRow key={item.category} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
