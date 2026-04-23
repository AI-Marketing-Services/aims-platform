export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-48 bg-surface rounded animate-pulse" />
      <div className="h-8 w-72 bg-surface rounded animate-pulse" />
      <div className="h-10 w-80 bg-surface rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-surface rounded-lg border border-border animate-pulse" />
        ))}
      </div>
    </div>
  )
}
