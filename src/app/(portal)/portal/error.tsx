"use client"

import { ErrorBoundary } from "@/components/shared/ErrorBoundary"

export default function PortalError({
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
      backHref="/portal/dashboard"
      backLabel="Back to Dashboard"
    />
  )
}
