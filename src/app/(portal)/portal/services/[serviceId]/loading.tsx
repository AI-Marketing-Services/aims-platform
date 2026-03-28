function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface ${className ?? ""}`} />
}

export default function Loading() {
  return (
    <div className="max-w-3xl space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <Pulse className="h-4 w-12" />
        <Pulse className="h-4 w-4 rounded-full" />
        <Pulse className="h-4 w-16" />
        <Pulse className="h-4 w-4 rounded-full" />
        <Pulse className="h-4 w-32" />
      </div>

      {/* Header card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex gap-2">
              <Pulse className="h-5 w-20 rounded-full" />
              <Pulse className="h-5 w-24 rounded-full" />
            </div>
            <Pulse className="h-6 w-48" />
            <Pulse className="h-4 w-full max-w-sm" />
          </div>
          <div className="text-right space-y-1.5 flex-shrink-0">
            <Pulse className="h-8 w-24 ml-auto" />
            <Pulse className="h-4 w-20 ml-auto" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Pulse className="h-3 w-16" />
              <Pulse className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>

      {/* Progress card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Pulse className="h-4 w-32" />
          <Pulse className="h-4 w-24" />
        </div>
        <Pulse className="h-2 w-full rounded-full" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Pulse className="h-4 w-4 rounded-full mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Pulse className="h-4 w-full max-w-xs" />
                <Pulse className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Pulse className="h-10 w-36 rounded-lg" />
        <Pulse className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  )
}
