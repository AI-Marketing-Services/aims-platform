export default function Loading() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-7 w-48 rounded bg-surface animate-pulse" />
        <div className="h-4 w-80 rounded bg-surface/60 animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="h-3 w-20 rounded bg-surface animate-pulse" />
            <div className="h-6 w-24 rounded bg-surface animate-pulse mt-3" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-surface/50 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
