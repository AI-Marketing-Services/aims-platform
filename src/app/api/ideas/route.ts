import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(20_000).optional().default(""),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).optional().default([]),
  status: z.enum(["INBOX", "ACTIVE", "SHIPPED", "PARKED"]).optional().default("INBOX"),
})

async function requireAdminUser() {
  const { userId } = await auth()
  if (!userId) return null
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  })
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) return null
  return user
}

export async function GET() {
  const user = await requireAdminUser()
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const ideas = await db.idea.findMany({
    where: { ownerId: user.id },
    orderBy: [{ rank: "asc" }, { createdAt: "desc" }],
  })
  return NextResponse.json({ ideas })
}

export async function POST(req: Request) {
  const user = await requireAdminUser()
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }
    const idea = await db.idea.create({
      data: {
        ownerId: user.id,
        title: parsed.data.title,
        body: parsed.data.body,
        tags: parsed.data.tags,
        status: parsed.data.status,
      },
    })
    return NextResponse.json({ idea }, { status: 201 })
  } catch (err) {
    logger.error("Idea create failed", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
