'use client';

import { useState } from 'react';
import Link from 'next/link';
import Toggle from '@/components/ui/Toggle';
import GrowthBadge from '@/components/ui/GrowthBadge';
import { formatMillions, formatGrowth, formatNumber, convertToUsd, currencySymbol } from '@/lib/utils';
import type { CompanyData, FinancialPeriod } from '@/types';

interface Row {
  company: CompanyData;
  latest: FinancialPeriod | null;
  prev: FinancialPeriod | null;
}

interface Props {
  rows: Row[];
  lastUpdated: string;
}

type CurrencyMode = 'original' | 'usd';

const CURRENCY_OPTS = [
  { value: 'original', label: 'Local' },
  { value: 'usd', label: 'USD' },
];

function getVal(p: FinancialPeriod | null, key: keyof FinancialPeriod, mode: CurrencyMode): number | null {
  if (!p) return null;
  const raw = p[key] as number | null;
  if (mode === 'original') return raw;
  return convertToUsd(raw, p.usd_rate);
}

export default function DashboardTable({ rows, lastUpdated }: Props) {
  const [mode, setMode] = useState<CurrencyMode>('original');
  const [updating, setUpdating] = useState(false);
  const [updateLog, setUpdateLog] = useState<string[]>([]);

  async function handleUpdate() {
    setUpdating(true);
    setUpdateLog([]);
    try {
      const res = await fetch('/api/update');
      if (!res.body) throw new Error('No stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((l) => l.startsWith('data:'));
        for (const line of lines) {
          const msg = line.replace(/^data:\s*/, '').trim();
          if (msg && msg !== 'DONE') {
            setUpdateLog((prev) => [...prev.slice(-19), msg]);
          }
        }
      }
    } catch (e) {
      setUpdateLog((prev) => [...prev, String(e)]);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-4">
          <Toggle options={CURRENCY_OPTS} value={mode} onChange={(v) => setMode(v as CurrencyMode)} />
          <span className="text-[11px] text-ink-faint font-mono">
            Updated {new Date(lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <button
          onClick={handleUpdate}
          disabled={updating}
          className="text-[11px] font-mono px-3 py-1 border border-border rounded hover:border-ink transition-colors disabled:opacity-50"
        >
          {updating ? 'Updating…' : 'Update Data'}
        </button>
      </div>

      {/* SSE log */}
      {updateLog.length > 0 && (
        <div className="mb-4 p-3 bg-surface-raised border border-border rounded font-mono text-[11px] text-ink-muted max-h-32 overflow-y-auto">
          {updateLog.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="table-scroll">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-border">
              {['Company', 'Ticker', 'Period', 'Revenue', 'Net Income', 'FCF', 'Paid Users', 'ARPU', 'YoY Rev'].map(
                (h) => (
                  <th key={h} className="pb-2 pr-5 text-left text-[11px] font-mono uppercase tracking-wide text-ink-faint whitespace-nowrap">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ company, latest, prev }) => {
              const sym = mode === 'usd' ? '$' : currencySymbol(company.currency);
              const unit = company.reporting_unit;

              const rev = getVal(latest, 'revenue', mode);
              const prevRev = getVal(prev, 'revenue', mode);
              const ni = getVal(latest, 'net_income', mode);
              const fcf = getVal(latest, 'free_cash_flow', mode);
              const yoy = formatGrowth(rev, prevRev);

              const paidUsers = latest?.paid_users ?? null;
              const arpu = latest?.arpu ?? null;

              return (
                <tr key={company.company_id} className="border-b border-border group hover:bg-surface-raised transition-colors">
                  <td className="py-3 pr-5">
                    <Link
                      href={`/company/${company.company_id}`}
                      className="text-[13px] font-medium text-ink hover:underline"
                    >
                      {company.name.split(' ')[0] === 'Info' ? 'InfoEdge' : company.name.split(',')[0].replace(' Limited', '').replace(' Group PLC', '').replace(' Holdings Co.', ' Holdings')}
                    </Link>
                  </td>
                  <td className="py-3 pr-5 font-mono text-[12px] text-ink-muted">{company.ticker}</td>
                  <td className="py-3 pr-5 font-mono text-[12px] text-ink-muted">
                    {latest?.period_label ?? '—'}
                  </td>
                  <td className="py-3 pr-5 font-mono text-[13px] text-right whitespace-nowrap">
                    {rev !== null ? `${sym}${formatMillions(rev)}` : '—'}
                  </td>
                  <td className={`py-3 pr-5 font-mono text-[13px] text-right whitespace-nowrap ${(ni ?? 0) < 0 ? 'text-negative' : ''}`}>
                    {ni !== null ? `${sym}${formatMillions(ni)}` : '—'}
                  </td>
                  <td className={`py-3 pr-5 font-mono text-[13px] text-right whitespace-nowrap ${(fcf ?? 0) < 0 ? 'text-negative' : ''}`}>
                    {fcf !== null ? `${sym}${formatMillions(fcf)}` : '—'}
                  </td>
                  <td className="py-3 pr-5 font-mono text-[13px] text-right whitespace-nowrap">
                    {paidUsers !== null ? formatLargeUsers(paidUsers) : '—'}
                  </td>
                  <td className="py-3 pr-5 font-mono text-[13px] text-right whitespace-nowrap">
                    {arpu !== null
                      ? mode === 'usd' && latest
                        ? `$${formatNumber(arpu * latest.usd_rate, 0)}`
                        : `${sym}${formatNumber(arpu, 0)}`
                      : '—'}
                  </td>
                  <td className="py-3">
                    <GrowthBadge value={yoy} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-ink-faint">
        Values in {mode === 'usd' ? 'USD' : 'original reporting currencies'} · {rows[0]?.company.reporting_unit ?? 'millions'}
      </p>
    </div>
  );
}

function formatLargeUsers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
