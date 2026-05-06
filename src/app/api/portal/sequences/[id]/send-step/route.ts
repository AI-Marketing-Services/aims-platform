import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { sendTrackedEmail } from "@/lib/email"
import { AIMS_FROM_EMAIL, AIMS_REPLY_TO } from "@/lib/email/senders"
import { mergeVariables } from "@/lib/sequences/render"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

/**
 * POST /api/portal/sequences/[id]/send-step
 *
 * Manually fire the next due step for any active enrollment in this
 * sequence. The "Send next batch" button on the sequence detail page
 * calls this — it picks up every enrollment whose nextSendAt is now or
 * earlier, sends step `currentStep`, advances state, then queues the
 * following step.
 *
 * Idempotency: if currentStep >= steps.length the enrollment is marked
 * "done" and skipped on future calls. nextSendAt is recomputed with the
 * outgoing step's delay so we never double-send the same step.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: sequenceId } = await params

  const sequence = await db.emailSequence.findFirst({
    where: { id: sequenceId, userId },
    include: { steps: { orderBy: { order: "asc" } }, user: true },
  })
  if (!sequence)
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (sequence.steps.length === 0)
    return NextResponse.json({ error: "Add at least one step" }, { status: 400 })

  // Pick up every active enrollment whose nextSendAt is due.
  const due = await db.sequenceEnrollment.findMany({
    where: {
      sequenceId,
      status: "active",
      nextSendAt: { lte: new Date() },
    },
    take: 200,
  })

  let sent = 0
  let skipped = 0
  let failed = 0
  const errors: Array<{ enrollmentId: string; reason: string }> = []

  for (const enr of due) {
    const step = sequence.steps.find((s) => s.order === enr.currentStep)
    if (!step) {
      // No step at this index — mark done.
      await db.sequenceEnrollment.update({
        where: { id: enr.id },
        data: { status: "done", nextSendAt: null },
      })
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

    try {
      const fromName = sequence.fromName ?? sequence.user.name ?? "AIMS"
      await sendTrackedEmail({
        from: `${fromName} <${AIMS_FROM_EMAIL}>`,
        to: enr.recipientEmail,
        replyTo: AIMS_REPLY_TO,
        subject,
        text,
        serviceArm: "sequences",
        clientId: enr.clientDealId ?? undefined,
      })

      // Advance enrollment.
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
      logger.error("Sequence step send failed", err, {
        enrollmentId: enr.id,
        sequenceId,
      })
    }
  }

  return NextResponse.json({
    ok: true,
    pickedUp: due.length,
    sent,
    skipped,
    failed,
    errors,
  })
}
