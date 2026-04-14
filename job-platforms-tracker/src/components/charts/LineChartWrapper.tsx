'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface DataPoint {
  label: string;
  value: number | null;
}

interface Props {
  data: DataPoint[];
  color?: string;
  unit?: string;
  prefix?: string;
  height?: number;
}

function CustomTooltip({ active, payload, label, prefix, unit }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div className="bg-surface border border-border px-3 py-2 text-[11px] font-mono shadow-sm">
      <div className="text-ink-muted mb-0.5">{label}</div>
      <div className="text-ink font-medium">
        {prefix}{val !== null && val !== undefined ? val.toLocaleString('en-US', { maximumFractionDigits: 1 }) : '—'}{unit ? ` ${unit}` : ''}
      </div>
    </div>
  );
}

export default function LineChartWrapper({
  data,
  color = '#1a1a2e',
  unit = '',
  prefix = '',
  height = 260,
}: Props) {
  const chartData = data.map((d) => ({ label: d.label, value: d.value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#999', fontFamily: 'DM Mono, monospace' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#999', fontFamily: 'DM Mono, monospace' }}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v) =>
            v >= 1000 ? `${prefix}${(v / 1000).toFixed(0)}B` : `${prefix}${v}`
          }
        />
        <Tooltip content={<CustomTooltip prefix={prefix} unit={unit} />} />
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
  );
}
