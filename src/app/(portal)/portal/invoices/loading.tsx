import { cn } from "@/lib/utils"

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface", className)} />
}

/** Matches invoices list: header + 3 stat cards + table rows. */
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Pulse className="h-6 w-32" />
          <Pulse className="h-3.5 w-56" />
        </div>
        <Pulse className="h-9 w-32 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-2">
            <Pulse className="h-3 w-24" />
            <Pulse className="h-7 w-20" />
            <Pulse className="h-3 w-16" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-5 py-3 flex items-center gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Pulse key={i} className="h-3 flex-1" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-b border-border last:border-b-0 px-5 py-4 flex items-center gap-4">
            {Array.from({ length: 5 }).map((_, j) => (
              <Pulse key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
