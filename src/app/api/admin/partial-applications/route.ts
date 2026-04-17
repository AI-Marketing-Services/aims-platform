import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { logger } from "@/lib/logger"

const updateSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["markContacted", "undoContacted", "dismiss", "undoDismiss"]),
  note: z.string().max(2000).optional(),
})

/**
 * PATCH /api/admin/partial-applications
 * Admin actions on the abandoned-applications follow-up list.
 *   - markContacted: admin called/texted the lead manually
 *   - dismiss: admin wants to stop seeing this in the queue
 */
export async function PATCH(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { id, action, note } = parsed.data

    const data: Record<string, unknown> = {}
    switch (action) {
      case "markContacted":
        data.contactedAt = new Date()
        data.contactedBy = userId
        if (note !== undefined) data.contactNote = note
        break
      case "undoContacted":
        data.contactedAt = null
        data.contactedBy = null
        break
      case "dismiss":
        data.dismissedAt = new Date()
        break
      case "undoDismiss":
        data.dismissedAt = null
        break
    }

    const updated = await db.partialApplication.update({
      where: { id },
      data,
      select: {
        id: true,
        contactedAt: true,
        contactedBy: true,
        contactNote: true,
        dismissedAt: true,
      },
    })

    return NextResponse.json({ ok: true, row: updated })
  } catch (err) {
    logger.error("[Admin] partial-applications PATCH failed", err)
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    )
  }
}
