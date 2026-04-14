export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-9 bg-surface-raised rounded w-40 mb-2" />
      <div className="h-4 bg-surface-raised rounded w-72 mb-8" />
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 w-16 bg-surface-raised rounded" />
        ))}
      </div>
      <div className="flex gap-3 mb-4">
        <div className="h-8 w-32 bg-surface-raised rounded" />
        <div className="h-8 w-24 bg-surface-raised rounded" />
        <div className="h-8 w-28 bg-surface-raised rounded" />
      </div>
      <div className="h-[320px] bg-surface-raised rounded mb-6" />
      <div className="h-4 bg-surface-raised rounded w-48 mb-3" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 bg-surface-raised rounded mb-px" />
      ))}
    </div>
  );
}
