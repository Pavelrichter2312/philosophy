'use client';

import { useState, lazy, Suspense } from 'react';
import Toggle from '@/components/ui/Toggle';
import { formatNumber, convertToUsd, currencySymbol } from '@/lib/utils';
import type { CompanyData, FinancialPeriod } from '@/types';

const BarChart = lazy(() => import('@/components/charts/BarChartWrapper'));
const MarginChart = lazy(() => import('@/components/charts/MarginLineChart'));

type Tab = 'income' | 'balance' | 'cashflow';
type PeriodMode = 'annual' | 'quarterly';
type CurrencyMode = 'original' | 'usd';

const TABS: { key: Tab; label: string }[] = [
  { key: 'income', label: 'Income Statement' },
  { key: 'balance', label: 'Balance Sheet' },
  { key: 'cashflow', label: 'Cash Flow' },
];

function v(p: FinancialPeriod, key: keyof FinancialPeriod, mode: CurrencyMode): number | null {
  const raw = p[key] as number | null;
  if (raw === null) return null;
  return mode === 'usd' ? convertToUsd(raw, p.usd_rate) : raw;
}

// ─── Chart skeleton ───────────────────────────────────────────────────────────
function ChartSkeleton() {
  return <div className="h-[180px] bg-surface-raised animate-pulse rounded" />;
}

// ─── Chart grid: 2-up on desktop ─────────────────────────────────────────────
function ChartGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 p-5 bg-surface-raised border border-border rounded">
      {children}
    </div>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-mono uppercase tracking-widest text-ink-faint mb-4 mt-8 first:mt-0">
      {children}
    </h3>
  );
}

// ─── Financial table ─────────────────────────────────────────────────────────
interface TableRow {
  label: string;
  key?: keyof FinancialPeriod;
  derived?: (p: FinancialPeriod) => number | null;
  isSubtotal?: boolean;
  indent?: boolean;
  isPercent?: boolean;
  highlight?: boolean;
}

function FinTable({
  periods,
  rows,
  sym,
  unit,
  mode,
}: {
  periods: FinancialPeriod[];
  rows: TableRow[];
  sym: string;
  unit: string;
  mode: CurrencyMode;
}) {
  return (
    <div className="table-scroll">
      <table className="w-full min-w-[520px]">
        <thead>
          <tr className="border-b-2 border-border">
            <th className="pb-2.5 pr-5 text-left text-[10px] font-mono uppercase tracking-widest text-ink-faint w-48">
              {sym} {unit}
            </th>
            {periods.map((p) => (
              <th
                key={p.period_label}
                className="pb-2.5 pr-4 text-right text-[10px] font-mono uppercase tracking-widest text-ink-faint whitespace-nowrap"
              >
                {p.period_label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`border-b border-border transition-colors ${
                row.highlight ? 'bg-surface-raised' : ''
              } ${row.isSubtotal ? '' : ''}`}
            >
              <td
                className={`py-2.5 pr-5 text-[12px] ${
                  row.indent ? 'pl-5 text-ink-muted' : ''
                } ${row.isSubtotal ? 'font-medium text-ink' : 'text-ink-muted'}`}
              >
                {row.label}
              </td>
              {periods.map((p) => {
                const val = row.key
                  ? v(p, row.key, mode)
                  : row.derived
                  ? row.derived(p)
                  : null;
                const isNeg = val !== null && val < 0;
                const isEmpty = val === null;
                return (
                  <td
                    key={p.period_label}
                    className={`py-2.5 pr-4 text-right font-mono text-[12px] whitespace-nowrap ${
                      isEmpty
                        ? 'text-ink-faint'
                        : isNeg
                        ? 'text-negative'
                        : row.isSubtotal
                        ? 'text-ink font-medium'
                        : 'text-ink-muted'
                    }`}
                  >
                    {isEmpty
                      ? '—'
                      : row.isPercent
                      ? `${val!.toFixed(1)}%`
                      : formatNumber(val!, 1)}
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

// ─── Main component ───────────────────────────────────────────────────────────
export default function CompanyTabs({ company }: { company: CompanyData }) {
  const [tab, setTab] = useState<Tab>('income');
  const [periodMode, setPeriodMode] = useState<PeriodMode>('annual');
  const [currMode, setCurrMode] = useState<CurrencyMode>('original');

  const sym = currMode === 'original' ? currencySymbol(company.currency) : '$';
  const unit = company.reporting_unit;
  const prefix = sym;

  const periods = company.periods
    .filter((p) =>
      periodMode === 'annual' ? p.period_type === 'FY' : p.period_type === 'Q'
    )
    .sort((a, b) => {
      if (a.fiscal_year !== b.fiscal_year) return a.fiscal_year - b.fiscal_year;
      return (a.fiscal_quarter ?? 0) - (b.fiscal_quarter ?? 0);
    });

  // helpers to build chart data
  function cd(key: keyof FinancialPeriod) {
    return periods.map((p) => ({ label: p.period_label, value: v(p, key, currMode) }));
  }
  function cdDerived(fn: (p: FinancialPeriod) => number | null) {
    return periods.map((p) => ({ label: p.period_label, value: fn(p) }));
  }
  function margin(num: keyof FinancialPeriod, den: keyof FinancialPeriod) {
    return cdDerived((p) => {
      const n = v(p, num, currMode);
      const d = v(p, den, currMode);
      return n !== null && d !== null && d !== 0 ? (n / d) * 100 : null;
    });
  }

  // ── Income Statement rows ──────────────────────────────────────────────────
  const incomeRows: TableRow[] = [
    { label: 'Revenue', key: 'revenue', isSubtotal: true, highlight: true },
    { label: 'Gross Profit', key: 'gross_profit', indent: true },
    {
      label: 'Gross Margin',
      isPercent: true,
      indent: true,
      derived: (p) => {
        const r = v(p, 'revenue', currMode);
        const g = v(p, 'gross_profit', currMode);
        return r && g ? (g / r) * 100 : null;
      },
    },
    { label: 'Operating Income', key: 'operating_income' },
    {
      label: 'Op. Margin',
      isPercent: true,
      indent: true,
      derived: (p) => {
        const r = v(p, 'revenue', currMode);
        const o = v(p, 'operating_income', currMode);
        return r && o ? (o / r) * 100 : null;
      },
    },
    { label: 'EBITDA', key: 'ebitda', isSubtotal: true },
    {
      label: 'EBITDA Margin',
      isPercent: true,
      indent: true,
      derived: (p) => {
        const r = v(p, 'revenue', currMode);
        const e = v(p, 'ebitda', currMode);
        return r && e ? (e / r) * 100 : null;
      },
    },
    { label: 'Net Income', key: 'net_income', isSubtotal: true, highlight: true },
    {
      label: 'Net Margin',
      isPercent: true,
      indent: true,
      derived: (p) => {
        const r = v(p, 'revenue', currMode);
        const n = v(p, 'net_income', currMode);
        return r && n ? (n / r) * 100 : null;
      },
    },
  ];

  // ── Balance Sheet rows ────────────────────────────────────────────────────
  const balanceRows: TableRow[] = [
    { label: 'Total Assets', key: 'total_assets', isSubtotal: true, highlight: true },
    { label: 'Cash & Equivalents', key: 'cash_and_equivalents', indent: true },
    { label: 'Total Debt', key: 'total_debt' },
    {
      label: 'Net Cash (Debt)',
      isSubtotal: true,
      derived: (p) => {
        const c = v(p, 'cash_and_equivalents', currMode);
        const d = v(p, 'total_debt', currMode);
        return c !== null && d !== null ? c - d : null;
      },
    },
    { label: 'Total Equity', key: 'total_equity', isSubtotal: true, highlight: true },
  ];

  // ── Cash Flow rows ────────────────────────────────────────────────────────
  const cashRows: TableRow[] = [
    { label: 'Operating Cash Flow', key: 'operating_cash_flow', isSubtotal: true, highlight: true },
    { label: 'Capital Expenditures', key: 'capex', indent: true },
    { label: 'Free Cash Flow', key: 'free_cash_flow', isSubtotal: true, highlight: true },
    {
      label: 'FCF Margin',
      isPercent: true,
      indent: true,
      derived: (p) => {
        const r = v(p, 'revenue', currMode);
        const f = v(p, 'free_cash_flow', currMode);
        return r && f ? (f / r) * 100 : null;
      },
    },
    {
      label: 'FCF Conversion',
      isPercent: true,
      indent: true,
      derived: (p) => {
        const ocf = v(p, 'operating_cash_flow', currMode);
        const fcf = v(p, 'free_cash_flow', currMode);
        return ocf && fcf && ocf !== 0 ? (fcf / ocf) * 100 : null;
      },
    },
  ];

  const noData = periods.length === 0;

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-7">
        <Toggle
          options={[
            { value: 'annual', label: 'Annual' },
            { value: 'quarterly', label: 'Quarterly' },
          ]}
          value={periodMode}
          onChange={(val) => setPeriodMode(val as PeriodMode)}
        />
        <Toggle
          options={[
            { value: 'original', label: company.currency },
            { value: 'usd', label: 'USD' },
          ]}
          value={currMode}
          onChange={(val) => setCurrMode(val as CurrencyMode)}
        />
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border mb-8">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-[12px] font-mono tracking-wide transition-colors whitespace-nowrap ${
              tab === t.key
                ? 'border-b-2 border-ink text-ink -mb-px font-medium'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {noData ? (
        <p className="text-ink-faint text-sm py-8 text-center">
          No {periodMode} data available.
        </p>
      ) : (
        <>
          {/* ── INCOME STATEMENT ───────────────────────────────────────────── */}
          {tab === 'income' && (
            <div>
              <SectionTitle>Revenue &amp; Profitability</SectionTitle>
              <ChartGrid>
                <Suspense fallback={<ChartSkeleton />}>
                  <BarChart
                    data={cd('revenue')}
                    prefix={prefix}
                    color="#1a1a2e"
                    title="Revenue"
                    height={180}
                  />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                  <BarChart
                    data={cd('gross_profit')}
                    prefix={prefix}
                    color="#334155"
                    title="Gross Profit"
                    height={180}
                  />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                  <BarChart
                    data={cd('ebitda')}
                    prefix={prefix}
                    color="#475569"
                    title="EBITDA"
                    height={180}
                  />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                  <BarChart
                    data={cd('net_income')}
                    prefix={prefix}
                    color="#64748b"
                    negativeColor="#dc2626"
                    title="Net Income"
                    height={180}
                  />
                </Suspense>
              </ChartGrid>

              <SectionTitle>Margin Trends</SectionTitle>
              <ChartGrid>
                <Suspense fallback={<ChartSkeleton />}>
                  <MarginChart
                    data={margin('gross_profit', 'revenue')}
                    color="#1a1a2e"
                    title="Gross Margin %"
                    height={180}
                  />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                  <MarginChart
                    data={margin('ebitda', 'revenue')}
                    color="#334155"
                    title="EBITDA Margin %"
                    height={180}
                  />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                  <MarginChart
                    data={margin('operating_income', 'revenue')}
                    color="#475569"
                    title="Operating Margin %"
                    height={180}
                  />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                  <MarginChart
                    data={margin('net_income', 'revenue')}
                    color="#64748b"
                    title="Net Margin %"
                    height={180}
                  />
                </Suspense>
              </ChartGrid>

              <SectionTitle>Full Income Statement</SectionTitle>
              <FinTable periods={periods} rows={incomeRows} sym={sym} unit={unit} mode={currMode} />
            </div>
          )}

          {/* ── BALANCE SHEET ──────────────────────────────────────────────── */}
          {tab === 'balance' && (
            <div>
              <SectionTitle>Assets &amp; Capital Structure</SectionTitle>
              <ChartGrid>
                <Suspense fallback={<ChartSkeleton />}>
                  <BarChart
                    data={cd('total_assets')}
                    prefix={prefix}
                    color="#1a1a2e"
                    title="Total Assets"
                    height={180}
                  />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                  <BarChart
                    data={cd('cash_and_equivalents')}
                    prefix={prefix}
                    color="#334155"
                    title="Cash &amp; Equivalents"
                    height={180}
                  />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                  <BarChart
                    data={cd('total_equity')}
                    prefix={prefix}
                    color="#475569"
                    title="Total Equity"
                    height={180}
                  />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                  <BarChart
                    data={cdDerived((p) => {
                      const c = v(p, 'cash_and_equivalents', currMode);
                      const d = v(p, 'total_debt', currMode);
                      return c !== null && d !== null ? c - d : null;
                    })}
                    prefix={prefix}
                    color="#64748b"
                    negativeColor="#dc2626"
                    title="Net Cash (Debt)"
                    height={180}
                  />
                </Suspense>
              </ChartGrid>

              <SectionTitle>Full Balance Sheet</SectionTitle>
              <FinTable periods={periods} rows={balanceRows} sym={sym} unit={unit} mode={currMode} />
            </div>
          )}

          {/* ── CASH FLOW ──────────────────────────────────────────────────── */}
          {tab === 'cashflow' && (
            <div>
              <SectionTitle>Cash Generation</SectionTitle>
              <ChartGrid>
                <Suspense fallback={<ChartSkeleton />}>
                  <BarChart
                    data={cd('operating_cash_flow')}
                    prefix={prefix}
                    color="#1a1a2e"
                    title="Operating Cash Flow"
                    height={180}
                  />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                  <BarChart
                    data={cd('free_cash_flow')}
                    prefix={prefix}
                    color="#334155"
                    negativeColor="#dc2626"
                    title="Free Cash Flow"
                    height={180}
                  />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                  <BarChart
                    data={cd('capex')}
                    prefix={prefix}
                    color="#94a3b8"
                    title="Capital Expenditures"
                    height={180}
                  />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                  <MarginChart
                    data={margin('free_cash_flow', 'revenue')}
                    color="#475569"
                    title="FCF Margin %"
                    height={180}
                  />
                </Suspense>
              </ChartGrid>

              <SectionTitle>Full Cash Flow Statement</SectionTitle>
              <FinTable periods={periods} rows={cashRows} sym={sym} unit={unit} mode={currMode} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
