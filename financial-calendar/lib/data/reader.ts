import path from 'path';
import fs from 'fs/promises';
import { CompanyFinancialsFile, FinancialPeriodRecord } from '@/types/financials';
import { CompanyEarningsFile, EarningsEvent } from '@/types/calendar';
import { COMPANIES } from '@/lib/constants/companies';
import { Company } from '@/types/company';

const DATA_ROOT = path.join(process.cwd(), 'data');

export async function readFinancials(
  slug: string,
  periodType?: string
): Promise<FinancialPeriodRecord[]> {
  const dir = path.join(DATA_ROOT, 'financials', slug);
  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch {
    return [];
  }
  const all: FinancialPeriodRecord[] = [];
  for (const file of files.filter((f) => f.endsWith('.json'))) {
    try {
      const raw = await fs.readFile(path.join(dir, file), 'utf-8');
      const parsed: CompanyFinancialsFile = JSON.parse(raw);
      const filtered = periodType
        ? parsed.periods.filter((p) => p.period.periodType === periodType)
        : parsed.periods;
      all.push(...filtered);
    } catch {
      // skip malformed files
    }
  }
  return all.sort((a, b) => a.period.startDate.localeCompare(b.period.startDate));
}

export async function readEarnings(slug: string): Promise<EarningsEvent[]> {
  const file = path.join(DATA_ROOT, 'earnings', `${slug}.json`);
  try {
    const raw = await fs.readFile(file, 'utf-8');
    const parsed: CompanyEarningsFile = JSON.parse(raw);
    return parsed.events;
  } catch {
    return [];
  }
}

export async function readAllEarnings(): Promise<EarningsEvent[]> {
  const all: EarningsEvent[] = [];
  for (const company of COMPANIES) {
    const events = await readEarnings(company.slug);
    all.push(...events);
  }
  return all.sort((a, b) => a.announcedDate.localeCompare(b.announcedDate));
}

export async function readAllCompanies(): Promise<Company[]> {
  return COMPANIES;
}
