import { NextResponse } from "next/server"
import crypto from "crypto"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { notify } from "@/lib/notifications"
import { sendPostBookingConfirmationEmail } from "@/lib/email/post-booking-education"
import { queueEmailSequence } from "@/lib/email/queue"

const CALENDLY_WEBHOOK_SECRET = process.env.CALENDLY_WEBHOOK_SECRET

/**
 * Verify the Calendly webhook signature.
 * Header format: `t=<timestamp>,v1=<signature>`
 * Signature = HMAC-SHA256( "<timestamp>.<rawBody>", signingKey )
 */
function verifySignature(rawBody: string, signatureHeader: string): boolean {
  if (!CALENDLY_WEBHOOK_SECRET) return false

  const parts = signatureHeader.split(",")
  const timestampPart = parts.find((p) => p.startsWith("t="))
  const sigPart = parts.find((p) => p.startsWith("v1="))

  if (!timestampPart || !sigPart) return false

  const timestamp = timestampPart.slice(2)
  const expectedSig = sigPart.slice(3)

  // Reject requests older than 5 minutes
  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (age > 300) return false

  const payload = `${timestamp}.${rawBody}`
  const computed = crypto
    .createHmac("sha256", CALENDLY_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex")

  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(expectedSig))
}

/**
 * Try to match a Calendly booking to an existing Deal. We use two lookup
 * paths so someone who applies with one email and books with another still
 * gets surfaced in the admin CRM instead of silently dropping on the floor.
 *
 * Strategy:
 * 1. Exact match on LeadMagnetSubmission.email (normal path)
 * 2. Fallback to Deal.contactEmail (case-insensitive)
 * 3. If we still can't match, notify admins that an orphan booking arrived
 *    so they can manually link it — beats losing the lead entirely.
 */
async function resolveDeal(email: string) {
  const submission = await db.leadMagnetSubmission
    .findFirst({
      where: { email, type: "COLLECTIVE_APPLICATION" },
      orderBy: { createdAt: "desc" },
    })
    .catch((err) => {
      logger.error("Calendly webhook: submission lookup failed", err)
      return null
    })

  if (submission?.dealId) {
    return { dealId: submission.dealId, matchSource: "submission_email" as const }
  }

  // Fallback: deal itself may exist with a different email than the application.
  const deal = await db.deal
    .findFirst({
      where: { contactEmail: { equals: email, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    })
    .catch((err) => {
      logger.error("Calendly webhook: deal fallback lookup failed", err)
      return null
    })

  if (deal) {
    return { dealId: deal.id, matchSource: "deal_email" as const }
  }

  return null
}

export async function POST(req: Request) {
  const rawBody = await req.text()

  if (!CALENDLY_WEBHOOK_SECRET) {
    logger.error("Calendly webhook: CALENDLY_WEBHOOK_SECRET not configured")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const sig = req.headers.get("calendly-webhook-signature") ?? ""
  if (!verifySignature(rawBody, sig)) {
    logger.error("Calendly webhook: invalid signature")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: {
    event?: string
    payload?: {
      email?: string
      name?: string
      uri?: string
      reschedule_url?: string
      cancel_url?: string
      scheduled_event?: {
        uri?: string
        start_time?: string
        location?: { join_url?: string }
      }
    }
  }
  try {
    event = JSON.parse(rawBody)
  } catch (err) {
    logger.error("Calendly webhook: malformed JSON", err)
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Only handle invitee.created (new booking). Cancellations and reschedules
  // fire their own events and aren't wired up yet.
  if (event.event !== "invitee.created") {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const invitee = event.payload
  const email = invitee?.email?.toLowerCase()
  const name = invitee?.name ?? ""
  const scheduledEvent = invitee?.scheduled_event
  const eventStartTime = scheduledEvent?.start_time ?? null
  const meetingUrl = scheduledEvent?.location?.join_url ?? null
  const rescheduleUrl = invitee?.reschedule_url ?? null
  const cancelUrl = invitee?.cancel_url ?? null

  // Calendly gives us two candidate idempotency keys: the invitee URI and
  // the scheduled-event URI. Invitee URI is unique per booking so we use
  // that. Falling back to scheduled_event URI + email if invitee URI is
  // missing on older event shapes.
  const idempotencyKey =
    invitee?.uri ?? (scheduledEvent?.uri ? `${scheduledEvent.uri}::${email ?? ""}` : null)

  if (!email) {
    logger.error("Calendly webhook: no email in payload")
    return NextResponse.json({ error: "Missing email" }, { status: 400 })
  }

  // Idempotency guard — reject replays that arrive during Calendly's retry
  // window. Unique constraint on WebhookEvent.eventUri makes the "check and
  // create" atomic; no TOCTOU race if two webhooks land at the same
  // millisecond.
  if (idempotencyKey) {
    try {
      await db.webhookEvent.create({
        data: { source: "calendly", eventUri: idempotencyKey },
      })
    } catch (err) {
      const prismaErr = err as { code?: string }
      if (prismaErr.code === "P2002") {
        logger.info(`Calendly webhook: duplicate ignored ${idempotencyKey}`, {
          action: "calendly_webhook_duplicate",
        })
        return NextResponse.json({ ok: true, duplicate: true })
      }
      // If the idempotency table write fails for some other reason, log and
      // continue — losing idempotency is better than losing the booking.
      logger.error("Calendly webhook: idempotency write failed, continuing", err)
    }
  }

  const match = await resolveDeal(email)

  // ── 1. Update the deal (if we found one) ────────────────────────────────
  if (match) {
    try {
      const detail =
        match.matchSource === "submission_email"
          ? `Calendly consult booked by ${name} (${email}).`
          : `Calendly consult booked by ${name} (${email}) — matched on deal email (applicant may have used a different email at /apply).`

      const updateData: Prisma.DealUpdateInput = {
        stage: "CONSULT_BOOKED",
        activities: {
          create: {
            type: "DEMO_COMPLETED",
            detail,
            metadata: {
              calendlyEventUri: idempotencyKey,
              eventStartTime,
              meetingUrl,
              matchSource: match.matchSource,
            },
          },
        },
      }

      await db.deal.update({
        where: { id: match.dealId },
        data: updateData,
      })
    } catch (err) {
      logger.error("Calendly webhook: deal update failed", err)
      // Don't abort — we still want to fire the confirmation email below
      // so the applicant isn't left waiting. The booking is in Calendly;
      // admin can reconcile manually from the Calendly dashboard.
    }
  } else {
    // No matching deal anywhere. Log loudly so admin can manually link.
    logger.error(
      `Calendly webhook: orphan booking — no deal found for ${email}`,
      null,
      { action: "calendly_orphan_booking", endpoint: "/api/webhooks/calendly" }
    )
    notify({
      type: "new_lead",
      title: "Orphan Calendly booking",
      message: `${name || email} booked a consult but no application was found on file. Check Calendly for their details and create a manual deal if needed.`,
      urgency: "high",
    }).catch((err) => logger.error("Orphan booking notify failed", err))
  }

  // ── 2. Day-0 confirmation email with Playbook PDF ──────────────────────
  // Fires even on orphan bookings — the applicant did book, they deserve
  // the confirmation. Attachment means we skip the queue and send direct.
  try {
    await sendPostBookingConfirmationEmail({
      to: email,
      name,
      eventStartTime,
      meetingUrl,
      rescheduleUrl,
      cancelUrl,
    })
  } catch (err) {
    logger.error("Calendly webhook: post-booking confirmation failed", err)
  }

  // ── 3. 3-email education drip ──────────────────────────────────────────
  try {
    await queueEmailSequence(email, "post-booking-education", {
      name,
      eventStartTime,
      meetingUrl,
    })
  } catch (err) {
    logger.error("Calendly webhook: queue post-booking education failed", err)
  }

  // ── 4. Morning-of reminder ─────────────────────────────────────────────
  // Fires 3h before the call, skipped if the call is <30min away.
  try {
    if (eventStartTime) {
      const startMs = new Date(eventStartTime).getTime()
      const threeHoursBefore = startMs - 3 * 3600_000
      const thirtyMinutesFromNow = Date.now() + 30 * 60_000
      const scheduledFor = new Date(Math.max(threeHoursBefore, thirtyMinutesFromNow))

      if (startMs > thirtyMinutesFromNow) {
        const cooldown = new Date(Date.now() - 90 * 86400_000)
        const existing = await db.emailQueueItem.findFirst({
          where: {
            recipientEmail: email,
            sequenceKey: "post-booking-morning-of",
            createdAt: { gte: cooldown },
          },
        })
        if (!existing) {
          await db.emailQueueItem.create({
            data: {
              recipientEmail: email,
              sequenceKey: "post-booking-morning-of",
              emailIndex: 0,
              scheduledFor,
              metadata: { name, eventStartTime, meetingUrl },
            },
          })
        }
      }
    }
  } catch (err) {
    logger.error("Calendly webhook: morning-of reminder schedule failed", err)
  }

  return NextResponse.json({ ok: true, matched: !!match })
}
