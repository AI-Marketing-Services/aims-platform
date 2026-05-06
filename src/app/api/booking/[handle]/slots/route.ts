import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { computeSlots } from "@/lib/booking/slots"

export const dynamic = "force-dynamic"

/**
 * GET /api/booking/[handle]/slots
 *
 * Public — returns the next 14 days of bookable slots for an active
 * booking page handle. No auth required (this powers the public picker).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params

  const availability = await db.bookingAvailability.findUnique({
    where: { handle: handle.toLowerCase() },
  })
  if (!availability || !availability.isActive) {
    return NextResponse.json({ error: "Not available" }, { status: 404 })
  }

  const fourteenDaysOut = new Date()
  fourteenDaysOut.setDate(fourteenDaysOut.getDate() + 14)

  const existingBookings = await db.booking.findMany({
    where: {
      userId: availability.userId,
      status: "confirmed",
      startAt: { gte: new Date(), lte: fourteenDaysOut },
    },
    select: { startAt: true, endAt: true },
  })

  const slots = computeSlots({
    weeklyHours: availability.weeklyHours as Record<
      string,
      Array<{ start: string; end: string }>
    >,
    durationMinutes: availability.durationMinutes,
    bufferMinutes: availability.bufferMinutes,
    existingBookings,
    daysAhead: 14,
  })

  return NextResponse.json({
    handle: availability.handle,
    durationMinutes: availability.durationMinutes,
    timezone: availability.timezone,
    welcomeTitle: availability.welcomeTitle,
    welcomeBody: availability.welcomeBody,
    slots,
  })
}
