import { ExchangeCode } from '@/types/company';

interface ExchangeBadgeProps {
  exchange: ExchangeCode;
  ticker?: string;
}

export default function ExchangeBadge({ exchange, ticker }: ExchangeBadgeProps) {
  return (
    <span className="inline-block text-[11px] text-ink-muted font-mono border border-border px-1.5 py-0.5 rounded">
      {ticker ? `${ticker} · ${exchange}` : exchange}
    </span>
  );
}
