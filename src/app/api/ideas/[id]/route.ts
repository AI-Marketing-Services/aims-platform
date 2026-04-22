import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { logger } from "@/lib/logger"

const patchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  body: z.string().trim().max(20_000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  status: z.enum(["INBOX", "ACTIVE", "SHIPPED", "PARKED"]).optional(),
  rank: z.number().int().optional(),
})

const VAULT_COOKIE = "lead_magnets_unlock"
const DEFAULT_OWNER_EMAIL = "adamwolfe102@gmail.com"

async function requireUnlockedAdmin() {
  const adminUserId = await requireAdmin()
  if (!adminUserId) return null

  const store = await cookies()
  if (store.get(VAULT_COOKIE)?.value !== "yes") return null

  const ownerEmail = process.env.LEAD_MAGNETS_OWNER_EMAIL ?? DEFAULT_OWNER_EMAIL
  const owner = await db.user.findUnique({
    where: { email: ownerEmail },
    select: { id: true },
  })
  if (!owner) return null

  return { ownerId: owner.id }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireUnlockedAdmin()
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { id } = await params
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 })

    const existing = await db.idea.findUnique({ where: { id }, select: { ownerId: true } })
    if (!existing || existing.ownerId !== ctx.ownerId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const idea = await db.idea.update({ where: { id }, data: parsed.data })
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
  const ctx = await requireUnlockedAdmin()
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { id } = await params
    const existing = await db.idea.findUnique({ where: { id }, select: { ownerId: true } })
    if (!existing || existing.ownerId !== ctx.ownerId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    await db.idea.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Idea delete failed", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
