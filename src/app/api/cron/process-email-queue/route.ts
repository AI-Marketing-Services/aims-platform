import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendTrackedEmail, emailLayout } from "@/lib/email"
import { logCronExecution } from "@/lib/cron-log"
import { logger } from "@/lib/logger"
import { buildOperatorVaultEmail } from "@/lib/email/community-sequence"
import { buildBusinessAIAuditEmail } from "@/lib/email/business-audit-sequence"
import { buildW2PlaybookEmail } from "@/lib/email/w2-playbook-sequence"
import { buildPostBookingEducationEmail } from "@/lib/email/post-booking-education"
import { AOC_FROM_EMAIL, AOC_REPLY_TO } from "@/lib/email/senders"

/**
 * Map a queued (sequenceKey, emailIndex) tuple to its admin-editable
 * templateKey so /admin/email-templates overrides flow through to the
 * actual send. Without this, edits in the admin UI silently fail to
 * apply for any email that goes through the queue cron — exactly the
 * thing that would surprise us during a campaign.
 *
 * Keep these strings in sync with EMAIL_TEMPLATES catalog entries.
 */
function templateKeyFor(sequenceKey: string, emailIndex: number): string | undefined {
  if (sequenceKey === "post-booking-education") {
    if (emailIndex === 0) return "aoc.post-booking-education.day-1"
    if (emailIndex === 1) return "aoc.post-booking-education.day-2"
    if (emailIndex === 2) return "aoc.post-booking-education.day-3"
  }
  if (sequenceKey === "post-booking-morning-of") {
    return "aoc.post-booking-morning-of"
  }
  if (sequenceKey === "operator-vault") {
    if (emailIndex >= 0 && emailIndex <= 4) {
      return `lead-magnet.operator-vault.day-${emailIndex + 1}`
    }
  }
  if (sequenceKey === "business-ai-audit") {
    if (emailIndex === 0) return "lead-magnet.business-ai-audit.day-1"
    if (emailIndex === 1) return "lead-magnet.business-ai-audit.day-2"
  }
  if (sequenceKey === "w2-playbook") {
    if (emailIndex === 0) return "lead-magnet.w2-playbook.day-1"
    if (emailIndex === 1) return "lead-magnet.w2-playbook.day-2"
  }
  return undefined
}

export const maxDuration = 60

const MAX_RETRIES = 6
const BACKOFF_MS = [
  2 * 60_000,
  10 * 60_000,
  30 * 60_000,
  2 * 3600_000,
  6 * 3600_000,
  24 * 3600_000,
]

type SendErrorKind = "transient" | "permanent"

function classifySendError(err: unknown): { kind: SendErrorKind; message: string; status?: number } {
  const raw = err as { statusCode?: number; status?: number; message?: string; name?: string; code?: string }
  const status = raw?.statusCode ?? raw?.status
  const message =
    raw?.message ??
    (err instanceof Error ? err.message : String(err ?? "unknown email error"))

  if (raw?.name === "AbortError" || raw?.code === "ETIMEDOUT" || raw?.code === "ECONNRESET") {
    return { kind: "transient", message, status }
  }

  if (typeof status === "number") {
    if (status === 429 || status >= 500) return { kind: "transient", message, status }
    if (status >= 400) return { kind: "permanent", message, status }
  }

  return { kind: "transient", message, status }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()

  try {
    const pending = await db.emailQueueItem.findMany({
      where: {
        status: "pending",
        scheduledFor: { lte: new Date() },
      },
      take: 50,
      orderBy: { scheduledFor: "asc" },
    })

    if (!pending.length) {
      const duration = Date.now() - startTime
      await logCronExecution("process-email-queue", "success", "No pending emails", duration)
      return NextResponse.json({ processed: 0 })
    }

    let sent = 0
    let failed = 0
    let retried = 0

    for (const item of pending) {
      try {
        const meta = item.metadata as Record<string, unknown>
        let emailContent: EmailContent | null = null

        if (item.sequenceKey === "operator-vault") {
          emailContent = buildOperatorVaultEmail(item.emailIndex, meta)
        } else if (item.sequenceKey === "business-ai-audit") {
          emailContent = buildBusinessAIAuditEmail(item.emailIndex, meta)
        } else if (item.sequenceKey === "w2-playbook") {
          emailContent = buildW2PlaybookEmail(item.emailIndex, meta)
        } else if (item.sequenceKey === "post-booking-education") {
          emailContent = buildPostBookingEducationEmail(item.emailIndex, meta)
        } else if (item.sequenceKey === "post-booking-morning-of") {
          emailContent = buildPostBookingEducationEmail(3, meta)
        }
        // All legacy AIMS sequences (post-quiz, post-calculator, post-audit,
        // post-purchase, partner-onboard, reseller-onboard) return null here
        // and are auto-cancelled below.

        if (!emailContent) {
          await db.emailQueueItem.update({ where: { id: item.id }, data: { status: "cancelled" } })
          continue
        }

        const templateKey = templateKeyFor(item.sequenceKey, item.emailIndex)
        await sendTrackedEmail({
          from: AOC_FROM_EMAIL,
          to: item.recipientEmail,
          replyTo: AOC_REPLY_TO,
          subject: emailContent.subject,
          html: emailLayout(emailContent.html, emailContent.subject),
          serviceArm: "ai-operator-collective",
          // Wiring this through is what lets admin edits at
          // /admin/email-templates actually take effect for queued
          // sequence emails (everything past day 0 of the post-booking
          // drip + the lead-magnet drips).
          ...(templateKey ? { templateKey } : {}),
        })

        await db.emailQueueItem.update({
          where: { id: item.id },
          data: {
            status: "sent",
            sentAt: new Date(),
            lastAttemptAt: new Date(),
            lastError: null,
          },
        })
        sent++
      } catch (err) {
        const classified = classifySendError(err)
        const nextRetryCount = item.retryCount + 1

        if (classified.kind === "permanent" || nextRetryCount >= MAX_RETRIES) {
          await db.emailQueueItem.update({
            where: { id: item.id },
            data: {
              status: "failed",
              retryCount: nextRetryCount,
              lastAttemptAt: new Date(),
              lastError: classified.message.slice(0, 500),
            },
          })
          logger.error(
            `Email queue item ${item.id} permanently failed (${classified.status ?? "?"}): ${classified.message}`,
            err,
            { action: "email_queue_permanent_fail" }
          )
          failed++
        } else {
          const backoff = BACKOFF_MS[Math.min(nextRetryCount - 1, BACKOFF_MS.length - 1)]
          const nextAttempt = new Date(Date.now() + backoff)
          await db.emailQueueItem.update({
            where: { id: item.id },
            data: {
              status: "pending",
              retryCount: nextRetryCount,
              lastAttemptAt: new Date(),
              lastError: classified.message.slice(0, 500),
              scheduledFor: nextAttempt,
            },
          })
          logger.warn(
            `Email queue item ${item.id} transient failure (${classified.status ?? "?"}), retry ${nextRetryCount}/${MAX_RETRIES} at ${nextAttempt.toISOString()}`,
            { action: "email_queue_transient_retry" }
          )
          retried++
        }
      }
    }

    const duration = Date.now() - startTime
    await logCronExecution(
      "process-email-queue",
      "success",
      `Processed: ${pending.length}, Sent: ${sent}, Retried: ${retried}, Failed: ${failed}`,
      duration
    )

    return NextResponse.json({ processed: pending.length, sent, retried, failed })
  } catch (err) {
    const duration = Date.now() - startTime
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    await logCronExecution("process-email-queue", "error", errorMessage, duration)
    logger.error("Process email queue cron failed:", err)
    return NextResponse.json({ error: "Process email queue failed" }, { status: 500 })
  }
}

interface EmailContent {
  subject: string
  html: string
}
