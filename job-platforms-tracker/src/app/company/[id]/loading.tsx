import SkeletonTable from '@/components/ui/SkeletonTable';

export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-surface-raised rounded w-48 mb-6" />
      <div className="h-9 bg-surface-raised rounded w-64 mb-2" />
      <div className="h-4 bg-surface-raised rounded w-40 mb-8" />
      <div className="grid grid-cols-3 gap-px bg-border border border-border rounded overflow-hidden mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface p-4">
            <div className="h-3 bg-surface-raised rounded w-16 mb-2" />
            <div className="h-5 bg-surface-raised rounded w-20" />
          </div>
        ))}
      </div>
      <div className="h-8 bg-surface-raised rounded w-full mb-6" />
      <div className="h-[260px] bg-surface-raised rounded mb-6" />
      <SkeletonTable rows={6} cols={6} />
    </div>
  );
}
