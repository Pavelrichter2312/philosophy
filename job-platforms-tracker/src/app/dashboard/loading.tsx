import SkeletonTable from '@/components/ui/SkeletonTable';

export default function Loading() {
  return (
    <div>
      <div className="mb-8 animate-pulse">
        <div className="h-8 bg-surface-raised rounded w-48 mb-2" />
        <div className="h-4 bg-surface-raised rounded w-80" />
      </div>
      <SkeletonTable rows={8} cols={9} />
    </div>
  );
}
