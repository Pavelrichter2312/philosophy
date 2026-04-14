'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FinancialPeriodRecord } from '@/types/financials';

interface RevenueChartProps {
  records: FinancialPeriodRecord[];
}

export default function RevenueChart({ records }: RevenueChartProps) {
  const data = records.map((r) => ({
    period: r.period.periodLabel,
    revenue: r.incomeStatement.revenue,
    operatingIncome: r.incomeStatement.operatingIncome,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barCategoryGap="35%">
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
          tickFormatter={(v) => v.toLocaleString()}
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
          cursor={{ fill: '#f7f7f5' }}
        />
        <Bar dataKey="revenue" name="Revenue" fill="#0a0a0a" radius={[2, 2, 0, 0]} />
        <Bar dataKey="operatingIncome" name="Operating Income" fill="#b0b0b0" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
