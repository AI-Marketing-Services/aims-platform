import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth"
import {
  getAutomationCards,
  createAutomationCard,
  logActivity,
} from "@/lib/ops-excellence/queries"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  const adminId = await requireAdmin()
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const engagementId = searchParams.get("engagementId")

    if (!engagementId) {
      return NextResponse.json({ error: "engagementId query param required" }, { status: 400 })
    }

    const cards = await getAutomationCards(engagementId)
    return NextResponse.json({ data: cards })
  } catch (err) {
    logger.error("Failed to fetch automation cards", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

const createSchema = z.object({
  engagementId: z.string().min(1),
  processName: z.string().min(1),
  department: z.string().min(1),
  roleAffected: z.string().min(1),
  fullyLoadedHourlyCost: z.number().positive(),
  baselineTimePerInstance: z.number().positive(),
  baselineFrequency: z.string().min(1),
  baselineMonthlyHours: z.number().min(0),
  baselineMonthlyCost: z.number().min(0),
  deployedAt: z.string().datetime().optional(),
})

export async function POST(req: NextRequest) {
  const adminId = await requireAdmin()
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { deployedAt, ...rest } = parsed.data

    const card = await createAutomationCard({
      ...rest,
      deployedAt: deployedAt ? new Date(deployedAt) : undefined,
    })

    await logActivity({
      engagementId: parsed.data.engagementId,
      type: "AUTOMATION_CARD_CREATED",
      title: `Automation case card created: ${parsed.data.processName}`,
      detail: `Department: ${parsed.data.department} | Baseline: ${parsed.data.baselineMonthlyHours}h/mo`,
      metadata: { adminId, cardId: card.id },
    })

    return NextResponse.json({ success: true, data: card }, { status: 201 })
  } catch (err) {
    logger.error("Failed to create automation card", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
