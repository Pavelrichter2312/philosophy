export type ExchangeCode = 'ASX' | 'NASDAQ' | 'NSE' | 'TSE' | 'PRIVATE' | 'OTHER';

export type FiscalYearConvention =
  | 'JUL_JUN'    // Australian: July 1 – June 30
  | 'APR_MAR'    // Indian: April 1 – March 31
  | 'APR_MAR_JP' // Japanese: April 1 – March 31
  | 'JAN_DEC'    // Calendar year (US, most)
  | 'OTHER';

export type ReportingCurrency = 'AUD' | 'USD' | 'CNY' | 'JPY' | 'INR' | 'CZK' | 'EUR';

export type ReportingPeriodType = 'annual' | 'half' | 'quarter';

export interface Company {
  slug: string;
  name: string;
  shortName: string;
  ticker: string;
  exchange: ExchangeCode;
  country: string;
  description: string;
  website: string;
  irPage: string;
  reportingCurrency: ReportingCurrency;
  reportingUnit: 'thousands' | 'millions' | 'billions';
  fiscalYearConvention: FiscalYearConvention;
  fiscalYearNote?: string;
  periodsAvailable: ReportingPeriodType[];
  lastUpdated: string;
}
