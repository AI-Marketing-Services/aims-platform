import { SkeletonStatCards, SkeletonTable } from "@/components/shared/Skeleton"

export default function VendorSavingsLoading() {
  return (
    <div className="space-y-6">
      <SkeletonStatCards count={4} />
      <SkeletonTable rows={5} />
    </div>
  )
}
