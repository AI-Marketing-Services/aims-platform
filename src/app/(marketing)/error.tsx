"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Marketing Error]", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-sm">
        An unexpected error occurred. Please try refreshing the page.
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 mb-4 font-mono">Error ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-900 text-sm font-medium rounded-lg transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    </div>
  )
}
