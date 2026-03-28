function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="max-w-5xl space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <Pulse className="h-4 w-10" />
        <Pulse className="h-4 w-4 rounded-full" />
        <Pulse className="h-4 w-10" />
        <Pulse className="h-4 w-4 rounded-full" />
        <Pulse className="h-4 w-40" />
      </div>

      {/* Deal header */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Pulse className="h-7 w-56" />
            <Pulse className="h-4 w-40" />
            <div className="flex gap-2 pt-1">
              <Pulse className="h-5 w-24 rounded-full" />
              <Pulse className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Pulse className="h-9 w-32 rounded-lg" />
            <Pulse className="h-9 w-28 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Pulse className="h-3 w-20" />
              <Pulse className="h-5 w-28" />
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline stage track */}
      <div className="rounded-xl border border-border bg-card p-6">
        <Pulse className="h-4 w-32 mb-4" />
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Pulse key={i} className="h-8 flex-1 rounded-md" />
          ))}
        </div>
      </div>

      {/* Activity feed */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <Pulse className="h-5 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Pulse className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Pulse className="h-4 w-full max-w-xs" />
              <Pulse className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
