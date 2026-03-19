export default function OnboardingLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="h-4 w-24 bg-surface animate-pulse rounded" />
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-surface animate-pulse rounded" />
          <div className="h-3 w-72 bg-surface animate-pulse rounded" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-4 w-32 bg-surface animate-pulse rounded" />
            <div className="h-10 w-full bg-deep animate-pulse rounded-lg" />
          </div>
        ))}
        <div className="h-12 w-full bg-surface animate-pulse rounded-lg" />
      </div>
    </div>
  )
}
