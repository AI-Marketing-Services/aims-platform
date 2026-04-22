import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const revokeSchema = z.object({
  accessId: z.string().min(1),
})

async function getDbUserId(clerkId: string) {
  const u = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  return u?.id ?? null
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

  const deal = await db.clientDeal.findFirst({
    where: { id: dealId, userId: dbUserId },
    select: { id: true },
  })
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = revokeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 })
  }

  const { accessId } = parsed.data

  try {
    const access = await db.clientPortalAccess.findFirst({
      where: { id: accessId, clientDealId: dealId, userId: dbUserId },
      select: { id: true, guestEmail: true, revokedAt: true },
    })

    if (!access) {
      return NextResponse.json({ error: "Access record not found" }, { status: 404 })
    }

    if (access.revokedAt) {
      return NextResponse.json({ error: "Access already revoked" }, { status: 409 })
    }

    await db.clientPortalAccess.update({
      where: { id: accessId },
      data: { revokedAt: new Date() },
    })

    await db.clientDealActivity.create({
      data: {
        clientDealId: dealId,
        type: "PORTAL_REVOKED",
        description: `Client portal access revoked for ${access.guestEmail}`,
        metadata: { accessId, guestEmail: access.guestEmail },
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Failed to revoke client portal access", err, { userId, dealId, accessId: parsed.data.accessId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
