import Link from 'next/link';
import { COMPANIES } from '@/lib/companies';
import { readCompany, latestAnnual, prevAnnual } from '@/lib/data';
import { formatMillions, formatGrowth, formatGrowthStr, currencySymbol } from '@/lib/utils';

export const revalidate = 43200;

const COUNTRY_FLAG: Record<string, string> = {
  China: 'CN',
  Australia: 'AU',
  India: 'IN',
  'United States': 'US',
  Japan: 'JP',
  Russia: 'RU',
  Poland: 'PL',
};

export default async function HomePage() {
  // Fetch light data for company cards
  const companyCards = COMPANIES.map((meta) => {
    const data = readCompany(meta.id);
    const latest = data ? latestAnnual(data) : null;
    const prev = data ? prevAnnual(data) : null;
    const yoy = formatGrowth(latest?.revenue ?? null, prev?.revenue ?? null);
    return { meta, latest, yoy };
  });

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="pt-10 pb-16 border-b border-border">
        <div className="max-w-2xl">
          <p className="text-[11px] font-mono uppercase tracking-widest text-ink-faint mb-4">
            Financial Intelligence
          </p>
          <h1 className="font-serif text-[40px] sm:text-[52px] leading-[1.1] font-medium text-ink mb-5">
            Track the world&apos;s<br />
            job platforms
          </h1>
          <p className="text-[15px] text-ink-muted leading-relaxed mb-8 max-w-xl">
            Historical financials, earnings calendars, and cross-platform comparison
            for 8 publicly listed online recruitment companies — from Boston to Beijing.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 bg-ink text-white text-[13px] font-mono rounded hover:bg-accent transition-colors"
            >
              Open Dashboard →
            </Link>
            <Link
              href="/compare"
              className="px-5 py-2.5 border border-border text-ink text-[13px] font-mono rounded hover:border-ink transition-colors"
            >
              Compare Companies
            </Link>
          </div>
        </div>
      </section>

      {/* ── Navigation cards ─────────────────────────────────────────────────── */}
      <section className="py-12 border-b border-border">
        <p className="text-[11px] font-mono uppercase tracking-widest text-ink-faint mb-6">
          Sections
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              href: '/dashboard',
              title: 'Dashboard',
              desc: 'Revenue, net income, FCF and paid users for all 8 platforms in one view. Toggle between local currency and USD.',
              tag: '8 companies',
            },
            {
              href: '/compare',
              title: 'Compare',
              desc: 'Multi-company chart with base-year indexing, configurable horizon, and CAGR table. Find who grew fastest.',
              tag: 'Multi-metric',
            },
            {
              href: '/calendar',
              title: 'Calendar',
              desc: 'Upcoming and past earnings dates. Direct links to each company\'s investor relations page.',
              tag: 'Earnings dates',
            },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group p-5 border border-border rounded hover:border-ink transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="font-serif text-[18px] font-medium text-ink group-hover:underline">
                  {card.title}
                </span>
                <span className="text-[10px] font-mono text-ink-faint bg-surface-raised px-2 py-0.5 rounded">
                  {card.tag}
                </span>
              </div>
              <p className="text-[12px] text-ink-muted leading-relaxed">{card.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Company grid ─────────────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[11px] font-mono uppercase tracking-widest text-ink-faint">
            Covered companies
          </p>
          <Link
            href="/dashboard"
            className="text-[11px] font-mono text-ink-muted hover:text-ink transition-colors"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded overflow-hidden">
          {companyCards.map(({ meta, latest, yoy }) => {
            const sym = currencySymbol(meta.currency);
            const rev = latest?.revenue ?? null;

            return (
              <Link
                key={meta.id}
                href={`/company/${meta.id}`}
                className="group bg-surface hover:bg-surface-raised transition-colors p-5 flex flex-col gap-3"
              >
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-[11px] text-ink-faint mb-0.5 uppercase tracking-wide">
                      {meta.ticker} · {meta.exchange}
                    </div>
                    <div className="font-serif text-[16px] font-medium text-ink leading-tight group-hover:underline">
                      {shortName(meta.name)}
                    </div>
                  </div>
                  {yoy !== null && (
                    <span
                      className={`text-[11px] font-mono mt-0.5 ${
                        yoy >= 0 ? 'text-positive' : 'text-negative'
                      }`}
                    >
                      {formatGrowthStr(yoy)}
                    </span>
                  )}
                </div>

                {/* Revenue */}
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wide text-ink-faint mb-0.5">
                    Revenue · {latest?.period_label ?? '—'}
                  </div>
                  <div className="font-mono text-[15px] font-medium text-ink">
                    {rev !== null ? `${sym}${formatMillions(rev)}` : '—'}
                    <span className="text-[10px] text-ink-faint ml-1">{meta.currency}</span>
                  </div>
                </div>

                {/* Country tag */}
                <div className="text-[10px] font-mono text-ink-faint">{meta.country}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Methodology note ─────────────────────────────────────────────────── */}
      <section className="py-8 border-t border-border">
        <p className="text-[11px] text-ink-faint max-w-2xl leading-relaxed">
          Data sourced from public filings: SEC EDGAR (ZipRecruiter, Kanzhun, HeadHunter),
          ASX (SEEK), NSE (InfoEdge), TSE (Recruit Holdings, Visional), GPW (Pracuj.pl).
          Financial figures are in original reporting currencies unless converted via open.er-api.com.
          Not investment advice.
        </p>
      </section>
    </div>
  );
}

function shortName(full: string): string {
  return full
    .replace(' Limited', '')
    .replace(' Group PLC', '')
    .replace(' Holdings Co., Ltd.', ' Holdings')
    .replace(', Inc.', '')
    .replace(' S.A.', '')
    .replace('(India) ', '')
    .replace(' Co., Ltd.', '');
}
