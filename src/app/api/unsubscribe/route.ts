import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { z } from "zod"

const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET
// Hard fail at runtime in production if unset, but allow `next build`
// (NEXT_PHASE === "phase-production-build") to collect page data even
// when the var hasn't been wired into the local env yet.
if (
  !UNSUBSCRIBE_SECRET &&
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build"
) {
  throw new Error("UNSUBSCRIBE_SECRET is not configured. Refusing to start in production.")
}

/**
 * Resolve the HMAC secret. In production, UNSUBSCRIBE_SECRET is required
 * (enforced at module load above). In development we fall back to the
 * Clerk secret as a convenience so local builds don't blow up. The literal
 * fallback string was removed because anyone reading the source could
 * forge unsubscribe links if the env wasn't set.
 */
function getSecret(): string {
  const secret = UNSUBSCRIBE_SECRET ?? process.env.CLERK_SECRET_KEY
  if (!secret) {
    throw new Error("UNSUBSCRIBE_SECRET is not configured")
  }
  return secret
}

/** Generate an HMAC token for a given email to use in unsubscribe links */
export function generateUnsubscribeToken(email: string): string {
  return createHmac("sha256", getSecret()).update(email.toLowerCase()).digest("hex")
}

/** Build a full unsubscribe URL with signed token */
export function buildUnsubscribeUrl(email: string): string {
  const token = generateUnsubscribeToken(email)
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aioperatorcollective.com"
  return `${base}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`
}

function verifyToken(email: string, token: string): boolean {
  try {
    const expected = generateUnsubscribeToken(email)
    const tokenBuf = Buffer.from(token, "utf-8")
    const expectedBuf = Buffer.from(expected, "utf-8")
    if (tokenBuf.length !== expectedBuf.length) return false
    return timingSafeEqual(tokenBuf, expectedBuf)
  } catch {
    return false
  }
}

const unsubscribeSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const parsed = unsubscribeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Valid email and token required" }, { status: 400 })
    }

    const { email, token } = parsed.data

    if (!verifyToken(email, token)) {
      return NextResponse.json({ error: "Invalid or expired unsubscribe link" }, { status: 403 })
    }

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

    logger.info("Unsubscribe processed", { endpoint: "POST /api/unsubscribe" })

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("Unsubscribe error:", err)
    return NextResponse.json({ error: "Failed to process unsubscribe" }, { status: 500 })
  }
}
