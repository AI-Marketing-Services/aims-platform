import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { createActivitySchema } from "@/lib/crm/schemas"

async function getDbUserId(clerkId: string) {
  const u = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  return u?.id ?? null
}

async function verifyDealOwner(dealId: string, userId: string) {
  const deal = await db.clientDeal.findFirst({ where: { id: dealId, userId }, select: { id: true } })
  return !!deal
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id: dealId } = await params
  const isOwner = await verifyDealOwner(dealId, dbUserId)
  if (!isOwner) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const activities = await db.clientDealActivity.findMany({
    where: { clientDealId: dealId },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ activities })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id: dealId } = await params
  const isOwner = await verifyDealOwner(dealId, dbUserId)
  if (!isOwner) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const body = await req.json()
    const parsed = createActivitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 })
    }

    const activity = await db.clientDealActivity.create({
      data: {
        clientDealId: dealId,
        type: parsed.data.type,
        description: parsed.data.description ?? null,
        metadata: parsed.data.metadata ? (parsed.data.metadata as Record<string, string>) : undefined,
      },
    })

    return NextResponse.json({ activity }, { status: 201 })
  } catch (err) {
    logger.error("Failed to log activity", err, { userId, dealId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
