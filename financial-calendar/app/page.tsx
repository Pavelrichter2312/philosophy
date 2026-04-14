import Link from 'next/link';
import { readAllEarnings, readAllCompanies } from '@/lib/data/reader';
import { formatDate } from '@/lib/utils/dates';
import { COMPANIES } from '@/lib/constants/companies';
import Divider from '@/components/ui/Divider';
import Tag from '@/components/ui/Tag';
import ExchangeBadge from '@/components/company/ExchangeBadge';

export const revalidate = 21600;

export default async function Home() {
  const allEvents = await readAllEarnings();
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = allEvents
    .filter((e) => e.announcedDate >= today)
    .slice(0, 6);

  return (
    <main>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="max-w-grid mx-auto px-6 py-20">
          <p className="text-[11px] text-ink-muted uppercase tracking-widest mb-6 font-mono">
            Job Market Intelligence
          </p>
          <h1 className="text-[40px] sm:text-[56px] font-light leading-[1.1] tracking-tight text-ink max-w-2xl">
            Earnings calendar for the global job market.
          </h1>
          <p className="mt-6 text-[15px] text-ink-muted max-w-lg leading-relaxed">
            Track earnings reports, financial statements, and platform metrics
            for SEEK, Kanzhun, ZipRecruiter, Pracuji, Recruit Holdings, Visional,
            and Info Edge.
          </p>
          <div className="mt-10 flex gap-4">
            <Link
              href="/calendar"
              className="px-5 py-2.5 bg-ink text-surface text-[13px] rounded hover:bg-ink/90 transition-colors"
            >
              View Calendar
            </Link>
            <Link
              href="/companies"
              className="px-5 py-2.5 border border-border text-ink text-[13px] rounded hover:bg-surface-raised transition-colors"
            >
              All Companies
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="border-b border-border">
        <div className="max-w-grid mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[13px] font-medium uppercase tracking-widest text-ink-muted">
              Upcoming Earnings
            </h2>
            <Link href="/calendar" className="text-[12px] text-ink-muted hover:text-ink transition-colors">
              View all →
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-[13px] text-ink-muted">No upcoming events scheduled.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
              {upcoming.map((event) => (
                <Link
                  key={event.id}
                  href={`/companies/${event.companySlug}`}
                  className="bg-surface p-5 hover:bg-surface-raised transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[13px] font-medium text-ink group-hover:text-ink">
                        {event.companyName}
                      </p>
                      <p className="text-[11px] text-ink-muted font-mono mt-0.5">{event.periodLabel}</p>
                    </div>
                    <Tag variant={event.status}>{event.status}</Tag>
                  </div>
                  <p className="text-[20px] font-light tabular-nums text-ink">{formatDate(event.announcedDate)}</p>
                  {event.exchange !== 'PRIVATE' && (
                    <p className="text-[11px] text-ink-faint mt-2 font-mono">{event.ticker} · {event.exchange}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Company Grid */}
      <section>
        <div className="max-w-grid mx-auto px-6 py-12">
          <h2 className="text-[13px] font-medium uppercase tracking-widest text-ink-muted mb-8">
            Covered Companies
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-border">
            {COMPANIES.map((company) => (
              <Link
                key={company.slug}
                href={`/companies/${company.slug}`}
                className="bg-surface p-5 hover:bg-surface-raised transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[14px] font-medium text-ink">{company.shortName}</p>
                    <p className="text-[11px] text-ink-muted mt-0.5">{company.name}</p>
                  </div>
                  <ExchangeBadge exchange={company.exchange} ticker={company.ticker || undefined} />
                </div>
                <Divider className="mb-4" />
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-ink-faint">{company.fiscalYearNote}</p>
                  <p className="text-[11px] text-ink-muted font-mono">{company.reportingCurrency}</p>
                </div>
                <p className="text-[11px] text-ink-muted mt-2">{company.description.slice(0, 60)}…</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
