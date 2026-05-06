import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"

export const dynamic = "force-dynamic"

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(20_000).optional(),
  variables: z.array(z.string().max(80)).max(40).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
})

/** PATCH /api/portal/templates/[id] — update fields on a user's own template. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const existing = await db.userTemplate.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const updated = await db.userTemplate.update({
    where: { id },
    data: parsed.data,
  })
  return NextResponse.json({ template: updated })
}

/** DELETE /api/portal/templates/[id] — delete a user's own template. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const existing = await db.userTemplate.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  await db.userTemplate.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
