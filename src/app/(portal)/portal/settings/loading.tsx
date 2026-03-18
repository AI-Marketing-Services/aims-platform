export default function SettingsLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="h-5 w-32 bg-gray-200 animate-pulse rounded" />
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="h-3 w-16 bg-gray-200 animate-pulse rounded" />
            <div className="h-9 w-full bg-gray-200 animate-pulse rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
            <div className="h-9 w-full bg-gray-200 animate-pulse rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
            <div className="h-9 w-full bg-gray-200 animate-pulse rounded-lg" />
          </div>
        </div>
        <div className="h-9 w-24 bg-gray-200 animate-pulse rounded-lg" />
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="h-5 w-40 bg-gray-200 animate-pulse rounded" />
        <div className="h-9 w-full bg-gray-200 animate-pulse rounded-lg" />
      </div>
    </div>
  )
}
