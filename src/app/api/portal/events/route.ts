import { NextResponse } from "next/server"
import { z } from "zod"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { emitEvent, EVENT_TYPES, type EventType } from "@/lib/events/emit"

export const dynamic = "force-dynamic"

/**
 * POST /api/portal/events
 *
 * Generic client-emit-event endpoint. Used by client components that
 * need to log a meaningful action (playbook viewed/used, audit shared,
 * etc.) without each one needing its own API route.
 *
 * Trust model: the client only ever logs events as itself (actorId is
 * always the authenticated user's DB id). Event types are gated to a
 * known allowlist to prevent spam / pollution of the event stream.
 */

// Only the events we expect clients to emit directly. Server-side
// operations (DEAL_CREATED, CREDITS_DEBITED, etc.) shouldn't come
// through this route — they emit from inside the server logic.
const CLIENT_ALLOWED_EVENTS: ReadonlySet<EventType> = new Set([
  EVENT_TYPES.PLAYBOOK_VIEWED,
  EVENT_TYPES.PLAYBOOK_USED,
  EVENT_TYPES.PLAYBOOK_SHARED,
  EVENT_TYPES.AUDIT_LINK_SHARED,
])

const bodySchema = z.object({
  type: z.string().refine((t) => CLIENT_ALLOWED_EVENTS.has(t as EventType), {
    message: "Event type not allowed from client",
  }),
  entityType: z.string().max(40).optional(),
  entityId: z.string().max(80).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export async function POST(req: Request) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid event", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  await emitEvent({
    actorId: dbUserId,
    type: parsed.data.type as EventType,
    entityType: parsed.data.entityType,
    entityId: parsed.data.entityId,
    metadata: parsed.data.metadata,
  })

  return NextResponse.json({ ok: true })
}
