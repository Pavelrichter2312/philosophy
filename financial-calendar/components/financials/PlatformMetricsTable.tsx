import { FinancialPeriodRecord } from '@/types/financials';
import { formatNumber } from '@/lib/utils/numbers';

interface PlatformMetricsTableProps {
  records: FinancialPeriodRecord[];
}

export default function PlatformMetricsTable({ records }: PlatformMetricsTableProps) {
  const headers = records.map((r) => r.period.periodLabel);
  const unit = records[0]?.period.unit ?? 'millions';
  const currency = records[0]?.period.currency ?? '';

  return (
    <div className="overflow-x-auto">
      <div className="text-[11px] text-ink-faint mb-3">
        Reported in {currency} {unit} · Client counts in absolute numbers
      </div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-6 font-normal text-ink-muted w-64" />
            {headers.map((h, i) => (
              <th key={i} className="text-right py-2 px-3 font-medium text-ink tabular-nums font-mono text-[12px]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border/60 hover:bg-surface-raised">
            <td className="py-2 pr-6 text-ink-muted text-[12px]">Paid Clients / Subscribers</td>
            {records.map((r, i) => (
              <td key={i} className="py-2 px-3 text-right tabular-nums font-mono text-[12px] text-ink">
                {r.platformMetrics.paidClientsOrSubscribers !== undefined
                  ? r.platformMetrics.paidClientsOrSubscribers.toLocaleString('en-US')
                  : '—'}
              </td>
            ))}
          </tr>
          <tr className="border-b border-border/60 hover:bg-surface-raised">
            <td className="py-2 pr-6 pl-4 text-ink-muted text-[12px]">YoY Growth</td>
            {records.map((r, i) => {
              const g = r.platformMetrics.paidClientsGrowthYoY;
              return (
                <td key={i} className={`py-2 px-3 text-right tabular-nums font-mono text-[12px] ${g !== undefined && g < 0 ? 'text-negative' : 'text-positive'}`}>
                  {g !== undefined ? `${g >= 0 ? '+' : ''}${(g * 100).toFixed(1)}%` : '—'}
                </td>
              );
            })}
          </tr>
          <tr className="border-b border-border/60 hover:bg-surface-raised">
            <td className="py-2 pr-6 text-ink-muted text-[12px]">
              {records[0]?.platformMetrics.arpuLabel ?? 'ARPU'}
            </td>
            {records.map((r, i) => (
              <td key={i} className="py-2 px-3 text-right tabular-nums font-mono text-[12px] text-ink">
                {r.platformMetrics.arpuValue !== undefined
                  ? formatNumber(r.platformMetrics.arpuValue, 'millions', 0)
                  : '—'}
              </td>
            ))}
          </tr>
          <tr className="border-b border-border/60 hover:bg-surface-raised">
            <td className="py-2 pr-6 pl-4 text-ink-muted text-[12px]">ARPU YoY Growth</td>
            {records.map((r, i) => {
              const g = r.platformMetrics.arpuGrowthYoY;
              return (
                <td key={i} className={`py-2 px-3 text-right tabular-nums font-mono text-[12px] ${g !== undefined && g < 0 ? 'text-negative' : 'text-positive'}`}>
                  {g !== undefined ? `${g >= 0 ? '+' : ''}${(g * 100).toFixed(1)}%` : '—'}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
