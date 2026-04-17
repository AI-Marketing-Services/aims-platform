import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import { DealStage } from "@prisma/client"
import { logger } from "@/lib/logger"
import {
  closeStatusToAimsStage,
  getCloseLead,
  isAOCLead,
} from "@/lib/close"

/**
 * Close CRM Webhook Handler — AOC-partitioned.
 *
 * Configure at: Settings > Webhooks in Close dashboard.
 * URL:    https://www.aioperatorcollective.com/api/webhooks/close
 * Secret: set CLOSE_WEBHOOK_SECRET env var to the same value.
 *
 * We share the Vendingpreneurs workspace so every inbound event must
 * be checked for BTC Business Line = "AI Operator Collective (AOC)"
 * before we touch our CRM. Webhook payloads don't include custom
 * fields by default, so we fetch the lead to verify before processing.
 */

function verifyWebhook(req: NextRequest): boolean {
  const secret = process.env.CLOSE_WEBHOOK_SECRET
  if (!secret) return false

  const sig = req.headers.get("x-close-webhook-signature") ?? req.headers.get("x-signature")
  if (!sig) return false

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

  // Only handle lead events for now. Everything else we 200-ack and ignore.
  if (event !== "lead.status_change" && event !== "lead.updated") {
    return NextResponse.json({ ok: true, event, skipped: "Unhandled event type" })
  }

  const data = body.data as Record<string, unknown> | undefined
  if (!data) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 })
  }

  const closeLeadId = (data.lead_id ?? data.id) as string | undefined
  if (!closeLeadId) {
    return NextResponse.json({ error: "Missing lead ID" }, { status: 400 })
  }

  // Fetch the lead to verify it's in our AOC partition. This is the
  // shared-workspace safety check — otherwise a vending-line status
  // change would pollute our CRM.
  const lead = await getCloseLead(closeLeadId)
  if (!lead) {
    logger.warn(`Close webhook: could not fetch lead ${closeLeadId} to verify partition`, {
      endpoint: "POST /api/webhooks/close",
    })
    return NextResponse.json({ ok: true, skipped: "Lead fetch failed" })
  }

  if (!isAOCLead(lead)) {
    // Not ours — Ben Kelly / Vendingpreneurs line. Silent success so
    // Close doesn't retry, but no state change on our side.
    return NextResponse.json({ ok: true, skipped: "Not an AOC lead" })
  }

  const newStage = closeStatusToAimsStage({
    statusId: (data.new_status_id as string) ?? lead.status_id ?? null,
    statusLabel: (data.new_status_label as string) ?? lead.status_label ?? null,
  })

  if (!newStage) {
    logger.warn(
      `Close webhook: unmapped status for AOC lead ${closeLeadId}: ${lead.status_label}`,
      { endpoint: "POST /api/webhooks/close" }
    )
    return NextResponse.json({ ok: true, skipped: `Unmapped status: ${lead.status_label}` })
  }

  // Find matching deal in AIMS by closeLeadId OR fall back to email.
  const contactEmail = lead.contacts?.[0]?.emails?.[0]?.email?.toLowerCase()
  const deal =
    (await db.deal.findUnique({
      where: { closeLeadId },
      select: { id: true, stage: true },
    })) ??
    (contactEmail
      ? await db.deal.findFirst({
          where: { contactEmail: { equals: contactEmail, mode: "insensitive" } },
          select: { id: true, stage: true },
        })
      : null)

  if (!deal) {
    // AOC lead that originated in Close before we knew about it.
    // Don't auto-create from the webhook — the next cron pull will
    // handle creation with the full payload + opportunities.
    logger.info(`Close webhook: no AIMS deal for AOC lead ${closeLeadId} yet; cron will import`, {
      endpoint: "POST /api/webhooks/close",
    })
    return NextResponse.json({ ok: true, skipped: "Lead not yet imported" })
  }

  if (deal.stage === newStage) {
    return NextResponse.json({ ok: true, skipped: "Already at this stage" })
  }

  const terminalStages = new Set<DealStage>([DealStage.MEMBER_JOINED, DealStage.LOST])

  await db.deal.update({
    where: { id: deal.id },
    data: {
      stage: newStage as DealStage,
      closeLeadId,
      ...(terminalStages.has(newStage as DealStage) ? { closedAt: new Date() } : {}),
      activities: {
        create: {
          type: "STAGE_CHANGE",
          detail: `Close webhook: ${deal.stage} -> ${newStage} (${lead.status_label ?? "?"})`,
          metadata: {
            source: "close_webhook",
            closeLeadId,
            oldStage: deal.stage,
            newStage,
            closeStatusLabel: lead.status_label,
            closeStatusId: lead.status_id,
          },
        },
      },
    },
  })

  return NextResponse.json({ ok: true, dealId: deal.id, newStage })
}
