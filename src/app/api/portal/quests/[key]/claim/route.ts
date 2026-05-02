import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { logger } from "@/lib/logger"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"
import { claimReward } from "@/lib/quests"

export const dynamic = "force-dynamic"

/**
 * POST /api/portal/quests/[key]/claim
 *
 * Redeems the reward (credits + badge + optional mystery box) for a
 * COMPLETED quest. Idempotent — calling twice returns alreadyClaimed:true.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { key } = await params
    const dbUser = await getOrCreateDbUserByClerkId(clerkId)

    const result = await claimReward(dbUser.id, key)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason ?? "Could not claim" },
        { status: 400 },
      )
    }
    return NextResponse.json(result)
  } catch (err) {
    logger.error("Failed to claim quest reward", err, {
      endpoint: "POST /api/portal/quests/[key]/claim",
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
