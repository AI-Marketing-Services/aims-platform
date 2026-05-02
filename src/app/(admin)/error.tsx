"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCcw, Home } from "lucide-react"
import { captureException } from "@/lib/observability"

/**
 * Scoped error boundary for /admin/*. Reports to observability with the
 * admin tag so we can prioritize fixes that block ops.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    captureException(error, {
      tags: { boundary: "admin" },
      extra: { digest: error.digest },
    })
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">
          Admin page crashed
        </h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Reported to observability. Check Vercel logs for the digest below.
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-muted-foreground/60 mb-6">
            digest: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface transition-colors"
          >
            <Home className="h-4 w-4" />
            Admin Home
          </Link>
        </div>
      </div>
    </div>
  )
}
