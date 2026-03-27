export default function AdminOpsExcellenceLoading() {
  return (
    <div className="max-w-7xl animate-pulse">
      <div className="mb-6 space-y-2">
        <div className="h-8 w-56 rounded bg-surface" />
        <div className="h-4 w-40 rounded bg-surface" />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className="h-3 w-20 rounded bg-surface" />
            <div className="h-7 w-12 rounded bg-surface" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="border-b border-border px-6 py-3">
          <div className="flex gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-3 w-16 rounded bg-surface" />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border">
            <div className="h-4 w-32 rounded bg-surface" />
            <div className="h-4 w-24 rounded bg-surface" />
            <div className="h-5 w-16 rounded-full bg-surface" />
            <div className="h-4 w-8 rounded bg-surface" />
            <div className="h-4 w-8 rounded bg-surface" />
          </div>
        ))}
      </div>
    </div>
  )
}
