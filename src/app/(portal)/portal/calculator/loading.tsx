import { cn } from "@/lib/utils"

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface", className)} />
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Pulse className="h-6 w-44" />
        <Pulse className="h-3.5 w-72" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Pulse className="h-3 w-32" />
              <Pulse className="h-9 w-full" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <Pulse className="h-4 w-28" />
          <Pulse className="h-12 w-32" />
          <div className="space-y-2 pt-3 border-t border-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Pulse className="h-3 w-24" />
                <Pulse className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
