import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { requireAdmin } from "@/lib/auth"
import { sendTicketStatusChangeEmail } from "@/lib/email/support"

const statusSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  resolutionNote: z.string().max(5000).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { ticketId } = await params

  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { name: true, email: true } },
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
  const parsed = statusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const updated = await db.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: parsed.data.status,
        resolvedAt: ["resolved", "closed"].includes(parsed.data.status) ? new Date() : undefined,
        resolutionNote: parsed.data.resolutionNote ?? undefined,
      },
    })

    // Notify client on resolution or closure
    if (parsed.data.status === "resolved" || parsed.data.status === "closed") {
      sendTicketStatusChangeEmail({
        to: ticket.user.email,
        clientName: ticket.user.name ?? ticket.user.email.split("@")[0],
        subject: ticket.subject,
        newStatus: parsed.data.status,
        resolutionNote: parsed.data.resolutionNote,
        ticketId: ticket.id,
      }).catch((err) => logger.error("Failed to send status change email", err))
    }

    return NextResponse.json(updated)
  } catch (err) {
    logger.error("Failed to update ticket status", err, { endpoint: "PATCH /api/admin/tickets/[ticketId]/status" })
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
}
