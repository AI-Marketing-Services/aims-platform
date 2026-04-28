import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { logger } from "@/lib/logger"

const STATUSES = ["NEW", "TRIAGED", "IN_PROGRESS", "RESOLVED", "WONT_FIX"] as const

const patchSchema = z.object({
  status: z.enum(STATUSES).optional(),
  adminNote: z.string().max(4000).optional(),
})

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const adminId = await requireAdmin()
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await ctx.params
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  let parsed
  try {
    parsed = patchSchema.safeParse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", issues: parsed.error.issues },
      { status: 400 },
    )
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  try {
    const updated = await db.portalFeedback.update({
      where: { id },
      data: parsed.data,
      select: { id: true, status: true, adminNote: true, updatedAt: true },
    })
    return NextResponse.json({ ok: true, feedback: updated })
  } catch (err) {
    logger.error("Failed to update portal feedback", err, {
      endpoint: "PATCH /api/admin/feedback/[id]",
      action: id,
    })
    return NextResponse.json(
      { error: "Could not update feedback" },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const adminId = await requireAdmin()
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await ctx.params
  try {
    await db.portalFeedback.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Failed to delete portal feedback", err, {
      endpoint: "DELETE /api/admin/feedback/[id]",
      action: id,
    })
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
