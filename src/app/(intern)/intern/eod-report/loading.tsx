import { Skeleton, SkeletonCard } from "@/components/shared/Skeleton"

export default function EodReportLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>
      <SkeletonCard className="p-6" />
      <SkeletonCard className="p-6" />
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  )
}
