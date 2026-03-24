"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
  backHref?: string
  backLabel?: string
}

export function ErrorBoundary({
  error,
  reset,
  backHref = "/",
  backLabel = "Go Home",
}: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error digest for production debugging (non-sensitive)
    if (error.digest) {
      console.error("Error boundary caught:", error.digest)
    }
  }, [error.digest])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <AlertTriangle className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Please try again or contact support if the
            problem persists.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/50 font-mono">
              Reference: {error.digest}
            </p>
          )}
          {process.env.NODE_ENV === "development" && error.message && (
            <pre className="mt-3 rounded-lg bg-muted p-3 text-left text-xs text-muted-foreground overflow-auto max-h-32">
              {error.message}
            </pre>
          )}
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
