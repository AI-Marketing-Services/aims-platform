"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { logger } from "@/lib/logger"

/**
 * Error boundary for /apply + /apply/next-steps. If the Collective
 * application form or the post-booking page throws, show a branded
 * recovery screen instead of Next.js's default crash page. Logging
 * routes through our logger so the failure surfaces in Vercel logs
 * alongside everything else.
 */
export default function ApplyError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error("Apply page crashed", error, {
      action: "apply_render_error",
      digest: error.digest,
    })
  }, [error])

  return (
    <main className="min-h-screen bg-[#FAFAF7] text-[#1A1A1A] flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-crimson/10">
          <AlertCircle className="h-8 w-8 text-crimson" />
        </div>
        <h1 className="font-playfair text-3xl text-[#1A1A1A]">
          Something went wrong on our end.
        </h1>
        <p className="text-sm text-[#4B5563] leading-relaxed">
          This is on us, not you. Try again in a moment — your progress on
          the application isn&apos;t lost. If it keeps happening, email{" "}
          <a
            href="mailto:noreply@aioperatorcollective.com"
            className="text-crimson font-semibold hover:underline"
          >
            noreply@aioperatorcollective.com
          </a>{" "}
          and we&apos;ll get you sorted.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-crimson px-5 py-2.5 text-sm font-semibold text-white hover:bg-crimson-dark transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E3E3E3] px-5 py-2.5 text-sm font-semibold text-[#1A1A1A] hover:border-crimson transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
