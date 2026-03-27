import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { z } from "zod"

const unsubscribeSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const parsed = unsubscribeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 })
    }

    const { email } = parsed.data

    const user = await db.user.findUnique({ where: { email } })
    if (user) {
      await db.user.update({
        where: { email },
        data: { notifMarketingDigest: false, emailNotifs: false },
      })
    }

    // Cancel any pending email queue items for this recipient
    await db.emailQueueItem.updateMany({
      where: { recipientEmail: email, status: "pending" },
      data: { status: "cancelled" },
    })

    logger.info(`Unsubscribe processed for ${email}`)

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("Unsubscribe error:", err)
    return NextResponse.json({ error: "Failed to process unsubscribe" }, { status: 500 })
  }
}
