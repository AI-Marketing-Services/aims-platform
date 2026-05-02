import { cn } from "@/lib/utils"

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface", className)} />
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Pulse className="h-6 w-32" />
        <Pulse className="h-3.5 w-56" />
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
        <Pulse className="h-4 w-32" />
        <Pulse className="h-64 w-full" />
      </div>
    </div>
  )
}
