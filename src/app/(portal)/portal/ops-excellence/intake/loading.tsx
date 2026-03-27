export default function IntakeLoading() {
  return (
    <div className="min-h-screen bg-ink">
      <div className="mx-auto max-w-3xl px-4 py-8 animate-pulse">
        <div className="mb-8 space-y-2">
          <div className="h-8 w-72 rounded bg-surface" />
          <div className="h-4 w-56 rounded bg-surface" />
        </div>

        {/* Step progress skeleton */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className="h-8 w-8 rounded-full bg-surface shrink-0" />
              <div className="h-1 flex-1 rounded bg-surface" />
            </div>
          ))}
        </div>

        {/* Form skeleton */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-24 rounded bg-surface" />
              <div className="h-10 w-full rounded-lg bg-surface" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
