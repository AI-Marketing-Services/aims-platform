import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const claimSchema = z.object({
  code: z.string().min(1),
})

/**
 * POST /api/referrals/claim
 *
 * Links the current authenticated user as the `referredId` on a Referral record.
 * Called from the portal on first login when a referral cookie (aims_ref) is present.
 *
 * This is the critical step that enables commission tracking: without a referredId,
 * the Stripe invoice.paid webhook cannot find the referral to create commissions.
 */
export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = claimSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 400 })
    }

    const { code } = parsed.data

    // Look up the DB user from Clerk ID
    const dbUser = await db.user.findUnique({ where: { clerkId } })
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if this user is already linked to a referral
    const existingReferral = await db.referral.findUnique({
      where: { referredId: dbUser.id },
    })
    if (existingReferral) {
      return NextResponse.json({ ok: true, alreadyClaimed: true })
    }

    // Find the referral by code
    const referral = await db.referral.findUnique({
      where: { code },
      select: { id: true, referrerId: true, referredId: true },
    })

    if (!referral) {
      return NextResponse.json({ error: "Referral code not found" }, { status: 404 })
    }

    // Prevent self-referral
    if (referral.referrerId === dbUser.id) {
      return NextResponse.json({ error: "Cannot claim your own referral code" }, { status: 400 })
    }

    // If this referral code already has a referred user, skip
    // (each Referral record can only have one referred user due to @unique constraint)
    if (referral.referredId) {
      return NextResponse.json({ ok: true, alreadyClaimed: true })
    }

    // Link the user as the referred user and increment signup count
    await db.referral.update({
      where: { id: referral.id },
      data: {
        referredId: dbUser.id,
        signups: { increment: 1 },
      },
    })

    logger.info("Referral claimed successfully", {
      userId: dbUser.id,
      action: `referral:${referral.id}:code:${code}`,
    })

    return NextResponse.json({ ok: true, claimed: true })
  } catch (err) {
    logger.error("Referral claim failed", err, {
      endpoint: "POST /api/referrals/claim",
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
