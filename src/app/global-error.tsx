"use client"

import Link from "next/link"
import { useEffect } from "react"
import { captureException } from "@/lib/observability"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    captureException(error, {
      tags: { boundary: "global" },
      extra: { digest: error.digest },
      level: "fatal",
    })
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-[#981B1B]">Something went wrong</h1>
            <p className="text-sm text-[#737373]">
              An unexpected error occurred. Our team has been notified. Please try again or return later.
            </p>
            {error.digest && (
              <p className="text-xs text-[#737373]/70 font-mono">
                Reference: {error.digest}
              </p>
            )}
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-md bg-[#981B1B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#791515] transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md border border-[#E3E3E3] px-5 py-2.5 text-sm font-semibold text-[#1A1A1A] hover:bg-white transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
