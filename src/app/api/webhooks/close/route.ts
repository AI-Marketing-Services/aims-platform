import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import { DealStage } from "@prisma/client"
import { logger } from "@/lib/logger"

/**
 * Close CRM Webhook Handler
 *
 * Close sends webhooks for lead/contact/opportunity events.
 * Configure at: Settings > Webhooks in Close dashboard.
 * Set the webhook URL to: https://www.aioperatorcollective.com/api/webhooks/close
 * Set the webhook secret in env: CLOSE_WEBHOOK_SECRET
 */

// Close status label -> AIMS DealStage mapping (community funnel)
const CLOSE_STATUS_TO_AIMS: Record<string, DealStage> = {
  "Potential":            DealStage.APPLICATION_SUBMITTED,
  "Qualified":            DealStage.APPLICATION_SUBMITTED,
  "Demo Scheduled":       DealStage.CONSULT_BOOKED,
  "Call Booked":          DealStage.CONSULT_BOOKED,
  "Consult Booked":       DealStage.CONSULT_BOOKED,
  "Follow Up":            DealStage.CONSULT_COMPLETED,
  "Proposal":             DealStage.CONSULT_COMPLETED,
  "Proposal Sent":        DealStage.CONSULT_COMPLETED,
  "Negotiation":          DealStage.CONSULT_COMPLETED,
  "Won":                  DealStage.MEMBER_JOINED,
  "Active Client":        DealStage.MEMBER_JOINED,
  "Joined":               DealStage.MEMBER_JOINED,
  "Lost":                 DealStage.LOST,
  "Churned":              DealStage.LOST,
  "Cancelled":            DealStage.LOST,
}

function verifyWebhook(req: NextRequest): boolean {
  const secret = process.env.CLOSE_WEBHOOK_SECRET
  if (!secret) {
    return false
  }

  const sig = req.headers.get("x-close-webhook-signature") ?? req.headers.get("x-signature")
  if (!sig) return false

  // Use timing-safe comparison to prevent timing attacks
  try {
    const sigBuf = Buffer.from(sig, "utf-8")
    const secretBuf = Buffer.from(secret, "utf-8")
    if (sigBuf.length !== secretBuf.length) return false
    return timingSafeEqual(sigBuf, secretBuf)
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  if (!verifyWebhook(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const event = body.event as string | undefined

  // Handle lead status changes
  if (event === "lead.status_change" || event === "lead.updated") {
    const data = body.data as Record<string, unknown> | undefined
    if (!data) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }

    const closeLeadId = (data.lead_id ?? data.id) as string | undefined
    if (!closeLeadId) {
      return NextResponse.json({ error: "Missing lead ID" }, { status: 400 })
    }

    // Get the new status label from the webhook payload
    const newStatusLabel = (data.new_status_label ?? data.status_label) as string | undefined
    if (!newStatusLabel) {
      return NextResponse.json({ ok: true, skipped: "No status label in payload" })
    }

    const newStage = CLOSE_STATUS_TO_AIMS[newStatusLabel]
    if (!newStage) {
      logger.warn(`Close webhook: unmapped status "${newStatusLabel}" for lead ${closeLeadId}`, { endpoint: "POST /api/webhooks/close" })
      return NextResponse.json({ ok: true, skipped: `Unmapped status: ${newStatusLabel}` })
    }

    // Find matching deal in AIMS
    const deal = await db.deal.findUnique({
      where: { closeLeadId },
      select: { id: true, stage: true },
    })

    if (!deal) {
      logger.warn(`Close webhook: no AIMS deal found for Close lead ${closeLeadId}`, { endpoint: "POST /api/webhooks/close" })
      return NextResponse.json({ ok: true, skipped: "No matching deal" })
    }

    // Skip if already at this stage
    if (deal.stage === newStage) {
      return NextResponse.json({ ok: true, skipped: "Already at this stage" })
    }

    const oldStage = deal.stage

    const terminalStages = new Set<DealStage>([DealStage.MEMBER_JOINED, DealStage.LOST])

    // Update the deal stage
    await db.deal.update({
      where: { id: deal.id },
      data: {
        stage: newStage,
        ...(terminalStages.has(newStage) ? { closedAt: new Date() } : {}),
      },
    })

    // Create activity record
    await db.dealActivity.create({
      data: {
        dealId: deal.id,
        type: "STAGE_CHANGE",
        detail: `Stage updated from Close CRM: ${oldStage} -> ${newStage}`,
        metadata: {
          source: "close_webhook",
          closeLeadId,
          oldStatus: (data.old_status_label as string) ?? oldStage,
          newStatus: newStatusLabel,
        },
      },
    })

    return NextResponse.json({ ok: true, dealId: deal.id, newStage })
  }

  // Acknowledge other events without processing
  return NextResponse.json({ ok: true, event, skipped: "Unhandled event type" })
}
