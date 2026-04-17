import { NextRequest, NextResponse } from "next/server"
import { createPost, MIGHTY_IDS } from "@/lib/mighty"
import {
  publishArticle,
  createRecurringEvent,
  createEngagementPoll,
} from "@/lib/mighty/content-pipeline"
import { requireAdmin } from "@/lib/auth"
import { logger } from "@/lib/logger"

/**
 * POST /api/admin/mighty/publish
 * Publish content to the AI Operator Collective community.
 *
 * Body:
 *   - type: "article" | "post" | "event" | "poll"
 *   - ...type-specific fields
 */
export async function POST(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { type, ...payload } = body

    switch (type) {
      case "article": {
        const post = await publishArticle({
          title: payload.title,
          body: payload.body ?? payload.description,
          spaceId: payload.space_id,
          notify: payload.notify,
        })
        return NextResponse.json({ success: !!post, data: post })
      }

      case "post": {
        const post = await createPost(
          {
            space_id: payload.space_id ?? MIGHTY_IDS.spaces.activityFeed,
            title: payload.title,
            description: payload.description,
          },
          payload.notify ?? false
        )
        return NextResponse.json({ success: !!post, data: post })
      }

      case "event": {
        const event = await createRecurringEvent({
          title: payload.title,
          description: payload.description,
          dayOfWeek: payload.day_of_week ?? "TU",
          startTime: payload.start_time ?? "14:00",
          durationMinutes: payload.duration_minutes ?? 60,
          timeZone: payload.time_zone,
          link: payload.link,
          spaceId: payload.space_id,
          frequency: payload.frequency,
        })
        return NextResponse.json({ success: !!event, data: event })
      }

      case "poll": {
        const poll = await createEngagementPoll(
          payload.title,
          payload.choices,
          payload.space_id
        )
        return NextResponse.json({ success: !!poll, data: poll })
      }

      default:
        return NextResponse.json(
          { error: `Unknown content type: ${type}` },
          { status: 400 }
        )
    }
  } catch (err) {
    logger.error("[Mighty] Content publish failed", err)
    return NextResponse.json(
      { error: "Failed to publish content" },
      { status: 500 }
    )
  }
}
