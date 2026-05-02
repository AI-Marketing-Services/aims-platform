import { cn } from "@/lib/utils"

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface", className)} />
}

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-card p-8 space-y-3">
        <Pulse className="h-3 w-32" />
        <Pulse className="h-9 w-64" />
        <Pulse className="h-3 w-96" />
        <Pulse className="h-2 w-full mt-6" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 flex gap-3">
            <Pulse className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Pulse className="h-4 w-1/2" />
              <Pulse className="h-3 w-3/4" />
              <Pulse className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
