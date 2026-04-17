"use client"

import Link from "next/link"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error.digest)
  }, [error.digest])

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#08090D] flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-[#C4972A]">Something went wrong</h1>
            <p className="text-sm text-[#F0EBE0]/60">
              An unexpected error occurred. Our team has been notified. Please try again or return later.
            </p>
            {error.digest && (
              <p className="text-xs text-[#F0EBE0]/40 font-mono">
                Reference: {error.digest}
              </p>
            )}
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-lg bg-[#C4972A] px-5 py-2.5 text-sm font-semibold text-[#08090D] hover:bg-[#A17D22] transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-[#F0EBE0]/20 px-5 py-2.5 text-sm font-semibold text-[#F0EBE0] hover:bg-[#F0EBE0]/5 transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
