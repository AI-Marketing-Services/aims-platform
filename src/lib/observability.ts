/**
 * Observability wrapper — single seam between application code and Sentry.
 *
 * All API routes, cron handlers, server actions, and error boundaries call
 * `captureException` / `captureMessage` from this module. By keeping the
 * Sentry import in one place we (a) avoid pulling the SDK into client
 * bundles by accident and (b) can swap providers without touching call sites.
 *
 * Sentry is enabled when:
 *   - NEXT_PUBLIC_SENTRY_DSN (or SENTRY_DSN) is set, AND
 *   - we're in production / on Vercel / SENTRY_DEV=1
 *
 * In all other cases this falls back to the structured logger so local dev
 * still gets readable error output without burning Sentry quota.
 */
import * as Sentry from "@sentry/nextjs"
import { logger } from "@/lib/logger"

interface CaptureContext {
  tags?: Record<string, string>
  extra?: Record<string, unknown>
  user?: { id?: string; email?: string }
  level?: "fatal" | "error" | "warning" | "info" | "debug"
}

const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN

const SENTRY_ENABLED =
  !!SENTRY_DSN &&
  (process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    process.env.SENTRY_DEV === "1")

export function captureException(err: unknown, context?: CaptureContext): void {
  // Always log locally — Sentry has aggressive sampling and we want full
  // fidelity in Vercel logs for incident response.
  logger.error(
    err instanceof Error ? err.message : "unknown error",
    err,
    {
      ...context?.tags,
      ...(context?.extra as Record<string, unknown> | undefined),
      level: context?.level ?? "error",
      userId: context?.user?.id,
    },
  )

  if (SENTRY_ENABLED) {
    try {
      Sentry.captureException(err, {
        tags: context?.tags,
        extra: context?.extra,
        user: context?.user,
        level: context?.level,
      })
    } catch (sentryErr) {
      // Never let observability break the request flow — if Sentry is
      // unhappy, log it and move on.
      logger.warn("Sentry capture failed", { error: String(sentryErr) })
    }
  }
}

export function captureMessage(message: string, context?: CaptureContext): void {
  if (context?.level === "warning") {
    logger.warn(message, {
      ...context?.tags,
      ...(context?.extra as Record<string, unknown> | undefined),
    })
  } else {
    logger.info(message, {
      ...context?.tags,
      ...(context?.extra as Record<string, unknown> | undefined),
    })
  }

  if (SENTRY_ENABLED) {
    try {
      Sentry.captureMessage(message, {
        tags: context?.tags,
        extra: context?.extra,
        user: context?.user,
        level: context?.level,
      })
    } catch (sentryErr) {
      logger.warn("Sentry message capture failed", { error: String(sentryErr) })
    }
  }
}

/**
 * Wrap an async handler — captures any exception thrown inside, then
 * re-throws so callers see the failure. Useful at API route entrypoints
 * that should report errors but still surface the original failure to
 * the client.
 */
export async function withObservability<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>,
): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    captureException(err, { tags: { handler: name, ...(tags ?? {}) } })
    throw err
  }
}
