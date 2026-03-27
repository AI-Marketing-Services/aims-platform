import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { requireAdmin } from "@/lib/auth"
import { upsertCFOTest, logActivity } from "@/lib/ops-excellence/queries"
import { logger } from "@/lib/logger"

const cfoTestSchema = z.object({
  engagementId: z.string().min(1),
  responses: z.array(z.object({
    questionId: z.string(),
    score: z.enum(["GREEN", "YELLOW", "RED"]),
    notes: z.string().optional().default(""),
  })).min(1, "At least one response is required"),
  administeredBy: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const adminId = await requireAdmin()
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = cfoTestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { engagementId, responses, administeredBy, notes } = parsed.data

    const greenCount = responses.filter((r) => r.score === "GREEN").length
    const yellowCount = responses.filter((r) => r.score === "YELLOW").length
    const redCount = responses.filter((r) => r.score === "RED").length

    const result = await upsertCFOTest({
      engagementId,
      responses: responses as unknown as Prisma.InputJsonValue,
      greenCount,
      yellowCount,
      redCount,
      administeredBy: administeredBy ?? adminId,
      notes,
    })

    await logActivity({
      engagementId,
      type: "CFO_TEST_COMPLETED",
      title: "CFO test administered",
      detail: `Results: ${greenCount}G / ${yellowCount}Y / ${redCount}R`,
      metadata: { adminId, greenCount, yellowCount, redCount },
    })

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    logger.error("Failed to save CFO test results", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
