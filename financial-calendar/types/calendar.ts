export type EarningsStatus = 'confirmed' | 'estimated' | 'reported';

export interface EarningsEvent {
  id: string;
  companySlug: string;
  companyName: string;
  ticker: string;
  exchange: string;
  periodLabel: string;
  announcedDate: string;
  status: EarningsStatus;
  revenueActual?: number;
  revenueEstimate?: number;
  epsActual?: number;
  epsEstimate?: number;
  reportUrl?: string;
  notes?: string;
}

export interface CompanyEarningsFile {
  companySlug: string;
  events: EarningsEvent[];
  lastUpdated: string;
}
