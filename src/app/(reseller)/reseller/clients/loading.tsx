import { Skeleton, SkeletonTable } from "@/components/shared/Skeleton"

export default function ResellerClientsLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <SkeletonTable rows={6} />
    </div>
  )
}
