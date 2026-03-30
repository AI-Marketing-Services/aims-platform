export default function BusinessCreditScoreLoading() {
  return (
    <div className="min-h-screen bg-deep animate-pulse">
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-4 w-32 bg-surface rounded" />
          <div className="flex gap-3">
            <div className="h-9 w-28 bg-surface rounded-lg" />
            <div className="h-9 w-28 bg-surface rounded-lg" />
          </div>
        </div>

        {/* Hero score card */}
        <div className="bg-card border border-border rounded-2xl p-10 mb-6">
          <div className="flex flex-col items-center text-center">
            <div className="h-4 w-48 bg-surface rounded mb-6" />
            <div className="h-24 w-40 bg-surface rounded-xl mb-4" />
            <div className="h-7 w-32 bg-surface rounded-full mb-4" />
            <div className="h-4 w-40 bg-surface rounded mb-2" />
            <div className="h-4 w-28 bg-surface rounded mb-8" />

            {/* Gauge bar */}
            <div className="w-full max-w-lg">
              <div className="h-4 bg-surface rounded-full mb-2" />
              <div className="flex justify-between">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-3 w-16 bg-surface rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dimension bars */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="h-5 w-48 bg-surface rounded mb-2" />
          <div className="h-4 w-64 bg-surface rounded mb-6" />
          <div className="space-y-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <div className="h-4 w-36 bg-surface rounded" />
                  <div className="h-4 w-10 bg-surface rounded" />
                </div>
                <div className="h-2.5 bg-surface rounded-full" />
                <div className="h-3 w-64 bg-surface rounded mt-1.5" />
              </div>
            ))}
          </div>
        </div>

        {/* Factors analysis */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6">
              <div className="h-5 w-36 bg-surface rounded mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <div className="w-4 h-4 bg-surface rounded-full mt-0.5 flex-shrink-0" />
                    <div className="h-4 bg-surface rounded flex-1" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Action plan */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="h-5 w-44 bg-surface rounded mb-2" />
          <div className="h-4 w-72 bg-surface rounded mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-8 h-8 bg-surface rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-48 bg-surface rounded mb-2" />
                  <div className="h-3 w-full bg-surface rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5">
              <div className="h-4 w-32 bg-surface rounded mb-2" />
              <div className="h-3 w-full bg-surface rounded mb-1" />
              <div className="h-3 w-3/4 bg-surface rounded mb-4" />
              <div className="h-4 w-20 bg-surface rounded mb-4" />
              <div className="h-8 w-full bg-surface rounded-lg" />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="h-7 w-72 bg-surface rounded mx-auto mb-3" />
          <div className="h-4 w-full max-w-md bg-surface rounded mx-auto mb-2" />
          <div className="h-4 w-80 bg-surface rounded mx-auto mb-6" />
          <div className="h-12 w-52 bg-surface rounded-xl mx-auto" />
        </div>
      </div>
    </div>
  )
}
