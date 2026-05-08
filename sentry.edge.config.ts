/**
 * Sentry — edge runtime config.
 *
 * Loaded by `instrumentation.ts` when NEXT_RUNTIME === "edge".
 * This covers `middleware.ts` and any route configured with
 * `export const runtime = "edge"`.
 */
import * as Sentry from "@sentry/nextjs"

const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,
    environment:
      process.env.VERCEL_ENV ??
      (process.env.NODE_ENV === "production" ? "production" : "development"),
    enabled:
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL === "1" ||
      process.env.SENTRY_DEV === "1",
    release: process.env.VERCEL_GIT_COMMIT_SHA,
  })
}
