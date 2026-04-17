import { NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
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

  try {
    const event = JSON.parse(rawBody)

    // Only handle invitee.created (new booking)
    if (event.event !== "invitee.created") {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const invitee = event.payload
    const email = invitee?.email?.toLowerCase()
    const name = invitee?.name ?? ""
    const scheduledEvent = invitee?.scheduled_event as
      | {
          start_time?: string
          location?: { join_url?: string }
        }
      | undefined
    const eventStartTime = scheduledEvent?.start_time ?? null
    const meetingUrl = scheduledEvent?.location?.join_url ?? null
    const rescheduleUrl = (invitee?.reschedule_url as string) ?? null
    const cancelUrl = (invitee?.cancel_url as string) ?? null

    if (!email) {
      logger.error("Calendly webhook: no email in payload")
      return NextResponse.json({ error: "Missing email" }, { status: 400 })
    }

    // Find the matching application
    const submission = await db.leadMagnetSubmission
      .findFirst({
        where: {
          email,
          type: "COLLECTIVE_APPLICATION",
        },
        orderBy: { createdAt: "desc" },
      })
      .catch((err) => {
        logger.error("Calendly webhook: DB lookup failed", err)
        return null
      })

    // Update the deal with booking info
    if (submission?.dealId) {
      try {
        await db.deal.update({
          where: { id: submission.dealId },
          data: {
            stage: "CONSULT_BOOKED",
            activities: {
              create: {
                type: "DEMO_COMPLETED",
                detail: `Calendly consult booked by ${name} (${email}).`,
              },
            },
          },
        })
      } catch (err) {
        logger.error("Calendly webhook: deal update failed", err)
        return NextResponse.json({ error: "Deal update failed" }, { status: 500 })
      }
    }

    // Day-0 confirmation email with the AI Operator Playbook PDF attached.
    // Sent immediately outside the email queue because it needs the attachment.
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

    // Queue the 3-email education drip (day 1 case study, day 2 tools, day 3 prompts).
    try {
      await queueEmailSequence(email, "post-booking-education", {
        name,
        eventStartTime,
        meetingUrl,
      })
    } catch (err) {
      logger.error("Calendly webhook: queue post-booking education failed", err)
    }

    // Morning-of reminder: fires 3 hours before the actual call.
    // Dynamic schedule based on Calendly's start_time, not a fixed delay.
    // Skipped if the call is less than 30 minutes away (too late to be useful).
    try {
      if (eventStartTime) {
        const startMs = new Date(eventStartTime).getTime()
        const threeHoursBefore = startMs - 3 * 3600_000
        const thirtyMinutesFromNow = Date.now() + 30 * 60_000
        const scheduledFor = new Date(Math.max(threeHoursBefore, thirtyMinutesFromNow))

        // Only queue if call is >30 min in the future
        if (startMs > thirtyMinutesFromNow) {
          // Dedup across 90d window (same logic as queueEmailSequence)
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

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Calendly webhook processing failed", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
