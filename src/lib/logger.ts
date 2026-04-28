/**
 * Structured logger utility for the AIMS platform.
 *
 * In production: only emits errors via console.error.
 * In development: emits errors with structured context.
 *
 * No external dependencies required.
 */

interface LogContext {
  endpoint?: string
  userId?: string
  dealId?: string
  action?: string
  [key: string]: unknown
}

const IS_PRODUCTION = process.env.NODE_ENV === "production"

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
