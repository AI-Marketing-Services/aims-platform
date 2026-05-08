/**
 * Sentry — server-side runtime config.
 *
 * Loaded by `instrumentation.ts` when NEXT_RUNTIME === "nodejs".
 * Captures errors thrown inside API routes, server components, server
 * actions, and cron handlers. Pair with `sentry.edge.config.ts` for
 * middleware / edge routes.
 */
import * as Sentry from "@sentry/nextjs"

const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Lower sample rate in prod — we are launching email campaigns and want
    // to keep cost predictable. Bump back up (or to 1.0) during incident
    // response to capture every span.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Keep stack traces short in prod logs to reduce ingestion cost without
    // losing the leaf frame.
    maxBreadcrumbs: 50,

    environment:
      process.env.VERCEL_ENV ??
      (process.env.NODE_ENV === "production" ? "production" : "development"),

    // Only enable in environments where it is meaningful — local dev with
    // SENTRY_DEV=1 opt-in, or any deployed env.
    enabled:
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL === "1" ||
      process.env.SENTRY_DEV === "1",

    // Release tracking — Vercel injects VERCEL_GIT_COMMIT_SHA on deploys.
    release: process.env.VERCEL_GIT_COMMIT_SHA,

    // Server traces are noisy because every health check + cron ping
    // produces a transaction. Drop the obviously-unimportant ones.
    ignoreTransactions: [
      "GET /api/health",
      "GET /api/cron/check-churn",
      "GET /api/cron/daily-digest",
      "GET /api/cron/process-email-queue",
      "GET /api/cron/process-sequences",
    ],

    beforeSend(event, hint) {
      // Drop the standard "Rate limit hit" warns — those are user-facing
      // behaviour, not bugs. The logger.warn already records them.
      const message = hint?.originalException
      if (
        message instanceof Error &&
        /Too many requests|RateLimitError/.test(message.message)
      ) {
        return null
      }
      return event
    },
  })
}
