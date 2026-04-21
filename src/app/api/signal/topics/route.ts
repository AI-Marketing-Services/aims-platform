import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"

const MAX_TOPICS = 5

const createSchema = z.object({
  label: z.string().trim().min(2).max(60),
  query: z.string().trim().min(2).max(200),
})

async function getDbUserId() {
  const { userId } = await auth()
  if (!userId) return null
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } })
  return user?.id ?? null
}

export async function GET() {
  const uid = await getDbUserId()
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const topics = await db.signalTopic.findMany({
    where: { userId: uid },
    orderBy: { createdAt: "asc" },
    select: { id: true, label: true, query: true, enabled: true, createdAt: true },
  })
  return NextResponse.json({ topics })
}

export async function POST(req: Request) {
  const uid = await getDbUserId()
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 })
  }

  const count = await db.signalTopic.count({ where: { userId: uid } })
  if (count >= MAX_TOPICS) {
    return NextResponse.json({ error: `Topic limit of ${MAX_TOPICS} reached` }, { status: 400 })
  }

  const topic = await db.signalTopic.create({
    data: { userId: uid, label: parsed.data.label, query: parsed.data.query },
    select: { id: true, label: true, query: true, enabled: true, createdAt: true },
  })
  return NextResponse.json({ topic }, { status: 201 })
}
