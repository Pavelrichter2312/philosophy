import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCompany, COMPANY_SLUGS } from '@/lib/constants/companies';
import { readFinancials, readEarnings } from '@/lib/data/reader';
import PageWrapper from '@/components/layout/PageWrapper';
import ExchangeBadge from '@/components/company/ExchangeBadge';
import GrowthPill from '@/components/financials/GrowthPill';
import IncomeStatement from '@/components/financials/IncomeStatement';
import BalanceSheet from '@/components/financials/BalanceSheet';
import CashFlowStatement from '@/components/financials/CashFlowStatement';
import PlatformMetricsTable from '@/components/financials/PlatformMetricsTable';
import RevenueChart from '@/components/charts/RevenueChart';
import Tag from '@/components/ui/Tag';
import Divider from '@/components/ui/Divider';
import { formatDate } from '@/lib/utils/dates';
import { formatNumber } from '@/lib/utils/numbers';

export const revalidate = 21600;

export function generateStaticParams() {
  return COMPANY_SLUGS.map((slug) => ({ slug }));
}

interface Props {
  params: { slug: string };
}

export default async function CompanyPage({ params }: Props) {
  const company = getCompany(params.slug);
  if (!company) notFound();

  const [records, events] = await Promise.all([
    readFinancials(params.slug, 'annual'),
    readEarnings(params.slug),
  ]);

  const sorted = [...records].sort((a, b) => b.period.startDate.localeCompare(a.period.startDate));
  const latest = sorted[0];
  const today = new Date().toISOString().slice(0, 10);
  const nextEvent = events.filter((e) => e.announcedDate >= today).sort((a, b) => a.announcedDate.localeCompare(b.announcedDate))[0];

  const tabs = ['Income Statement', 'Balance Sheet', 'Cash Flow', 'Platform Metrics'] as const;

  return (
    <PageWrapper>
      {/* Back */}
      <div className="mb-8">
        <Link href="/companies" className="text-[12px] text-ink-muted hover:text-ink transition-colors">
          ← All companies
        </Link>
      </div>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-start gap-4 flex-wrap mb-4">
          <div className="flex-1">
            <h1 className="text-[28px] font-light tracking-tight text-ink">{company.name}</h1>
            <p className="text-[14px] text-ink-muted mt-1">{company.description}</p>
          </div>
          <ExchangeBadge exchange={company.exchange} ticker={company.ticker || undefined} />
        </div>
        <div className="flex items-center gap-6 text-[12px] text-ink-faint flex-wrap">
          <span className="font-mono">{company.reportingCurrency} · {company.reportingUnit}</span>
          {company.fiscalYearNote && <span>{company.fiscalYearNote}</span>}
          {company.irPage && (
            <a href={company.irPage} target="_blank" rel="noopener noreferrer"
              className="text-ink-muted hover:text-ink transition-colors">
              IR page →
            </a>
          )}
        </div>
      </div>

      {/* Next event banner */}
      {nextEvent && (
        <div className="border border-border rounded p-4 mb-10 flex items-center gap-6 bg-surface-raised">
          <div>
            <p className="text-[11px] text-ink-muted uppercase tracking-widest mb-1">Next Report</p>
            <p className="text-[16px] font-medium text-ink">{nextEvent.periodLabel}</p>
          </div>
          <Divider className="h-8 w-px border-l border-t-0" />
          <div>
            <p className="text-[20px] font-light tabular-nums text-ink">{formatDate(nextEvent.announcedDate)}</p>
          </div>
          <div className="ml-auto">
            <Tag variant={nextEvent.status}>{nextEvent.status}</Tag>
          </div>
        </div>
      )}

      {/* KPI strip */}
      {latest && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] text-ink-muted uppercase tracking-widest">
              Latest: {latest.period.periodLabel}
            </p>
            <p className="text-[11px] text-ink-faint font-mono">
              {latest.period.currency} {latest.period.unit}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border">
            {[
              {
                label: 'Revenue',
                value: formatNumber(latest.incomeStatement.revenue),
                growth: latest.incomeStatement.revenueGrowthYoY,
              },
              {
                label: 'EBITDA',
                value: latest.incomeStatement.ebitda !== undefined
                  ? formatNumber(latest.incomeStatement.ebitda)
                  : '—',
                growth: undefined,
              },
              {
                label: 'Operating Income',
                value: formatNumber(latest.incomeStatement.operatingIncome),
                growth: undefined,
              },
              {
                label: 'Net Income',
                value: formatNumber(latest.incomeStatement.netIncome),
                growth: undefined,
              },
              {
                label: 'Paid Clients',
                value: latest.platformMetrics.paidClientsOrSubscribers !== undefined
                  ? latest.platformMetrics.paidClientsOrSubscribers.toLocaleString('en-US')
                  : '—',
                growth: latest.platformMetrics.paidClientsGrowthYoY,
              },
              {
                label: latest.platformMetrics.arpuLabel?.split(' ')[0] ?? 'ARPU',
                value: latest.platformMetrics.arpuValue !== undefined
                  ? formatNumber(latest.platformMetrics.arpuValue, 'millions', 0)
                  : '—',
                growth: latest.platformMetrics.arpuGrowthYoY,
              },
            ].map((kpi, i) => (
              <div key={i} className="bg-surface p-4">
                <p className="text-[11px] text-ink-muted mb-2">{kpi.label}</p>
                <p className="text-[22px] font-light tabular-nums text-ink leading-none">{kpi.value}</p>
                {kpi.growth !== undefined && (
                  <div className="mt-1.5">
                    <GrowthPill value={kpi.growth} label="YoY" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Revenue chart */}
      {records.length > 0 && (
        <section className="mb-12">
          <p className="text-[11px] text-ink-muted uppercase tracking-widest mb-4">Revenue & Operating Income</p>
          <RevenueChart records={records} />
        </section>
      )}

      <Divider className="mb-12" />

      {/* Financial tables */}
      {records.length > 0 && (
        <section>
          <div className="mb-8">
            <p className="text-[11px] text-ink-muted uppercase tracking-widest mb-4">Financial Statements</p>
            {/* Tab navigation via CSS */}
            <div className="overflow-x-auto">
              <div className="space-y-16">
                <div>
                  <h3 className="text-[13px] font-medium text-ink mb-5 pb-3 border-b border-border">Income Statement</h3>
                  <IncomeStatement records={sorted} />
                </div>
                <div>
                  <h3 className="text-[13px] font-medium text-ink mb-5 pb-3 border-b border-border">Statement of Financial Position</h3>
                  <BalanceSheet records={sorted} />
                </div>
                <div>
                  <h3 className="text-[13px] font-medium text-ink mb-5 pb-3 border-b border-border">Cash Flow Statement</h3>
                  <CashFlowStatement records={sorted} />
                </div>
                <div>
                  <h3 className="text-[13px] font-medium text-ink mb-5 pb-3 border-b border-border">Platform Metrics</h3>
                  <PlatformMetricsTable records={sorted} />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Earnings history */}
      {events.length > 0 && (
        <section className="mt-16">
          <Divider className="mb-12" />
          <p className="text-[11px] text-ink-muted uppercase tracking-widest mb-6">Earnings History</p>
          <div className="border-t border-border">
            {[...events].sort((a, b) => b.announcedDate.localeCompare(a.announcedDate)).map((event) => (
              <div key={event.id} className="border-b border-border/60 py-3 flex items-center gap-6">
                <span className="text-[12px] font-mono text-ink-muted w-28 shrink-0">
                  {formatDate(event.announcedDate)}
                </span>
                <span className="text-[13px] text-ink w-32">{event.periodLabel}</span>
                {event.revenueActual !== undefined && (
                  <span className="text-[12px] font-mono tabular-nums text-ink">
                    Rev: {event.revenueActual.toLocaleString()}
                  </span>
                )}
                {event.revenueEstimate !== undefined && event.revenueActual === undefined && (
                  <span className="text-[12px] font-mono tabular-nums text-ink-muted">
                    Est: {event.revenueEstimate.toLocaleString()}
                  </span>
                )}
                <div className="ml-auto">
                  <Tag variant={event.status}>{event.status}</Tag>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </PageWrapper>
  );
}
