import { formatGrowthStr } from '@/lib/utils';

interface GrowthBadgeProps {
  value: number | null;
  className?: string;
}

export default function GrowthBadge({ value, className = '' }: GrowthBadgeProps) {
  if (value === null) return <span className={`text-ink-faint text-[11px] font-mono ${className}`}>—</span>;

  const isPositive = value >= 0;
  return (
    <span
      className={`text-[11px] font-mono ${
        isPositive ? 'text-positive' : 'text-negative'
      } ${className}`}
    >
      {formatGrowthStr(value)}
    </span>
  );
}
