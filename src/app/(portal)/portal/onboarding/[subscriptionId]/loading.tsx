export default function OnboardingLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-gray-200 animate-pulse rounded" />
          <div className="h-3 w-72 bg-gray-200 animate-pulse rounded" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
            <div className="h-10 w-full bg-gray-100 animate-pulse rounded-lg" />
          </div>
        ))}
        <div className="h-12 w-full bg-gray-200 animate-pulse rounded-lg" />
      </div>
    </div>
  )
}
