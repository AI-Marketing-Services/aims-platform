import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { sendTrackedEmail } from "@/lib/email"
import { AIMS_FROM_EMAIL, AIMS_REPLY_TO } from "@/lib/email/senders"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

/**
 * POST /api/portal/client-updates/[id]/send
 *
 * Send a draft Client Update email to the linked deal's primary contact.
 * Marks the update "sent" + records sentAt.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const update = await db.clientUpdate.findFirst({
    where: { id, userId },
  })
  if (!update)
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (update.status === "sent")
    return NextResponse.json({ ok: true, alreadySent: true })

  if (!update.clientDealId) {
    return NextResponse.json({ error: "No deal attached" }, { status: 400 })
  }
  const deal = await db.clientDeal.findUnique({
    where: { id: update.clientDealId },
    select: {
      contactEmail: true,
      contacts: { take: 1, where: { isPrimary: true }, select: { email: true } },
    },
  })
  const recipient = deal?.contactEmail ?? deal?.contacts[0]?.email
  if (!recipient) {
    return NextResponse.json(
      { error: "No contact email on this deal" },
      { status: 400 },
    )
  }

  const operator = await db.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })
  const fromName = operator?.name ?? "AIMS"

  try {
    await sendTrackedEmail({
      from: `${fromName} <${AIMS_FROM_EMAIL}>`,
      to: recipient,
      replyTo: AIMS_REPLY_TO,
      subject: update.subject,
      text: update.body,
      serviceArm: "client-updates",
      clientId: update.clientDealId,
    })
    await db.clientUpdate.update({
      where: { id },
      data: { status: "sent", sentAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Failed to send client update", err, { id, userId })
    return NextResponse.json({ error: "Send failed" }, { status: 500 })
  }
}
