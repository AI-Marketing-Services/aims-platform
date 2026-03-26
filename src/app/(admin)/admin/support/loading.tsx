import { cn } from "@/lib/utils"

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface", className)} />
}

/** Matches actual support page: header + 4 stat cards + filter tabs + ticket list */
export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header with icon */}
      <div className="flex items-center gap-3">
        <Pulse className="h-10 w-10 rounded-xl" />
        <div className="space-y-1.5">
          <Pulse className="h-7 w-40" />
          <Pulse className="h-4 w-56" />
        </div>
      </div>

      {/* 4 Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <Pulse className="h-3 w-16" />
            <Pulse className="h-7 w-12" />
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Pulse key={i} className="h-8 w-20 rounded-lg" />
        ))}
      </div>

      {/* Ticket list */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Pulse className="h-5 w-16 rounded-full" />
              <Pulse className="h-4 w-14" />
              <Pulse className="h-4 w-8" />
            </div>
            <Pulse className="h-4 w-3/4" />
            <div className="flex items-center gap-3">
              <Pulse className="h-3 w-24" />
              <Pulse className="h-3 w-28" />
              <Pulse className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
