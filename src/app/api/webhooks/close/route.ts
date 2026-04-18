import { NextRequest, NextResponse } from "next/server"
import crypto from "node:crypto"
import { db } from "@/lib/db"
import { DealStage } from "@prisma/client"
import { logger } from "@/lib/logger"
import {
  closeStatusToAimsStage,
  getCloseLead,
  isAOCLead,
  listLeadOpportunities,
} from "@/lib/close"

/**
 * Close CRM Webhook Handler — AOC-partitioned.
 *
 * Configure:
 *   URL:    https://www.aioperatorcollective.com/api/webhooks/close
 *   Secret: CLOSE_WEBHOOK_SECRET (the signature_key returned by Close
 *           when the webhook subscription was created).
 *   Events: lead.created, lead.updated, opportunity.created,
 *           opportunity.updated.
 *
 * Signature verification (per Close docs):
 *   HMAC-SHA256, key = hex-decoded signature_key, data = timestamp + rawBody.
 *   Headers: close-sig-hash, close-sig-timestamp.
 *
 * Partition guard:
 *   We share the Vendingpreneurs workspace. Every inbound event must be
 *   verified to belong to our BTC Business Line = AOC partition. Webhook
 *   payloads don't reliably include custom fields, so we fetch the lead
 *   by ID and check the tag before touching AIMS state.
 */

function verifyWebhook(rawBody: string, req: NextRequest): boolean {
  const secret = process.env.CLOSE_WEBHOOK_SECRET
  if (!secret) {
    logger.warn("Close webhook: CLOSE_WEBHOOK_SECRET not configured")
    return false
  }

  const sig = req.headers.get("close-sig-hash")
  const timestamp = req.headers.get("close-sig-timestamp")
  if (!sig || !timestamp) return false

  // Reject replays older than 5 minutes.
  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp))
  if (!Number.isFinite(ageSec) || ageSec > 300) return false

  try {
    const keyBytes = Buffer.from(secret, "hex")
    const payload = `${timestamp}${rawBody}`
    const expected = crypto
      .createHmac("sha256", keyBytes)
      .update(payload, "utf8")
      .digest("hex")

    const sigBuf = Buffer.from(sig, "hex")
    const expBuf = Buffer.from(expected, "hex")
    if (sigBuf.length !== expBuf.length) return false
    return crypto.timingSafeEqual(sigBuf, expBuf)
  } catch (err) {
    logger.error("Close webhook: signature verify failed", err)
    return false
  }
}

// ─── Payload shapes ─────────────────────────────────────────────────────

interface CloseEventWrapper {
  subscription_id?: string
  event?: CloseEventPayload
}

interface CloseEventPayload {
  id?: string
  object_type?: string
  object_id?: string
  action?: string
  changed_fields?: string[]
  data?: Record<string, unknown>
  previous_data?: Record<string, unknown>
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  if (!verifyWebhook(rawBody, req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let wrapper: CloseEventWrapper
  try {
    wrapper = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const event = wrapper.event
  if (!event?.object_type || !event.action) {
    return NextResponse.json({ ok: true, skipped: "No event payload" })
  }

  const key = `${event.object_type}.${event.action}`

  // Dispatch. Lead events update the deal stage directly, opportunity
  // events re-pull opportunities so revenue stays fresh.
  try {
    if (key === "lead.created" || key === "lead.updated") {
      return await handleLeadEvent(event)
    }
    if (key === "opportunity.created" || key === "opportunity.updated") {
      return await handleOpportunityEvent(event)
    }
    return NextResponse.json({ ok: true, skipped: `Unhandled event: ${key}` })
  } catch (err) {
    logger.error(`Close webhook ${key} handler failed`, err, {
      action: "close_webhook_handler",
    })
    return NextResponse.json(
      { error: "Handler failed" },
      { status: 500 }
    )
  }
}

// ─── Lead event handler ─────────────────────────────────────────────────

async function handleLeadEvent(event: CloseEventPayload): Promise<NextResponse> {
  const closeLeadId =
    event.object_id ??
    (event.data?.id as string | undefined) ??
    (event.data?.lead_id as string | undefined)

  if (!closeLeadId) {
    return NextResponse.json({ error: "Missing lead ID" }, { status: 400 })
  }

  // Fetch the lead to verify AOC partition. Webhook payload's `data` may
  // include custom fields, but not always — fetching is the safe path.
  const lead = await getCloseLead(closeLeadId)
  if (!lead) {
    logger.warn(`Close webhook: could not fetch lead ${closeLeadId} to verify partition`, {
      endpoint: "POST /api/webhooks/close",
    })
    return NextResponse.json({ ok: true, skipped: "Lead fetch failed" })
  }

  if (!isAOCLead(lead)) {
    // Silent success — vending / Ben Kelly line, not ours. No retry storm.
    return NextResponse.json({ ok: true, skipped: "Not an AOC lead" })
  }

  const newStage = closeStatusToAimsStage({
    statusId: lead.status_id ?? null,
    statusLabel: lead.status_label ?? null,
  })
  if (!newStage) {
    logger.warn(
      `Close webhook: unmapped status for AOC lead ${closeLeadId}: ${lead.status_label}`,
      { endpoint: "POST /api/webhooks/close" }
    )
    return NextResponse.json({ ok: true, skipped: `Unmapped status: ${lead.status_label}` })
  }

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
    logger.info(`Close webhook: no AIMS deal for AOC lead ${closeLeadId}; cron will import`, {
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
            changedFields: event.changed_fields ?? [],
          },
        },
      },
    },
  })

  return NextResponse.json({ ok: true, dealId: deal.id, newStage })
}

// ─── Opportunity event handler (revenue tracking) ───────────────────────

async function handleOpportunityEvent(event: CloseEventPayload): Promise<NextResponse> {
  const data = event.data ?? {}
  const closeLeadId = (data.lead_id as string | undefined) ?? null
  if (!closeLeadId) {
    return NextResponse.json({ ok: true, skipped: "Opportunity missing lead_id" })
  }

  // Partition guard on the parent lead.
  const lead = await getCloseLead(closeLeadId)
  if (!lead || !isAOCLead(lead)) {
    return NextResponse.json({ ok: true, skipped: "Not an AOC lead" })
  }

  // Recompute total won revenue for this lead's opportunities. Normalise
  // Close cents -> dollars. This keeps AIMS deal.value + deal.mrr in sync
  // regardless of whether the change was value, status, or something else.
  const opportunities = await listLeadOpportunities(closeLeadId)
  let wonTotal = 0
  let wonCount = 0
  for (const opp of opportunities) {
    if (opp.date_won) {
      wonTotal += (opp.value ?? 0) / 100
      wonCount++
    }
  }

  const contactEmail = lead.contacts?.[0]?.emails?.[0]?.email?.toLowerCase()
  const deal =
    (await db.deal.findUnique({
      where: { closeLeadId },
      select: { id: true, stage: true, value: true, mrr: true },
    })) ??
    (contactEmail
      ? await db.deal.findFirst({
          where: { contactEmail: { equals: contactEmail, mode: "insensitive" } },
          select: { id: true, stage: true, value: true, mrr: true },
        })
      : null)

  if (!deal) {
    return NextResponse.json({ ok: true, skipped: "Lead not yet imported" })
  }

  const wasTerminal = deal.stage === "MEMBER_JOINED" || deal.stage === "LOST"
  // If an opportunity was just won and the deal isn't yet terminal,
  // advance the stage to MEMBER_JOINED (closed/won).
  const nextStage: DealStage =
    wonCount > 0 && !wasTerminal ? DealStage.MEMBER_JOINED : (deal.stage as DealStage)

  await db.deal.update({
    where: { id: deal.id },
    data: {
      closeLeadId,
      value: wonTotal > 0 ? wonTotal : deal.value,
      mrr: wonTotal > 0 ? wonTotal : deal.mrr,
      stage: nextStage,
      ...(nextStage === DealStage.MEMBER_JOINED && !wasTerminal
        ? { closedAt: new Date() }
        : {}),
      activities: {
        create: {
          type: wonCount > 0 ? "PAYMENT_RECEIVED" : "NOTE_ADDED",
          detail: `Close opportunity ${event.action}: ${wonCount} won opp(s), $${wonTotal.toLocaleString()} total.`,
          metadata: {
            source: "close_webhook",
            closeLeadId,
            opportunityId: event.object_id,
            wonCount,
            wonTotal,
            changedFields: event.changed_fields ?? [],
            action: event.action,
          },
        },
      },
    },
  })

  return NextResponse.json({ ok: true, dealId: deal.id, wonTotal, wonCount })
}
