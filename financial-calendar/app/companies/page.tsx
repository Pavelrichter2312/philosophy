import Link from 'next/link';
import { COMPANIES } from '@/lib/constants/companies';
import { readEarnings } from '@/lib/data/reader';
import PageWrapper from '@/components/layout/PageWrapper';
import ExchangeBadge from '@/components/company/ExchangeBadge';
import Divider from '@/components/ui/Divider';

export const revalidate = 21600;

export default async function CompaniesPage() {
  const today = new Date().toISOString().slice(0, 10);

  const companiesWithNext = await Promise.all(
    COMPANIES.map(async (company) => {
      const events = await readEarnings(company.slug);
      const next = events.filter((e) => e.announcedDate >= today).sort((a, b) => a.announcedDate.localeCompare(b.announcedDate))[0];
      return { company, nextEvent: next };
    })
  );

  return (
    <PageWrapper>
      <div className="mb-12">
        <p className="text-[11px] text-ink-muted uppercase tracking-widest font-mono mb-3">Coverage Universe</p>
        <h1 className="text-[32px] font-light tracking-tight text-ink">Companies</h1>
        <p className="mt-3 text-[14px] text-ink-muted">
          Seven leading job market platforms across six markets.
        </p>
      </div>

      <div className="border-t border-border">
        {companiesWithNext.map(({ company, nextEvent }) => (
          <Link
            key={company.slug}
            href={`/companies/${company.slug}`}
            className="flex items-center gap-6 py-5 border-b border-border/60 hover:bg-surface-raised px-2 -mx-2 rounded transition-colors group"
          >
            <div className="w-48 shrink-0">
              <p className="text-[14px] font-medium text-ink">{company.shortName}</p>
              <p className="text-[11px] text-ink-muted mt-0.5">{company.name}</p>
            </div>
            <div className="w-32 shrink-0">
              <ExchangeBadge exchange={company.exchange} ticker={company.ticker || undefined} />
            </div>
            <div className="flex-1 hidden md:block">
              <p className="text-[12px] text-ink-muted">{company.description}</p>
            </div>
            <div className="w-32 shrink-0 text-right hidden sm:block">
              <p className="text-[11px] text-ink-faint">{company.fiscalYearNote}</p>
              <p className="text-[11px] font-mono text-ink-muted mt-0.5">{company.reportingCurrency} · {company.reportingUnit}</p>
            </div>
            <div className="w-40 shrink-0 text-right">
              {nextEvent ? (
                <>
                  <p className="text-[12px] font-mono text-ink">{nextEvent.periodLabel}</p>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    {new Date(nextEvent.announcedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </>
              ) : (
                <p className="text-[11px] text-ink-faint">No upcoming event</p>
              )}
            </div>
            <span className="text-ink-faint group-hover:text-ink transition-colors text-[12px]">→</span>
          </Link>
        ))}
      </div>
    </PageWrapper>
  );
}
