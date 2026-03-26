import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { notify } from "@/lib/notifications"
import {
  sendTicketConfirmationEmail,
  sendTicketNotificationToAdmin,
} from "@/lib/email/support"

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

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
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

    // Send notifications in parallel
    await Promise.allSettled([
      // Email confirmation to client
      sendTicketConfirmationEmail({
        to: dbUser.email,
        name: dbUser.name ?? dbUser.email.split("@")[0],
        subject: parsed.data.subject,
        ticketId: ticket.id,
      }),
      // Email notification to admin
      sendTicketNotificationToAdmin({
        clientName: dbUser.name ?? dbUser.email,
        clientEmail: dbUser.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
        priority: parsed.data.priority,
        ticketId: ticket.id,
      }),
      // In-app notification for admins
      notify({
        type: "support_ticket",
        title: "New Support Ticket",
        message: `${dbUser.name ?? dbUser.email} opened a ticket: ${parsed.data.subject}`,
        channel: "IN_APP",
        urgency: parsed.data.priority === "urgent" ? "high" : "normal",
        metadata: { ticketId: ticket.id, priority: parsed.data.priority },
      }),
    ]).catch((err) => logger.error("Failed to send ticket notifications", err))

    return NextResponse.json({ id: ticket.id }, { status: 201 })
  } catch (err) {
    logger.error("Failed to create support ticket", err, { endpoint: "POST /api/support/tickets" })
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
  }
}

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const dbUser = await db.user.findUnique({ where: { clerkId } })
    if (!dbUser) return NextResponse.json([], { status: 200 })

    const tickets = await db.supportTicket.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            message: true,
            isAdmin: true,
            authorName: true,
            createdAt: true,
          },
        },
      },
    })

    return NextResponse.json(tickets)
  } catch (err) {
    logger.error("Failed to fetch support tickets", err, { endpoint: "GET /api/support/tickets" })
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}
