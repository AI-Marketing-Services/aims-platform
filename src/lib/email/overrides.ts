/**
 * Read-side helper for EmailTemplateOverride lookups.
 *
 * `sendTrackedEmail` calls this with a templateKey at send-time. If a
 * row exists, the override's subject + html replace the code defaults.
 * If not (or if the lookup itself throws — DB hiccup, table not yet
 * migrated, etc.), the call falls back gracefully to the defaults so a
 * broken override layer NEVER blocks an email.
 *
 * The override map is intentionally NOT cached in-memory on the server
 * — emails are infrequent enough that a per-send DB read is fine, and
 * caching invalidation across serverless instances would be its own
 * source of "I edited the template but it didn't update" bugs.
 */
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export interface ResolvedOverride {
  subject: string | null
  html: string | null
  updatedAt: Date | null
}

export async function getTemplateOverride(
  templateKey: string | null | undefined,
): Promise<ResolvedOverride> {
  if (!templateKey) return { subject: null, html: null, updatedAt: null }
  try {
    const row = await db.emailTemplateOverride.findUnique({
      where: { templateKey },
      select: { subject: true, html: true, updatedAt: true },
    })
    if (!row) return { subject: null, html: null, updatedAt: null }
    return row
  } catch (err) {
    logger.error("Failed to read EmailTemplateOverride", err, { templateKey })
    return { subject: null, html: null, updatedAt: null }
  }
}

/**
 * Apply an override to outgoing email params: if the admin saved a
 * customised subject/html, those win; otherwise the code defaults are
 * untouched. Returns the same shape as the input so callers can spread
 * it into their final send call.
 */
export async function applyTemplateOverride<
  T extends { subject?: string; html?: string },
>(templateKey: string | null | undefined, defaults: T): Promise<T> {
  const override = await getTemplateOverride(templateKey)
  if (!override.subject && !override.html) return defaults
  return {
    ...defaults,
    ...(override.subject ? { subject: override.subject } : {}),
    ...(override.html ? { html: override.html } : {}),
  }
}
