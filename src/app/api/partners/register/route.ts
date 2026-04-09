import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getDubClient, getDubProgramId } from "@/lib/dub"

/**
 * POST /api/partners/register
 *
 * Registers the current user as a Dub.co partner. If the user already has a
 * Referral record we update it with the Dub partner ID; otherwise we create one.
 *
 * Requires authentication. Any logged-in user can register (they start at
 * AFFILIATE tier). Tier upgrades are handled by admin.
 */
export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const dbUser = await db.user.findUnique({ where: { clerkId } })
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if already registered with Dub.co
    const existing = await db.referral.findFirst({
      where: { referrerId: dbUser.id },
    })

    if (existing?.dubPartnerId) {
      return NextResponse.json({ ok: true, alreadyRegistered: true, dubPartnerId: existing.dubPartnerId })
    }

    const dub = getDubClient()
    const programId = getDubProgramId()

    let dubPartnerId: string | null = null

    // If Dub is configured, create the partner there
    if (dub && programId) {
      try {
        const partner = await dub.partners.create({
          name: dbUser.name ?? dbUser.email,
          email: dbUser.email,
          tenantId: dbUser.id,
        })
        dubPartnerId = partner.id
      } catch (dubErr) {
        logger.error("Failed to create Dub.co partner", dubErr, {
          endpoint: "POST /api/partners/register",
          userId: dbUser.id,
        })
        // Continue without Dub — still create local referral
      }
    }

    // Upsert the referral record
    const code = existing?.code ?? `AIMS-${dbUser.id.slice(-8).toUpperCase()}`

    if (existing) {
      const updated = await db.referral.update({
        where: { id: existing.id },
        data: {
          dubPartnerId,
          dubProgramId: programId,
        },
      })
      return NextResponse.json({ ok: true, referralId: updated.id, dubPartnerId, code: updated.code })
    }

    const referral = await db.referral.create({
      data: {
        referrerId: dbUser.id,
        code,
        tier: "AFFILIATE",
        dubPartnerId,
        dubProgramId: programId,
      },
    })

    return NextResponse.json({ ok: true, referralId: referral.id, dubPartnerId, code: referral.code })
  } catch (err) {
    logger.error("Partner registration failed", err, {
      endpoint: "POST /api/partners/register",
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
