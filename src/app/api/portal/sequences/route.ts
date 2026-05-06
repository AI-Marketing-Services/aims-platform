import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { hasEntitlement } from "@/lib/entitlements"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"

export const dynamic = "force-dynamic"

const stepSchema = z.object({
  order: z.number().int().min(0),
  delayDays: z.number().int().min(0).max(180),
  subject: z.string().min(1).max(300),
  body: z.string().min(1).max(20_000),
})

const createSchema = z.object({
  name: z.string().min(1).max(200),
  fromName: z.string().max(120).optional(),
  pauseOnReply: z.boolean().optional(),
  steps: z.array(stepSchema).min(1).max(20),
})

async function checkAccess(userId: string): Promise<boolean> {
  const u = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  if (u?.role === "ADMIN" || u?.role === "SUPER_ADMIN") return true
  return hasEntitlement(userId, FEATURE_ENTITLEMENTS.SEQUENCES)
}

/** GET /api/portal/sequences — list user's sequences + counts. */
export async function GET() {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const allowed = await checkAccess(userId)
  if (!allowed) {
    return NextResponse.json(
      { error: "upgrade_required", entitlement: FEATURE_ENTITLEMENTS.SEQUENCES },
      { status: 402 },
    )
  }

  const sequences = await db.emailSequence.findMany({
    where: { userId },
    include: {
      _count: { select: { steps: true, enrollments: true } },
    },
    orderBy: { updatedAt: "desc" },
  })
  return NextResponse.json({ sequences })
}

/** POST /api/portal/sequences — create new sequence + initial steps. */
export async function POST(req: Request) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const allowed = await checkAccess(userId)
  if (!allowed) {
    return NextResponse.json(
      { error: "upgrade_required", entitlement: FEATURE_ENTITLEMENTS.SEQUENCES },
      { status: 402 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // Normalize step ordering — insertion guaranteed to start at 0 and step
  // up so the cron worker can iterate by index.
  const orderedSteps = [...parsed.data.steps]
    .sort((a, b) => a.order - b.order)
    .map((s, idx) => ({ ...s, order: idx }))

  const created = await db.emailSequence.create({
    data: {
      userId,
      name: parsed.data.name,
      fromName: parsed.data.fromName ?? null,
      pauseOnReply: parsed.data.pauseOnReply ?? true,
      status: "draft",
      steps: { create: orderedSteps },
    },
    include: { steps: { orderBy: { order: "asc" } } },
  })
  return NextResponse.json({ sequence: created }, { status: 201 })
}
