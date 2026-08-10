import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Download, User, School, Calendar, BookOpen,
  ChevronDown, ChevronUp, TrendingUp, FileText, Filter,
  BarChart2, CheckCircle, AlertTriangle, AlertOctagon
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, AreaChart, Area, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import api from '../../lib/axios';
import { formatDate, formatDateTime, getSeverityColor, getSeverityBg } from '../../utils/formatters';
import { Spinner } from '../../components/ui';
import SeverityBadge from '../../components/charts/SeverityBadge';
import { useToast } from '../../components/ui/Toast';

// ── Severity icon helper ────────────────────────────────────────
function SeverityIcon({ severity }) {
  const s = severity?.toLowerCase();
  if (s === 'minimal' || s === 'low')
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (s === 'mild' || s === 'moderate')
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  return <AlertOctagon className="w-4 h-4 text-red-500" />;
}

// ── Score progress bar ──────────────────────────────────────────
function ScoreBar({ score, maxScore, severity }) {
  const pct = maxScore ? Math.round((score / maxScore) * 100) : 0;
  const color = getSeverityColor(severity);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 bg-surface-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold text-surface-700 w-16 text-right">{score}/{maxScore}</span>
    </div>
  );
}

// ── Custom recharts tooltip ─────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-surface-200 rounded-xl p-3 shadow-xl text-sm min-w-[150px]">
      <p className="text-surface-500 text-xs font-medium mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span className="text-surface-600 truncate">{entry.name}:</span>
          <span className="font-bold text-surface-900 ml-auto">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

const CHART_COLORS = ['#4F46E5', '#0ea5e9', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'];

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'date-desc' },
  { label: 'Oldest First', value: 'date-asc' },
  { label: 'Highest Score', value: 'score-desc' },
  { label: 'Lowest Score', value: 'score-asc' },
  { label: 'Severity (High→Low)', value: 'severity-desc' },
];

const SEVERITY_ORDER = ['severe', 'moderately severe', 'moderate', 'mild', 'minimal', 'high', 'low'];

function sortResults(results, sortKey) {
  return [...results].sort((a, b) => {
    switch (sortKey) {
      case 'date-asc': return new Date(a.takenAt) - new Date(b.takenAt);
      case 'date-desc': return new Date(b.takenAt) - new Date(a.takenAt);
      case 'score-desc': return (b.score / b.maxScore) - (a.score / a.maxScore);
      case 'score-asc': return (a.score / a.maxScore) - (b.score / b.maxScore);
      case 'severity-desc':
        return SEVERITY_ORDER.indexOf(a.severity?.toLowerCase()) -
               SEVERITY_ORDER.indexOf(b.severity?.toLowerCase());
      default: return new Date(b.takenAt) - new Date(a.takenAt);
    }
  });
}

// ── Question breakdown sub-component ───────────────────────────
function QuestionBreakdown({ result }) {
  const questions = result.test?.questions || [];
  const answers = result.answers || {};

  const answerList = Array.isArray(answers)
    ? answers.map(a => ({ qId: a.questionId || a.id, val: a.value ?? a }))
    : Object.entries(answers).map(([qId, val]) => ({ qId, val }));

  if (!answerList.length) {
    return (
      <div className="text-center py-6 text-surface-400 text-sm">
        No question data available.
      </div>
    );
  }

  const getAnswerLabel = (qId, val) => {
    const q = questions.find(q => q.id === parseInt(qId) || q.id === qId);
    if (!q) return String(val);
    const opt = q.options?.find(o => o.value === val);
    return opt?.label || String(val);
  };

  return (
    <div className="divide-y divide-surface-100">
      {answerList.map(({ qId, val }, idx) => {
        const q = questions.find(q => q.id === parseInt(qId) || q.id === qId);
        const label = getAnswerLabel(qId, val);
        const pts = Number(val) || 0;
        const maxPts = q?.options ? Math.max(...(q.options.map(o => o.value ?? 0))) : null;
        const pct = maxPts ? (pts / maxPts) * 100 : null;

        return (
          <div key={qId} className="flex items-start gap-4 py-3.5 px-4 hover:bg-surface-50/60 transition-colors">
            {/* Number badge */}
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center mt-0.5">
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-800 leading-relaxed">
                {q?.text || `Question ${qId}`}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-100">
                  {label}
                </span>
                {pct !== null && (
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 h-1.5 bg-surface-100 rounded-full overflow-hidden max-w-[120px]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: pct > 66 ? '#ef4444' : pct > 33 ? '#f59e0b' : '#16a34a'
                        }}
                      />
                    </div>
                  </div>
                )}
                <span className="text-xs text-surface-400">{pts} pts</span>
              </div>
            </div>
          </div>
        );
      })}
      <div className="px-4 py-3 bg-surface-50 flex items-center justify-between">
        <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Total Score</span>
        <span className="text-sm font-bold text-surface-900">{result.score} / {result.maxScore}</span>
      </div>
    </div>
  );
}

// ── Test card ───────────────────────────────────────────────────
function TestCard({ result, index }) {
  const [expanded, setExpanded] = useState(false);
  const pct = result.maxScore ? Math.round((result.score / result.maxScore) * 100) : 0;
  const color = getSeverityColor(result.severity);

  return (
    <div className="bg-white border border-surface-200/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Card header */}
      <div className="px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-sm"
              style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
            >
              {index + 1}
            </div>
            <div>
              <h3 className="font-bold text-surface-900 text-sm leading-tight">{result.test?.name || 'Assessment'}</h3>
              <p className="text-xs text-surface-400 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {formatDateTime(result.takenAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <SeverityBadge severity={result.severity} size="sm" />
            <SeverityIcon severity={result.severity} />
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-surface-400 font-medium">Score</span>
            <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
          </div>
          <ScoreBar score={result.score} maxScore={result.maxScore} severity={result.severity} />
        </div>

        {/* Category tag */}
        {result.test?.category && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 text-xs bg-surface-100 text-surface-600 px-2.5 py-1 rounded-full font-medium">
              <BookOpen className="w-3 h-3" />
              {result.test.category}
            </span>
          </div>
        )}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-6 py-3 bg-surface-50/60 hover:bg-surface-100/60 border-t border-surface-100 transition-colors text-sm font-semibold text-surface-600"
      >
        <span className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary-500" />
          {expanded ? 'Hide' : 'Show'} Question Breakdown
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="border-t border-surface-100 animate-slide-up">
          <QuestionBreakdown result={result} />
        </div>
      )}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────
export default function StudentReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { error: toastError, success } = useToast();

  const [activeTest, setActiveTest] = useState('all');
  const [sortKey, setSortKey] = useState('date-desc');
  const [isDownloading, setIsDownloading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-student-report-page', id],
    queryFn: () => api.get(`/psychiatrist/students/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await api.get(`/admin/students/${id}/pdf-report`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MindBridge_Report_${data?.student?.firstName}_${data?.student?.lastName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      success('PDF downloaded successfully');
    } catch (err) {
      toastError('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-primary-50/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-surface-500 font-medium">Loading student report…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-5xl">⚠️</p>
          <h2 className="text-xl font-bold text-surface-900">Failed to load report</h2>
          <p className="text-surface-500 text-sm">The student data could not be retrieved.</p>
          <button onClick={() => navigate(-1)} className="text-primary-600 text-sm underline">Go back</button>
        </div>
      </div>
    );
  }

  const { student, results = [], alerts = [], appointments = [] } = data;

  // Build test-type tabs
  const testNames = ['all', ...new Set(results.map(r => r.test?.name).filter(Boolean))];

  // Filter & sort
  const filteredResults = sortResults(
    activeTest === 'all' ? results : results.filter(r => r.test?.name === activeTest),
    sortKey
  );

  // Chart data: score over time per category
  const chartCategories = [...new Set(results.map(r => r.test?.category || r.test?.name || 'Unknown'))];
  const chartDataMap = {};
  [...results].sort((a, b) => new Date(a.takenAt) - new Date(b.takenAt)).forEach(r => {
    const key = formatDate(r.takenAt, 'MMM d');
    const cat = r.test?.category || r.test?.name || 'Unknown';
    if (!chartDataMap[key]) chartDataMap[key] = { date: key };
    chartDataMap[key][cat] = r.score;
  });
  const chartData = Object.values(chartDataMap);

  // Radar data: avg score per test category
  const radarData = chartCategories.map(cat => {
    const catResults = results.filter(r => (r.test?.category || r.test?.name) === cat);
    const avgPct = catResults.length
      ? Math.round(catResults.reduce((s, r) => s + (r.score / r.maxScore) * 100, 0) / catResults.length)
      : 0;
    return { category: cat, score: avgPct };
  });

  // Overall stats
  const avgScore = results.length
    ? Math.round(results.reduce((s, r) => s + (r.score / r.maxScore) * 100, 0) / results.length)
    : null;
  const latestResult = results.length
    ? [...results].sort((a, b) => new Date(b.takenAt) - new Date(a.takenAt))[0]
    : null;
  const highRiskCount = results.filter(r =>
    ['severe', 'moderately severe', 'high'].includes(r.severity?.toLowerCase())
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6">

      {/* ── Sticky top bar ───────────────────────────────────────── */}
      <div className="bg-white/90 backdrop-blur-md border border-surface-250 rounded-2xl p-4 shadow-sm mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-surface-100 transition-colors text-surface-600 hover:text-surface-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-surface-900 leading-tight">
              {student?.firstName} {student?.lastName}
            </h1>
            <p className="text-xs text-surface-400">Student Personal Report</p>
          </div>
        </div>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
        >
          <Download className="w-4 h-4" />
          {isDownloading ? 'Generating…' : 'Download PDF'}
        </button>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Hero card ─────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-surface-200/60 shadow-sm overflow-hidden">
          {/* Gradient banner */}
          <div className="h-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-purple-500 text-white font-black text-2xl flex items-center justify-center shadow-lg">
                {student?.firstName?.[0]}{student?.lastName?.[0]}
              </div>
              {/* Info */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-5">
                {[
                  { icon: User, label: 'Full Name', value: `${student?.firstName} ${student?.lastName}` },
                  { icon: School, label: 'School', value: student?.school?.name || '—' },
                  { icon: BookOpen, label: 'Grade', value: student?.grade || '—' },
                  { icon: Calendar, label: 'Member Since', value: formatDate(student?.createdAt) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                      <Icon className="w-3 h-3" />
                      {label}
                    </p>
                    <p className="text-sm font-semibold text-surface-800 leading-tight">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Assessments Taken',
              value: results.length,
              icon: <FileText className="w-5 h-5 text-indigo-500" />,
              bg: 'bg-indigo-50',
              border: 'border-indigo-100',
            },
            {
              label: 'Average Score',
              value: avgScore != null ? `${avgScore}%` : '—',
              icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
              bg: 'bg-emerald-50',
              border: 'border-emerald-100',
            },
            {
              label: 'Latest Severity',
              value: latestResult ? (
                <SeverityBadge severity={latestResult.severity} size="sm" />
              ) : '—',
              icon: <SeverityIcon severity={latestResult?.severity} />,
              bg: 'bg-orange-50',
              border: 'border-orange-100',
            },
            {
              label: 'High-Risk Results',
              value: highRiskCount,
              icon: <AlertOctagon className="w-5 h-5 text-red-500" />,
              bg: 'bg-red-50',
              border: 'border-red-100',
            },
          ].map(stat => (
            <div
              key={stat.label}
              className={`${stat.bg} border ${stat.border} rounded-2xl p-4 flex items-start gap-3`}
            >
              <div className="p-2 bg-white/80 rounded-xl shadow-sm flex-shrink-0">
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-surface-400">{stat.label}</p>
                <div className="text-xl font-black text-surface-900 mt-0.5">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts ─────────────────────────────────────────────── */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score history line chart */}
            <div className="lg:col-span-2 bg-white border border-surface-200/60 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-primary-500" />
                <h3 className="font-bold text-surface-900 text-sm">Score History Over Time</h3>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    {chartCategories.map((cat, i) => (
                      <linearGradient key={cat} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  {chartCategories.map((cat, i) => (
                    <Area
                      key={cat}
                      type="monotone"
                      dataKey={cat}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      fill={`url(#grad-${i})`}
                      strokeWidth={2}
                      dot={{ r: 4, fill: CHART_COLORS[i % CHART_COLORS.length] }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Radar chart (avg by category) */}
            <div className="bg-white border border-surface-200/60 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <BarChart2 className="w-4 h-4 text-purple-500" />
                <h3 className="font-bold text-surface-900 text-sm">Avg Score by Category</h3>
              </div>
              {radarData.length > 2 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                    <Radar
                      name="Avg %"
                      dataKey="score"
                      stroke="#4F46E5"
                      fill="#4F46E5"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <Tooltip formatter={(v) => [`${v}%`, 'Avg Score']} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col gap-3 mt-2">
                  {radarData.map((d, i) => (
                    <div key={d.category}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-surface-700 truncate max-w-[140px]">{d.category}</span>
                        <span className="font-bold" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>{d.score}%</span>
                      </div>
                      <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${d.score}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Assessment Results ─────────────────────────────────── */}
        <div>
          {/* Section header + controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <h2 className="text-xl font-bold text-surface-900">
              Assessment Results
              <span className="ml-2 text-base font-normal text-surface-400">({filteredResults.length})</span>
            </h2>
            {/* Sort dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-surface-400" />
              <select
                value={sortKey}
                onChange={e => setSortKey(e.target.value)}
                className="text-sm border border-surface-200 rounded-xl px-3 py-2 bg-white text-surface-700 font-medium focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Test-name filter tabs */}
          {testNames.length > 2 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {testNames.map(name => (
                <button
                  key={name}
                  onClick={() => setActiveTest(name)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    activeTest === name
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                      : 'bg-white text-surface-600 border-surface-200 hover:border-primary-300 hover:text-primary-600'
                  }`}
                >
                  {name === 'all' ? 'All Tests' : name}
                  {name !== 'all' && (
                    <span className={`ml-1.5 ${activeTest === name ? 'text-primary-200' : 'text-surface-400'}`}>
                      ({results.filter(r => r.test?.name === name).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Cards grid */}
          {filteredResults.length === 0 ? (
            <div className="bg-white rounded-2xl border border-surface-200/60 py-16 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-surface-500 font-medium">No assessments found</p>
              <p className="text-surface-400 text-sm">Try adjusting your filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredResults.map((result, idx) => (
                <TestCard key={result.id} result={result} index={idx} />
              ))}
            </div>
          )}
        </div>

        {/* ── Alerts & Appointments summary ─────────────────────── */}
        {(alerts.length > 0 || appointments.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {alerts.length > 0 && (
              <div className="bg-white border border-surface-200/60 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-surface-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <h3 className="font-bold text-surface-900 text-sm">Alerts ({alerts.length})</h3>
                </div>
                <div className="divide-y divide-surface-100">
                  {alerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className="px-5 py-3.5 flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-surface-800">{alert.type || 'Alert'}</p>
                        <p className="text-xs text-surface-400">{formatDateTime(alert.firedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {appointments.length > 0 && (
              <div className="bg-white border border-surface-200/60 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-surface-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <h3 className="font-bold text-surface-900 text-sm">Appointments ({appointments.length})</h3>
                </div>
                <div className="divide-y divide-surface-100">
                  {appointments.slice(0, 5).map(appt => (
                    <div key={appt.id} className="px-5 py-3.5 flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-surface-800">
                          With {appt.psychiatrist?.firstName} {appt.psychiatrist?.lastName}
                        </p>
                        <p className="text-xs text-surface-400">{formatDateTime(appt.slot)}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        appt.status === 'COMPLETED'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : appt.status === 'CANCELLED'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6 border-t border-surface-100">
          <p className="text-xs text-surface-400">
            MindBridge Platform — Confidential Student Report · Generated {formatDateTime(new Date())}
          </p>
        </div>
      </div>
    </div>
  );
}
