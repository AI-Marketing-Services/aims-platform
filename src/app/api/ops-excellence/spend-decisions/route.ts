import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth"
import {
  getSpendDecisions,
  createSpendDecision,
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

    const decisions = await getSpendDecisions(engagementId)
    return NextResponse.json({ data: decisions })
  } catch (err) {
    logger.error("Failed to fetch spend decisions", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

const createSchema = z.object({
  engagementId: z.string().min(1),
  vendorName: z.string().min(1),
  toolName: z.string().optional(),
  currentAnnualCost: z.number().min(0),
  decision: z.enum(["ELIMINATE", "CONSOLIDATE", "RENEGOTIATE", "JUSTIFY"]),
  newAnnualCost: z.number().min(0).optional(),
  dollarDelta: z.number().optional(),
  decisionOwner: z.string().min(1),
  rationale: z.string().optional(),
  renewalDate: z.string().datetime().optional(),
  usageLevel: z.enum(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]).optional(),
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

    const { renewalDate, ...rest } = parsed.data

    const decision = await createSpendDecision({
      ...rest,
      renewalDate: renewalDate ? new Date(renewalDate) : undefined,
    })

    await logActivity({
      engagementId: parsed.data.engagementId,
      type: "SPEND_DECISION_CREATED",
      title: `Spend decision: ${parsed.data.decision} ${parsed.data.vendorName}`,
      detail: `Current cost: $${parsed.data.currentAnnualCost.toLocaleString()}/yr`,
      metadata: { adminId, decisionId: decision.id, decision: parsed.data.decision },
    })

    return NextResponse.json({ success: true, data: decision }, { status: 201 })
  } catch (err) {
    logger.error("Failed to create spend decision", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
