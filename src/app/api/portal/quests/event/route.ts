import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"
import { markQuestEvent } from "@/lib/quests"
import { TRIGGER_EVENTS, type TriggerEvent } from "@/lib/quests/registry"

export const dynamic = "force-dynamic"

/**
 * POST /api/portal/quests/event
 *
 * Allow the client to fire trusted events that have no natural server-side
 * trigger — e.g. welcome video watched, page visited (for tour guide
 * sidequest), playbook bookmarked.
 *
 * The list of acceptable events is whitelisted to a SUBSET of TRIGGER_EVENTS
 * so the client can never grant itself "deal.first_closed_won".
 */
const ALLOWED_CLIENT_EVENTS = new Set<TriggerEvent>([
  "welcome_video.watched",
  "page.visited",
  "community.post_reacted",
  "community.win_posted",
  "community.question_answered",
  "playbook.bookmarked",
])

const eventSchema = z.object({
  event: z.enum(TRIGGER_EVENTS),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = eventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 })
  }

  if (!ALLOWED_CLIENT_EVENTS.has(parsed.data.event)) {
    return NextResponse.json(
      { error: "Event not allowed from client" },
      { status: 403 },
    )
  }

  try {
    const dbUser = await getOrCreateDbUserByClerkId(clerkId)
    const rows = await markQuestEvent(dbUser.id, parsed.data.event, {
      metadata: parsed.data.metadata,
    })
    return NextResponse.json({ ok: true, advanced: rows?.length ?? 0 })
  } catch (err) {
    logger.error("Quest event POST failed", err, {
      endpoint: "POST /api/portal/quests/event",
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
