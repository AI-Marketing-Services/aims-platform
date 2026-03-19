"use client"

import { ErrorBoundary } from "@/components/shared/ErrorBoundary"

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorBoundary error={error} reset={reset} backHref="/" backLabel="Go Home" />
}
