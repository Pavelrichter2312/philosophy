export default function SkeletonTable({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-scroll animate-pulse">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b border-border">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="py-2 pr-4 text-left">
                <div className="h-3 bg-surface-raised rounded w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-border">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="py-2.5 pr-4">
                  <div
                    className="h-3 bg-surface-raised rounded"
                    style={{ width: c === 0 ? '120px' : `${50 + Math.random() * 40}px` }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
