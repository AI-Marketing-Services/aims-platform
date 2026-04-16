import { NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { sendOperatorVaultEmail } from "@/lib/email/operator-vault"

const CALENDLY_WEBHOOK_SECRET = process.env.CALENDLY_WEBHOOK_SECRET

/**
 * Verify the Calendly webhook signature.
 * Header format: `t=<timestamp>,v1=<signature>`
 * Signature = HMAC-SHA256( "<timestamp>.<rawBody>", signingKey )
 */
function verifySignature(rawBody: string, signatureHeader: string): boolean {
  if (!CALENDLY_WEBHOOK_SECRET) return false

  const parts = signatureHeader.split(",")
  const timestampPart = parts.find((p) => p.startsWith("t="))
  const sigPart = parts.find((p) => p.startsWith("v1="))

  if (!timestampPart || !sigPart) return false

  const timestamp = timestampPart.slice(2)
  const expectedSig = sigPart.slice(3)

  // Reject requests older than 5 minutes
  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (age > 300) return false

  const payload = `${timestamp}.${rawBody}`
  const computed = crypto
    .createHmac("sha256", CALENDLY_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex")

  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(expectedSig))
}

export async function POST(req: Request) {
  const rawBody = await req.text()

  if (!CALENDLY_WEBHOOK_SECRET) {
    logger.error("Calendly webhook: CALENDLY_WEBHOOK_SECRET not configured")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const sig = req.headers.get("calendly-webhook-signature") ?? ""
  if (!verifySignature(rawBody, sig)) {
    logger.error("Calendly webhook: invalid signature")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  try {
    const event = JSON.parse(rawBody)

    // Only handle invitee.created (new booking)
    if (event.event !== "invitee.created") {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const invitee = event.payload
    const email = invitee?.email?.toLowerCase()
    const name = invitee?.name ?? ""

    if (!email) {
      logger.error("Calendly webhook: no email in payload")
      return NextResponse.json({ error: "Missing email" }, { status: 400 })
    }

    // Find the matching application
    const submission = await db.leadMagnetSubmission
      .findFirst({
        where: {
          email,
          type: "COLLECTIVE_APPLICATION",
        },
        orderBy: { createdAt: "desc" },
      })
      .catch((err) => {
        logger.error("Calendly webhook: DB lookup failed", err)
        return null
      })

    // Update the deal with booking info
    if (submission?.dealId) {
      try {
        await db.deal.update({
          where: { id: submission.dealId },
          data: {
            stage: "DEMO_BOOKED",
            activities: {
              create: {
                type: "DEMO_COMPLETED",
                detail: `Calendly call booked by ${name} (${email}).`,
              },
            },
          },
        })
      } catch (err) {
        logger.error("Calendly webhook: deal update failed", err)
        return NextResponse.json({ error: "Deal update failed" }, { status: 500 })
      }
    }

    // Send the Playbook Vault email (triggered by booking, not form submit)
    try {
      await sendOperatorVaultEmail({ to: email, name })
    } catch (err) {
      logger.error("Calendly webhook: vault email failed", err)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Calendly webhook processing failed", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
