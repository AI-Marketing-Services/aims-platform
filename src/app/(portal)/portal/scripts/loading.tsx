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
          <Pulse className="h-3.5 w-64" />
        </div>
        <Pulse className="h-9 w-32 rounded-lg" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Pulse key={i} className="h-7 w-20 rounded-lg shrink-0" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Pulse key={i} className="h-44" />
        ))}
      </div>
    </div>
  )
}
