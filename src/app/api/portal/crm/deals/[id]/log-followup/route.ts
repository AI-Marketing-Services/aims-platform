import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { emitEvent, EVENT_TYPES } from "@/lib/events/emit"

export const dynamic = "force-dynamic"

/**
 * POST /api/portal/crm/deals/[id]/log-followup
 *
 * Records that the operator sent a follow-up email for this deal —
 * called when they click 'Open in mail app' (or 'I sent this') after
 * drafting via the AI follow-up dialog.
 *
 * Updates:
 *   - ClientDealActivity entry with type FOLLOW_UP_SENT
 *   - Bumps ClientDeal.updatedAt so the 'days since last touch' on
 *     the daily digest stale-deals list resets.
 *   - DEAL_UPDATED event emitted (the digest reads this for activity)
 *
 * Stays separate from the draft endpoint because operators may draft
 * an email but not send it — only count actually-sent ones for the
 * follow-up cadence.
 */

const bodySchema = z.object({
  subject: z.string().max(200).optional(),
  recipientEmail: z.string().email().max(180).optional(),
  tone: z.string().max(40).optional(),
  intent: z.string().max(40).optional(),
  customNote: z.string().max(500).optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id: dealId } = await params

  let body: unknown = {}
  try {
    body = await req.json()
  } catch {
    // empty body fine
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const deal = await db.clientDeal.findFirst({
    where: { id: dealId, userId: dbUserId },
    select: { id: true, companyName: true },
  })
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 })
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.clientDealActivity.create({
        data: {
          clientDealId: dealId,
          type: "FOLLOW_UP_SENT",
          description:
            parsed.data.subject
              ? `Follow-up sent · ${parsed.data.subject}`
              : `Follow-up sent`,
          metadata: {
            subject: parsed.data.subject ?? null,
            recipientEmail: parsed.data.recipientEmail ?? null,
            tone: parsed.data.tone ?? null,
            intent: parsed.data.intent ?? null,
            customNote: parsed.data.customNote ?? null,
          },
        },
      })
      // Bump deal.updatedAt so stale-deals list resets the timer
      await tx.clientDeal.update({
        where: { id: dealId },
        data: { updatedAt: new Date() },
      })
    })

    void emitEvent({
      actorId: dbUserId,
      type: EVENT_TYPES.DEAL_UPDATED,
      entityType: "ClientDeal",
      entityId: dealId,
      metadata: {
        action: "follow-up-sent",
        subject: parsed.data.subject ?? null,
        recipientEmail: parsed.data.recipientEmail ?? null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Log follow-up sent failed", err, {
      dealId,
      userId: dbUserId,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
