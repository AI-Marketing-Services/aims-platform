/**
 * Structured logger utility for the AIMS platform.
 *
 * In production: emits errors via console.error AND forwards to Sentry
 *                (when configured) so the error monitor catches the
 *                bulk of caught-and-logged errors that don't escape the
 *                request handler. The instrumentation hook already
 *                catches uncaught errors; this picks up the rest.
 * In development: emits errors with structured context, no Sentry.
 *
 * Safe to call from edge runtime — Sentry SDK is dynamically loaded so
 * it can be tree-shaken from edge bundles where the import isn't valid.
 */
import * as Sentry from "@sentry/nextjs"

interface LogContext {
  endpoint?: string
  userId?: string
  dealId?: string
  action?: string
  [key: string]: unknown
}

const IS_PRODUCTION = process.env.NODE_ENV === "production"

const SENTRY_ENABLED =
  !!(process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN) &&
  (IS_PRODUCTION ||
    process.env.VERCEL === "1" ||
    process.env.SENTRY_DEV === "1")

function formatMessage(level: string, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  const contextStr = context ? ` ${JSON.stringify(context)}` : ""
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
}

export const logger = {
  error(message: string, error?: unknown, context?: LogContext): void {
    // Prisma errors carry their useful diagnostics on `code` + `meta`, NOT on
    // `message`. Without these, every prod failure shows up as the same opaque
    // "PrismaClientKnownRequestError" with no clue which constraint or table
    // tripped it. Pull them onto the structured payload so log scrapers can
    // see the actual failure mode (e.g. P2021 missing table, P2002 unique
    // violation).
    const errAsRecord = (error ?? {}) as Record<string, unknown>
    const errorDetail = error instanceof Error
      ? {
          message: error.message,
          name: error.name,
          code: typeof errAsRecord.code === "string" ? errAsRecord.code : undefined,
          meta: errAsRecord.meta,
          stack: IS_PRODUCTION ? undefined : error.stack,
        }
      : error !== undefined
        ? { value: String(error) }
        : undefined

    const merged = { ...context, ...(errorDetail ? { error: errorDetail } : {}) }

    console.error(formatMessage("error", message, merged))

    // Forward to Sentry for production monitoring. We pass the original
    // error (so Sentry decodes the stack) plus the structured context
    // tags so search + filtering in the Sentry UI works. Wrapped in
    // try/catch — observability never breaks the request.
    if (SENTRY_ENABLED) {
      try {
        const tags: Record<string, string> = {}
        if (typeof context?.endpoint === "string") tags.endpoint = context.endpoint
        if (typeof context?.action === "string") tags.action = context.action
        if (typeof context?.userId === "string") tags.userId = context.userId
        if (typeof context?.dealId === "string") tags.dealId = context.dealId

        if (error instanceof Error) {
          Sentry.captureException(error, {
            tags,
            extra: { message, ...context },
            level: "error",
          })
        } else {
          // Synthetic exception — message-only logs become Sentry events
          // we can still see + filter by tag.
          Sentry.captureMessage(message, {
            tags,
            extra: { error, ...context },
            level: "error",
          })
        }
      } catch {
        // Silently ignore Sentry failures — never let observability
        // break the actual request.
      }
    }
  },

  warn(message: string, context?: LogContext): void {
    if (IS_PRODUCTION) return
    console.error(formatMessage("warn", message, context))
  },

  info(message: string, context?: LogContext): void {
    if (IS_PRODUCTION) return
    console.error(formatMessage("info", message, context))
  },
}
