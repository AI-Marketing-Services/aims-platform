import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { DealStage } from "@prisma/client"
import { logger } from "@/lib/logger"

/**
 * Close CRM Webhook Handler
 *
 * Close sends webhooks for lead/contact/opportunity events.
 * Configure at: Settings > Webhooks in Close dashboard.
 * Set the webhook URL to: https://aimseos.com/api/webhooks/close
 * Set the webhook secret in env: CLOSE_WEBHOOK_SECRET
 */

// Close status label → AIMS DealStage mapping
const CLOSE_STATUS_TO_AIMS: Record<string, DealStage> = {
  "Potential":       DealStage.NEW_LEAD,
  "Qualified":       DealStage.QUALIFIED,
  "Demo Scheduled":  DealStage.DEMO_BOOKED,
  "Proposal":        DealStage.PROPOSAL_SENT,
  "Negotiation":     DealStage.NEGOTIATION,
  "Won":             DealStage.ACTIVE_CLIENT,
  "Lost":            DealStage.LOST,
}

function verifyWebhook(req: NextRequest): boolean {
  const secret = process.env.CLOSE_WEBHOOK_SECRET
  if (!secret) {
    // If no secret configured, reject all webhooks in production
    if (process.env.NODE_ENV === "production") return false
    // In development, allow unsigned webhooks for testing
    return true
  }

  const sig = req.headers.get("x-close-webhook-signature") ?? req.headers.get("x-signature")
  if (!sig) return false

  // Close uses a simple token-based verification
  return sig === secret
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

    // Update the deal stage
    await db.deal.update({
      where: { id: deal.id },
      data: {
        stage: newStage,
        ...(newStage === DealStage.ACTIVE_CLIENT ? { closedAt: new Date() } : {}),
        ...(newStage === DealStage.LOST ? { closedAt: new Date() } : {}),
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
