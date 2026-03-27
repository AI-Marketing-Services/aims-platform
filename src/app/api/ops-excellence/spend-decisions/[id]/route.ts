import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth"
import { updateSpendDecision, deleteSpendDecision, logActivity } from "@/lib/ops-excellence/queries"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

type RouteContext = { params: Promise<{ id: string }> }

const patchSchema = z.object({
  vendorName: z.string().min(1).optional(),
  toolName: z.string().optional(),
  currentAnnualCost: z.number().min(0).optional(),
  decision: z.enum(["ELIMINATE", "CONSOLIDATE", "RENEGOTIATE", "JUSTIFY"]).optional(),
  newAnnualCost: z.number().min(0).optional(),
  dollarDelta: z.number().optional(),
  decisionOwner: z.string().min(1).optional(),
  rationale: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETE"]).optional(),
  renewalDate: z.string().datetime().optional(),
  usageLevel: z.enum(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]).optional(),
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

    const existing = await db.spendDecision.findUnique({
      where: { id },
      select: { engagementId: true, status: true, vendorName: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Spend decision not found" }, { status: 404 })
    }

    const { renewalDate, ...rest } = parsed.data
    const updateData: Record<string, unknown> = { ...rest }
    if (renewalDate) {
      updateData.renewalDate = new Date(renewalDate)
    }

    const updated = await updateSpendDecision(id, updateData)

    if (parsed.data.status && parsed.data.status !== existing.status) {
      await logActivity({
        engagementId: existing.engagementId,
        type: "SPEND_DECISION_STATUS_CHANGED",
        title: `Spend decision status: ${existing.vendorName} -> ${parsed.data.status}`,
        detail: `Changed from ${existing.status}`,
        metadata: { adminId, decisionId: id, previousStatus: existing.status, newStatus: parsed.data.status },
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    logger.error("Failed to update spend decision", err)
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
    await deleteSpendDecision(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("Failed to delete spend decision", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
