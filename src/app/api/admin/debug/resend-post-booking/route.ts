import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { sendPostBookingConfirmationEmail } from "@/lib/email/post-booking-education"

/**
 * Admin-only debug endpoint that re-fires the post-booking confirmation
 * email for a given applicant. Used when we want to verify a template
 * fix without waiting for a real Calendly booking, or when the original
 * webhook failed silently.
 *
 * POST /api/admin/debug/resend-post-booking
 * Body: { email: string, sendTo?: string, name?: string }
 *
 * `email` is used to look up the applicant's name from the DB.
 * `sendTo` overrides the delivery address (useful for Asana/review inboxes).
 * `name` overrides the name lookup entirely.
 */
const schema = z.object({
  email: z.string().email(),
  sendTo: z.string().email().optional(),
  name: z.string().optional(),
  eventStartTime: z.string().optional(),
  meetingUrl: z.string().url().optional(),
})

export async function POST(req: Request) {
  const { userId, sessionClaims } = await auth()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const email = parsed.data.email.toLowerCase()
  const deliverTo = parsed.data.sendTo ?? email

  // Hydrate name from override, DB deal, or email prefix.
  let name = parsed.data.name ?? null
  if (!name) {
    const deal = await db.deal.findFirst({
      where: { contactEmail: { equals: email, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      select: { contactName: true },
    })
    name = deal?.contactName ?? email.split("@")[0]
  }

  try {
    await sendPostBookingConfirmationEmail({
      to: deliverTo,
      name,
      eventStartTime: parsed.data.eventStartTime ?? null,
      meetingUrl: parsed.data.meetingUrl ?? null,
      rescheduleUrl: null,
      cancelUrl: null,
    })

    logger.info(
      `[debug] Re-sent post-booking email to ${deliverTo} (looked up as ${email}, triggered by ${userId})`,
      { action: "debug_resend_post_booking" }
    )

    return NextResponse.json({ ok: true, to: deliverTo, name })
  } catch (err) {
    logger.error(`[debug] resend-post-booking failed for ${deliverTo}`, err, {
      action: "debug_resend_post_booking_error",
    })
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json(
      { error: `Send failed: ${message}` },
      { status: 500 }
    )
  }
}
