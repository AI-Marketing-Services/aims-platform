import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { requireAdmin } from "@/lib/auth"
import { sendReplyNotificationToClient } from "@/lib/email/support"

const replySchema = z.object({
  message: z.string().min(1).max(10000),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const adminClerkId = await requireAdmin()
  if (!adminClerkId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { ticketId } = await params

  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
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

  const adminUser = await db.user.findUnique({ where: { clerkId: adminClerkId } })
  if (!adminUser) {
    return NextResponse.json({ error: "Admin user not found in database" }, { status: 404 })
  }

  try {
    const reply = await db.supportTicketReply.create({
      data: {
        ticketId,
        message: parsed.data.message,
        isAdmin: true,
        authorId: adminUser.id,
        authorName: adminUser.name ?? "AIMS Support",
      },
    })

    // Update ticket status to in_progress if it was open
    await db.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: ticket.status === "open" ? "in_progress" : ticket.status,
        updatedAt: new Date(),
      },
    })

    // Email the client about the reply
    sendReplyNotificationToClient({
      to: ticket.user.email,
      clientName: ticket.user.name ?? ticket.user.email.split("@")[0],
      subject: ticket.subject,
      replyMessage: parsed.data.message,
      authorName: adminUser.name ?? "AIMS Support",
      ticketId: ticket.id,
    }).catch((err) => logger.error("Failed to send reply notification email", err))

    return NextResponse.json({ id: reply.id }, { status: 201 })
  } catch (err) {
    logger.error("Failed to create admin reply", err, { endpoint: "POST /api/admin/tickets/[ticketId]/reply" })
    return NextResponse.json({ error: "Failed to create reply" }, { status: 500 })
  }
}
