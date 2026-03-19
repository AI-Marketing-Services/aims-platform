import { cn } from "@/lib/utils"

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface", className)} />
}

/** Dashboard-style skeleton: KPI cards + chart + table */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Pulse className="h-4 w-24" />
            <Pulse className="h-8 w-32" />
            <Pulse className="h-3 w-20" />
          </div>
        ))}
      </div>
      {/* Chart placeholder */}
      <div className="rounded-xl border border-border bg-card p-6">
        <Pulse className="h-5 w-40 mb-4" />
        <Pulse className="h-64 w-full" />
      </div>
      {/* Table placeholder */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <Pulse className="h-5 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Pulse key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}

/** Table-style skeleton: header + rows */
export function TableSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Pulse className="h-7 w-48" />
        <Pulse className="h-9 w-32 rounded-md" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border p-4">
          <Pulse className="h-9 w-full rounded-md" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Pulse className="h-5 w-5 rounded" />
              <Pulse className="h-4 flex-1" />
              <Pulse className="h-4 w-24" />
              <Pulse className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Detail/form-style skeleton */
export function DetailSkeleton() {
  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <Pulse className="h-8 w-64" />
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Pulse className="h-4 w-24" />
            <Pulse className="h-10 w-full rounded-md" />
          </div>
        ))}
        <Pulse className="h-10 w-32 rounded-md" />
      </div>
    </div>
  )
}

/** Simple card grid skeleton */
export function CardGridSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Pulse className="h-7 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Pulse className="h-10 w-10 rounded-lg" />
            <Pulse className="h-5 w-32" />
            <Pulse className="h-4 w-full" />
            <Pulse className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
