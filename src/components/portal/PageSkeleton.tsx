import { cn } from "@/lib/utils"

function Pulse({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-surface", className)} />
  )
}

/**
 * Generic page-level skeleton. Mirrors the standard portal page layout —
 * icon + title + description, optional CTA, then a grid OR list of cards.
 * Used by every Phase-2 feature's loading.tsx so we get instant feedback
 * on navigation instead of a blank screen during the server fetch.
 */
export function PageSkeleton({
  variant = "grid",
  cards = 6,
}: {
  variant?: "grid" | "list" | "form"
  cards?: number
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Pulse className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Pulse className="h-6 w-44" />
            <Pulse className="h-3.5 w-80" />
          </div>
        </div>
        <Pulse className="h-9 w-32 rounded-lg" />
      </div>

      {variant === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: cards }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 space-y-3"
            >
              <Pulse className="h-4 w-2/3" />
              <Pulse className="h-3 w-full" />
              <Pulse className="h-3 w-5/6" />
              <Pulse className="h-3 w-3/4" />
              <div className="flex items-center justify-between pt-2">
                <Pulse className="h-3 w-20" />
                <Pulse className="h-7 w-16 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === "list" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="divide-y divide-border">
            {Array.from({ length: cards }).map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-4">
                <Pulse className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Pulse className="h-3.5 w-1/2" />
                  <Pulse className="h-3 w-1/3" />
                </div>
                <Pulse className="h-3 w-20" />
                <Pulse className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === "form" && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Pulse className="h-3 w-32" />
              <Pulse className="h-9 w-full rounded-lg" />
            </div>
          ))}
          <Pulse className="h-10 w-32 rounded-lg" />
        </div>
      )}
    </div>
  )
}
