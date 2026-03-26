"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#08090D] flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-[#C4972A]">Something went wrong</h1>
            <p className="text-sm text-[#F0EBE0]/60">
              An unexpected error occurred. Please try again.
            </p>
            {error.digest && (
              <p className="text-xs text-[#F0EBE0]/40 font-mono">
                Error ID: {error.digest}
              </p>
            )}
          </div>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-[#C4972A] px-5 py-2.5 text-sm font-semibold text-[#08090D] hover:bg-[#A17D22] transition-colors"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
