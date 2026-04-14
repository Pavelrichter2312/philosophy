'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  label: string;
  value: number | null;
}

interface Props {
  data: DataPoint[];
  color?: string;
  height?: number;
  title?: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div className="bg-surface border border-border px-3 py-2 text-[11px] font-mono shadow-sm">
      <div className="text-ink-muted mb-0.5">{label}</div>
      <div className="text-ink font-medium">
        {v !== null && v !== undefined ? `${v.toFixed(1)}%` : '—'}
      </div>
    </div>
  );
}

export default function MarginLineChart({
  data,
  color = '#1a1a2e',
  height = 180,
  title,
}: Props) {
  const chartData = data.filter((d) => d.value !== null);

  return (
    <div>
      {title && (
        <div className="text-[10px] font-mono uppercase tracking-wide text-ink-faint mb-2">
          {title}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: '#bbb', fontFamily: 'DM Mono, monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#bbb', fontFamily: 'DM Mono, monospace' }}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(v) => `${v.toFixed(0)}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
