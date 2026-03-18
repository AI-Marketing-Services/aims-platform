import { Skeleton } from "@/components/shared/Skeleton"

export default function FulfillmentLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Toolbar skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-36" />
      </div>
      {/* Kanban columns skeleton */}
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-60 flex-shrink-0 space-y-3">
            <div className="border-t-2 border-gray-200 pt-3 space-y-1.5">
              <Skeleton className="h-4 w-28" />
            </div>
            {Array.from({ length: (i % 3) + 1 }).map((_, j) => (
              <div key={j} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded" />
                  <Skeleton className="h-5 w-14 rounded" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-7 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
