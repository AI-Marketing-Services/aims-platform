export default function CronStatusLoading() {
  return (
    <div className="w-full space-y-6">
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-72 bg-gray-100 rounded animate-pulse mt-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-32 w-full bg-gray-50 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
