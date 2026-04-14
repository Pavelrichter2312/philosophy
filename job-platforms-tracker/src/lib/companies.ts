import type { CompanyMeta } from '@/types';

export const COMPANIES: CompanyMeta[] = [
  {
    id: 'kanzhun',
    name: 'Kanzhun Limited',
    ticker: 'BZ',
    exchange: 'NASDAQ',
    currency: 'CNY',
    fiscal_year_end_month: 12,
    ir_url: 'https://ir.kanzhun.com',
    description: 'Leading online recruitment platform in China, operating Boss Zhipin app',
    country: 'China',
  },
  {
    id: 'seek',
    name: 'SEEK Limited',
    ticker: 'SEK',
    exchange: 'ASX',
    currency: 'AUD',
    fiscal_year_end_month: 6,
    ir_url: 'https://www.seek.com.au/about/investors',
    description: "Australia's dominant online employment marketplace",
    country: 'Australia',
  },
  {
    id: 'infoedge',
    name: 'Info Edge (India) Limited',
    ticker: 'NAUKRI',
    exchange: 'NSE',
    currency: 'INR',
    fiscal_year_end_month: 3,
    ir_url: 'https://www.infoedge.in/investor-relations.html',
    description: "India's leading online classifieds company, operating Naukri.com",
    country: 'India',
  },
  {
    id: 'ziprecruiter',
    name: 'ZipRecruiter, Inc.',
    ticker: 'ZIP',
    exchange: 'NYSE',
    currency: 'USD',
    fiscal_year_end_month: 12,
    ir_url: 'https://investor.ziprecruiter.com',
    description: 'AI-driven online employment marketplace for job seekers and employers',
    country: 'United States',
  },
  {
    id: 'visional',
    name: 'Visional, Inc.',
    ticker: '4194',
    exchange: 'TSE',
    currency: 'JPY',
    fiscal_year_end_month: 7,
    ir_url: 'https://visional.inc/en/ir/',
    description: 'Japanese HRtech company operating BizReach recruitment platform',
    country: 'Japan',
  },
  {
    id: 'headhunter',
    name: 'HeadHunter Group PLC',
    ticker: 'HHRU',
    exchange: 'MOEX',
    currency: 'RUB',
    fiscal_year_end_month: 12,
    ir_url: 'https://investor.hh.ru',
    description: "Russia's leading online recruitment platform, operating hh.ru",
    country: 'Russia',
  },
  {
    id: 'pracuj',
    name: 'Pracuj.pl S.A.',
    ticker: 'PRC',
    exchange: 'GPW',
    currency: 'PLN',
    fiscal_year_end_month: 12,
    ir_url: 'https://investor.pracuj.pl',
    description: "Poland's leading online job portal and HR services provider",
    country: 'Poland',
  },
  {
    id: 'recruit',
    name: 'Recruit Holdings Co., Ltd.',
    ticker: '6098',
    exchange: 'TSE',
    currency: 'JPY',
    fiscal_year_end_month: 3,
    ir_url: 'https://recruit-holdings.com/ir/',
    description: 'Global HR technology company operating Indeed, Glassdoor, and other platforms',
    country: 'Japan',
  },
];

export const COMPANY_IDS = COMPANIES.map((c) => c.id);

export function getCompanyMeta(id: string): CompanyMeta | undefined {
  return COMPANIES.find((c) => c.id === id);
}

export const COMPARATOR_COLORS = [
  '#1a1a2e',
  '#e63946',
  '#2a9d8f',
  '#e9c46a',
  '#6d6875',
  '#457b9d',
  '#f4a261',
  '#2d6a4f',
];
