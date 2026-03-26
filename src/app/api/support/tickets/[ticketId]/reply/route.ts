import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { notify } from "@/lib/notifications"

const replySchema = z.object({
  message: z.string().min(1).max(10000),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { ticketId } = await params

  const dbUser = await db.user.findUnique({ where: { clerkId } })
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // Verify the ticket belongs to this user
  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, userId: true, subject: true },
  })

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }

  if (ticket.userId !== dbUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = replySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const reply = await db.supportTicketReply.create({
      data: {
        ticketId,
        message: parsed.data.message,
        isAdmin: false,
        authorId: dbUser.id,
        authorName: dbUser.name ?? dbUser.email.split("@")[0],
      },
    })

    // Update ticket timestamp
    await db.supportTicket.update({
      where: { id: ticketId },
      data: { status: "open", updatedAt: new Date() },
    })

    // Notify admin of client reply
    notify({
      type: "support_reply",
      title: "Client replied to support ticket",
      message: `${dbUser.name ?? dbUser.email} replied to: ${ticket.subject}`,
      channel: "IN_APP",
      metadata: { ticketId, replyId: reply.id },
    }).catch((err) => logger.error("Failed to notify admin of client reply", err))

    return NextResponse.json({ id: reply.id }, { status: 201 })
  } catch (err) {
    logger.error("Failed to create ticket reply", err, { endpoint: "POST /api/support/tickets/[ticketId]/reply" })
    return NextResponse.json({ error: "Failed to create reply" }, { status: 500 })
  }
}
