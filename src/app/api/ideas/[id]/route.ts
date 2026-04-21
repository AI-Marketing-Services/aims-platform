import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const patchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  body: z.string().trim().max(20_000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  status: z.enum(["INBOX", "ACTIVE", "SHIPPED", "PARKED"]).optional(),
  rank: z.number().int().optional(),
})

async function requireAdminUser() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) return null
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true, role: true } })
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) return null
  return user
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser()
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { id } = await params
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 })

    const existing = await db.idea.findUnique({ where: { id }, select: { ownerId: true } })
    if (!existing || existing.ownerId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const idea = await db.idea.update({
      where: { id },
      data: parsed.data,
    })
    return NextResponse.json({ idea })
  } catch (err) {
    logger.error("Idea patch failed", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser()
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { id } = await params
    const existing = await db.idea.findUnique({ where: { id }, select: { ownerId: true } })
    if (!existing || existing.ownerId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    await db.idea.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Idea delete failed", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
