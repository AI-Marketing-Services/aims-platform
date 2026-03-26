import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { sendReplyNotificationToClient } from "@/lib/email/support"

const replySchema = z.object({
  message: z.string().min(1).max(10000),
})

async function requireAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) return null
  return userId
}

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

  const body = await req.json()
  const parsed = replySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 })
  }

  const adminUser = await db.user.findUnique({ where: { clerkId: adminClerkId } })

  try {
    const reply = await db.supportTicketReply.create({
      data: {
        ticketId,
        message: parsed.data.message,
        isAdmin: true,
        authorId: adminUser?.id ?? adminClerkId,
        authorName: adminUser?.name ?? "AIMS Support",
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
      authorName: adminUser?.name ?? "AIMS Support",
      ticketId: ticket.id,
    }).catch((err) => logger.error("Failed to send reply notification email", err))

    return NextResponse.json({ id: reply.id }, { status: 201 })
  } catch (err) {
    logger.error("Failed to create admin reply", err, { endpoint: "POST /api/admin/tickets/[ticketId]/reply" })
    return NextResponse.json({ error: "Failed to create reply" }, { status: 500 })
  }
}
