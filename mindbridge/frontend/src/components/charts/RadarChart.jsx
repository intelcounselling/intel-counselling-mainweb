// RadarChart.jsx — Spider/Radar chart for personality/sub-score dimensions
import {
  RadarChart as RechartRadar, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend
} from 'recharts';

const DEFAULT_COLORS = ['#1C3F39', '#C19B6C'];

const DIM_LABELS = {
  Visual: 'Visual',
  Auditory: 'Auditory',
  Kinesthetic: 'Kinesthetic',
  Mixed: 'Multi-Modal',
  Confidence: 'Confidence',
  Adaptability: 'Adaptability',
  Responsibility: 'Responsibility',
  EmotionalGrowth: 'Emotional Growth',
  SocialAwareness: 'Social Awareness',
};

/**
 * RadarChart
 * @param {object} data — { DimName: score, ... }
 * @param {number} maxScore — Max per dimension (default 20)
 * @param {Array} series — [{ data: {...}, label, color }] for multi-series
 */
export default function RadarChart({ data, maxScore = 20, series, height = 300 }) {
  // Build chart data from either single data obj or series
  let subjects;
  if (series && series.length) {
    const allKeys = [...new Set(series.flatMap(s => Object.keys(s.data || {})))];
    subjects = allKeys.map(key => {
      const row = { subject: DIM_LABELS[key] || key };
      series.forEach(s => { row[s.label] = s.data?.[key] ?? 0; });
      return row;
    });
  } else if (data && typeof data === 'object') {
    subjects = Object.entries(data).map(([key, val]) => ({
      subject: DIM_LABELS[key] || key,
      Score: val ?? 0,
    }));
  } else {
    subjects = [];
  }

  if (!subjects.length) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-surface-400 text-sm">No dimension data yet</p>
      </div>
    );
  }

  const seriesKeys = series ? series.map(s => s.label) : ['Score'];
  const seriesColors = series ? series.map((s, i) => s.color || DEFAULT_COLORS[i]) : [DEFAULT_COLORS[0]];

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartRadar cx="50%" cy="50%" outerRadius="70%" data={subjects}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, maxScore]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
          />
          {seriesKeys.map((key, i) => (
            <Radar
              key={key}
              name={key}
              dataKey={key}
              stroke={seriesColors[i]}
              fill={seriesColors[i]}
              fillOpacity={0.2}
              dot={{ r: 3, fill: seriesColors[i] }}
            />
          ))}
          <Tooltip
            formatter={(val, name) => [`${val} / ${maxScore}`, name]}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
          />
          {series && series.length > 1 && (
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ fontSize: 12, color: '#334155' }}>{value}</span>}
            />
          )}
        </RechartRadar>
      </ResponsiveContainer>
    </div>
  );
}
