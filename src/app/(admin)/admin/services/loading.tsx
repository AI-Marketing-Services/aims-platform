import { SkeletonStatCards, SkeletonTable } from "@/components/shared/Skeleton"

export default function ServicesLoading() {
  return (
    <div className="space-y-6">
      <SkeletonStatCards count={4} />
      <SkeletonTable rows={6} />
    </div>
  )
}
