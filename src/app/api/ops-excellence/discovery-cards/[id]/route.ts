import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth"
import { updateDiscoveryCard, deleteDiscoveryCard } from "@/lib/ops-excellence/queries"
import { calculateProcessTier } from "@/lib/ops-excellence/scoring"
import { logger } from "@/lib/logger"

type RouteContext = { params: Promise<{ id: string }> }

const patchSchema = z.object({
  department: z.string().min(1).optional(),
  processName: z.string().min(1).optional(),
  ownerRole: z.string().min(1).optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "AD_HOC"]).optional(),
  timePerInstance: z.number().positive().optional(),
  toolsUsed: z.array(z.string()).optional(),
  painPoints: z.string().optional(),
  exceptionHandling: z.string().optional(),
  automationCandidate: z.enum(["YES", "NO", "MAYBE"]).optional(),
  complexityScore: z.number().int().min(1).max(5).optional(),
  valueScore: z.number().int().min(1).max(5).optional(),
  annualCost: z.number().min(0).optional(),
  validated: z.boolean().optional(),
  isExpandedCapture: z.boolean().optional(),
  expandedContext: z.record(z.unknown()).optional(),
  discoveryRound: z.number().int().positive().optional(),
})

export async function PATCH(req: NextRequest, context: RouteContext) {
  const adminId = await requireAdmin()
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { id } = await context.params
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = { ...parsed.data }

    if (parsed.data.complexityScore !== undefined && parsed.data.valueScore !== undefined) {
      updateData.tier = calculateProcessTier(parsed.data.complexityScore, parsed.data.valueScore)
    }

    const updated = await updateDiscoveryCard(id, updateData)
    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    logger.error("Failed to update discovery card", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const adminId = await requireAdmin()
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { id } = await context.params
    await deleteDiscoveryCard(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("Failed to delete discovery card", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
