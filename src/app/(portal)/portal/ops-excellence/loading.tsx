export default function OpsExcellenceLoading() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
        {/* Company header skeleton */}
        <div className="flex items-center gap-4 pb-6 border-b border-border">
          <div className="h-14 w-14 rounded-full bg-surface" />
          <div className="space-y-2">
            <div className="h-8 w-64 rounded bg-surface" />
            <div className="h-4 w-32 rounded bg-surface" />
          </div>
        </div>

        {/* Score gauge skeleton */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-col items-center py-6">
            <div className="h-60 w-60 rounded-full bg-surface" />
            <div className="h-6 w-32 rounded bg-surface mt-4" />
          </div>
        </div>

        {/* Dimension cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="h-4 w-24 rounded bg-surface" />
              <div className="h-8 w-16 rounded bg-surface" />
              <div className="h-1.5 w-full rounded-full bg-surface" />
              <div className="h-3 w-48 rounded bg-surface" />
            </div>
          ))}
        </div>

        {/* Capacity section skeleton */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <div className="h-5 w-28 rounded bg-surface" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 p-3 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-surface rounded-xl p-4 space-y-2">
                <div className="h-3 w-20 rounded bg-panel" />
                <div className="h-7 w-16 rounded bg-panel" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
