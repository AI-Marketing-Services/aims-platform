import { cn } from "@/lib/utils"

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface", className)} />
}

/** Matches CRM kanban board: header + 5-column board with cards. */
export default function Loading() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Pulse className="h-9 w-9 rounded-lg" />
          <div className="space-y-1.5">
            <Pulse className="h-4 w-32" />
            <Pulse className="h-3 w-44" />
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Pulse className="h-2.5 w-14" />
              <Pulse className="h-4 w-16" />
            </div>
          ))}
          <Pulse className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto px-6 py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 min-w-[800px]">
          {Array.from({ length: 5 }).map((_, col) => (
            <div key={col} className="space-y-3">
              <div className="flex items-center justify-between">
                <Pulse className="h-3 w-20" />
                <Pulse className="h-4 w-6" />
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2.5">
                  <Pulse className="h-3.5 w-3/4" />
                  <Pulse className="h-3 w-full" />
                  <Pulse className="h-2.5 w-1/2" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
