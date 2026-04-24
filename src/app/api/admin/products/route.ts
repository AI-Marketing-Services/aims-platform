import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const createSchema = z.object({
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, "slug must be lowercase with hyphens"),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional().nullable(),
  type: z.enum(["tier", "tool", "addon"]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  stripePriceMonthly: z.string().nullable().optional(),
  stripePriceAnnual: z.string().nullable().optional(),
  stripePriceOneTime: z.string().nullable().optional(),
  entitlements: z.array(z.string().min(1).max(60)).default([]),
  commissionBps: z.number().int().min(0).max(10000).default(0),
  grantsRole: z.string().nullable().optional(),
})

export async function POST(req: Request) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 })
  }

  try {
    const product = await db.product.create({ data: parsed.data })
    return NextResponse.json({ product }, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 })
    }
    logger.error("Product create failed", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
