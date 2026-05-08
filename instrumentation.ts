/**
 * Next.js instrumentation hook.
 *
 * Runs once per server runtime (nodejs / edge) at boot. Used to wire
 * Sentry into the appropriate runtime before the first request lands.
 *
 * https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
import * as Sentry from "@sentry/nextjs"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config")
  }
}

/**
 * Capture any error caught by Next.js' built-in error boundary so it
 * surfaces in Sentry instead of disappearing into the void.
 *
 * Required for the App Router error reporting since Next.js 15.3.
 */
export const onRequestError = Sentry.captureRequestError
