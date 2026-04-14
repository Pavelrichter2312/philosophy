import FinancialTable, { TableRow } from './FinancialTable';
import { FinancialPeriodRecord } from '@/types/financials';

interface IncomeStatementProps {
  records: FinancialPeriodRecord[];
}

export default function IncomeStatement({ records }: IncomeStatementProps) {
  const headers = records.map((r) => r.period.periodLabel);
  const unit = records[0]?.period.unit ?? 'millions';
  const currency = records[0]?.period.currency ?? '';

  const rows: TableRow[] = [
    {
      label: 'Revenue',
      values: records.map((r) => r.incomeStatement.revenue),
      isSubtotal: true,
    },
    {
      label: 'Gross Profit',
      values: records.map((r) => r.incomeStatement.grossProfit ?? null),
    },
    {
      label: 'Gross Margin',
      values: records.map((r) => r.incomeStatement.grossMargin ?? null),
      isMargin: true,
      indent: true,
    },
    {
      label: 'EBITDA',
      values: records.map((r) => r.incomeStatement.ebitda ?? null),
    },
    {
      label: 'EBITDA Margin',
      values: records.map((r) => r.incomeStatement.ebitdaMargin ?? null),
      isMargin: true,
      indent: true,
    },
    {
      label: 'Operating Income',
      values: records.map((r) => r.incomeStatement.operatingIncome),
    },
    {
      label: 'Operating Margin',
      values: records.map((r) => r.incomeStatement.operatingMargin ?? null),
      isMargin: true,
      indent: true,
    },
    {
      label: 'Net Income',
      values: records.map((r) => r.incomeStatement.netIncome),
      isTotal: true,
    },
    {
      label: 'Net Margin',
      values: records.map((r) => r.incomeStatement.netMargin ?? null),
      isMargin: true,
      indent: true,
    },
    {
      label: 'EPS (Basic)',
      values: records.map((r) => r.incomeStatement.eps ?? null),
    },
    {
      label: 'EPS (Diluted)',
      values: records.map((r) => r.incomeStatement.epsDiluted ?? null),
    },
  ];

  return <FinancialTable headers={headers} rows={rows} unit={unit} currency={currency} />;
}
