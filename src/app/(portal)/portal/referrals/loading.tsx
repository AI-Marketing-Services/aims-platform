export default function ReferralsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <div className="h-4 w-1/3 bg-gray-200 animate-pulse rounded" />
            <div className="h-8 w-1/2 bg-gray-200 animate-pulse rounded" />
            <div className="h-3 w-2/3 bg-gray-200 animate-pulse rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex gap-4">
          {[40, 24, 16, 16].map((w, i) => (
            <div key={i} className="h-3 bg-gray-200 animate-pulse rounded" style={{ width: `${w * 4}px` }} />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50">
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-40 bg-gray-200 animate-pulse rounded" />
              <div className="h-3 w-28 bg-gray-200 animate-pulse rounded" />
            </div>
            <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
            <div className="h-5 w-16 bg-gray-200 animate-pulse rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
