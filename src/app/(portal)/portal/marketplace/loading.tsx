export default function MarketplaceLoading() {
  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <div className="h-9 flex-1 max-w-xs bg-gray-200 animate-pulse rounded-lg" />
        <div className="h-9 w-32 bg-gray-200 animate-pulse rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <div className="h-4 w-1/3 bg-gray-200 animate-pulse rounded" />
            <div className="h-6 w-2/3 bg-gray-200 animate-pulse rounded" />
            <div className="h-3 w-full bg-gray-200 animate-pulse rounded" />
            <div className="h-3 w-4/5 bg-gray-200 animate-pulse rounded" />
            <div className="flex justify-between items-center pt-2">
              <div className="h-5 w-16 bg-gray-200 animate-pulse rounded" />
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
