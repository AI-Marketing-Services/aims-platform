import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  type: z.enum(["tier", "tool", "addon"]).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  stripePriceMonthly: z.string().nullable().optional(),
  stripePriceAnnual: z.string().nullable().optional(),
  stripePriceOneTime: z.string().nullable().optional(),
  entitlements: z.array(z.string().min(1).max(60)).optional(),
  commissionBps: z.number().int().min(0).max(10000).optional(),
  grantsRole: z.string().nullable().optional(),
  // Slug is intentionally not patchable — it's an immutable identifier
  // that downstream systems and analytics may reference. Make a new
  // product instead of renaming the slug.
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 })
  }

  try {
    const product = await db.product.update({ where: { id }, data: parsed.data })
    return NextResponse.json({ product })
  } catch (err) {
    logger.error("Product update failed", err, { productId: id })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  // Refuse to delete a product that has purchase history. Deactivating
  // is the right move — keeps the historical purchases coherent.
  const purchaseCount = await db.purchase.count({ where: { productId: id } })
  if (purchaseCount > 0) {
    return NextResponse.json(
      { error: `Has ${purchaseCount} purchase(s). Deactivate instead of deleting.` },
      { status: 409 },
    )
  }

  try {
    await db.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Product delete failed", err, { productId: id })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
