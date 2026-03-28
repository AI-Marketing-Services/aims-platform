function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="max-w-5xl space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <Pulse className="h-4 w-14" />
        <Pulse className="h-4 w-4 rounded-full" />
        <Pulse className="h-4 w-16" />
        <Pulse className="h-4 w-4 rounded-full" />
        <Pulse className="h-4 w-36" />
      </div>

      {/* Client header card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-start gap-4">
          <Pulse className="h-14 w-14 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Pulse className="h-6 w-48" />
            <Pulse className="h-4 w-64" />
            <div className="flex gap-2 pt-1">
              <Pulse className="h-5 w-20 rounded-full" />
              <Pulse className="h-5 w-24 rounded-full" />
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Pulse className="h-9 w-28 rounded-lg" />
            <Pulse className="h-9 w-24 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Pulse className="h-3 w-20" />
              <Pulse className="h-5 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Pulse key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>

      {/* Content area */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <Pulse className="h-5 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Pulse className="h-4 w-40" />
              <Pulse className="h-5 w-20 rounded-full" />
            </div>
            <Pulse className="h-3 w-full max-w-sm" />
            <div className="flex gap-4">
              <Pulse className="h-3 w-24" />
              <Pulse className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
