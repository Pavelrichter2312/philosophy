'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';

interface DataPoint {
  label: string;
  value: number | null;
}

interface Props {
  data: DataPoint[];
  color?: string;
  negativeColor?: string;
  prefix?: string;
  height?: number;
  title?: string;
}

function CustomTooltip({ active, payload, label, prefix }: any) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div className="bg-surface border border-border px-3 py-2 text-[11px] font-mono shadow-sm">
      <div className="text-ink-muted mb-0.5">{label}</div>
      <div className="text-ink font-medium">
        {prefix}
        {v !== null && v !== undefined
          ? Math.abs(v) >= 1000
            ? `${(v / 1000).toFixed(1)}B`
            : v.toLocaleString('en-US', { maximumFractionDigits: 1 })
          : '—'}
      </div>
    </div>
  );
}

export default function BarChartWrapper({
  data,
  color = '#1a1a2e',
  negativeColor = '#dc2626',
  prefix = '',
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
        <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#f5f5f5" />
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
            width={44}
            tickFormatter={(v) =>
              Math.abs(v) >= 1000
                ? `${prefix}${(v / 1000).toFixed(0)}B`
                : `${prefix}${v}`
            }
          />
          <Tooltip content={<CustomTooltip prefix={prefix} />} />
          <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={40}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={(entry.value ?? 0) < 0 ? negativeColor : color}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
