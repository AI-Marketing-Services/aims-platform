export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-card rounded animate-pulse" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-card rounded-xl border border-border animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 bg-card rounded-xl border border-border animate-pulse" />
        ))}
      </div>
    </div>
  )
}
