import { cn } from "@/lib/utils"

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface", className)} />
}

/** Matches audits page: header + create CTA + grid of audit cards */
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Pulse className="h-6 w-36" />
          <Pulse className="h-3.5 w-72" />
        </div>
        <Pulse className="h-9 w-36 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Pulse className="h-4 w-2/3" />
              <Pulse className="h-5 w-14 rounded-full" />
            </div>
            <Pulse className="h-3 w-full" />
            <Pulse className="h-3 w-3/4" />
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Pulse className="h-3 w-20" />
              <Pulse className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
