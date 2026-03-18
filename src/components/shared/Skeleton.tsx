import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-md bg-gray-200", className)} />
  )
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("bg-white border border-gray-200 rounded-xl p-5 space-y-3", className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100">
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-4 w-14" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex gap-4">
        {[40, 24, 16, 16, 16].map((w, i) => (
          <Skeleton key={i} className={`h-3 w-${w}`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 gap-4 sm:grid-cols-${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
