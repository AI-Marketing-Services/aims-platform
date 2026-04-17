import { NextRequest, NextResponse } from "next/server"
import {
  getNetwork,
  listSpaces,
  listCollections,
  listMembers,
  listPlans,
  listTags,
  listBadges,
  listPosts,
} from "@/lib/mighty"
import { requireAdmin } from "@/lib/auth"
import { logger } from "@/lib/logger"

/**
 * GET /api/admin/mighty
 * Returns full snapshot of the AI Operator Collective community.
 * Admin-only endpoint.
 */
export async function GET(_req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const [network, spaces, collections, members, plans, tags, badges, posts] =
      await Promise.all([
        getNetwork(),
        listSpaces(),
        listCollections(),
        listMembers(),
        listPlans(),
        listTags(),
        listBadges(),
        listPosts(),
      ])

    return NextResponse.json({
      success: true,
      data: {
        network,
        spaces,
        collections,
        members,
        plans,
        tags,
        badges,
        posts,
      },
    })
  } catch (err) {
    logger.error("[Mighty] Admin overview failed", err)
    return NextResponse.json(
      { error: "Failed to fetch community data" },
      { status: 500 }
    )
  }
}
