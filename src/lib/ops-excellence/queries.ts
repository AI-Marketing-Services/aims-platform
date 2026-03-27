// ============================================================
// Ops Excellence Database Queries
// All Prisma operations for the OE feature.
// ============================================================

import { db } from "@/lib/db"
import type { EngagementStage, Prisma } from "@prisma/client"
import type {
  DashboardData,
  EngagementListItem,
  CapacityMetrics,
  SpendMetrics,
  DiscoveryMetrics,
} from "./types"

// ── Engagements ─────────────────────────────────────────────

export async function createEngagement(data: {
  userId: string
  companyName: string
  companyLogo?: string
  industry?: string
  annualRevenue?: string
  employeeCount?: number
  website?: string
  intakeData?: Prisma.InputJsonValue
}) {
  return db.opsExcellenceEngagement.create({
    data: {
      ...data,
      stage: "INTAKE",
      tier: "DIAGNOSE",
    },
  })
}

export async function getEngagementById(id: string) {
  return db.opsExcellenceEngagement.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, company: true, avatarUrl: true } },
      scores: { orderBy: { version: "desc" } },
      cfoTest: true,
      discoveryCards: { orderBy: { createdAt: "desc" } },
      spendDecisions: { orderBy: { createdAt: "desc" } },
      automationCards: { orderBy: { createdAt: "desc" } },
      capacityPulses: { orderBy: { submittedAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  })
}

export async function getEngagementByUserId(userId: string) {
  return db.opsExcellenceEngagement.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      scores: { orderBy: { version: "desc" }, take: 2 },
      cfoTest: true,
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  })
}

export async function getEngagementList(filters?: {
  stage?: EngagementStage
  integratorId?: string
  search?: string
}): Promise<EngagementListItem[]> {
  const where: Prisma.OpsExcellenceEngagementWhereInput = {}

  if (filters?.stage) where.stage = filters.stage
  if (filters?.integratorId) where.integratorId = filters.integratorId
  if (filters?.search) {
    where.OR = [
      { companyName: { contains: filters.search, mode: "insensitive" } },
      { user: { email: { contains: filters.search, mode: "insensitive" } } },
    ]
  }

  const engagements = await db.opsExcellenceEngagement.findMany({
    where,
    include: {
      user: { select: { id: true, email: true, name: true } },
      scores: { orderBy: { version: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  })

  return engagements.map((e) => ({
    id: e.id,
    companyName: e.companyName,
    companyLogo: e.companyLogo,
    stage: e.stage,
    tier: e.tier,
    latestScore: e.scores[0]?.compositeScore ?? null,
    confidenceTier: e.scores[0]?.confidenceTier ?? null,
    integratorId: e.integratorId,
    daysSinceStart: Math.floor((Date.now() - e.startDate.getTime()) / (1000 * 60 * 60 * 24)),
    userId: e.user.id,
    userEmail: e.user.email,
    userName: e.user.name,
    createdAt: e.createdAt.toISOString(),
  }))
}

export async function updateEngagement(
  id: string,
  data: Prisma.OpsExcellenceEngagementUpdateInput
) {
  return db.opsExcellenceEngagement.update({ where: { id }, data })
}

// ── Credit Scores ───────────────────────────────────────────

export async function createScore(data: {
  engagementId: string
  version: number
  compositeScore: number
  confidenceTier: "RED" | "YELLOW" | "GREEN"
  confidencePercent: number
  financialClarity: number
  aiReadiness: number
  capacityRoi: number
  spendEfficiency: number
  financialDetail?: Prisma.InputJsonValue
  aiReadinessDetail?: Prisma.InputJsonValue
  capacityRoiDetail?: Prisma.InputJsonValue
  spendDetail?: Prisma.InputJsonValue
  operationalLeverage?: number
  totalHoursFreed?: number
  totalDollarsSaved?: number
  automationsDeployed?: number
  calculatedBy?: string
  notes?: string
}) {
  return db.creditScore.create({ data })
}

export async function getScoreHistory(engagementId: string) {
  return db.creditScore.findMany({
    where: { engagementId },
    orderBy: { version: "asc" },
  })
}

export async function getLatestScore(engagementId: string) {
  return db.creditScore.findFirst({
    where: { engagementId },
    orderBy: { version: "desc" },
  })
}

// ── CFO Test ────────────────────────────────────────────────

export async function upsertCFOTest(data: {
  engagementId: string
  responses: Prisma.InputJsonValue
  greenCount: number
  yellowCount: number
  redCount: number
  administeredBy?: string
  notes?: string
}) {
  return db.cFOTestResult.upsert({
    where: { engagementId: data.engagementId },
    create: data,
    update: {
      responses: data.responses,
      greenCount: data.greenCount,
      yellowCount: data.yellowCount,
      redCount: data.redCount,
      administeredBy: data.administeredBy,
      notes: data.notes,
      administeredAt: new Date(),
    },
  })
}

// ── Discovery Cards ─────────────────────────────────────────

export async function createDiscoveryCard(data: {
  engagementId: string
  department: string
  processName: string
  ownerRole: string
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "AD_HOC"
  timePerInstance: number
  toolsUsed: string[]
  painPoints?: string
  exceptionHandling?: string
  automationCandidate?: "YES" | "NO" | "MAYBE"
  complexityScore: number
  valueScore: number
  tier: number
  annualCost?: number
  isExpandedCapture?: boolean
  expandedContext?: Prisma.InputJsonValue
  discoveryRound?: number
}) {
  return db.processDiscoveryCard.create({ data })
}

export async function updateDiscoveryCard(
  id: string,
  data: Prisma.ProcessDiscoveryCardUpdateInput
) {
  return db.processDiscoveryCard.update({ where: { id }, data })
}

export async function getDiscoveryCards(engagementId: string) {
  return db.processDiscoveryCard.findMany({
    where: { engagementId },
    orderBy: [{ tier: "asc" }, { valueScore: "desc" }],
  })
}

export async function deleteDiscoveryCard(id: string) {
  return db.processDiscoveryCard.delete({ where: { id } })
}

// ── Spend Decisions ─────────────────────────────────────────

export async function createSpendDecision(data: {
  engagementId: string
  vendorName: string
  toolName?: string
  currentAnnualCost: number
  decision: "ELIMINATE" | "CONSOLIDATE" | "RENEGOTIATE" | "JUSTIFY"
  newAnnualCost?: number
  dollarDelta?: number
  decisionOwner: string
  rationale?: string
  renewalDate?: Date
  usageLevel?: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN"
}) {
  return db.spendDecision.create({ data })
}

export async function updateSpendDecision(
  id: string,
  data: Prisma.SpendDecisionUpdateInput
) {
  return db.spendDecision.update({ where: { id }, data })
}

export async function getSpendDecisions(engagementId: string) {
  return db.spendDecision.findMany({
    where: { engagementId },
    orderBy: { currentAnnualCost: "desc" },
  })
}

export async function deleteSpendDecision(id: string) {
  return db.spendDecision.delete({ where: { id } })
}

// ── Automation Case Cards ───────────────────────────────────

export async function createAutomationCard(data: {
  engagementId: string
  processName: string
  department: string
  roleAffected: string
  fullyLoadedHourlyCost: number
  baselineTimePerInstance: number
  baselineFrequency: string
  baselineMonthlyHours: number
  baselineMonthlyCost: number
  deployedAt?: Date
}) {
  return db.automationCaseCard.create({ data })
}

export async function updateAutomationCard(
  id: string,
  data: Prisma.AutomationCaseCardUpdateInput
) {
  return db.automationCaseCard.update({ where: { id }, data })
}

export async function getAutomationCards(engagementId: string) {
  return db.automationCaseCard.findMany({
    where: { engagementId },
    orderBy: { createdAt: "desc" },
  })
}

export async function deleteAutomationCard(id: string) {
  return db.automationCaseCard.delete({ where: { id } })
}

// ── Pulse Surveys ───────────────────────────────────────────

export async function createPulseSurvey(data: {
  engagementId: string
  automationCardId?: string
  respondentRole: string
  timeSavedPerWeek?: number
  capacityConversion: "HIGHER_VALUE_WORK" | "ABSORBED_NO_CHANGE" | "NOT_VISIBLE_YET"
  feedback?: string
}) {
  return db.capacityPulseSurvey.create({ data })
}

export async function getPulseSurveys(engagementId: string) {
  return db.capacityPulseSurvey.findMany({
    where: { engagementId },
    orderBy: { submittedAt: "desc" },
  })
}

// ── Activity Log ────────────────────────────────────────────

export async function logActivity(data: {
  engagementId: string
  type: string
  title: string
  detail?: string
  metadata?: Prisma.InputJsonValue
}) {
  return db.engagementActivity.create({ data })
}

export async function getActivities(engagementId: string, limit = 50) {
  return db.engagementActivity.findMany({
    where: { engagementId },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
}

// ── Dashboard Aggregation ───────────────────────────────────

export async function getDashboardData(engagementId: string): Promise<DashboardData | null> {
  const engagement = await db.opsExcellenceEngagement.findUnique({
    where: { id: engagementId },
    include: {
      scores: { orderBy: { version: "desc" }, take: 2 },
      cfoTest: true,
      automationCards: true,
      spendDecisions: true,
      discoveryCards: true,
      capacityPulses: true,
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  })

  if (!engagement) return null

  const latestScore = engagement.scores[0] ?? null
  const previousScore = engagement.scores[1] ?? null

  const capacityMetrics = buildCapacityMetrics(
    engagement.automationCards,
    engagement.capacityPulses
  )
  const spendMetrics = buildSpendMetrics(engagement.spendDecisions)
  const discoveryMetrics = buildDiscoveryMetrics(engagement.discoveryCards)

  return {
    engagement: {
      id: engagement.id,
      companyName: engagement.companyName,
      companyLogo: engagement.companyLogo,
      industry: engagement.industry,
      stage: engagement.stage,
      tier: engagement.tier,
      startDate: engagement.startDate.toISOString(),
      daysSinceStart: Math.floor(
        (Date.now() - engagement.startDate.getTime()) / (1000 * 60 * 60 * 24)
      ),
    },
    latestScore: latestScore ? {
      version: latestScore.version,
      compositeScore: latestScore.compositeScore,
      confidenceTier: latestScore.confidenceTier,
      confidencePercent: latestScore.confidencePercent,
      financialClarity: latestScore.financialClarity,
      aiReadiness: latestScore.aiReadiness,
      capacityRoi: latestScore.capacityRoi,
      spendEfficiency: latestScore.spendEfficiency,
      operationalLeverage: latestScore.operationalLeverage,
      totalHoursFreed: latestScore.totalHoursFreed,
      totalDollarsSaved: latestScore.totalDollarsSaved,
      automationsDeployed: latestScore.automationsDeployed,
      calculatedAt: latestScore.calculatedAt.toISOString(),
    } : null,
    previousScore: previousScore ? {
      version: previousScore.version,
      compositeScore: previousScore.compositeScore,
      confidenceTier: previousScore.confidenceTier,
      confidencePercent: previousScore.confidencePercent,
      financialClarity: previousScore.financialClarity,
      aiReadiness: previousScore.aiReadiness,
      capacityRoi: previousScore.capacityRoi,
      spendEfficiency: previousScore.spendEfficiency,
      operationalLeverage: previousScore.operationalLeverage,
      totalHoursFreed: previousScore.totalHoursFreed,
      totalDollarsSaved: previousScore.totalDollarsSaved,
      automationsDeployed: previousScore.automationsDeployed,
      calculatedAt: previousScore.calculatedAt.toISOString(),
    } : null,
    cfoTest: engagement.cfoTest ? {
      greenCount: engagement.cfoTest.greenCount,
      yellowCount: engagement.cfoTest.yellowCount,
      redCount: engagement.cfoTest.redCount,
      responses: engagement.cfoTest.responses as unknown as NonNullable<DashboardData["cfoTest"]>["responses"],
    } : null,
    capacityMetrics,
    spendMetrics,
    discoveryMetrics,
    recentActivity: engagement.activities.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      detail: a.detail,
      createdAt: a.createdAt.toISOString(),
    })),
  }
}

// ── Metric Builders ─────────────────────────────────────────

function buildCapacityMetrics(
  cards: { id: string; processName: string; department: string; hoursFreedPerMonth: number | null; dollarValueFreed: number | null; automationHealthScore: number | null; deployedAt: Date | null }[],
  pulses: { capacityConversion: string }[]
): CapacityMetrics {
  const deployed = cards.filter((c) => c.deployedAt !== null)
  const totalHours = deployed.reduce((sum, c) => sum + (c.hoursFreedPerMonth ?? 0), 0)
  const totalDollars = deployed.reduce((sum, c) => sum + (c.dollarValueFreed ?? 0), 0)
  const higherValueCount = pulses.filter((p) => p.capacityConversion === "HIGHER_VALUE_WORK").length

  return {
    totalAutomations: deployed.length,
    totalHoursFreedPerMonth: totalHours,
    totalDollarValuePerMonth: totalDollars,
    cumulativeHoursSaved: totalHours, // Simplified — real calculation would use deploy dates
    conversionRate: pulses.length > 0 ? (higherValueCount / pulses.length) * 100 : 0,
    automations: deployed.map((c) => ({
      id: c.id,
      processName: c.processName,
      department: c.department,
      hoursFreedPerMonth: c.hoursFreedPerMonth,
      dollarValueFreed: c.dollarValueFreed,
      healthScore: c.automationHealthScore,
      deployedAt: c.deployedAt?.toISOString() ?? null,
    })),
  }
}

function buildSpendMetrics(
  decisions: { decision: string; dollarDelta: number | null; status: string }[]
): SpendMetrics {
  const byType: Record<string, number> = {}
  let identified = 0
  let realized = 0

  for (const d of decisions) {
    byType[d.decision] = (byType[d.decision] ?? 0) + 1
    const delta = d.dollarDelta ?? 0
    if (delta > 0) identified += delta
    if (delta > 0 && d.status === "COMPLETE") realized += delta
  }

  return {
    totalDecisions: decisions.length,
    totalSavingsIdentified: identified,
    totalSavingsRealized: realized,
    implementationBacklog: identified - realized,
    decisionsByType: byType,
  }
}

function buildDiscoveryMetrics(
  cards: { department: string; tier: number; automationCandidate: string; validated: boolean }[]
): DiscoveryMetrics {
  const byDepartment: Record<string, number> = {}
  const byTier: Record<number, number> = {}

  for (const c of cards) {
    byDepartment[c.department] = (byDepartment[c.department] ?? 0) + 1
    byTier[c.tier] = (byTier[c.tier] ?? 0) + 1
  }

  return {
    totalCards: cards.length,
    cardsByDepartment: byDepartment,
    cardsByTier: byTier,
    automationCandidates: cards.filter((c) => c.automationCandidate === "YES").length,
    validated: cards.filter((c) => c.validated).length,
  }
}
