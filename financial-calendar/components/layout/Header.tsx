'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { label: 'Calendar', href: '/calendar' },
  { label: 'Companies', href: '/companies' },
  { label: 'Compare', href: '/compare' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface sticky top-0 z-50">
      <div className="max-w-grid mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-ink font-medium tracking-tight text-[15px]">
          FinCal
        </Link>
        <nav className="flex items-center gap-8">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[13px] transition-colors ${
                  active
                    ? 'text-ink font-medium'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
