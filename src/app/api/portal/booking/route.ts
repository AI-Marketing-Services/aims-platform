import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { hasEntitlement } from "@/lib/entitlements"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"
import { defaultWeeklyHours } from "@/lib/booking/slots"

export const dynamic = "force-dynamic"

const upsertSchema = z.object({
  handle: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Handle must be lowercase letters, numbers, or hyphens"),
  isActive: z.boolean().optional(),
  durationMinutes: z.number().int().min(5).max(240).optional(),
  bufferMinutes: z.number().int().min(0).max(120).optional(),
  timezone: z.string().min(1).max(64).optional(),
  weeklyHours: z.record(z.string(), z.array(z.object({ start: z.string(), end: z.string() }))).optional(),
  welcomeTitle: z.string().max(120).optional(),
  welcomeBody: z.string().max(2000).optional(),
})

async function checkAccess(userId: string): Promise<boolean> {
  const u = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  if (u?.role === "ADMIN" || u?.role === "SUPER_ADMIN") return true
  return hasEntitlement(userId, FEATURE_ENTITLEMENTS.BOOKING)
}

/** GET /api/portal/booking — own availability + bookings. */
export async function GET() {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const allowed = await checkAccess(userId)
  if (!allowed) {
    return NextResponse.json(
      { error: "upgrade_required", entitlement: FEATURE_ENTITLEMENTS.BOOKING },
      { status: 402 },
    )
  }

  const [availability, bookings] = await Promise.all([
    db.bookingAvailability.findUnique({ where: { userId } }),
    db.booking.findMany({
      where: { userId, startAt: { gte: new Date() } },
      orderBy: { startAt: "asc" },
      take: 50,
    }),
  ])

  return NextResponse.json({ availability, bookings })
}

/** PUT /api/portal/booking — upsert availability config. */
export async function PUT(req: Request) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const allowed = await checkAccess(userId)
  if (!allowed) {
    return NextResponse.json(
      { error: "upgrade_required", entitlement: FEATURE_ENTITLEMENTS.BOOKING },
      { status: 402 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // Handle uniqueness — if another user took the handle, 409.
  const existingHandle = await db.bookingAvailability.findUnique({
    where: { handle: parsed.data.handle },
    select: { userId: true },
  })
  if (existingHandle && existingHandle.userId !== userId) {
    return NextResponse.json(
      { error: "handle_taken", message: "That handle is already in use." },
      { status: 409 },
    )
  }

  const data = {
    handle: parsed.data.handle,
    isActive: parsed.data.isActive ?? true,
    durationMinutes: parsed.data.durationMinutes ?? 30,
    bufferMinutes: parsed.data.bufferMinutes ?? 15,
    timezone: parsed.data.timezone ?? "America/Los_Angeles",
    weeklyHours: (parsed.data.weeklyHours ?? defaultWeeklyHours()) as object,
    welcomeTitle: parsed.data.welcomeTitle ?? null,
    welcomeBody: parsed.data.welcomeBody ?? null,
  }

  const availability = await db.bookingAvailability.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  })
  return NextResponse.json({ availability })
}
