'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

export interface SeriesData {
  company_id: string;
  name: string;
  ticker: string;
  color: string;
  data: { year: number; value: number | null }[];
}

interface Props {
  series: SeriesData[];
  years: number[];
  indexed?: boolean;
  height?: number;
  prefix?: string;
}

function CustomTooltip({ active, payload, label, indexed, prefix }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border px-3 py-2 text-[11px] font-mono shadow-sm min-w-[140px]">
      <div className="text-ink-muted mb-1.5">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-0.5">
          <div className="flex items-center gap-1.5">
            <span style={{ background: p.color }} className="inline-block w-2 h-2 rounded-full" />
            <span className="text-ink-muted">{p.name}</span>
          </div>
          <span className="text-ink font-medium">
            {p.value !== null && p.value !== undefined
              ? indexed
                ? `${p.value.toFixed(1)}`
                : `${prefix}${p.value.toLocaleString('en-US', { maximumFractionDigits: 1 })}`
              : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function MultiLineChartWrapper({ series, years, indexed = false, height = 320, prefix = '' }: Props) {
  // Build flat data array: [{year, companyA: val, companyB: val, ...}]
  const chartData = years.map((year) => {
    const row: Record<string, number | null | string> = { year: String(year) };
    series.forEach((s) => {
      const point = s.data.find((d) => d.year === year);
      row[s.company_id] = point?.value ?? null;
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="#f0f0f0" />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 10, fill: '#999', fontFamily: 'DM Mono, monospace' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#999', fontFamily: 'DM Mono, monospace' }}
          axisLine={false}
          tickLine={false}
          width={indexed ? 36 : 52}
          tickFormatter={(v) =>
            indexed ? String(v.toFixed(0)) : v >= 1000 ? `${(v / 1000).toFixed(0)}B` : String(v)
          }
        />
        <Tooltip content={<CustomTooltip indexed={indexed} prefix={prefix} />} />
        <Legend
          wrapperStyle={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', paddingTop: '8px' }}
        />
        {series.map((s, i) => (
          <Line
            key={s.company_id}
            type="monotone"
            dataKey={s.company_id}
            name={s.ticker}
            stroke={s.color}
            strokeWidth={1.5}
            strokeDasharray={i % 3 === 1 ? '4 2' : i % 3 === 2 ? '2 2' : undefined}
            dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
