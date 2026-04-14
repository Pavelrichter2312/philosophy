export default function Footer() {
  return (
    <footer className="border-t border-border mt-16 pb-20 sm:pb-8">
      <div className="max-w-grid mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p className="text-[11px] text-ink-faint">
          Financial data sourced from public filings. Not investment advice.
        </p>
        <p className="text-[11px] text-ink-faint">
          Updated: Apr 2025
        </p>
      </div>
    </footer>
  );
}
