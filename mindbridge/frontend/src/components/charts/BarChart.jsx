// BarChart.jsx — Reusable horizontal/vertical bar chart using Recharts
import {
  BarChart as RechartBar, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';

const DEFAULT_COLORS = ['#1C3F39', '#C19B6C', '#4F46E5', '#0EA5E9', '#16A34A'];

const SEVERITY_COLORS = {
  severe: '#DC2626',
  moderate: '#EA580C',
  mild: '#CA8A04',
  low: '#16A34A',
  minimal: '#16A34A',
};

/**
 * BarChart
 * @param {Array} data — [{ label, count, percentage, severity? }]
 * @param {string} valueKey — which key to use as bar value (default 'count')
 * @param {boolean} horizontal — render horizontal bars
 * @param {boolean} showPct — show percentage labels on bars
 */
export default function BarChart({
  data = [],
  valueKey = 'count',
  labelKey = 'label',
  horizontal = false,
  showPct = false,
  height = 260,
  colors,
  colorBySeverity = false,
}) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-surface-400 text-sm">No data yet</p>
      </div>
    );
  }

  const chartData = data.map(d => ({
    name: d[labelKey] ?? d.label,
    value: d[valueKey] ?? d.count ?? 0,
    percentage: d.percentage,
    severity: d.severity,
  }));

  const getColor = (entry, index) => {
    if (colorBySeverity && entry.severity) return SEVERITY_COLORS[entry.severity] || DEFAULT_COLORS[0];
    if (colors) return colors[index % colors.length];
    return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  };

  if (horizontal) {
    return (
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartBar data={chartData} layout="vertical" margin={{ left: 20, right: 40 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 11, fill: '#334155' }} />
            <Tooltip
              formatter={(val, _, props) => [
                showPct && props.payload.percentage !== undefined
                  ? `${val} (${props.payload.percentage}%)`
                  : val,
                'Count'
              ]}
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry, index)} />
              ))}
              {showPct && (
                <LabelList
                  dataKey="percentage"
                  position="right"
                  formatter={(v) => v !== undefined ? `${v}%` : ''}
                  style={{ fontSize: 11, fill: '#64748b' }}
                />
              )}
            </Bar>
          </RechartBar>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartBar data={chartData} margin={{ top: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#334155' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
          <Tooltip
            formatter={(val, _, props) => [
              showPct && props.payload.percentage !== undefined
                ? `${val} students (${props.payload.percentage}%)`
                : `${val} students`,
              'Count'
            ]}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry, index)} />
            ))}
            {showPct && (
              <LabelList
                dataKey="percentage"
                position="top"
                formatter={(v) => v !== undefined ? `${v}%` : ''}
                style={{ fontSize: 11, fill: '#64748b' }}
              />
            )}
          </Bar>
        </RechartBar>
      </ResponsiveContainer>
    </div>
  );
}
