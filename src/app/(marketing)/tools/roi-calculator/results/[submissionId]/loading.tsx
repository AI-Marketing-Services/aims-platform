export default function QuizResultsLoading() {
  return (
    <div className="min-h-screen bg-deep animate-pulse">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Score card */}
        <div className="bg-card border border-border rounded-2xl p-8 text-center mb-8">
          <div className="h-4 w-32 bg-surface rounded mx-auto mb-6" />
          <div className="h-16 w-28 bg-surface rounded mx-auto mb-4" />
          <div className="h-6 w-48 bg-surface rounded mx-auto mb-3" />
          <div className="h-4 w-64 bg-surface rounded mx-auto" />
        </div>

        {/* Result sections */}
        <div className="space-y-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5">
              <div className="h-4 w-32 bg-surface rounded mb-3" />
              <div className="h-4 w-full bg-surface rounded mb-2" />
              <div className="h-4 w-4/5 bg-surface rounded" />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <div className="h-6 w-48 bg-surface rounded mx-auto mb-3" />
          <div className="h-4 w-64 bg-surface rounded mx-auto mb-6" />
          <div className="h-10 w-40 bg-surface rounded mx-auto" />
        </div>
      </div>
    </div>
  )
}
