import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

const schema = z.object({
  // Specific ids to delete
  ids: z.array(z.string()).optional(),
  // OR delete by type (e.g. "new_lead") — useful for purging the
  // stale orphan-Calendly flood (`titleContains: "Orphan Calendly"`).
  type: z.string().optional(),
  // Substring match on title — case-insensitive.
  titleContains: z.string().optional(),
  // Only act on read or unread rows — defaults to both.
  onlyRead: z.boolean().optional(),
  // Date cutoff — anything older than this gets nuked.
  olderThanDays: z.number().int().positive().optional(),
})

/**
 * DELETE /api/notifications/bulk-delete
 *
 * Admin-only. Removes notifications matching any combination of:
 *   - specific ids
 *   - type
 *   - title substring
 *   - read status
 *   - age in days
 *
 * Used by /admin/notifications to clear the stale orphan-Calendly flood
 * and any other accumulated noise.
 */
export async function POST(req: Request) {
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { ids, type, titleContains, onlyRead, olderThanDays } = parsed.data
  if (!ids?.length && !type && !titleContains && !olderThanDays) {
    return NextResponse.json(
      {
        error:
          "Refusing to delete with no filter. Provide at least one of: ids, type, titleContains, olderThanDays.",
      },
      { status: 400 },
    )
  }

  const where: Record<string, unknown> = {}
  if (ids?.length) where.id = { in: ids }
  if (type) where.type = type
  if (titleContains) where.title = { contains: titleContains, mode: "insensitive" }
  if (typeof onlyRead === "boolean") where.read = onlyRead
  if (olderThanDays) {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
    where.sentAt = { lt: cutoff }
  }

  try {
    const result = await db.notification.deleteMany({ where })
    logger.info("Notifications bulk-deleted", {
      deletedBy: userId,
      filter: { ids: ids?.length, type, titleContains, onlyRead, olderThanDays },
      deleted: result.count,
    })
    return NextResponse.json({ ok: true, deleted: result.count })
  } catch (err) {
    logger.error("Bulk delete notifications failed:", err)
    return NextResponse.json(
      { error: "Failed to delete notifications" },
      { status: 500 },
    )
  }
}
