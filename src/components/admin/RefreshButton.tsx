"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Click-to-refresh affordance for admin pages backed by server-side
 * Prisma queries. Forces Next.js to re-fetch data without doing a
 * full page reload — preserves scroll, filters, etc.
 *
 * Useful after:
 *   - Running the demo seed endpoint
 *   - A user completed onboarding in another tab
 *   - Anything else that mutates data outside the current session
 */
export function RefreshButton({ className }: { className?: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleRefresh() {
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-primary/5 hover:text-primary px-3 py-1.5 text-xs font-medium text-foreground transition-colors disabled:opacity-50",
        className,
      )}
      title="Re-fetch data from the database"
    >
      <RefreshCw
        className={cn("h-3.5 w-3.5", isPending && "animate-spin")}
      />
      {isPending ? "Refreshing…" : "Refresh data"}
    </button>
  )
}
