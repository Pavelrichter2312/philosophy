export function formatNumber(
  value: number,
  unit: 'thousands' | 'millions' | 'billions' = 'millions',
  decimals = 1
): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatLargeNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + 'T';
  }
  if (Math.abs(value) >= 1_000) {
    return (value / 1_000).toFixed(1) + 'B';
  }
  return value.toFixed(1) + 'M';
}

export function formatGrowth(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(1)}%`;
}

export function formatCurrency(
  value: number,
  currency: string,
  unit: 'thousands' | 'millions' | 'billions' = 'millions'
): string {
  const unitLabel = unit === 'thousands' ? 'K' : unit === 'millions' ? 'M' : 'B';
  return `${currency} ${formatNumber(value)} ${unitLabel}`;
}
