import { notFound } from 'next/navigation';
import { COMPANIES, COMPANY_IDS } from '@/lib/companies';
import { readCompany, latestAnnual, prevAnnual } from '@/lib/data';
import { formatMillions, formatGrowth, formatGrowthStr, currencySymbol } from '@/lib/utils';
import CompanyTabs from '@/components/company/CompanyTabs';

export const revalidate = 43200;

export function generateStaticParams() {
  return COMPANY_IDS.map((id) => ({ id }));
}

interface Props {
  params: { id: string };
}

export default async function CompanyPage({ params }: Props) {
  const meta = COMPANIES.find((c) => c.id === params.id);
  if (!meta) notFound();

  const company = readCompany(params.id);
  if (!company) notFound();

  const latest = latestAnnual(company);
  const prev = prevAnnual(company);
  const sym = currencySymbol(company.currency);
  const unit = company.reporting_unit;

  const kpis = [
    { label: 'Revenue', value: latest?.revenue, prev: prev?.revenue },
    { label: 'EBITDA', value: latest?.ebitda, prev: prev?.ebitda },
    { label: 'Net Income', value: latest?.net_income, prev: prev?.net_income },
    { label: 'FCF', value: latest?.free_cash_flow, prev: prev?.free_cash_flow },
    { label: 'Paid Users', value: latest?.paid_users, prev: prev?.paid_users, raw: true },
    { label: 'ARPU', value: latest?.arpu, prev: prev?.arpu },
  ].filter((k) => k.value !== null);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 text-[11px] font-mono text-ink-faint">
        <a href="/dashboard" className="hover:text-ink transition-colors">Dashboard</a>
        <span className="mx-2">›</span>
        <span className="text-ink-muted">{company.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-serif text-3xl font-medium text-ink">{company.name}</h1>
          </div>
          <div className="flex items-center gap-3 text-[12px] font-mono text-ink-muted">
            <span>{company.ticker}</span>
            <span className="text-border-strong">·</span>
            <span>{company.exchange}</span>
            <span className="text-border-strong">·</span>
            <span>{company.currency}</span>
            {latest && (
              <>
                <span className="text-border-strong">·</span>
                <span>{latest.period_label}</span>
              </>
            )}
          </div>
        </div>
        <a
          href={meta.ir_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] font-mono text-ink-muted hover:text-ink border border-border hover:border-ink px-3 py-1.5 rounded transition-colors whitespace-nowrap"
        >
          IR Website ↗
        </a>
      </div>

      {/* KPI Strip */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-px bg-border mb-8 border border-border rounded overflow-hidden">
          {kpis.map((kpi) => {
            const yoy = formatGrowth(kpi.value ?? null, kpi.prev ?? null);
            return (
              <div key={kpi.label} className="bg-surface p-4">
                <div className="text-[10px] font-mono uppercase tracking-wide text-ink-faint mb-1">
                  {kpi.label}
                </div>
                <div className="text-[15px] font-mono font-medium text-ink">
                  {kpi.raw
                    ? formatUsersKpi(kpi.value!)
                    : `${sym}${formatMillions(kpi.value ?? null)}`}
                </div>
                {yoy !== null && (
                  <div className={`text-[11px] font-mono mt-0.5 ${yoy >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {formatGrowthStr(yoy)} YoY
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <CompanyTabs company={company} />
    </div>
  );
}

function formatUsersKpi(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
