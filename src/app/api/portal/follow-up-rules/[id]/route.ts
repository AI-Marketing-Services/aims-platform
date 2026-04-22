import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

async function getDbUserId(clerkId: string): Promise<string | null> {
  const u = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  return u?.id ?? null
}

const updateRuleSchema = z.object({
  stageTrigger: z
    .enum([
      "PROSPECT",
      "DISCOVERY_CALL",
      "PROPOSAL_SENT",
      "ACTIVE_RETAINER",
      "COMPLETED",
      "LOST",
    ])
    .optional(),
  daysStale: z.number().int().min(1).max(90).optional(),
  message: z.string().max(1000).nullish(),
  isActive: z.boolean().optional(),
  clientDealId: z.string().cuid().nullish(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id } = await params

  const existing = await db.followUpRule.findFirst({ where: { id, userId: dbUserId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const body = await req.json()
    const parsed = updateRuleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (parsed.data.stageTrigger !== undefined) updates.stageTrigger = parsed.data.stageTrigger
    if (parsed.data.daysStale !== undefined) updates.daysStale = parsed.data.daysStale
    if ("message" in parsed.data) updates.message = parsed.data.message ?? null
    if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive
    if ("clientDealId" in parsed.data) updates.clientDealId = parsed.data.clientDealId ?? null

    const rule = await db.followUpRule.update({ where: { id }, data: updates })
    return NextResponse.json({ rule })
  } catch (err) {
    logger.error("Failed to update follow-up rule", err, { userId, ruleId: id })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id } = await params

  const existing = await db.followUpRule.findFirst({ where: { id, userId: dbUserId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    await db.followUpRule.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Failed to delete follow-up rule", err, { userId, ruleId: id })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
