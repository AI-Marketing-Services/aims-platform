import { NextResponse } from "next/server"
import crypto from "node:crypto"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

/**
 * POST /api/webhooks/resend
 *
 * Resend sends one webhook per email lifecycle event:
 *   - email.delivered
 *   - email.opened
 *   - email.clicked
 *   - email.bounced
 *   - email.complained
 *   - email.delivery_delayed
 *   - email.unsubscribed (Resend audience webhook — different flow)
 *
 * We persist each event as an EmailEvent row, deduped on
 * `data.email_id`+`type`+`occurred_at` (Resend retries reuse the same
 * trio). Idempotency is enforced by `EmailEvent.resendEventId @unique`.
 *
 * Powers /admin/email-performance: send → delivered → opened → clicked
 * → signup → paid attribution chain. Linked back to EmailQueueItem
 * (existing model) via `headers.X-Queue-Item-Id` when present.
 *
 * Authentication: Resend signs every webhook with svix-style headers.
 * We verify using RESEND_WEBHOOK_SECRET — without it the route 503s
 * to avoid spoofed events from polluting the analytics layer.
 */
export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 })
  }

  const svixId = req.headers.get("svix-id")
  const svixTimestamp = req.headers.get("svix-timestamp")
  const svixSignature = req.headers.get("svix-signature")
  const body = await req.text()

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "missing_signature_headers" }, { status: 400 })
  }

  // Resend uses svix; svix sigs are HMAC-SHA256 of `${id}.${ts}.${body}`
  // base64-encoded, prefixed with `v1,`. Multiple signatures may be sent
  // space-separated for key rotation; any match is sufficient.
  const signedPayload = `${svixId}.${svixTimestamp}.${body}`
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64")
  const expectedSig = crypto
    .createHmac("sha256", secretBytes)
    .update(signedPayload)
    .digest("base64")
  const provided = svixSignature
    .split(" ")
    .map((s) => s.replace(/^v1,/, ""))
    .filter(Boolean)
  const sigOk = provided.some((p) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(p), Buffer.from(expectedSig))
    } catch {
      return false
    }
  })
  if (!sigOk) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 })
  }

  let payload: ResendWebhookPayload
  try {
    payload = JSON.parse(body) as ResendWebhookPayload
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  try {
    await persistEmailEvent(payload, svixId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Resend webhook persistence failed", err, {
      type: payload.type,
      svixId,
    })
    return NextResponse.json({ error: "persistence_failed" }, { status: 500 })
  }
}

interface ResendWebhookPayload {
  type: string
  created_at?: string
  data: {
    email_id?: string
    to?: string | string[]
    subject?: string
    click?: { link?: string }
    headers?: Record<string, string> | null
    tags?: Array<{ name: string; value: string }> | null
  }
}

async function persistEmailEvent(
  payload: ResendWebhookPayload,
  svixId: string,
): Promise<void> {
  const eventType = mapResendEventType(payload.type)
  if (!eventType) return // unknown event type, no-op

  const recipient = Array.isArray(payload.data.to)
    ? payload.data.to[0]
    : payload.data.to
  if (!recipient) return

  // Pull queue-item-id and template-key from custom headers we attach in
  // sendTrackedEmail. Fall back to tags if a sender uses Resend's
  // tag-based addressing.
  const headers = payload.data.headers ?? {}
  const tags = payload.data.tags ?? []
  const queueItemId =
    headers["X-Queue-Item-Id"] ??
    tags.find((t) => t.name === "queue_item_id")?.value ??
    null
  const templateKey =
    headers["X-Template-Key"] ??
    tags.find((t) => t.name === "template_key")?.value ??
    null
  const campaignTag =
    headers["X-Campaign-Tag"] ??
    tags.find((t) => t.name === "campaign_tag")?.value ??
    null

  const occurredAt = payload.created_at ? new Date(payload.created_at) : new Date()

  // Idempotency — svix-id is guaranteed unique per event by the spec.
  await db.emailEvent
    .upsert({
      where: { resendEventId: svixId },
      create: {
        eventType,
        resendMessageId: payload.data.email_id ?? null,
        resendEventId: svixId,
        email: recipient.toLowerCase(),
        queueItemId,
        clickedUrl: payload.data.click?.link ?? null,
        templateKey,
        campaignTag,
        occurredAt,
      },
      update: {}, // existing row → just dedupe
    })
    .catch((err) => {
      logger.error("emailEvent.upsert failed", err, { svixId, eventType })
    })
}

function mapResendEventType(t: string): string | null {
  switch (t) {
    case "email.sent":
    case "email.delivered":
      return "delivered"
    case "email.opened":
      return "opened"
    case "email.clicked":
      return "clicked"
    case "email.bounced":
      return "bounced"
    case "email.complained":
      return "complained"
    case "email.delivery_delayed":
      return "delivery_delayed"
    case "email.unsubscribed":
    case "contact.unsubscribed":
      return "unsubscribed"
    default:
      return null
  }
}
