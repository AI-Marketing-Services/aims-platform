import { Skeleton, SkeletonTable } from "@/components/shared/Skeleton"

export default function TasksLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 flex-1 max-w-xs rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <SkeletonTable rows={6} />
    </div>
  )
}
