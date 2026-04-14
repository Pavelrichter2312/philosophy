export type Currency = 'CNY' | 'AUD' | 'INR' | 'USD' | 'JPY' | 'RUB' | 'PLN';
export type Exchange = 'NASDAQ' | 'ASX' | 'NSE' | 'NYSE' | 'TSE' | 'MOEX' | 'GPW';
export type PeriodType = 'FY' | 'Q';
export type Horizon = '1Y' | '2Y' | '3Y' | '5Y' | 'MAX';

export type MetricKey =
  | 'revenue'
  | 'gross_profit'
  | 'operating_income'
  | 'ebitda'
  | 'net_income'
  | 'free_cash_flow'
  | 'paid_users'
  | 'arpu';

export interface FinancialPeriod {
  period_type: PeriodType;
  fiscal_year: number;
  fiscal_quarter: number | null;
  period_label: string;
  start_date: string;
  end_date: string;
  calendar_year: number;
  currency: Currency;
  usd_rate: number;
  // Income Statement
  revenue: number | null;
  gross_profit: number | null;
  operating_income: number | null;
  ebitda: number | null;
  net_income: number | null;
  // Balance Sheet
  total_assets: number | null;
  total_equity: number | null;
  total_debt: number | null;
  cash_and_equivalents: number | null;
  // Cash Flow
  operating_cash_flow: number | null;
  capex: number | null;
  free_cash_flow: number | null;
  // Operational
  paid_users: number | null;
  arpu: number | null;
}

export interface CompanyData {
  company_id: string;
  name: string;
  ticker: string;
  exchange: string;
  currency: Currency;
  reporting_unit: 'millions' | 'billions' | 'thousands';
  fiscal_year_end_month: number;
  ir_url: string;
  last_updated: string;
  periods: FinancialPeriod[];
}

export interface CompanyMeta {
  id: string;
  name: string;
  ticker: string;
  exchange: string;
  currency: Currency;
  fiscal_year_end_month: number;
  ir_url: string;
  description: string;
  country: string;
}

export interface EarningsEvent {
  id: string;
  company_id: string;
  company_name: string;
  ticker: string;
  exchange: string;
  period_label: string;
  date: string;
  status: 'confirmed' | 'estimated' | 'reported';
  revenue_actual: number | null;
  revenue_estimate: number | null;
  currency: Currency;
  ir_url: string;
  notes: string | null;
}

export interface EarningsCalendar {
  last_updated: string;
  events: EarningsEvent[];
}

export interface FxRatesCache {
  last_updated: string;
  base: 'USD';
  rates: Record<string, number>;
}

// For dashboard row
export interface DashboardRow {
  company: CompanyMeta;
  latestPeriod: FinancialPeriod | null;
  prevPeriod: FinancialPeriod | null;
}

// For comparator
export interface ComparatorSeries {
  company_id: string;
  name: string;
  ticker: string;
  color: string;
  data: { year: number; value: number | null }[];
}
