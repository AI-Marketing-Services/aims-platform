export default function ExecutiveOpsAuditResultsLoading() {
  return (
    <div className="min-h-screen bg-deep animate-pulse">
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Header nav */}
        <div className="flex items-center justify-between mb-10">
          <div className="h-4 w-36 bg-surface rounded" />
          <div className="flex gap-3">
            <div className="h-9 w-28 bg-surface rounded-lg" />
            <div className="h-9 w-28 bg-surface rounded-lg" />
          </div>
        </div>

        {/* Executive Summary Banner */}
        <div className="bg-card border border-border rounded-2xl p-8 mb-6 border-l-4 border-l-[#981B1B]">
          <div className="h-3 w-56 bg-surface rounded mb-4" />
          <div className="h-6 w-72 bg-surface rounded mb-2" />
          <div className="h-4 w-40 bg-surface rounded mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-surface/40 rounded-xl p-5">
                <div className="h-3 w-32 bg-surface rounded mb-3" />
                <div className="h-12 w-28 bg-surface rounded mb-2" />
                <div className="h-3 w-20 bg-surface rounded" />
              </div>
            ))}
          </div>
          <div className="mt-6">
            <div className="h-8 w-48 bg-surface rounded-full" />
          </div>
        </div>

        {/* Company Profile */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="h-5 w-40 bg-surface rounded mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="h-3 w-20 bg-surface rounded mb-2" />
                <div className="h-4 w-28 bg-surface rounded" />
              </div>
            ))}
          </div>
          <div className="bg-surface/30 rounded-xl p-4 mt-4">
            <div className="h-3 w-24 bg-surface rounded mb-2" />
            <div className="h-4 w-full bg-surface rounded" />
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="mb-6">
          <div className="h-5 w-60 bg-surface rounded mb-2" />
          <div className="h-4 w-80 bg-surface rounded mb-4" />
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-5 w-32 bg-surface rounded" />
                  <div className="h-4 w-20 bg-surface rounded" />
                </div>
                <div className="h-2.5 bg-surface rounded-full mb-2" />
                <div className="h-3 w-48 bg-surface rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-surface rounded" />
                  <div className="h-3 w-5/6 bg-surface rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pain Point Analysis */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="h-5 w-48 bg-surface rounded mb-4" />
          <div className="grid md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, col) => (
              <div key={col} className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-surface/30 rounded-xl p-4">
                    <div className="h-3 w-36 bg-surface rounded mb-2" />
                    <div className="h-4 w-full bg-surface rounded mb-1" />
                    <div className="h-4 w-3/4 bg-surface rounded" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Cost of Inefficiency */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="h-5 w-56 bg-surface rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-full bg-surface rounded" />
            ))}
          </div>
          <div className="bg-surface/30 rounded-xl p-5 mt-6">
            <div className="h-8 w-3/4 bg-surface rounded mx-auto" />
          </div>
          <div className="mt-4">
            <div className="h-6 w-80 bg-surface rounded" />
          </div>
        </div>

        {/* AI Readiness */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="h-5 w-44 bg-surface rounded mb-4" />
          <div className="flex flex-wrap gap-2 mb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-7 w-20 bg-surface rounded-full" />
            ))}
          </div>
          <div className="h-4 w-full bg-surface rounded mb-2" />
          <div className="h-4 w-5/6 bg-surface rounded" />
        </div>

        {/* Roadmap */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="h-5 w-56 bg-surface rounded mb-4" />
          <div className="space-y-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-9 h-9 bg-surface rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-56 bg-surface rounded mb-2" />
                  <div className="h-3 w-full bg-surface rounded mb-1" />
                  <div className="h-3 w-4/5 bg-surface rounded mb-3" />
                  <div className="flex gap-3">
                    <div className="h-6 w-32 bg-surface rounded-full" />
                    <div className="h-6 w-32 bg-surface rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Recommendations */}
        <div className="mb-6">
          <div className="h-5 w-60 bg-surface rounded mb-4" />
          <div className="grid md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5">
                <div className="h-4 w-40 bg-surface rounded mb-2" />
                <div className="h-3 w-full bg-surface rounded mb-1" />
                <div className="h-3 w-3/4 bg-surface rounded mb-4" />
                <div className="h-4 w-24 bg-surface rounded mb-4" />
                <div className="h-9 w-full bg-surface rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <div className="h-7 w-72 bg-surface rounded mx-auto mb-3" />
          <div className="h-4 w-full max-w-lg bg-surface rounded mx-auto mb-2" />
          <div className="h-4 w-96 bg-surface rounded mx-auto mb-8" />
          <div className="h-14 w-64 bg-surface rounded-xl mx-auto" />
        </div>
      </div>
    </div>
  )
}
