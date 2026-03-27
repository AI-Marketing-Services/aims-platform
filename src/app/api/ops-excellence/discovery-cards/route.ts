import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { requireAdmin } from "@/lib/auth"
import {
  getDiscoveryCards,
  createDiscoveryCard,
  logActivity,
} from "@/lib/ops-excellence/queries"
import { calculateProcessTier } from "@/lib/ops-excellence/scoring"
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

    const cards = await getDiscoveryCards(engagementId)
    return NextResponse.json({ data: cards })
  } catch (err) {
    logger.error("Failed to fetch discovery cards", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

const createSchema = z.object({
  engagementId: z.string().min(1),
  department: z.string().min(1),
  processName: z.string().min(1),
  ownerRole: z.string().min(1),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "AD_HOC"]),
  timePerInstance: z.number().positive(),
  toolsUsed: z.array(z.string()).default([]),
  painPoints: z.string().optional(),
  exceptionHandling: z.string().optional(),
  automationCandidate: z.enum(["YES", "NO", "MAYBE"]).optional(),
  complexityScore: z.number().int().min(1).max(5),
  valueScore: z.number().int().min(1).max(5),
  annualCost: z.number().min(0).optional(),
  isExpandedCapture: z.boolean().optional(),
  expandedContext: z.record(z.unknown()).optional(),
  discoveryRound: z.number().int().positive().optional(),
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

    const tier = calculateProcessTier(parsed.data.complexityScore, parsed.data.valueScore)

    const card = await createDiscoveryCard({
      ...parsed.data,
      tier,
      expandedContext: parsed.data.expandedContext as Prisma.InputJsonValue | undefined,
    })

    await logActivity({
      engagementId: parsed.data.engagementId,
      type: "DISCOVERY_CARD_CREATED",
      title: `Discovery card created: ${parsed.data.processName}`,
      detail: `Department: ${parsed.data.department} | Tier: ${tier}`,
      metadata: { adminId, cardId: card.id, tier },
    })

    return NextResponse.json({ success: true, data: card }, { status: 201 })
  } catch (err) {
    logger.error("Failed to create discovery card", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
