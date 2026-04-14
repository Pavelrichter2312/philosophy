import { ReportingCurrency, ReportingPeriodType } from './company';

export interface FiscalPeriod {
  companySlug: string;
  periodType: ReportingPeriodType;
  fiscalYear: number;
  fiscalQuarter?: 1 | 2 | 3 | 4;
  fiscalHalf?: 1 | 2;
  periodLabel: string;
  startDate: string;
  endDate: string;
  reportDate?: string;
  currency: ReportingCurrency;
  unit: 'thousands' | 'millions' | 'billions';
  source: string;
  notes?: string;
}

export interface IncomeStatement {
  revenue: number;
  revenueGrowthYoY?: number;
  costOfRevenue?: number;
  grossProfit?: number;
  grossMargin?: number;
  operatingExpenses?: number;
  ebitda?: number;
  ebitdaMargin?: number;
  operatingIncome: number;
  operatingMargin?: number;
  interestExpense?: number;
  pretaxIncome?: number;
  incomeTax?: number;
  netIncome: number;
  netMargin?: number;
  eps?: number;
  epsDiluted?: number;
  sharesBasic?: number;
  sharesDiluted?: number;
}

export interface BalanceSheet {
  cashAndEquivalents: number;
  shortTermInvestments?: number;
  accountsReceivable?: number;
  otherCurrentAssets?: number;
  totalCurrentAssets: number;
  propertyPlantEquipment?: number;
  intangibleAssets?: number;
  goodwill?: number;
  otherNonCurrentAssets?: number;
  totalNonCurrentAssets: number;
  totalAssets: number;
  accountsPayable?: number;
  shortTermDebt?: number;
  deferredRevenue?: number;
  otherCurrentLiabilities?: number;
  totalCurrentLiabilities: number;
  longTermDebt?: number;
  otherNonCurrentLiabilities?: number;
  totalNonCurrentLiabilities: number;
  totalLiabilities: number;
  commonStock?: number;
  retainedEarnings?: number;
  otherEquity?: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
}

export interface CashFlowStatement {
  operatingCashFlow: number;
  capitalExpenditures?: number;
  freeCashFlow?: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netChangeInCash: number;
  cashBeginningOfPeriod?: number;
  cashEndOfPeriod?: number;
}

export interface PlatformMetrics {
  paidClientsOrSubscribers?: number;
  paidClientsGrowthYoY?: number;
  arpuValue?: number;
  arpuLabel?: string;
  arpuGrowthYoY?: number;
  additionalMetrics?: Record<string, number | string>;
}

export interface FinancialPeriodRecord {
  period: FiscalPeriod;
  incomeStatement: IncomeStatement;
  balanceSheet: BalanceSheet;
  cashFlow: CashFlowStatement;
  platformMetrics: PlatformMetrics;
}

export interface CompanyFinancialsFile {
  companySlug: string;
  periods: FinancialPeriodRecord[];
  lastScraped: string;
}
