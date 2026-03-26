import { cn } from "@/lib/utils"

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface", className)} />
}

/** Matches actual Clients page: 5 stat cards + search + table */
export default function Loading() {
  return (
    <div className="max-w-7xl">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl px-4 py-3 space-y-2">
            <Pulse className="h-3 w-20" />
            <Pulse className="h-6 w-16" />
          </div>
        ))}
      </div>

      {/* Header + Export */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Pulse className="h-7 w-32" />
          <Pulse className="h-4 w-48" />
        </div>
        <Pulse className="h-9 w-28 rounded-lg" />
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-5">
        <Pulse className="h-9 flex-1 rounded-lg" />
        <Pulse className="h-9 w-36 rounded-lg" />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex gap-4">
          {["w-28", "w-24", "w-32", "w-20", "w-14", "w-16", "w-20", "w-16", "w-16"].map((w, i) => (
            <Pulse key={i} className={`h-3 ${w}`} />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border">
            <Pulse className="h-4 w-28" />
            <Pulse className="h-4 w-24" />
            <Pulse className="h-4 w-32" />
            <Pulse className="h-5 w-20 rounded-full" />
            <Pulse className="h-4 w-10" />
            <Pulse className="h-4 w-16" />
            <Pulse className="h-4 w-20" />
            <Pulse className="h-4 w-16" />
            <Pulse className="h-4 w-14" />
          </div>
        ))}
      </div>
    </div>
  )
}
