import FinancialTable, { TableRow } from './FinancialTable';
import { FinancialPeriodRecord } from '@/types/financials';

interface BalanceSheetProps {
  records: FinancialPeriodRecord[];
}

export default function BalanceSheet({ records }: BalanceSheetProps) {
  const headers = records.map((r) => r.period.periodLabel);
  const unit = records[0]?.period.unit ?? 'millions';
  const currency = records[0]?.period.currency ?? '';

  const rows: TableRow[] = [
    { label: 'Cash & Equivalents', values: records.map((r) => r.balanceSheet.cashAndEquivalents) },
    { label: 'Short-term Investments', values: records.map((r) => r.balanceSheet.shortTermInvestments ?? null) },
    { label: 'Total Current Assets', values: records.map((r) => r.balanceSheet.totalCurrentAssets), isSubtotal: true },
    { label: 'Total Non-current Assets', values: records.map((r) => r.balanceSheet.totalNonCurrentAssets) },
    { label: 'Total Assets', values: records.map((r) => r.balanceSheet.totalAssets), isTotal: true },
    { label: 'Total Current Liabilities', values: records.map((r) => r.balanceSheet.totalCurrentLiabilities), isSubtotal: true },
    { label: 'Long-term Debt', values: records.map((r) => r.balanceSheet.longTermDebt ?? null), indent: true },
    { label: 'Total Non-current Liabilities', values: records.map((r) => r.balanceSheet.totalNonCurrentLiabilities) },
    { label: 'Total Liabilities', values: records.map((r) => r.balanceSheet.totalLiabilities), isSubtotal: true },
    { label: 'Total Equity', values: records.map((r) => r.balanceSheet.totalEquity), isTotal: true },
  ];

  return <FinancialTable headers={headers} rows={rows} unit={unit} currency={currency} />;
}
