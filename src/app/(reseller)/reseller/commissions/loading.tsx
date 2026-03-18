import { SkeletonStatCards, SkeletonTable } from "@/components/shared/Skeleton"

export default function CommissionsLoading() {
  return (
    <div className="space-y-6">
      <SkeletonStatCards count={3} />
      <SkeletonTable rows={5} />
    </div>
  )
}
