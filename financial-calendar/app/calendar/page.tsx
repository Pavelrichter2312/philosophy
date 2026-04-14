import { readAllEarnings } from '@/lib/data/reader';
import { formatDate } from '@/lib/utils/dates';
import { groupByMonth } from '@/lib/utils/dates';
import PageWrapper from '@/components/layout/PageWrapper';
import Tag from '@/components/ui/Tag';
import Divider from '@/components/ui/Divider';
import Link from 'next/link';

export const revalidate = 21600;

const MONTH_NAMES: Record<string, string> = {
  '01': 'January', '02': 'February', '03': 'March', '04': 'April',
  '05': 'May', '06': 'June', '07': 'July', '08': 'August',
  '09': 'September', '10': 'October', '11': 'November', '12': 'December',
};

export default async function CalendarPage() {
  const events = await readAllEarnings();
  const today = new Date().toISOString().slice(0, 10);

  const past = events.filter((e) => e.announcedDate < today);
  const upcoming = events.filter((e) => e.announcedDate >= today);

  const upcomingByMonth = groupByMonth(upcoming);
  const pastByMonth = groupByMonth(past);

  return (
    <PageWrapper>
      <div className="mb-12">
        <p className="text-[11px] text-ink-muted uppercase tracking-widest font-mono mb-3">Earnings Calendar</p>
        <h1 className="text-[32px] font-light tracking-tight text-ink">
          Reporting schedule
        </h1>
        <p className="mt-3 text-[14px] text-ink-muted">
          Confirmed and estimated earnings dates for all covered companies.
        </p>
      </div>

      {/* Upcoming */}
      {Object.keys(upcomingByMonth).length > 0 && (
        <section className="mb-16">
          <h2 className="text-[11px] font-medium uppercase tracking-widest text-ink-muted mb-6">Upcoming</h2>
          {Object.entries(upcomingByMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([monthKey, monthEvents]) => {
              const [year, month] = monthKey.split('-');
              return (
                <div key={monthKey} className="mb-8">
                  <p className="text-[12px] text-ink-muted font-mono mb-3">{MONTH_NAMES[month]} {year}</p>
                  <div className="border-t border-border">
                    {monthEvents.map((event) => (
                      <div key={event.id} className="border-b border-border/60 py-3 flex items-center gap-6 hover:bg-surface-raised px-2 -mx-2 rounded transition-colors">
                        <span className="text-[12px] font-mono tabular-nums text-ink-muted w-28 shrink-0">
                          {formatDate(event.announcedDate)}
                        </span>
                        <Link
                          href={`/companies/${event.companySlug}`}
                          className="flex-1 flex items-center gap-4 hover:text-ink"
                        >
                          <span className="text-[13px] font-medium text-ink w-40">{event.companyName}</span>
                          <span className="text-[12px] font-mono text-ink-muted">{event.periodLabel}</span>
                        </Link>
                        {event.exchange !== 'PRIVATE' && (
                          <span className="text-[11px] font-mono text-ink-faint w-28 text-right">{event.ticker} · {event.exchange}</span>
                        )}
                        <Tag variant={event.status}>{event.status}</Tag>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </section>
      )}

      <Divider className="mb-12" />

      {/* Past */}
      {Object.keys(pastByMonth).length > 0 && (
        <section>
          <h2 className="text-[11px] font-medium uppercase tracking-widest text-ink-muted mb-6">Past Reports</h2>
          {Object.entries(pastByMonth)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([monthKey, monthEvents]) => {
              const [year, month] = monthKey.split('-');
              return (
                <div key={monthKey} className="mb-8">
                  <p className="text-[12px] text-ink-muted font-mono mb-3">{MONTH_NAMES[month]} {year}</p>
                  <div className="border-t border-border">
                    {monthEvents.map((event) => (
                      <div key={event.id} className="border-b border-border/60 py-3 flex items-center gap-6 hover:bg-surface-raised px-2 -mx-2 rounded transition-colors">
                        <span className="text-[12px] font-mono tabular-nums text-ink-muted w-28 shrink-0">
                          {formatDate(event.announcedDate)}
                        </span>
                        <Link
                          href={`/companies/${event.companySlug}`}
                          className="flex-1 flex items-center gap-4"
                        >
                          <span className="text-[13px] text-ink-muted w-40">{event.companyName}</span>
                          <span className="text-[12px] font-mono text-ink-faint">{event.periodLabel}</span>
                        </Link>
                        {event.revenueActual !== undefined && (
                          <span className="text-[12px] font-mono tabular-nums text-ink w-32 text-right">
                            {event.revenueActual.toLocaleString()}
                          </span>
                        )}
                        {event.exchange !== 'PRIVATE' && (
                          <span className="text-[11px] font-mono text-ink-faint w-28 text-right">{event.ticker} · {event.exchange}</span>
                        )}
                        <Tag variant="reported">reported</Tag>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </section>
      )}
    </PageWrapper>
  );
}
