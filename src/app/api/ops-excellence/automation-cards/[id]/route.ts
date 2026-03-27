import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth"
import { updateAutomationCard, deleteAutomationCard, logActivity } from "@/lib/ops-excellence/queries"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

type RouteContext = { params: Promise<{ id: string }> }

const patchSchema = z.object({
  processName: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  roleAffected: z.string().min(1).optional(),
  fullyLoadedHourlyCost: z.number().positive().optional(),
  baselineTimePerInstance: z.number().positive().optional(),
  baselineFrequency: z.string().min(1).optional(),
  baselineMonthlyHours: z.number().min(0).optional(),
  baselineMonthlyCost: z.number().min(0).optional(),
  deployedAt: z.string().datetime().optional().nullable(),
  hoursFreedPerMonth: z.number().min(0).optional(),
  dollarValueFreed: z.number().min(0).optional(),
  automationHealthScore: z.number().int().min(0).max(100).optional(),
  postDeploymentTimePerInstance: z.number().min(0).optional(),
  postDeploymentFrequency: z.string().optional(),
  postDeploymentMonthlyHours: z.number().min(0).optional(),
  postDeploymentMonthlyCost: z.number().min(0).optional(),
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

    const existing = await db.automationCaseCard.findUnique({
      where: { id },
      select: { engagementId: true, processName: true, deployedAt: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Automation card not found" }, { status: 404 })
    }

    const { deployedAt, ...rest } = parsed.data
    const updateData: Record<string, unknown> = { ...rest }

    if (deployedAt !== undefined) {
      updateData.deployedAt = deployedAt ? new Date(deployedAt) : null
    }

    const updated = await updateAutomationCard(id, updateData)

    const isNewDeployment = deployedAt && !existing.deployedAt
    const hasMetricsUpdate = parsed.data.hoursFreedPerMonth !== undefined
      || parsed.data.dollarValueFreed !== undefined
      || parsed.data.automationHealthScore !== undefined

    if (isNewDeployment) {
      await logActivity({
        engagementId: existing.engagementId,
        type: "AUTOMATION_DEPLOYED",
        title: `Automation deployed: ${existing.processName}`,
        metadata: { adminId, cardId: id },
      })
    } else if (hasMetricsUpdate) {
      await logActivity({
        engagementId: existing.engagementId,
        type: "AUTOMATION_METRICS_UPDATED",
        title: `Automation metrics updated: ${existing.processName}`,
        detail: [
          parsed.data.hoursFreedPerMonth !== undefined ? `Hours freed: ${parsed.data.hoursFreedPerMonth}/mo` : null,
          parsed.data.dollarValueFreed !== undefined ? `Value: $${parsed.data.dollarValueFreed}/mo` : null,
          parsed.data.automationHealthScore !== undefined ? `Health: ${parsed.data.automationHealthScore}%` : null,
        ].filter(Boolean).join(" | "),
        metadata: { adminId, cardId: id },
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    logger.error("Failed to update automation card", err)
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
    await deleteAutomationCard(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("Failed to delete automation card", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
