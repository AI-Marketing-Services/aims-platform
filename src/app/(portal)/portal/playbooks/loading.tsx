import { cn } from "@/lib/utils"

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface", className)} />
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Pulse className="h-6 w-36" />
        <Pulse className="h-3.5 w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <Pulse key={i} className="h-48" />
        ))}
      </div>
    </div>
  )
}
