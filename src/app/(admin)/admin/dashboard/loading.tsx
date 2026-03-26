import { cn } from "@/lib/utils"

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface", className)} />
}

/** Matches the actual AdminDashboardClient layout */
export default function Loading() {
  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Pulse className="h-7 w-48" />
          <Pulse className="h-4 w-64" />
        </div>
        <Pulse className="h-9 w-28 rounded-lg" />
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-6 space-y-3">
            <div className="flex items-start justify-between">
              <Pulse className="h-3 w-16" />
              <Pulse className="h-9 w-9 rounded-full" />
            </div>
            <Pulse className="h-8 w-28" />
            <Pulse className="h-3 w-24" />
            <div className="space-y-1 pt-1">
              <Pulse className="h-2 w-full rounded-full" />
              <Pulse className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* 2 Chart panels */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="space-y-1">
              <Pulse className="h-4 w-32" />
              <Pulse className="h-3 w-48" />
            </div>
            <Pulse className="h-[200px] w-full" />
          </div>
        ))}
      </div>

      {/* 3 Bottom panels */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5 space-y-3">
            <Pulse className="h-4 w-28" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-start gap-2">
                <Pulse className="h-4 w-4 rounded shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <Pulse className="h-3 w-3/4" />
                  <Pulse className="h-2.5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
