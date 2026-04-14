import FinancialTable, { TableRow } from './FinancialTable';
import { FinancialPeriodRecord } from '@/types/financials';

interface CashFlowStatementProps {
  records: FinancialPeriodRecord[];
}

export default function CashFlowStatement({ records }: CashFlowStatementProps) {
  const headers = records.map((r) => r.period.periodLabel);
  const unit = records[0]?.period.unit ?? 'millions';
  const currency = records[0]?.period.currency ?? '';

  const rows: TableRow[] = [
    { label: 'Operating Cash Flow', values: records.map((r) => r.cashFlow.operatingCashFlow), isSubtotal: true },
    { label: 'Capital Expenditures', values: records.map((r) => r.cashFlow.capitalExpenditures ?? null), indent: true },
    { label: 'Free Cash Flow', values: records.map((r) => r.cashFlow.freeCashFlow ?? null), isTotal: true },
    { label: 'Investing Cash Flow', values: records.map((r) => r.cashFlow.investingCashFlow) },
    { label: 'Financing Cash Flow', values: records.map((r) => r.cashFlow.financingCashFlow) },
    { label: 'Net Change in Cash', values: records.map((r) => r.cashFlow.netChangeInCash), isSubtotal: true },
  ];

  return <FinancialTable headers={headers} rows={rows} unit={unit} currency={currency} />;
}
