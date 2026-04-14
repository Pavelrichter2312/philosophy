'use client';

import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface SeriesData {
  companySlug: string;
  companyName: string;
  points: { period: string; value: number }[];
}

interface CompareChartProps {
  series: SeriesData[];
  metricLabel: string;
  indexed?: boolean;
}

const STROKE_COLORS = ['#0a0a0a', '#6b6b6b', '#b0b0b0', '#0a0a0a', '#6b6b6b', '#b0b0b0', '#0a0a0a'];
const STROKE_DASHES = ['none', 'none', 'none', '4 2', '4 2', '4 2', '2 2'];

export default function CompareChart({ series, metricLabel, indexed = false }: CompareChartProps) {
  // Collect all unique period labels
  const allPeriods = Array.from(
    new Set(series.flatMap((s) => s.points.map((p) => p.period)))
  ).sort();

  const chartData = allPeriods.map((period) => {
    const row: Record<string, string | number> = { period };
    series.forEach((s) => {
      const pt = s.points.find((p) => p.period === period);
      if (pt) {
        if (indexed) {
          const base = s.points[0]?.value ?? 1;
          row[s.companySlug] = base !== 0 ? (pt.value / base) * 100 : 0;
        } else {
          row[s.companySlug] = pt.value;
        }
      }
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <XAxis
          dataKey="period"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#6b6b6b', fontFamily: 'DM Mono, monospace' }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#6b6b6b', fontFamily: 'DM Mono, monospace' }}
          tickFormatter={(v) => indexed ? `${v.toFixed(0)}` : v.toLocaleString()}
        />
        <Tooltip
          contentStyle={{
            border: '1px solid #e8e8e4',
            borderRadius: 4,
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
            background: '#fff',
            boxShadow: 'none',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, fontFamily: 'Inter, sans-serif' }}
        />
        {series.map((s, i) => (
          <Line
            key={s.companySlug}
            dataKey={s.companySlug}
            name={s.companyName}
            stroke={STROKE_COLORS[i % STROKE_COLORS.length]}
            strokeDasharray={STROKE_DASHES[i % STROKE_DASHES.length]}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
