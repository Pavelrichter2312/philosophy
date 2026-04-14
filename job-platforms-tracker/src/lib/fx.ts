import type { FxRatesCache, Currency } from '@/types';
import path from 'path';
import fs from 'fs';

const CACHE_PATH = path.join(process.cwd(), 'src/data/fx-rates-cache.json');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function readFxCache(): FxRatesCache | null {
  try {
    const raw = fs.readFileSync(CACHE_PATH, 'utf-8');
    return JSON.parse(raw) as FxRatesCache;
  } catch {
    return null;
  }
}

export function isCacheStale(cache: FxRatesCache): boolean {
  return Date.now() - new Date(cache.last_updated).getTime() > CACHE_TTL_MS;
}

export async function fetchFxRates(): Promise<Record<string, number>> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) throw new Error(`FX API error: ${res.status}`);
  const json = (await res.json()) as { rates: Record<string, number> };
  return json.rates;
}

export async function getUsdRates(): Promise<Record<string, number>> {
  const cache = readFxCache();
  if (cache && !isCacheStale(cache)) {
    return cache.rates;
  }
  const rates = await fetchFxRates();
  const newCache: FxRatesCache = {
    last_updated: new Date().toISOString(),
    base: 'USD',
    rates,
  };
  fs.writeFileSync(CACHE_PATH, JSON.stringify(newCache, null, 2));
  return rates;
}

// Convert value from original currency to USD using cached rates
// rates is { CNY: 7.1, AUD: 1.53, ... } (units per 1 USD)
export function toUsd(value: number | null, currency: Currency, rates: Record<string, number>): number | null {
  if (value === null) return null;
  const rate = rates[currency];
  if (!rate) return null;
  return value / rate;
}

// Get default usd_rate for a currency from cache (value of 1 unit in USD)
export function getUsdRate(currency: Currency, rates: Record<string, number>): number {
  if (currency === 'USD') return 1;
  const rate = rates[currency];
  if (!rate) return 1;
  return 1 / rate;
}
