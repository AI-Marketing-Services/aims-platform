import { cn } from "@/lib/utils"

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface", className)} />
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Pulse className="h-6 w-44" />
          <Pulse className="h-3.5 w-72" />
        </div>
        <Pulse className="h-9 w-32 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
            <Pulse className="h-5 w-5 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Pulse className="h-4 w-1/2" />
              <Pulse className="h-3 w-3/4" />
            </div>
            <Pulse className="h-7 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
