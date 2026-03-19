"use client"

import { ErrorBoundary } from "@/components/shared/ErrorBoundary"

export default function InternError({
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
      backHref="/intern/dashboard"
      backLabel="Back to Dashboard"
    />
  )
}
