"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCcw, Home } from "lucide-react"
import { captureException } from "@/lib/observability"

/**
 * Error boundary scoped to the AOC landing/apply route group.
 * Matches the cream/crimson theme so applicants don't suddenly see
 * the dark/gold AIMS error page when something fails.
 */
export default function LandingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    captureException(error, {
      tags: { boundary: "landing" },
      extra: { digest: error.digest },
    })
  }, [error])

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-[#E3E3E3] rounded-2xl p-8 text-center shadow-sm">
        <AlertTriangle className="h-10 w-10 text-crimson mx-auto mb-4" />
        <h2 className="font-playfair text-2xl text-[#1A1A1A] mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-[#737373] mb-6 leading-relaxed">
          A hiccup on our end. Try again, or head home — we&apos;ll have it fixed in a moment.
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-[#9CA3AF] mb-6">
            Reference: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-md bg-crimson px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white hover:bg-crimson-dark transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-[#E3E3E3] px-5 py-2.5 text-sm font-semibold text-[#1A1A1A] hover:bg-[#F5F5F5] transition-colors"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
