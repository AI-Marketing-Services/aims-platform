import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getEffectiveRole } from "@/lib/auth"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { grantCredits } from "@/lib/enrichment/credits/ledger"

/**
 * POST /api/admin/credits/grant-unlimited
 *
 * Self-serve "give me a giant credit balance" endpoint for SUPER_ADMINs.
 * Sets the caller's plan tier to "agency" and tops their balance up to
 * 1,000,000 credits via the ledger so the audit trail stays clean.
 *
 * Designed to be invoked from the browser console:
 *   await fetch("/api/admin/credits/grant-unlimited", { method: "POST" })
 *     .then(r => r.json())
 */
export const dynamic = "force-dynamic"

const TARGET_BALANCE = 1_000_000

export async function POST() {
  const effective = await getEffectiveRole()
  if (!effective) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (effective.realRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden — SUPER_ADMIN only" }, { status: 403 })
  }

  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "User row missing" }, { status: 404 })
  }

  try {
    const user = await db.user.findUnique({
      where: { id: dbUserId },
      select: { creditBalance: true, email: true },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const topUp = TARGET_BALANCE - user.creditBalance
    if (topUp <= 0) {
      return NextResponse.json({
        ok: true,
        already: true,
        balance: user.creditBalance,
        message: `Already at ${user.creditBalance.toLocaleString()} credits — no top-up needed.`,
      })
    }

    const result = await grantCredits({
      userId: dbUserId,
      amount: topUp,
      reason: "admin-adjustment",
      metadata: { reason: "super-admin self-grant", target: TARGET_BALANCE },
    })

    // Bump plan tier to "agency" so the monthly grant cron auto-refills
    // back up if balance ever dips. Belt and suspenders.
    await db.user.update({
      where: { id: dbUserId },
      data: { creditPlanTier: "agency" },
    })

    logger.info("Super admin self-granted unlimited credits", {
      userId: dbUserId,
      email: user.email,
      previousBalance: user.creditBalance,
      newBalance: result.balanceAfter,
    })

    return NextResponse.json({
      ok: true,
      previousBalance: user.creditBalance,
      newBalance: result.balanceAfter,
      planTier: "agency",
      message: `Granted ${topUp.toLocaleString()} credits. New balance: ${result.balanceAfter.toLocaleString()}.`,
    })
  } catch (err) {
    logger.error("grant-unlimited failed", err, { userId: dbUserId })
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    )
  }
}
