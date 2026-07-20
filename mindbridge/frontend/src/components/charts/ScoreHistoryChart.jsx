import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { formatDate } from '../../utils/formatters';

const COLORS = ['#4F46E5', '#0ea5e9', '#16a34a', '#ca8a04', '#ea580c'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-surface-200 rounded-xl p-3 shadow-lg text-sm">
        <p className="text-surface-500 mb-2">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-surface-700 font-medium">{entry.name}:</span>
            <span className="text-surface-900 font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * ScoreHistoryChart
 * data: Array<{ takenAt: string, score: number, test: { name, category } }>
 * Groups by test category and plots score over time.
 */
export default function ScoreHistoryChart({ results = [], height = 280 }) {
  if (!results.length) {
    return (
      <div className="flex items-center justify-center h-40 text-surface-400 text-sm">
        No test history yet
      </div>
    );
  }

  // Build data points: { date, [testName]: score }
  const categories = [...new Set(results.map(r => r.test?.category || r.test?.name || 'Unknown'))];
  const dataMap = {};

  results.forEach(r => {
    const dateKey = formatDate(r.takenAt, 'MMM d');
    const cat = r.test?.category || r.test?.name || 'Unknown';
    if (!dataMap[dateKey]) dataMap[dateKey] = { date: dateKey };
    dataMap[dateKey][cat] = r.score;
  });

  const data = Object.values(dataMap).reverse();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
          formatter={(value) => <span className="text-surface-600">{value}</span>}
        />
        {categories.map((cat, i) => (
          <Line
            key={cat}
            type="monotone"
            dataKey={cat}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4, fill: COLORS[i % COLORS.length] }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
