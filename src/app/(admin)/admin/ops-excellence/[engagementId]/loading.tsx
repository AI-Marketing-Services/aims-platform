export default function AdminOpsEngagementLoading() {
  return (
    <div className="max-w-7xl animate-pulse space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 rounded bg-surface" />
        <div className="h-4 w-4 rounded-full bg-surface" />
        <div className="h-4 w-24 rounded bg-surface" />
        <div className="h-4 w-4 rounded-full bg-surface" />
        <div className="h-4 w-48 rounded bg-surface" />
      </div>

      {/* Engagement header */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="h-7 w-56 rounded bg-surface" />
            <div className="h-4 w-40 rounded bg-surface" />
            <div className="flex gap-2 pt-1">
              <div className="h-5 w-20 rounded-full bg-surface" />
              <div className="h-5 w-16 rounded-full bg-surface" />
            </div>
          </div>
          <div className="text-right space-y-1.5 flex-shrink-0">
            <div className="h-8 w-24 rounded bg-surface ml-auto" />
            <div className="h-4 w-20 rounded bg-surface ml-auto" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-20 rounded bg-surface" />
              <div className="h-5 w-28 rounded bg-surface" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-28 rounded-lg bg-surface" />
        ))}
      </div>

      {/* Tab content placeholder */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="h-5 w-40 rounded bg-surface" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-[#0E1219] p-4 space-y-2">
              <div className="h-3 w-20 rounded bg-surface" />
              <div className="h-7 w-12 rounded bg-surface" />
            </div>
          ))}
        </div>
        <div className="space-y-3 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-48 rounded bg-surface" />
                <div className="h-5 w-16 rounded-full bg-surface" />
              </div>
              <div className="h-3 w-full max-w-sm rounded bg-surface" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
