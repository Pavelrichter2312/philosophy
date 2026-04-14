'use client';

import { useState, useMemo, lazy, Suspense } from 'react';
import Toggle from '@/components/ui/Toggle';
import { convertToUsd, formatNumber, formatGrowthStr, calcCAGR, currencySymbol } from '@/lib/utils';
import { COMPARATOR_COLORS } from '@/lib/companies';
import type { CompanyData, FinancialPeriod, MetricKey, Horizon } from '@/types';

const MultiLineChartWrapper = lazy(() => import('@/components/charts/MultiLineChartWrapper'));

const METRICS: { key: MetricKey; label: string }[] = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'net_income', label: 'Net Income' },
  { key: 'ebitda', label: 'EBITDA' },
  { key: 'free_cash_flow', label: 'Free Cash Flow' },
  { key: 'operating_income', label: 'Operating Income' },
  { key: 'paid_users', label: 'Paid Users' },
  { key: 'arpu', label: 'ARPU' },
];

const HORIZONS: { value: Horizon; label: string }[] = [
  { value: '1Y', label: '1Y' },
  { value: '2Y', label: '2Y' },
  { value: '3Y', label: '3Y' },
  { value: '5Y', label: '5Y' },
  { value: 'MAX', label: 'MAX' },
];

type CurrencyMode = 'original' | 'usd';

function getMetricValue(p: FinancialPeriod, key: MetricKey, mode: CurrencyMode): number | null {
  const raw = p[key] as number | null;
  if (raw === null) return null;
  if (mode === 'usd') return convertToUsd(raw, p.usd_rate);
  return raw;
}

interface Props {
  companies: CompanyData[];
}

export default function Comparator({ companies }: Props) {
  const defaultIds = companies.slice(0, 4).map((c) => c.company_id);
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultIds);
  const [metric, setMetric] = useState<MetricKey>('revenue');
  const [currMode, setCurrMode] = useState<CurrencyMode>('usd');
  const [baseYear, setBaseYear] = useState<number | null>(null);
  const [horizon, setHorizon] = useState<Horizon>('MAX');
  const [indexed, setIndexed] = useState(false);

  // All available years across all companies
  const allYears = useMemo(() => {
    const ysMap: Record<number, true> = {};
    companies.forEach((c) => {
      c.periods.filter((p) => p.period_type === 'FY').forEach((p) => { ysMap[p.fiscal_year] = true; });
    });
    return Object.keys(ysMap).map(Number).sort((a, b) => a - b);
  }, [companies]);

  const maxYear = allYears[allYears.length - 1] ?? new Date().getFullYear();
  const minYear = allYears[0] ?? 2019;

  // Apply horizon filter
  const visibleYears = useMemo(() => {
    if (horizon === 'MAX') return allYears;
    const n = horizon === '1Y' ? 1 : horizon === '2Y' ? 2 : horizon === '3Y' ? 3 : 5;
    const from = maxYear - n;
    return allYears.filter((y) => y >= from);
  }, [allYears, horizon, maxYear]);

  // Build series for each selected company
  const series = useMemo(() => {
    return selectedIds.map((id, idx) => {
      const company = companies.find((c) => c.company_id === id)!;
      const annuals = company.periods
        .filter((p) => p.period_type === 'FY')
        .sort((a, b) => a.fiscal_year - b.fiscal_year);

      const baseYearPeriod = baseYear
        ? annuals.find((p) => p.fiscal_year === baseYear)
        : null;
      const baseVal = baseYearPeriod ? getMetricValue(baseYearPeriod, metric, currMode) : null;
      const hasBaseYear = baseYear === null || baseVal !== null;

      const data = visibleYears.map((year) => {
        const period = annuals.find((p) => p.fiscal_year === year);
        const raw = period ? getMetricValue(period, metric, currMode) : null;
        let value: number | null = raw;
        if (indexed && baseVal && raw !== null) {
          value = (raw / baseVal) * 100;
        }
        return { year, value };
      });

      return {
        company_id: id,
        name: company.name,
        ticker: company.ticker,
        color: COMPARATOR_COLORS[idx % COMPARATOR_COLORS.length],
        data,
        hasBaseYear,
        company,
      };
    });
  }, [selectedIds, companies, metric, currMode, baseYear, indexed, visibleYears]);

  const activeSeries = series.filter((s) => s.hasBaseYear);
  const missingBaseSeries = series.filter((s) => !s.hasBaseYear);

  // CAGR table
  const cagrData = useMemo(() => {
    if (visibleYears.length < 2) return [];
    const startYear = visibleYears[0];
    const endYear = visibleYears[visibleYears.length - 1];
    const years = endYear - startYear;
    return activeSeries.map((s) => {
      const annuals = s.company.periods.filter((p) => p.period_type === 'FY');
      const startP = annuals.find((p) => p.fiscal_year === startYear);
      const endP = annuals.find((p) => p.fiscal_year === endYear);
      const startVal = startP ? getMetricValue(startP, metric, currMode) : null;
      const endVal = endP ? getMetricValue(endP, metric, currMode) : null;
      const cagr = startVal && endVal && startVal > 0 ? calcCAGR(startVal, endVal, years) : null;
      return { ticker: s.ticker, name: s.name, cagr, color: s.color };
    });
  }, [activeSeries, visibleYears, metric, currMode]);

  function toggleCompany(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div>
      {/* Company selector */}
      <div className="mb-6">
        <div className="text-[11px] font-mono uppercase tracking-wide text-ink-faint mb-2">Companies</div>
        <div className="flex flex-wrap gap-2">
          {companies.map((c, i) => {
            const selected = selectedIds.includes(c.company_id);
            const color = selected
              ? COMPARATOR_COLORS[selectedIds.indexOf(c.company_id) % COMPARATOR_COLORS.length]
              : undefined;
            return (
              <button
                key={c.company_id}
                onClick={() => toggleCompany(c.company_id)}
                className={`px-3 py-1.5 text-[12px] font-mono border rounded transition-colors ${
                  selected ? 'text-white border-transparent' : 'text-ink-muted border-border hover:border-ink'
                }`}
                style={selected ? { background: color, borderColor: color } : undefined}
              >
                {c.ticker}
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Metric select */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wide text-ink-faint mb-1">Metric</div>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as MetricKey)}
            className="text-[12px] font-mono border border-border rounded px-2 py-1 bg-surface text-ink focus:outline-none focus:border-ink"
          >
            {METRICS.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Currency */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wide text-ink-faint mb-1">Currency</div>
          <Toggle
            options={[{ value: 'usd', label: 'USD' }, { value: 'original', label: 'Local' }]}
            value={currMode}
            onChange={(v) => setCurrMode(v as CurrencyMode)}
          />
        </div>

        {/* Base year */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wide text-ink-faint mb-1">Base Year</div>
          <select
            value={baseYear ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              setBaseYear(v ? Number(v) : null);
              setIndexed(!!v);
            }}
            className="text-[12px] font-mono border border-border rounded px-2 py-1 bg-surface text-ink focus:outline-none focus:border-ink"
          >
            <option value="">None</option>
            {allYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Horizon */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wide text-ink-faint mb-1">Horizon</div>
          <Toggle
            options={HORIZONS}
            value={horizon}
            onChange={(v) => setHorizon(v as Horizon)}
          />
        </div>
      </div>

      {/* Missing base year notices */}
      {missingBaseSeries.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {missingBaseSeries.map((s) => (
            <span key={s.company_id} className="text-[11px] font-mono text-ink-faint bg-surface-raised px-2 py-1 rounded">
              {s.ticker} — нет данных за {baseYear}
            </span>
          ))}
        </div>
      )}

      {/* Chart */}
      {activeSeries.length > 0 && visibleYears.length > 0 ? (
        <div className="mb-6">
          <Suspense fallback={<div className="h-[320px] bg-surface-raised animate-pulse rounded" />}>
            <MultiLineChartWrapper
              series={activeSeries}
              years={visibleYears}
              indexed={indexed}
              prefix={currMode === 'usd' ? '$' : ''}
            />
          </Suspense>
          {indexed && <p className="text-[11px] text-ink-faint font-mono mt-1">Indexed to 100 at {baseYear}</p>}
        </div>
      ) : (
        <div className="h-[320px] flex items-center justify-center text-ink-faint text-sm border border-border rounded mb-6">
          Select at least one company
        </div>
      )}

      {/* CAGR Table */}
      {cagrData.length > 0 && (
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wide text-ink-faint mb-2">
            CAGR {visibleYears[0]}–{visibleYears[visibleYears.length - 1]}
          </div>
          <div className="table-scroll">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-border">
                  {['Company', 'Ticker', 'CAGR'].map((h) => (
                    <th key={h} className="pb-2 pr-6 text-left text-[11px] font-mono uppercase tracking-wide text-ink-faint">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cagrData
                  .sort((a, b) => (b.cagr ?? -999) - (a.cagr ?? -999))
                  .map((row) => (
                    <tr key={row.ticker} className="border-b border-border">
                      <td className="py-2.5 pr-6 text-[13px] text-ink">{row.name.split(' ')[0]}</td>
                      <td className="py-2.5 pr-6 font-mono text-[12px] text-ink-muted">{row.ticker}</td>
                      <td className={`py-2.5 font-mono text-[13px] ${(row.cagr ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {row.cagr !== null ? `${formatGrowthStr(row.cagr)} p.a.` : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
