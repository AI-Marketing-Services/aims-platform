export default function SupportLoading() {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="h-5 w-40 bg-gray-200 animate-pulse rounded" />
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="h-3 w-16 bg-gray-200 animate-pulse rounded" />
            <div className="h-9 w-full bg-gray-200 animate-pulse rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
            <div className="h-24 w-full bg-gray-200 animate-pulse rounded-lg" />
          </div>
        </div>
        <div className="h-9 w-32 bg-gray-200 animate-pulse rounded-lg" />
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50">
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-48 bg-gray-200 animate-pulse rounded" />
              <div className="h-3 w-32 bg-gray-200 animate-pulse rounded" />
            </div>
            <div className="h-5 w-16 bg-gray-200 animate-pulse rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
