'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/compare', label: 'Compare' },
  { href: '/calendar', label: 'Calendar' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-border">
      <div className="max-w-grid mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
        <Link href="/" className="font-serif text-base font-medium text-ink tracking-tight">
          Job Platforms
        </Link>
        <nav className="hidden sm:flex items-center gap-6">
          {NAV.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[13px] transition-colors ${
                  active ? 'text-ink' : 'text-ink-muted hover:text-ink'
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
