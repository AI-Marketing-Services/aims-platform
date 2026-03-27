import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const vendorSchema = z.object({
  vendorName: z.string().min(1).max(200),
  monthlyCost: z.number().min(0),
  category: z.string().min(1).max(100),
  replacementName: z.string().max(200).optional(),
  projectedSavings: z.number().min(0).default(0),
  notes: z.string().max(5000).optional(),
})

export async function POST(req: Request) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 })

  const parsed = vendorSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const vendor = await db.vendorTracker.create({
      data: {
        vendorName: parsed.data.vendorName,
        monthlyCost: parsed.data.monthlyCost,
        category: parsed.data.category,
        replacementName: parsed.data.replacementName ?? null,
        projectedSavings: parsed.data.projectedSavings,
        notes: parsed.data.notes ?? null,
      },
    })
    return NextResponse.json(vendor)
  } catch (err) {
    logger.error("Vendor create error:", err)
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 })
  }
}
