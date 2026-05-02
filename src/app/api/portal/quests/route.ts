import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { logger } from "@/lib/logger"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"
import {
  getUserProgress,
  getFeatureUnlockMap,
  recordDailyLogin,
  seedDayZero,
} from "@/lib/quests"
import { markQuestEvent } from "@/lib/quests"

export const dynamic = "force-dynamic"

/**
 * GET /api/portal/quests
 *
 * Returns the full quest log + progress + feature unlock map for the
 * signed-in user. Also fires the daily-login streak + dashboard.visited
 * trigger as a side-effect (idempotent).
 */
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const dbUser = await getOrCreateDbUserByClerkId(clerkId)

    // Best-effort streak + day-0 seeding. Never blocks the response.
    void recordDailyLogin(dbUser.id)
    void seedDayZero(dbUser.id)
    void markQuestEvent(dbUser.id, "dashboard.visited")

    const [progress, featureFlags] = await Promise.all([
      getUserProgress(dbUser.id),
      getFeatureUnlockMap(dbUser.id),
    ])

    return NextResponse.json({ progress, featureFlags })
  } catch (err) {
    logger.error("Failed to load quests", err, {
      endpoint: "GET /api/portal/quests",
      userId: clerkId,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
