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
    const errorDetail = error instanceof Error
      ? { message: error.message, stack: IS_PRODUCTION ? undefined : error.stack }
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
