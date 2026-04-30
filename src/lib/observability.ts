/**
 * Observability wrapper — single seam between application code and the
 * future Sentry integration. Today: forwards to console + the existing
 * logger. Tomorrow: install @sentry/nextjs, set SENTRY_DSN, replace the
 * implementations of captureException / captureMessage with the Sentry
 * equivalents — every existing call site picks up Sentry without diff.
 *
 * NOTE: this is the migration scaffold. The reason it isn't already
 * wired to Sentry is that @sentry/nextjs requires a DSN env var + the
 * SDK install, which is a deploy-time decision. Once the DSN exists:
 *
 *   1. npm install @sentry/nextjs
 *   2. npx @sentry/wizard@latest -i nextjs   (auto-creates sentry.*.config.ts)
 *   3. Replace the bodies below with Sentry.captureException / captureMessage
 *
 * That's it. No call sites need to change.
 */
import { logger } from "@/lib/logger"

interface CaptureContext {
  tags?: Record<string, string>
  extra?: Record<string, unknown>
  user?: { id?: string; email?: string }
  level?: "fatal" | "error" | "warning" | "info" | "debug"
}

export function captureException(err: unknown, context?: CaptureContext): void {
  // Today: structured log via logger.
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
  // Future:
  //   import * as Sentry from "@sentry/nextjs"
  //   Sentry.captureException(err, { tags: context?.tags, extra: context?.extra,
  //                                  user: context?.user, level: context?.level })
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
  // Future:
  //   import * as Sentry from "@sentry/nextjs"
  //   Sentry.captureMessage(message, { tags, extra, user, level })
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
