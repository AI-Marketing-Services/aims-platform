import { cn } from "@/lib/utils"

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface", className)} />
}

/** Matches actual services page: header + 3 metric cards + service cards */
export default function Loading() {
  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <Pulse className="h-7 w-36" />
        <Pulse className="h-4 w-64" />
      </div>

      {/* 3 Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4">
            <Pulse className="w-9 h-9 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Pulse className="h-3 w-28" />
              <Pulse className="h-7 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Service cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Pulse className="h-5 w-40" />
              <Pulse className="h-5 w-16 rounded-full" />
              <Pulse className="h-5 w-20 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Pulse className="h-2 w-full rounded-full" />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Pulse className="h-4 w-24" />
              <Pulse className="h-4 w-32" />
            </div>
            <div className="flex gap-2">
              <Pulse className="h-8 w-28 rounded-lg" />
              <Pulse className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
