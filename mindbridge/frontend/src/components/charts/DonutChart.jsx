// DonutChart.jsx — Reusable donut/pie chart using Recharts
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#1C3F39', '#C19B6C', '#4F46E5', '#0EA5E9', '#16A34A', '#DC2626', '#CA8A04'];

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 12, fontWeight: 600 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/**
 * DonutChart
 * @param {Array} data — [{ label, count, percentage }] or [{ name, value }]
 * @param {string} title — Center label
 * @param {number} total — Center total number
 */
export default function DonutChart({ data = [], title = '', total, height = 280, colors = COLORS, showLegend = true }) {
  // Normalize data format
  const chartData = data.map((d, i) => ({
    name: d.label ?? d.name,
    value: d.count ?? d.value ?? 0,
  })).filter(d => d.value > 0);

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-surface-400 text-sm">No data yet</p>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={height * 0.23}
            outerRadius={height * 0.38}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [value, name]}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
          />
          {showLegend && (
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ fontSize: 12, color: '#334155' }}>{value}</span>}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
