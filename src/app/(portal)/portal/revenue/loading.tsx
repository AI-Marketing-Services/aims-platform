import { cn } from "@/lib/utils"

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface", className)} />
}

/** Matches revenue page: header + 4 stat cards + chart + recent activity */
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Pulse className="h-6 w-40" />
        <Pulse className="h-3.5 w-64" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-2">
            <Pulse className="h-3 w-20" />
            <Pulse className="h-7 w-24" />
            <Pulse className="h-3 w-16" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Pulse className="h-4 w-32" />
          <Pulse className="h-7 w-24 rounded-md" />
        </div>
        <Pulse className="h-64 w-full" />
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <Pulse className="h-4 w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Pulse className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Pulse className="h-3.5 w-1/2" />
              <Pulse className="h-3 w-1/3" />
            </div>
            <Pulse className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
