import { cn } from "@/lib/utils"

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface", className)} />
}

/** Matches actual portal dashboard: greeting + metric cards + quick actions + services */
export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Pulse className="h-7 w-64" />
        <Pulse className="h-4 w-80" />
      </div>

      {/* 4 Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Pulse className="h-3 w-24" />
              <Pulse className="h-9 w-9 rounded-xl" />
            </div>
            <Pulse className="h-8 w-20" />
            <Pulse className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Pulse key={i} className="h-9 w-28 rounded-lg" />
        ))}
      </div>

      {/* Services section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Pulse className="h-5 w-32" />
          <Pulse className="h-4 w-16" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Pulse className="h-4 w-40" />
                <Pulse className="h-5 w-16 rounded-full" />
              </div>
              <Pulse className="h-3 w-56" />
            </div>
            <Pulse className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}
