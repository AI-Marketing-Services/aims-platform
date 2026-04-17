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
 * Body: { email: string }
 *
 * Looks up the most recent LeadMagnetSubmission / Deal for the email
 * to hydrate the applicant's name, then re-sends. Everything else
 * (attached Playbook PDF, magic-link URL, CTA copy) is rebuilt live.
 */
const schema = z.object({
  email: z.string().email(),
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

  // Hydrate name from the most recent application/deal for this email.
  const deal = await db.deal.findFirst({
    where: { contactEmail: { equals: email, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    select: { contactName: true },
  })
  const name = deal?.contactName ?? email.split("@")[0]

  try {
    await sendPostBookingConfirmationEmail({
      to: email,
      name,
      eventStartTime: parsed.data.eventStartTime ?? null,
      meetingUrl: parsed.data.meetingUrl ?? null,
      rescheduleUrl: null,
      cancelUrl: null,
    })

    logger.info(
      `[debug] Re-sent post-booking email to ${email} (triggered by ${userId})`,
      { action: "debug_resend_post_booking" }
    )

    return NextResponse.json({ ok: true, to: email, name })
  } catch (err) {
    logger.error(`[debug] resend-post-booking failed for ${email}`, err, {
      action: "debug_resend_post_booking_error",
    })
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json(
      { error: `Send failed: ${message}` },
      { status: 500 }
    )
  }
}
