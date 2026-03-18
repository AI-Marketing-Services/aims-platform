import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"

const createSchema = z.object({
  subject: z.string().min(1).max(255),
  message: z.string().min(1).max(10000),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
})

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUser = await db.user.findUnique({ where: { clerkId } })
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const ticket = await db.supportTicket.create({
      data: {
        userId: dbUser.id,
        subject: parsed.data.subject,
        message: parsed.data.message,
        priority: parsed.data.priority,
        status: "open",
      },
    })

    return NextResponse.json({ id: ticket.id }, { status: 201 })
  } catch (err) {
    console.error("Failed to create support ticket:", err)
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const dbUser = await db.user.findUnique({ where: { clerkId } })
    if (!dbUser) return NextResponse.json([], { status: 200 })

    const tickets = await db.supportTicket.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
      include: { responses: { select: { id: true } } },
    })

    return NextResponse.json(tickets)
  } catch (err) {
    console.error("Failed to fetch support tickets:", err)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}
