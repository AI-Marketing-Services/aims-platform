export default function BlogPostLoading() {
  return (
    <div className="min-h-screen bg-deep animate-pulse">
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Breadcrumb */}
        <div className="h-4 w-32 bg-surface rounded mb-8" />

        {/* Title */}
        <div className="space-y-3 mb-6">
          <div className="h-8 bg-surface rounded w-full" />
          <div className="h-8 bg-surface rounded w-4/5" />
        </div>

        {/* Meta */}
        <div className="flex gap-4 mb-10">
          <div className="h-4 w-20 bg-surface rounded" />
          <div className="h-4 w-24 bg-surface rounded" />
          <div className="h-4 w-16 bg-surface rounded" />
        </div>

        {/* Content blocks */}
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`h-4 bg-surface rounded ${i % 3 === 2 ? "w-3/4" : "w-full"}`} />
          ))}
          <div className="h-32 bg-surface rounded my-6" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i + 10} className={`h-4 bg-surface rounded ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
