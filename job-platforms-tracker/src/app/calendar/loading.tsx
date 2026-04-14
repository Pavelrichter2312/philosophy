import SkeletonTable from '@/components/ui/SkeletonTable';

export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-9 bg-surface-raised rounded w-56 mb-2" />
      <div className="h-4 bg-surface-raised rounded w-80 mb-8" />
      <div className="h-3 bg-surface-raised rounded w-20 mb-3" />
      <SkeletonTable rows={5} cols={7} />
      <div className="h-3 bg-surface-raised rounded w-16 mb-3 mt-10" />
      <SkeletonTable rows={8} cols={7} />
    </div>
  );
}
