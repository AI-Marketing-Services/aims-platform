import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-md bg-surface", className)} />
  )
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-5 space-y-3", className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-border">
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

const TABLE_HEADER_WIDTHS = ["w-40", "w-24", "w-16", "w-16", "w-16"]

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex gap-4">
        {TABLE_HEADER_WIDTHS.map((w, i) => (
          <Skeleton key={i} className={`h-3 ${w}`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}

const STAT_GRID_CLASSES: Record<number, string> = {
  2: "grid grid-cols-2 gap-4 sm:grid-cols-2",
  3: "grid grid-cols-2 gap-4 sm:grid-cols-3",
  4: "grid grid-cols-2 gap-4 sm:grid-cols-4",
  5: "grid grid-cols-2 gap-4 sm:grid-cols-5",
  6: "grid grid-cols-2 gap-4 sm:grid-cols-6",
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  const gridClass = STAT_GRID_CLASSES[count] ?? STAT_GRID_CLASSES[4]
  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
