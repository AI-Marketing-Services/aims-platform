import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"

const patchSchema = z.object({
  label: z.string().trim().min(2).max(60).optional(),
  query: z.string().trim().min(2).max(200).optional(),
  enabled: z.boolean().optional(),
})

async function getDbUserId() {
  const { userId } = await auth()
  if (!userId) return null
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } })
  return user?.id ?? null
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await getDbUserId()
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await ctx.params

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const existing = await db.signalTopic.findFirst({ where: { id, userId: uid }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const topic = await db.signalTopic.update({
    where: { id },
    data: parsed.data,
    select: { id: true, label: true, query: true, enabled: true, createdAt: true },
  })
  return NextResponse.json({ topic })
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await getDbUserId()
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await ctx.params

  const existing = await db.signalTopic.findFirst({ where: { id, userId: uid }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.signalTopic.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
