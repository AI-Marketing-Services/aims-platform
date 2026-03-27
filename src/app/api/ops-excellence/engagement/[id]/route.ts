import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth"
import { getEngagementById, updateEngagement, logActivity } from "@/lib/ops-excellence/queries"
import { logger } from "@/lib/logger"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, context: RouteContext) {
  const adminId = await requireAdmin()
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { id } = await context.params
    const engagement = await getEngagementById(id)

    if (!engagement) {
      return NextResponse.json({ error: "Engagement not found" }, { status: 404 })
    }

    return NextResponse.json({ data: engagement })
  } catch (err) {
    logger.error("Failed to fetch engagement", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

const patchSchema = z.object({
  stage: z.enum([
    "INTAKE", "ONBOARDING", "PHASE_1_INSTRUMENT", "PHASE_2_EXECUTE",
    "PHASE_3_PROVE", "ACTIVE_ONGOING", "PAUSED", "COMPLETED",
  ]).optional(),
  tier: z.enum(["DIAGNOSE", "EXECUTE", "PROVE"]).optional(),
  integratorId: z.string().optional(),
  callNotes: z.string().optional(),
  callRecordingUrl: z.string().url().optional().or(z.literal("")),
  companyLogo: z.string().optional(),
  companyName: z.string().min(1).optional(),
  industry: z.string().optional(),
  annualRevenue: z.string().optional(),
  employeeCount: z.coerce.number().int().positive().optional(),
  website: z.string().optional(),
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

    const existing = await getEngagementById(id)
    if (!existing) {
      return NextResponse.json({ error: "Engagement not found" }, { status: 404 })
    }

    const updated = await updateEngagement(id, parsed.data)

    if (parsed.data.stage && parsed.data.stage !== existing.stage) {
      await logActivity({
        engagementId: id,
        type: "STAGE_CHANGED",
        title: `Stage changed to ${parsed.data.stage}`,
        detail: `Changed from ${existing.stage} by admin`,
        metadata: { adminId, previousStage: existing.stage, newStage: parsed.data.stage },
      })
    }

    if (parsed.data.tier && parsed.data.tier !== existing.tier) {
      await logActivity({
        engagementId: id,
        type: "TIER_CHANGED",
        title: `Tier changed to ${parsed.data.tier}`,
        detail: `Changed from ${existing.tier} by admin`,
        metadata: { adminId, previousTier: existing.tier, newTier: parsed.data.tier },
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    logger.error("Failed to update engagement", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
