'use client';

import { useState, useEffect } from 'react';
import { COMPANIES } from '@/lib/constants/companies';
import { FinancialPeriodRecord } from '@/types/financials';
import CompareChart from '@/components/charts/CompareChart';
import PageWrapper from '@/components/layout/PageWrapper';
import Divider from '@/components/ui/Divider';
import { formatNumber } from '@/lib/utils/numbers';

type MetricKey = 'revenue' | 'operatingIncome' | 'netIncome' | 'paidClients' | 'arpu';

const METRICS: { key: MetricKey; label: string }[] = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'operatingIncome', label: 'Operating Income' },
  { key: 'netIncome', label: 'Net Income' },
  { key: 'paidClients', label: 'Paid Clients' },
  { key: 'arpu', label: 'ARPU' },
];

function getMetricValue(record: FinancialPeriodRecord, metric: MetricKey): number | undefined {
  switch (metric) {
    case 'revenue': return record.incomeStatement.revenue;
    case 'operatingIncome': return record.incomeStatement.operatingIncome;
    case 'netIncome': return record.incomeStatement.netIncome;
    case 'paidClients': return record.platformMetrics.paidClientsOrSubscribers;
    case 'arpu': return record.platformMetrics.arpuValue;
  }
}

export default function ComparePage() {
  const [selected, setSelected] = useState<string[]>(['seek', 'kanzhun', 'ziprecruiter']);
  const [metric, setMetric] = useState<MetricKey>('revenue');
  const [indexed, setIndexed] = useState(false);
  const [allRecords, setAllRecords] = useState<Record<string, FinancialPeriodRecord[]>>({});

  useEffect(() => {
    selected.forEach(async (slug) => {
      if (allRecords[slug]) return;
      const res = await fetch(`/api/companies/${slug}/financials?periodType=annual`);
      const json = await res.json();
      if (json.ok) {
        setAllRecords((prev) => ({ ...prev, [slug]: json.data }));
      }
    });
  }, [selected]);

  const toggleCompany = (slug: string) => {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const series = selected
    .filter((slug) => allRecords[slug])
    .map((slug) => {
      const company = COMPANIES.find((c) => c.slug === slug)!;
      const records = allRecords[slug] ?? [];
      return {
        companySlug: slug,
        companyName: company.shortName,
        points: records
          .map((r) => ({
            period: r.period.periodLabel,
            value: getMetricValue(r, metric) ?? 0,
          }))
          .filter((p) => p.value !== 0),
      };
    })
    .filter((s) => s.points.length > 0);

  const selectedMetricLabel = METRICS.find((m) => m.key === metric)?.label ?? '';

  return (
    <PageWrapper>
      <div className="mb-10">
        <p className="text-[11px] text-ink-muted uppercase tracking-widest font-mono mb-3">Compare</p>
        <h1 className="text-[32px] font-light tracking-tight text-ink">Side-by-side comparison</h1>
        <p className="mt-3 text-[14px] text-ink-muted">
          Select companies and a metric to compare across reporting periods.
        </p>
      </div>

      {/* Controls */}
      <div className="grid sm:grid-cols-2 gap-8 mb-10">
        {/* Company selector */}
        <div>
          <p className="text-[11px] text-ink-muted uppercase tracking-widest mb-3">Companies</p>
          <div className="flex flex-wrap gap-2">
            {COMPANIES.map((c) => (
              <button
                key={c.slug}
                onClick={() => toggleCompany(c.slug)}
                className={`px-3 py-1.5 text-[12px] border rounded transition-colors ${
                  selected.includes(c.slug)
                    ? 'bg-ink text-surface border-ink'
                    : 'border-border text-ink-muted hover:border-ink hover:text-ink'
                }`}
              >
                {c.shortName}
              </button>
            ))}
          </div>
        </div>

        {/* Metric selector */}
        <div>
          <p className="text-[11px] text-ink-muted uppercase tracking-widest mb-3">Metric</p>
          <div className="flex flex-wrap gap-2">
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`px-3 py-1.5 text-[12px] border rounded transition-colors ${
                  metric === m.key
                    ? 'bg-ink text-surface border-ink'
                    : 'border-border text-ink-muted hover:border-ink hover:text-ink'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={indexed}
                onChange={(e) => setIndexed(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-[12px] text-ink-muted">Index to base period (100)</span>
            </label>
          </div>
        </div>
      </div>

      <Divider className="mb-8" />

      {/* Chart */}
      {series.length > 0 ? (
        <>
          <div className="mb-8">
            <p className="text-[11px] text-ink-muted uppercase tracking-widest mb-4">
              {selectedMetricLabel} {indexed ? '(indexed)' : ''}
            </p>
            <CompareChart series={series} metricLabel={selectedMetricLabel} indexed={indexed} />
          </div>

          <Divider className="my-8" />

          {/* Data table */}
          <div>
            <p className="text-[11px] text-ink-muted uppercase tracking-widest mb-4">Data Table</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-6 font-normal text-ink-muted">Period</th>
                    {selected.map((slug) => {
                      const company = COMPANIES.find((c) => c.slug === slug)!;
                      return (
                        <th key={slug} className="text-right py-2 px-3 font-medium text-ink text-[12px] font-mono">
                          {company.shortName}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {Array.from(new Set(series.flatMap((s) => s.points.map((p) => p.period)))).sort().map((period) => (
                    <tr key={period} className="border-b border-border/60 hover:bg-surface-raised">
                      <td className="py-2 pr-6 text-ink-muted text-[12px] font-mono">{period}</td>
                      {selected.map((slug) => {
                        const s = series.find((s) => s.companySlug === slug);
                        const pt = s?.points.find((p) => p.period === period);
                        return (
                          <td key={slug} className="py-2 px-3 text-right tabular-nums font-mono text-[12px] text-ink">
                            {pt ? formatNumber(pt.value) : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="py-16 text-center">
          <p className="text-[13px] text-ink-muted">Select at least one company to compare.</p>
        </div>
      )}
    </PageWrapper>
  );
}
