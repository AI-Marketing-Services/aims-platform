import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth"
import {
  getEngagementById,
  getLatestScore,
  createScore,
  logActivity,
} from "@/lib/ops-excellence/queries"
import { calculateCreditScore } from "@/lib/ops-excellence/scoring"
import type { ScoringInput } from "@/lib/ops-excellence/types"
import { logger } from "@/lib/logger"

const calculateSchema = z.object({
  engagementId: z.string().min(1),
  financialData: z.object({
    revenue: z.number().nullable(),
    controllableSGA: z.number().nullable(),
    toolCount: z.number().int().nullable(),
    fteCount: z.number().int().nullable(),
    unitEconomicsCalculable: z.number().min(0).max(4),
  }),
  measurementConfidence: z.object({
    systemIntegrationCoverage: z.number().min(0).max(100),
    dataFreshness: z.number().min(0).max(100),
    singleSourceOfTruth: z.number().min(0).max(100),
    dashboardAdoption: z.number().min(0).max(100),
  }),
  notes: z.string().optional(),
})

type EngagementWithRelations = NonNullable<Awaited<ReturnType<typeof getEngagementById>>>

function buildScoringInput(
  engagement: EngagementWithRelations,
  financialData: ScoringInput["financialData"],
  measurementConfidence: ScoringInput["measurementConfidence"]
): ScoringInput {
  const { discoveryCards, automationCards, spendDecisions, capacityPulses, cfoTest } = engagement

  const deployed = automationCards.filter(
    (c: (typeof automationCards)[number]) => c.deployedAt !== null
  )
  const withMeasurements = deployed.filter(
    (c: (typeof automationCards)[number]) =>
      c.hoursFreedPerMonth !== null && c.hoursFreedPerMonth > 0
  )
  const avgHealth = deployed.length > 0
    ? deployed.reduce(
        (sum: number, c: (typeof automationCards)[number]) =>
          sum + (c.automationHealthScore ?? 0),
        0
      ) / deployed.length
    : 0

  const departments = new Set(
    discoveryCards.map((c: (typeof discoveryCards)[number]) => c.department)
  )
  const classified = discoveryCards.filter(
    (c: (typeof discoveryCards)[number]) =>
      c.automationCandidate !== null && c.automationCandidate !== "MAYBE"
  )
  const automationCandidates = discoveryCards.filter(
    (c: (typeof discoveryCards)[number]) => c.automationCandidate === "YES"
  )
  const validated = discoveryCards.filter(
    (c: (typeof discoveryCards)[number]) => c.validated
  )

  const savingsIdentified = spendDecisions.reduce(
    (sum: number, d: (typeof spendDecisions)[number]) =>
      sum + ((d.dollarDelta ?? 0) > 0 ? (d.dollarDelta ?? 0) : 0),
    0
  )

  const higherValueCount = capacityPulses.filter(
    (p: (typeof capacityPulses)[number]) => p.capacityConversion === "HIGHER_VALUE_WORK"
  ).length
  const absorbedCount = capacityPulses.filter(
    (p: (typeof capacityPulses)[number]) => p.capacityConversion === "ABSORBED_NO_CHANGE"
  ).length
  const notVisibleCount = capacityPulses.filter(
    (p: (typeof capacityPulses)[number]) => p.capacityConversion === "NOT_VISIBLE_YET"
  ).length

  return {
    cfoTest: cfoTest
      ? {
          greenCount: cfoTest.greenCount,
          yellowCount: cfoTest.yellowCount,
          redCount: cfoTest.redCount,
        }
      : null,
    discoveryCards: {
      total: discoveryCards.length,
      classified: classified.length,
      automationCandidates: automationCandidates.length,
      validated: validated.length,
      departmentsCovered: departments.size,
    },
    automationCards: {
      deployed: deployed.length,
      withMeasurements: withMeasurements.length,
      totalHoursFreed: deployed.reduce(
        (sum: number, c: (typeof automationCards)[number]) =>
          sum + (c.hoursFreedPerMonth ?? 0),
        0
      ),
      totalDollarValue: deployed.reduce(
        (sum: number, c: (typeof automationCards)[number]) =>
          sum + (c.dollarValueFreed ?? 0),
        0
      ),
      averageHealthScore: avgHealth,
    },
    spendDecisions: {
      total: spendDecisions.length,
      savingsIdentified,
      savingsRealized: spendDecisions
        .filter((d: (typeof spendDecisions)[number]) => d.status === "COMPLETE")
        .reduce(
          (sum: number, d: (typeof spendDecisions)[number]) =>
            sum + ((d.dollarDelta ?? 0) > 0 ? (d.dollarDelta ?? 0) : 0),
          0
        ),
    },
    pulseSurveys: {
      total: capacityPulses.length,
      higherValueCount,
      absorbedCount,
      notVisibleCount,
    },
    financialData,
    measurementConfidence,
  }
}

export async function POST(req: NextRequest) {
  const adminId = await requireAdmin()
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = calculateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { engagementId, financialData, measurementConfidence, notes } = parsed.data

    const engagement = await getEngagementById(engagementId)
    if (!engagement) {
      return NextResponse.json({ error: "Engagement not found" }, { status: 404 })
    }

    const scoringInput = buildScoringInput(engagement, financialData, measurementConfidence)
    const result = calculateCreditScore(scoringInput)

    const latestScore = await getLatestScore(engagementId)
    const nextVersion = latestScore ? latestScore.version + 1 : 1

    const score = await createScore({
      engagementId,
      version: nextVersion,
      compositeScore: result.compositeScore,
      confidenceTier: result.confidenceTier,
      confidencePercent: result.confidencePercent,
      financialClarity: result.financialClarity,
      aiReadiness: result.aiReadiness,
      capacityRoi: result.capacityRoi,
      spendEfficiency: result.spendEfficiency,
      financialDetail: result.financialDetail,
      aiReadinessDetail: result.aiReadinessDetail,
      capacityRoiDetail: result.capacityRoiDetail,
      spendDetail: result.spendDetail,
      operationalLeverage: result.operationalLeverage ?? undefined,
      totalHoursFreed: scoringInput.automationCards.totalHoursFreed,
      totalDollarsSaved: scoringInput.spendDecisions.savingsRealized,
      automationsDeployed: scoringInput.automationCards.deployed,
      calculatedBy: adminId,
      notes,
    })

    await logActivity({
      engagementId,
      type: "SCORE_CALCULATED",
      title: `Credit score V${nextVersion} calculated`,
      detail: `Composite: ${result.compositeScore} | Confidence: ${result.confidenceTier} (${result.confidencePercent}%)`,
      metadata: {
        adminId,
        version: nextVersion,
        compositeScore: result.compositeScore,
        confidenceTier: result.confidenceTier,
      },
    })

    return NextResponse.json({ success: true, data: score })
  } catch (err) {
    logger.error("Failed to calculate credit score", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
