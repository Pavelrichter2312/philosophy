import { formatNumber } from '@/lib/utils/numbers';

export interface TableRow {
  label: string;
  values: (number | undefined | null)[];
  isSubtotal?: boolean;
  isTotal?: boolean;
  indent?: boolean;
  isMargin?: boolean;
}

interface FinancialTableProps {
  headers: string[];
  rows: TableRow[];
  unit: string;
  currency: string;
}

function formatCell(v: number | undefined | null, isMargin?: boolean): string {
  if (v === undefined || v === null) return '—';
  if (isMargin) return `${(v * 100).toFixed(1)}%`;
  return formatNumber(v);
}

export default function FinancialTable({ headers, rows, unit, currency }: FinancialTableProps) {
  return (
    <div className="overflow-x-auto">
      <div className="text-[11px] text-ink-faint mb-3">
        Reported in {currency} {unit}
      </div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-6 font-normal text-ink-muted w-64">
              {/* row label column */}
            </th>
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-right py-2 px-3 font-medium text-ink tabular-nums font-mono text-[12px]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`border-b border-border/60 hover:bg-surface-raised transition-colors ${
                row.isTotal ? 'font-medium' : ''
              } ${row.isSubtotal ? 'border-b border-border' : ''}`}
            >
              <td
                className={`py-2 pr-6 text-ink-muted text-[12px] ${
                  row.indent ? 'pl-4' : ''
                } ${row.isTotal ? 'text-ink font-medium' : ''}`}
              >
                {row.label}
              </td>
              {row.values.map((val, j) => (
                <td
                  key={j}
                  className={`py-2 px-3 text-right tabular-nums font-mono text-[12px] ${
                    row.isTotal ? 'text-ink font-medium' : 'text-ink'
                  } ${val !== undefined && val !== null && val < 0 ? 'text-negative' : ''}`}
                >
                  {formatCell(val, row.isMargin)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
