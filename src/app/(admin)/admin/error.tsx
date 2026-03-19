"use client"

import { ErrorBoundary } from "@/components/shared/ErrorBoundary"

export default function AdminError({
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
      backHref="/admin/dashboard"
      backLabel="Back to Dashboard"
    />
  )
}
