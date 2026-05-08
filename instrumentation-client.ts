/**
 * Sentry — client (browser) instrumentation.
 *
 * Next.js 16 picks this up automatically and runs it before any other
 * client code. Captures unhandled errors, unhandled promise rejections,
 * and (when sample rate > 0) browser performance traces.
 *
 * Replay is intentionally OFF — we are launching email campaigns and
 * sessions-replay is disproportionately expensive for the value we'd get
 * pre-product-launch. Re-enable once the platform itself is shipping.
 */
import * as Sentry from "@sentry/nextjs"

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    environment:
      process.env.NEXT_PUBLIC_VERCEL_ENV ??
      (process.env.NODE_ENV === "production" ? "production" : "development"),
    enabled:
      process.env.NODE_ENV === "production" ||
      process.env.SENTRY_DEV === "1",
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

    // Strip noisy, low-value events that show up on launch day.
    ignoreErrors: [
      // Browser extensions — chrome-extension://, Loom, Grammarly.
      "ChunkLoadError",
      "Loading chunk",
      "Loading CSS chunk",
      // Hydration warnings caused by extensions injecting DOM.
      "Hydration failed",
      // Network noise from users on flaky connections.
      "NetworkError",
      "Failed to fetch",
      // Cancellations from users navigating away mid-request.
      "AbortError",
      // ResizeObserver warns are noise.
      "ResizeObserver loop",
    ],

    // Don't ship sessions for static assets that 404 — they're noise.
    denyUrls: [
      /\/_next\/static\//,
      /chrome-extension:\/\//,
      /moz-extension:\/\//,
    ],
  })
}

// Required by Next 16 — the framework calls this on every navigation so
// router transitions get attached to traces. Without it the navigation
// timing metrics show up as orphaned spans.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
