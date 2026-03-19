"use client"

import { ErrorBoundary } from "@/components/shared/ErrorBoundary"

export default function ResellerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorBoundary
      error={error}
      reset={reset}
      backHref="/reseller/dashboard"
      backLabel="Back to Dashboard"
    />
  )
}
