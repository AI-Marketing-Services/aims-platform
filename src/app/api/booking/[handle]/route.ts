import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { formRatelimit, getIp, rateLimitedResponse } from "@/lib/ratelimit"

export const dynamic = "force-dynamic"

const bookSchema = z.object({
  startAt: z.string().datetime(),
  inviteeName: z.string().min(1).max(200),
  inviteeEmail: z.string().email(),
  inviteePhone: z.string().max(40).optional(),
  notes: z.string().max(2000).optional(),
})

/**
 * POST /api/booking/[handle]
 *
 * Public — creates a confirmed Booking for the given handle, then
 * auto-creates a CRM ClientDeal for the operator with the invitee's
 * details so they pick up the lead immediately.
 *
 * Conflict detection: re-checks for an overlapping booking right before
 * insert. Race condition is theoretically possible (two visitors picking
 * the same slot at the same instant) — we accept the rare loss because
 * the operator can manually cancel one and the cost of a global lock
 * isn't worth it for this volume.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params

  // Public endpoint — rate-limit by IP + handle to prevent CRM
  // poisoning. Without this, anyone could scripted-submit thousands of
  // fake bookings, filling the operator's pipeline with garbage and
  // burning their enrichment credit pool indirectly. 5 per minute per
  // (IP, handle) is plenty for a real visitor double-clicking but kills
  // a flood.
  if (formRatelimit) {
    const key = `booking:${handle}:${getIp(req)}`
    const { success } = await formRatelimit.limit(key)
    if (!success) {
      return rateLimitedResponse(req, `POST /api/booking/${handle}`, key)
    }
  }

  const availability = await db.bookingAvailability.findUnique({
    where: { handle: handle.toLowerCase() },
  })
  if (!availability || !availability.isActive) {
    return NextResponse.json({ error: "Not available" }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = bookSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const startAt = new Date(parsed.data.startAt)
  const endAt = new Date(
    startAt.getTime() + availability.durationMinutes * 60_000,
  )

  // Re-check conflict.
  const conflict = await db.booking.findFirst({
    where: {
      userId: availability.userId,
      status: "confirmed",
      AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
    },
    select: { id: true },
  })
  if (conflict) {
    return NextResponse.json(
      { error: "slot_taken", message: "That slot just got booked. Pick another." },
      { status: 409 },
    )
  }

  // Auto-create a CRM deal so the operator picks up the lead in CRM.
  let clientDealId: string | null = null
  try {
    const deal = await db.clientDeal.create({
      data: {
        userId: availability.userId,
        companyName:
          parsed.data.inviteeName + (parsed.data.notes ? ` — ${parsed.data.notes.slice(0, 60)}` : ""),
        contactName: parsed.data.inviteeName,
        contactEmail: parsed.data.inviteeEmail,
        contactPhone: parsed.data.inviteePhone ?? null,
        source: "booking",
        stage: "DISCOVERY_CALL",
        notes: `Booked via /book/${availability.handle} for ${startAt.toISOString()}.\n\n${parsed.data.notes ?? ""}`.trim(),
      },
    })
    clientDealId = deal.id
  } catch (err) {
    logger.error("Auto-create CRM deal from booking failed", err, {
      bookingHandle: handle,
    })
  }

  const booking = await db.booking.create({
    data: {
      userId: availability.userId,
      clientDealId,
      inviteeName: parsed.data.inviteeName,
      inviteeEmail: parsed.data.inviteeEmail.toLowerCase(),
      inviteePhone: parsed.data.inviteePhone ?? null,
      notes: parsed.data.notes ?? null,
      startAt,
      endAt,
      status: "confirmed",
    },
  })

  return NextResponse.json({ booking })
}
