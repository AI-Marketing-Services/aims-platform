export default function OnboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-muted" />
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  )
}
