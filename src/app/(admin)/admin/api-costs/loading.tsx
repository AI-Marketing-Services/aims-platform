import { SkeletonStatCards, SkeletonTable } from "@/components/shared/Skeleton"

export default function ApiCostsLoading() {
  return (
    <div className="space-y-6">
      <SkeletonStatCards count={4} />
      <SkeletonTable rows={5} />
    </div>
  )
}
