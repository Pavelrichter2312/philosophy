import { readEarningsCalendar } from '@/lib/data';
import { formatDate, isUpcoming } from '@/lib/utils';
import type { EarningsEvent } from '@/types';

export const revalidate = 43200;

function StatusBadge({ status }: { status: EarningsEvent['status'] }) {
  const cls = {
    reported: 'text-positive',
    confirmed: 'text-ink',
    estimated: 'text-ink-muted',
  }[status];
  return <span className={`text-[11px] font-mono ${cls}`}>{status}</span>;
}

export default async function CalendarPage() {
  const cal = readEarningsCalendar();
  const events = cal?.events ?? [];

  const upcoming = events.filter((e) => isUpcoming(e.date)).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const past = events.filter((e) => !isUpcoming(e.date)).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-medium text-ink mb-2">Earnings Calendar</h1>
        <p className="text-[13px] text-ink-muted">
          Upcoming and recent earnings announcements for tracked job platforms.
        </p>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[11px] font-mono uppercase tracking-wide text-ink-faint mb-3">Upcoming</h2>
          <EventTable events={upcoming} isUpcoming />
        </section>
      )}

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="text-[11px] font-mono uppercase tracking-wide text-ink-faint mb-3">Past</h2>
          <EventTable events={past} isUpcoming={false} />
        </section>
      )}

      {events.length === 0 && (
        <p className="text-ink-faint text-sm">No earnings events found.</p>
      )}
    </div>
  );
}

function EventTable({ events, isUpcoming }: { events: EarningsEvent[]; isUpcoming: boolean }) {
  return (
    <div className="table-scroll">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b border-border">
            {['Company', 'Ticker', 'Period', 'Date', 'Status', 'Revenue', 'IR'].map((h) => (
              <th key={h} className="pb-2 pr-5 text-left text-[11px] font-mono uppercase tracking-wide text-ink-faint">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className={`border-b border-border ${isUpcoming ? '' : 'text-ink-faint'}`}>
              <td className={`py-2.5 pr-5 text-[13px] ${isUpcoming ? 'text-ink' : 'text-ink-faint'}`}>
                {e.company_name.split(' ')[0]}
              </td>
              <td className="py-2.5 pr-5 font-mono text-[12px]">{e.ticker}</td>
              <td className="py-2.5 pr-5 font-mono text-[12px]">{e.period_label}</td>
              <td className={`py-2.5 pr-5 font-mono text-[12px] ${isUpcoming ? 'font-medium text-ink' : ''}`}>
                {formatDate(e.date)}
              </td>
              <td className="py-2.5 pr-5">
                <StatusBadge status={e.status} />
              </td>
              <td className="py-2.5 pr-5 font-mono text-[12px]">
                {e.revenue_actual !== null
                  ? e.revenue_actual.toLocaleString('en-US')
                  : e.revenue_estimate !== null
                  ? `~${e.revenue_estimate.toLocaleString('en-US')}e`
                  : '—'}
              </td>
              <td className="py-2.5">
                <a
                  href={e.ir_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono text-ink-muted hover:text-ink transition-colors"
                >
                  IR ↗
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
