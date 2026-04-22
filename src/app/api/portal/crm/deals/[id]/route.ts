import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { updateDealSchema } from "@/lib/crm/schemas"

async function getDbUserId(clerkId: string) {
  const u = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  return u?.id ?? null
}

async function getDealForUser(dealId: string, userId: string) {
  return db.clientDeal.findFirst({
    where: { id: dealId, userId },
    include: {
      contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      activities: { orderBy: { createdAt: "desc" } },
    },
  })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id } = await params
  const deal = await getDealForUser(id, dbUserId)
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ deal })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id } = await params
  const existing = await db.clientDeal.findFirst({ where: { id, userId: dbUserId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const body = await req.json()
    const parsed = updateDealSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 })
    }

    const { contactEmail, website, tags, value, ...rest } = parsed.data

    const updates: Record<string, unknown> = { ...rest }
    if (contactEmail !== undefined) updates.contactEmail = contactEmail || null
    if (website !== undefined) updates.website = website || null
    if (tags !== undefined) updates.tags = tags
    if (value !== undefined) updates.value = value

    // Log stage change as activity
    const activities = []
    if (parsed.data.stage && parsed.data.stage !== existing.stage) {
      activities.push({
        type: "STAGE_CHANGE" as const,
        description: `Stage changed from ${existing.stage} to ${parsed.data.stage}`,
        metadata: { from: existing.stage, to: parsed.data.stage },
      })
    }

    const deal = await db.clientDeal.update({
      where: { id },
      data: {
        ...updates,
        ...(activities.length > 0
          ? { activities: { create: activities } }
          : {}),
      },
      include: {
        contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
        activities: { orderBy: { createdAt: "desc" } },
      },
    })

    return NextResponse.json({ deal })
  } catch (err) {
    logger.error("Failed to update client deal", err, { userId, dealId: id })
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
  const existing = await db.clientDeal.findFirst({ where: { id, userId: dbUserId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    await db.clientDeal.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Failed to delete client deal", err, { userId, dealId: id })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
