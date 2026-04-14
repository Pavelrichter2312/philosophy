import { formatGrowth } from '@/lib/utils/numbers';

interface GrowthPillProps {
  value: number;
  label?: string;
}

export default function GrowthPill({ value, label }: GrowthPillProps) {
  const isPositive = value >= 0;
  return (
    <span
      className={`inline-block text-[11px] font-mono tabular-nums ${
        isPositive ? 'text-positive' : 'text-negative'
      }`}
    >
      {formatGrowth(value)} {label && <span className="text-ink-faint">{label}</span>}
    </span>
  );
}
