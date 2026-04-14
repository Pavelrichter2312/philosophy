import path from 'path';
import fs from 'fs';
import type { CompanyData, EarningsCalendar, FinancialPeriod } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'src/data');

export function readCompany(id: string): CompanyData | null {
  try {
    const filePath = path.join(DATA_DIR, 'companies', `${id}.json`);
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as CompanyData;
  } catch {
    return null;
  }
}

export function readAllCompanies(): CompanyData[] {
  const dir = path.join(DATA_DIR, 'companies');
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const raw = fs.readFileSync(path.join(dir, f), 'utf-8');
        return JSON.parse(raw) as CompanyData;
      });
  } catch {
    return [];
  }
}

export function readEarningsCalendar(): EarningsCalendar | null {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, 'earnings-calendar.json'), 'utf-8');
    return JSON.parse(raw) as EarningsCalendar;
  } catch {
    return null;
  }
}

// Returns annual periods sorted ascending by fiscal_year
export function annualPeriods(company: CompanyData): FinancialPeriod[] {
  return company.periods
    .filter((p) => p.period_type === 'FY')
    .sort((a, b) => a.fiscal_year - b.fiscal_year);
}

// Returns quarterly periods sorted ascending
export function quarterlyPeriods(company: CompanyData): FinancialPeriod[] {
  return company.periods
    .filter((p) => p.period_type === 'Q')
    .sort((a, b) => {
      if (a.fiscal_year !== b.fiscal_year) return a.fiscal_year - b.fiscal_year;
      return (a.fiscal_quarter ?? 0) - (b.fiscal_quarter ?? 0);
    });
}

// Latest annual period
export function latestAnnual(company: CompanyData): FinancialPeriod | null {
  const periods = annualPeriods(company);
  return periods[periods.length - 1] ?? null;
}

// Second-to-last annual period (for YoY)
export function prevAnnual(company: CompanyData): FinancialPeriod | null {
  const periods = annualPeriods(company);
  return periods[periods.length - 2] ?? null;
}
