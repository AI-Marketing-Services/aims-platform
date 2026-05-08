import { NextResponse } from "next/server"
import crypto from "crypto"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { notify } from "@/lib/notifications"
import { sendPostBookingConfirmationEmail } from "@/lib/email/post-booking-education"
import { sendNoShowRecoveryEmail } from "@/lib/email/no-show-recovery"
import { queueEmailSequence } from "@/lib/email/queue"

const CALENDLY_WEBHOOK_SECRET = process.env.CALENDLY_WEBHOOK_SECRET

/**
 * Allowlist of Calendly event type URIs that should fire the AOC
 * post-booking flow. Calendly team/workspace webhooks deliver every
 * invitee.created event in the workspace — not just the AOC consult —
 * so without this filter the AOC welcome email goes out for every
 * sales demo, intern interview, and 1:1 booked by anyone on the team.
 *
 * Format: comma-separated event type URIs, e.g.
 *   CALENDLY_AOC_EVENT_TYPE_URIS=https://api.calendly.com/event_types/ABCD1234,https://api.calendly.com/event_types/EFGH5678
 *
 * If unset, we skip ALL bookings (fail-safe) and log loudly so ops
 * knows the filter is missing.
 */
const AOC_EVENT_TYPE_URIS = (process.env.CALENDLY_AOC_EVENT_TYPE_URIS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

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
  // Restrict to AOC application deals only — other sources (tool audit, intake
  // form, etc.) must not be matched just because they share the same email.
  const deal = await db.deal
    .findFirst({
      where: {
        contactEmail: { equals: email, mode: "insensitive" },
        source: "ai-operator-collective-application",
      },
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
        event_type?: string
        name?: string
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

  // Calendly fires three events we care about: invitee.created (new
  // booking), invitee.canceled (cancellation OR reschedule on the OLD
  // event — Calendly fires .canceled on the old slot then .created on
  // the new one), and invitee.no_show.marked. Anything else gets a 200
  // skip so Calendly stops retrying.
  if (
    event.event !== "invitee.created" &&
    event.event !== "invitee.canceled" &&
    event.event !== "invitee.no_show.marked"
  ) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const invitee = event.payload
  const email = invitee?.email?.toLowerCase()
  const name = invitee?.name ?? ""
  const scheduledEvent = invitee?.scheduled_event
  const eventTypeUri = scheduledEvent?.event_type ?? null
  const eventTypeName = scheduledEvent?.name ?? null

  // ── Event-type allowlist ────────────────────────────────────────────────
  // Done BEFORE idempotency write so we don't burn idempotency rows for
  // every unrelated workspace booking.
  if (AOC_EVENT_TYPE_URIS.length === 0) {
    logger.error(
      "Calendly webhook: CALENDLY_AOC_EVENT_TYPE_URIS not configured — skipping booking to prevent workspace-wide fanout",
      null,
      { action: "calendly_webhook_no_filter", eventTypeUri, eventTypeName }
    )
    // Slack-alert ops loudly. Without the env filter, real users booking AOC
    // consults will get NO welcome email, NO deal stage update, and NO
    // morning-of reminder. Better to find out the moment a booking arrives
    // than to discover a black hole the next day from a cron log.
    notify({
      type: "config_error",
      title: "Calendly webhook silent — AOC env filter missing",
      message: `CALENDLY_AOC_EVENT_TYPE_URIS is not set in this environment. A real Calendly booking just arrived (${name || email}, ${eventTypeName ?? "?"}) but was skipped to prevent fanning out the AOC welcome to every workspace booking. Set the env var to re-enable the booking flow.`,
      urgency: "high",
    }).catch(() => {})
    return NextResponse.json({ ok: true, skipped: "no_event_type_filter" })
  }
  if (!eventTypeUri || !AOC_EVENT_TYPE_URIS.includes(eventTypeUri)) {
    logger.info(
      `Calendly webhook: skipping non-AOC event type ${eventTypeUri ?? "unknown"}`,
      { action: "calendly_webhook_skipped_event_type", eventTypeUri, eventTypeName }
    )
    return NextResponse.json({ ok: true, skipped: "non_aoc_event_type" })
  }

  // ── Cancellation handler ────────────────────────────────────────────────
  // Cancel = applicant clicked "cancel booking" in Calendly OR rescheduled.
  // Calendly fires this on the OLD event when a reschedule happens; the new
  // slot fires its own invitee.created. Either way we want the deal to:
  //   - log a CANCELED activity so admin sees it in the timeline
  //   - drop back to APPLICATION_SUBMITTED so nurture-unbooked picks them
  //     up again if they don't rebook within a few days
  //   - cancel the morning-of reminder so we don't email about a meeting
  //     that no longer exists
  if (event.event === "invitee.canceled") {
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 })
    }
    const match = await resolveDeal(email)
    if (match) {
      try {
        const currentDeal = await db.deal.findUnique({
          where: { id: match.dealId },
          select: { stage: true },
        })
        // Only walk the stage backwards if we're still in the booked-but-
        // not-yet-completed window. Don't touch deals that have already
        // progressed past the call (CONSULT_COMPLETED, MEMBER_JOINED, etc).
        const shouldRevertStage = currentDeal?.stage === "CONSULT_BOOKED"
        await db.deal.update({
          where: { id: match.dealId },
          data: {
            ...(shouldRevertStage ? { stage: "APPLICATION_SUBMITTED" } : {}),
            activities: {
              create: {
                type: "NOTE_ADDED",
                detail: `Calendly consult canceled by ${name || email}.`,
                metadata: { calendlyEventUri: scheduledEvent?.uri ?? null },
              },
            },
          },
        })
      } catch (err) {
        logger.error("Calendly webhook: cancel deal update failed", err)
      }
    }
    // Cancel any pending morning-of reminder for this email so we don't
    // ping the applicant about a meeting that no longer exists.
    try {
      await db.emailQueueItem.updateMany({
        where: {
          recipientEmail: email,
          sequenceKey: "post-booking-morning-of",
          status: "pending",
        },
        data: { status: "cancelled" },
      })
    } catch (err) {
      logger.error("Calendly webhook: cancel morning-of reminder failed", err)
    }
    notify({
      type: "new_lead",
      title: "Calendly consult canceled",
      message: `${name || email} canceled their AOC consult. Deal moved back to APPLICATION_SUBMITTED.`,
      urgency: "normal",
    }).catch(() => {})
    return NextResponse.json({ ok: true, canceled: true })
  }

  // ── No-show handler ─────────────────────────────────────────────────────
  // Calendly's "mark as no-show" feature fires invitee.no_show.marked. If we
  // get one, log it on the deal, send the recovery email, and notify ops.
  if (event.event === "invitee.no_show.marked") {
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 })
    }
    const match = await resolveDeal(email)
    let tier: "hot" | "warm" | "cold" | null = null
    if (match) {
      try {
        const deal = await db.deal.update({
          where: { id: match.dealId },
          data: {
            activities: {
              create: {
                type: "NOTE_ADDED",
                detail: `Calendly no-show: ${name || email} did not attend their consult.`,
                metadata: { calendlyEventUri: scheduledEvent?.uri ?? null },
              },
            },
          },
          select: { leadScoreTier: true },
        })
        tier = (deal.leadScoreTier as "hot" | "warm" | "cold" | null) ?? null
      } catch (err) {
        logger.error("Calendly webhook: no-show deal update failed", err)
      }
    }
    // Recovery email — single low-pressure rebook nudge. Fires regardless
    // of whether we matched the deal so a Calendly-only contact still
    // gets the email. Failure is logged but does not break the webhook.
    sendNoShowRecoveryEmail({ to: email, name: name ?? "", tier }).catch(
      (err) => logger.error("No-show recovery email failed", err)
    )
    notify({
      type: "new_lead",
      title: "Calendly no-show",
      message: `${name || email} no-showed their AOC consult. Recovery email sent.`,
      urgency: "normal",
    }).catch(() => {})
    return NextResponse.json({ ok: true, noShow: true })
  }

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

      // Fetch current stage so we never downgrade a deal that has already
      // progressed beyond APPLICATION_SUBMITTED (e.g. CONSULT_COMPLETED,
      // MIGHTY_INVITED, MEMBER_JOINED).
      const currentDeal = await db.deal.findUnique({
        where: { id: match.dealId },
        select: { stage: true },
      })

      const updateData: Prisma.DealUpdateInput = {
        ...(currentDeal?.stage === "APPLICATION_SUBMITTED" ? { stage: "CONSULT_BOOKED" } : {}),
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

  // ── 2. Day-0 confirmation email ────────────────────────────────────────
  // Fires even on orphan bookings — the applicant did book, they deserve
  // the confirmation. We skip the queue and send direct.
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
      rescheduleUrl,
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
              metadata: { name, eventStartTime, meetingUrl, rescheduleUrl },
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
