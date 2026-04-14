'use client';

import { useState, lazy, Suspense } from 'react';
import Toggle from '@/components/ui/Toggle';
import GrowthBadge from '@/components/ui/GrowthBadge';
import { formatNumber, formatMillions, formatGrowth, convertToUsd, currencySymbol } from '@/lib/utils';
import type { CompanyData, FinancialPeriod, MetricKey } from '@/types';

const LineChartWrapper = lazy(() => import('@/components/charts/LineChartWrapper'));

type Tab = 'income' | 'balance' | 'cashflow' | 'operational';
type PeriodMode = 'annual' | 'quarterly';
type FiscalMode = 'fy' | 'cy';
type CurrencyMode = 'original' | 'usd';

const TABS: { key: Tab; label: string }[] = [
  { key: 'income', label: 'Income Statement' },
  { key: 'balance', label: 'Balance Sheet' },
  { key: 'cashflow', label: 'Cash Flow' },
  { key: 'operational', label: 'Operational' },
];

function val(p: FinancialPeriod, key: keyof FinancialPeriod, mode: CurrencyMode): number | null {
  const raw = p[key] as number | null;
  if (mode === 'original') return raw;
  return convertToUsd(raw, p.usd_rate);
}

interface TableRow {
  label: string;
  key?: keyof FinancialPeriod;
  derived?: (p: FinancialPeriod, mode: CurrencyMode) => number | null;
  isSubtotal?: boolean;
  indent?: boolean;
  isPercent?: boolean;
}

function FinTable({ periods, rows, sym, unit }: {
  periods: FinancialPeriod[];
  rows: TableRow[];
  sym: string;
  unit: string;
}) {
  return (
    <div className="table-scroll">
      <table className="w-full min-w-[560px]">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-2 pr-4 text-left text-[11px] font-mono uppercase tracking-wide text-ink-faint w-44">
              {sym} {unit}
            </th>
            {periods.map((p) => (
              <th key={p.period_label} className="pb-2 pr-4 text-right text-[11px] font-mono uppercase tracking-wide text-ink-faint whitespace-nowrap">
                {p.period_label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className={`border-b border-border ${row.isSubtotal ? 'font-medium' : ''}`}>
              <td className={`py-2 pr-4 text-[12px] text-ink-muted ${row.indent ? 'pl-4' : ''}`}>
                {row.label}
              </td>
              {periods.map((p) => {
                const v = row.key ? val(p, row.key, 'original') : row.derived ? row.derived(p, 'original') : null;
                const isNeg = v !== null && v < 0;
                return (
                  <td key={p.period_label} className={`py-2 pr-4 text-right font-mono text-[12px] whitespace-nowrap ${isNeg ? 'text-negative' : ''}`}>
                    {row.isPercent
                      ? v !== null ? `${v.toFixed(1)}%` : '—'
                      : v !== null ? formatNumber(v, 1) : '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CompanyTabs({ company }: { company: CompanyData }) {
  const [tab, setTab] = useState<Tab>('income');
  const [periodMode, setPeriodMode] = useState<PeriodMode>('annual');
  const [fiscalMode, setFiscalMode] = useState<FiscalMode>('fy');
  const [currMode, setCurrMode] = useState<CurrencyMode>('original');

  const sym = currMode === 'original' ? currencySymbol(company.currency) : '$';
  const unit = company.reporting_unit;

  // Filter periods
  const allPeriods = company.periods.filter((p) =>
    periodMode === 'annual' ? p.period_type === 'FY' : p.period_type === 'Q'
  );
  const periods = [...allPeriods].sort((a, b) => {
    if (a.fiscal_year !== b.fiscal_year) return a.fiscal_year - b.fiscal_year;
    return (a.fiscal_quarter ?? 0) - (b.fiscal_quarter ?? 0);
  });

  // Chart data for active tab
  function chartData(key: keyof FinancialPeriod) {
    return periods.map((p) => ({
      label: p.period_label,
      value: val(p, key, currMode),
    }));
  }

  const INCOME_ROWS: TableRow[] = [
    { label: 'Revenue', key: 'revenue', isSubtotal: true },
    { label: 'Gross Profit', key: 'gross_profit' },
    { label: 'Gross Margin', isPercent: true, derived: (p, m) => {
      const r = val(p, 'revenue', m);
      const g = val(p, 'gross_profit', m);
      return r && g ? (g / r) * 100 : null;
    }},
    { label: 'Operating Income', key: 'operating_income' },
    { label: 'Op. Margin', isPercent: true, derived: (p, m) => {
      const r = val(p, 'revenue', m);
      const o = val(p, 'operating_income', m);
      return r && o ? (o / r) * 100 : null;
    }},
    { label: 'EBITDA', key: 'ebitda', isSubtotal: true },
    { label: 'EBITDA Margin', isPercent: true, derived: (p, m) => {
      const r = val(p, 'revenue', m);
      const e = val(p, 'ebitda', m);
      return r && e ? (e / r) * 100 : null;
    }},
    { label: 'Net Income', key: 'net_income', isSubtotal: true },
    { label: 'Net Margin', isPercent: true, derived: (p, m) => {
      const r = val(p, 'revenue', m);
      const n = val(p, 'net_income', m);
      return r && n ? (n / r) * 100 : null;
    }},
  ];

  const BALANCE_ROWS: TableRow[] = [
    { label: 'Total Assets', key: 'total_assets', isSubtotal: true },
    { label: 'Cash & Equivalents', key: 'cash_and_equivalents', indent: true },
    { label: 'Total Debt', key: 'total_debt' },
    { label: 'Total Equity', key: 'total_equity', isSubtotal: true },
    { label: 'Net Cash', derived: (p, m) => {
      const cash = val(p, 'cash_and_equivalents', m);
      const debt = val(p, 'total_debt', m);
      return cash !== null && debt !== null ? cash - debt : null;
    }},
  ];

  const CASHFLOW_ROWS: TableRow[] = [
    { label: 'Operating Cash Flow', key: 'operating_cash_flow', isSubtotal: true },
    { label: 'CapEx', key: 'capex', indent: true },
    { label: 'Free Cash Flow', key: 'free_cash_flow', isSubtotal: true },
    { label: 'FCF Margin', isPercent: true, derived: (p, m) => {
      const r = val(p, 'revenue', m);
      const f = val(p, 'free_cash_flow', m);
      return r && f ? (f / r) * 100 : null;
    }},
  ];

  const OP_ROWS: TableRow[] = [
    { label: 'Paid Users', key: 'paid_users' },
    { label: 'ARPU', key: 'arpu' },
  ];

  const tabRows: Record<Tab, TableRow[]> = {
    income: INCOME_ROWS,
    balance: BALANCE_ROWS,
    cashflow: CASHFLOW_ROWS,
    operational: OP_ROWS,
  };

  const chartKey: Record<Tab, keyof FinancialPeriod> = {
    income: 'revenue',
    balance: 'total_assets',
    cashflow: 'free_cash_flow',
    operational: 'paid_users',
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Toggle
          options={[{ value: 'annual', label: 'Annual' }, { value: 'quarterly', label: 'Quarterly' }]}
          value={periodMode}
          onChange={(v) => setPeriodMode(v as PeriodMode)}
        />
        <Toggle
          options={[{ value: 'fy', label: 'FY' }, { value: 'cy', label: 'CY' }]}
          value={fiscalMode}
          onChange={(v) => setFiscalMode(v as FiscalMode)}
        />
        <Toggle
          options={[{ value: 'original', label: `${company.currency}` }, { value: 'usd', label: 'USD' }]}
          value={currMode}
          onChange={(v) => setCurrMode(v as CurrencyMode)}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6 gap-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-[12px] font-mono transition-colors whitespace-nowrap ${
              tab === t.key
                ? 'border-b-2 border-ink text-ink -mb-px'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {periods.length > 0 && (
        <div className="mb-6">
          <Suspense fallback={<div className="h-[260px] bg-surface-raised animate-pulse rounded" />}>
            <LineChartWrapper
              data={chartData(chartKey[tab])}
              prefix={currMode === 'usd' ? '$' : currencySymbol(company.currency)}
            />
          </Suspense>
        </div>
      )}

      {/* Table */}
      {periods.length > 0 ? (
        <FinTable periods={periods} rows={tabRows[tab]} sym={sym} unit={unit} />
      ) : (
        <p className="text-ink-faint text-sm">No {periodMode} data available.</p>
      )}
    </div>
  );
}
