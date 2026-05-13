import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * GET /api/portal/credits/balance
 *
 * Lightweight current-balance endpoint for the sidebar CreditBadge.
 * Returns only the two fields the badge renders so the response stays
 * tiny even at 30-second polling. Used so that credit-earn events
 * (quest claim, monthly grant, refund, etc.) surface in the sidebar
 * without needing a full layout RSC refetch.
 */
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const user = await db.user.findUnique({
    where: { clerkId },
    select: { creditBalance: true, creditPlanTier: true },
  })
  if (!user) {
    // Returning 200 + zero balance avoids breaking the sidebar UI when
    // the Clerk webhook race hasn't yet landed the User row. The badge
    // will rehydrate on the next 30s poll.
    return NextResponse.json({ creditBalance: 0, creditPlanTier: "free" })
  }
  return NextResponse.json({
    creditBalance: user.creditBalance,
    creditPlanTier: user.creditPlanTier,
  })
}
