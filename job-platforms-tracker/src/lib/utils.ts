import type { Currency } from '@/types';

const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: '¥',
  AUD: 'A$',
  INR: '₹',
  USD: '$',
  JPY: '¥',
  RUB: '₽',
  PLN: 'zł',
};

export function currencySymbol(currency: Currency | string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

export function formatNumber(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatLarge(value: number | null | undefined, unit = 'millions'): string {
  if (value === null || value === undefined) return '—';
  // value is already in the stated unit (millions, etc.)
  if (unit === 'billions') {
    return `${formatNumber(value, 2)}B`;
  }
  if (unit === 'thousands') {
    if (Math.abs(value) >= 1_000_000) return `${formatNumber(value / 1_000_000, 1)}T`;
    if (Math.abs(value) >= 1_000) return `${formatNumber(value / 1_000, 1)}B`;
    return `${formatNumber(value, 0)}M`;
  }
  // millions (default)
  if (Math.abs(value) >= 1_000_000) return `${formatNumber(value / 1_000_000, 2)}T`;
  if (Math.abs(value) >= 1_000) return `${formatNumber(value / 1_000, 1)}B`;
  return `${formatNumber(value, 0)}M`;
}

export function formatMillions(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  if (Math.abs(value) >= 1_000) return `${formatNumber(value / 1_000, 1)}B`;
  return `${formatNumber(value, 0)}M`;
}

export function formatGrowth(current: number | null, prev: number | null): number | null {
  if (current === null || prev === null || prev === 0) return null;
  return ((current - prev) / Math.abs(prev)) * 100;
}

export function formatGrowthStr(pct: number | null): string {
  if (pct === null) return '—';
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function isUpcoming(iso: string): boolean {
  return new Date(iso) > new Date();
}

export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function convertToUsd(value: number | null, usdRate: number): number | null {
  if (value === null) return null;
  return value * usdRate;
}

export function calcCAGR(start: number, end: number, years: number): number | null {
  if (start <= 0 || years <= 0) return null;
  return (Math.pow(end / start, 1 / years) - 1) * 100;
}
