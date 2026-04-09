export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="h-10 w-72 rounded bg-surface animate-pulse" />
          <div className="h-5 w-[36rem] max-w-full rounded bg-surface/60 animate-pulse mt-3" />
          <div className="mt-8 flex gap-3">
            <div className="h-10 w-64 rounded-xl bg-surface animate-pulse" />
            <div className="h-10 w-80 rounded-xl bg-surface/60 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-4 w-48 rounded bg-surface/60 animate-pulse mb-6" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-5 space-y-4 animate-pulse"
            >
              <div className="h-6 w-24 rounded-full bg-surface" />
              <div className="h-6 w-3/4 rounded bg-surface" />
              <div className="h-4 w-full rounded bg-surface/60" />
              <div className="h-4 w-5/6 rounded bg-surface/60" />
              <div className="space-y-2 pt-2">
                <div className="h-3 w-full rounded bg-surface/50" />
                <div className="h-3 w-4/5 rounded bg-surface/50" />
                <div className="h-3 w-3/5 rounded bg-surface/50" />
              </div>
              <div className="h-10 w-full rounded-xl bg-surface mt-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
