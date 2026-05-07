import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendTrackedEmail } from "@/lib/email"
import { AIMS_FROM_EMAIL, AIMS_REPLY_TO } from "@/lib/email/senders"
import { mergeVariables } from "@/lib/sequences/render"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"
// take: 500 enrollments × ~150ms Resend latency = ~75s — needs more than the
// 60s Pro default. Five minutes lets a stuck batch drain on the next tick.
export const maxDuration = 300

// Vercel Cron: runs every 30 min.
// vercel.json: { "path": "/api/cron/process-sequences", "schedule": "*/30 * * * *" }

/**
 * Bulk-processes every active SequenceEnrollment whose nextSendAt is due,
 * across every operator. Same logic as the manual /api/portal/sequences/[id]/send-step
 * trigger, but cron-driven and unscoped to a single sequence.
 *
 * Per run we cap at 500 enrollments to bound execution time on Vercel's
 * 60s function limit. Anything left over picks up on the next 30-min tick.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()

  // Pull due enrollments. Constrain to enrollments whose parent sequence is
  // active — we shouldn't fire steps for paused/draft sequences even if
  // their enrollments are stuck in "active".
  const due = await db.sequenceEnrollment.findMany({
    where: {
      status: "active",
      nextSendAt: { lte: new Date() },
      sequence: { status: "active" },
    },
    include: {
      sequence: {
        include: {
          steps: { orderBy: { order: "asc" } },
          user: { select: { id: true, name: true } },
        },
      },
    },
    take: 500,
  })

  let sent = 0
  let skipped = 0
  let failed = 0
  const errors: Array<{ enrollmentId: string; reason: string }> = []

  for (const enr of due) {
    const sequence = enr.sequence
    if (!sequence || sequence.steps.length === 0) {
      skipped++
      continue
    }
    const step = sequence.steps.find((s) => s.order === enr.currentStep)
    if (!step) {
      // Past the last step — mark done.
      await db.sequenceEnrollment
        .update({
          where: { id: enr.id },
          data: { status: "done", nextSendAt: null },
        })
        .catch(() => {})
      skipped++
      continue
    }

    const ctx = {
      contact: {
        firstName: enr.recipientName?.split(" ")[0] ?? null,
        lastName: enr.recipientName?.split(" ").slice(1).join(" ") || null,
        fullName: enr.recipientName,
        email: enr.recipientEmail,
      },
      operator: {
        name: sequence.fromName ?? sequence.user.name ?? "",
        firstName:
          (sequence.fromName ?? sequence.user.name ?? "").split(" ")[0] ?? "",
      },
    }

    const subject = mergeVariables(step.subject, ctx)
    const text = mergeVariables(step.body, ctx)
    const fromName = sequence.fromName ?? sequence.user.name ?? "AIMS"

    try {
      await sendTrackedEmail({
        from: `${fromName} <${AIMS_FROM_EMAIL}>`,
        to: enr.recipientEmail,
        replyTo: AIMS_REPLY_TO,
        subject,
        text,
        serviceArm: "sequences-cron",
        clientId: enr.clientDealId ?? undefined,
      })

      const nextStepIndex = enr.currentStep + 1
      const nextStep = sequence.steps.find((s) => s.order === nextStepIndex)
      if (!nextStep) {
        await db.sequenceEnrollment.update({
          where: { id: enr.id },
          data: {
            status: "done",
            currentStep: nextStepIndex,
            lastStepSentAt: new Date(),
            nextSendAt: null,
          },
        })
      } else {
        const nextSendAt = new Date()
        nextSendAt.setDate(nextSendAt.getDate() + (nextStep.delayDays ?? 0))
        await db.sequenceEnrollment.update({
          where: { id: enr.id },
          data: {
            currentStep: nextStepIndex,
            lastStepSentAt: new Date(),
            nextSendAt,
          },
        })
      }
      sent++
    } catch (err) {
      failed++
      const reason = err instanceof Error ? err.message : "send failed"
      errors.push({ enrollmentId: enr.id, reason })
      logger.error("Cron sequence step send failed", err, {
        enrollmentId: enr.id,
        sequenceId: sequence.id,
      })
    }
  }

  const ms = Date.now() - startTime
  logger.info("Sequence cron complete", {
    pickedUp: due.length,
    sent,
    skipped,
    failed,
    durationMs: ms,
  })

  return NextResponse.json({
    ok: true,
    pickedUp: due.length,
    sent,
    skipped,
    failed,
    errors: errors.slice(0, 20),
    durationMs: ms,
  })
}
