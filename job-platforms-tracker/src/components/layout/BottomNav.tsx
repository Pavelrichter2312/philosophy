'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Home', icon: '◈', exact: true },
  { href: '/dashboard', label: 'Data', icon: '▦' },
  { href: '/compare', label: 'Compare', icon: '⟺' },
  { href: '/calendar', label: 'Calendar', icon: '◷' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border flex">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href ||
            pathname.startsWith(item.href + '/') ||
            (item.href === '/dashboard' && pathname.startsWith('/company'));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
              active ? 'text-ink' : 'text-ink-faint'
            }`}
          >
            <span className="text-[15px] leading-none">{item.icon}</span>
            <span className="text-[10px] tracking-wide uppercase">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
