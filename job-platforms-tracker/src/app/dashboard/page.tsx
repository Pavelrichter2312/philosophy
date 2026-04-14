import { COMPANIES } from '@/lib/companies';
import { readCompany, latestAnnual, prevAnnual } from '@/lib/data';
import DashboardTable from '@/components/dashboard/DashboardTable';

export const revalidate = 43200; // 12 hours

export default async function DashboardPage() {
  const rows = COMPANIES.map((meta) => {
    const data = readCompany(meta.id);
    return {
      company: data ?? {
        company_id: meta.id,
        name: meta.name,
        ticker: meta.ticker,
        exchange: meta.exchange,
        currency: meta.currency,
        reporting_unit: 'millions' as const,
        fiscal_year_end_month: meta.fiscal_year_end_month,
        ir_url: meta.ir_url,
        last_updated: new Date().toISOString(),
        periods: [],
      },
      latest: data ? latestAnnual(data) : null,
      prev: data ? prevAnnual(data) : null,
    };
  });

  const lastUpdated = rows.reduce((acc, r) => {
    const d = r.company.last_updated;
    return d > acc ? d : acc;
  }, '2020-01-01T00:00:00Z');

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-medium text-ink mb-2">
          Job Platforms
        </h1>
        <p className="text-[13px] text-ink-muted max-w-lg">
          Financial metrics and earnings data for 8 publicly listed online recruitment platforms worldwide.
        </p>
      </div>
      <DashboardTable rows={rows} lastUpdated={lastUpdated} />
    </div>
  );
}
