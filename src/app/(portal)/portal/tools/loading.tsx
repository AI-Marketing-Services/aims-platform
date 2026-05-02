import { cn } from "@/lib/utils"

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface", className)} />
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Pulse className="h-6 w-32" />
        <Pulse className="h-3.5 w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Pulse className="h-10 w-10 rounded-lg" />
            <Pulse className="h-4 w-3/4" />
            <Pulse className="h-3 w-full" />
            <Pulse className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
