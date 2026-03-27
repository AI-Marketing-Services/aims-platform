// ============================================================
// Ops Excellence TypeScript Types
// Mirrors Prisma types + adds frontend-specific interfaces
// ============================================================

import type {
  EngagementStage,
  EngagementTier,
  ConfidenceTier,
  ProcessFrequency,
  AutomationCandidacy,
  SpendDecisionType,
  SpendDecisionStatus,
  UsageLevel,
  CapacityConversion,
} from "@prisma/client"

// Re-export Prisma enums for convenience
export type {
  EngagementStage,
  EngagementTier,
  ConfidenceTier,
  ProcessFrequency,
  AutomationCandidacy,
  SpendDecisionType,
  SpendDecisionStatus,
  UsageLevel,
  CapacityConversion,
}

// ── Intake Form Data ────────────────────────────────────────

export interface IntakeCompanyData {
  companyName: string
  industry: string
  website: string
  annualRevenue: string
  employeeCount: string
  businessModel: string
  locationCount: string
}

export interface IntakeLeadershipData {
  ceoName: string
  ceoEmail: string
  ceoPhone: string
  integratorName: string
  integratorEmail: string
  financeLeadName: string
  financeLeadEmail: string
  painPoints: string[]
  successVision: string
  operatingSystem: string
}

export type CFOResponseScore = "GREEN" | "YELLOW" | "RED"

export interface CFOTestResponse {
  questionId: string
  score: CFOResponseScore
  notes: string
}

export interface IntakeCFOData {
  responses: CFOTestResponse[]
}

export interface IntakeTechnologyData {
  currentTools: string[]
  otherTools: string
  toolCount: string
  dataMaturit: string
  aiUsage: string
}

export interface IntakeScheduleData {
  preferredCallTime: string
  additionalNotes: string
  fileUrls: string[]
}

export interface FullIntakeData {
  company: IntakeCompanyData
  leadership: IntakeLeadershipData
  cfoTest: IntakeCFOData
  technology: IntakeTechnologyData
  schedule: IntakeScheduleData
}

// ── Dashboard Data ──────────────────────────────────────────

export interface DashboardData {
  engagement: EngagementSummary
  latestScore: ScoreSummary | null
  previousScore: ScoreSummary | null
  cfoTest: CFOTestSummary | null
  capacityMetrics: CapacityMetrics
  spendMetrics: SpendMetrics
  discoveryMetrics: DiscoveryMetrics
  recentActivity: ActivityItem[]
}

export interface EngagementSummary {
  id: string
  companyName: string
  companyLogo: string | null
  industry: string | null
  stage: EngagementStage
  tier: EngagementTier
  startDate: string
  daysSinceStart: number
}

export interface ScoreSummary {
  version: number
  compositeScore: number
  confidenceTier: ConfidenceTier
  confidencePercent: number
  financialClarity: number
  aiReadiness: number
  capacityRoi: number
  spendEfficiency: number
  operationalLeverage: number | null
  totalHoursFreed: number | null
  totalDollarsSaved: number | null
  automationsDeployed: number | null
  calculatedAt: string
}

export interface CFOTestSummary {
  greenCount: number
  yellowCount: number
  redCount: number
  responses: CFOTestResponse[]
}

export interface CapacityMetrics {
  totalAutomations: number
  totalHoursFreedPerMonth: number
  totalDollarValuePerMonth: number
  cumulativeHoursSaved: number
  conversionRate: number
  automations: AutomationSummary[]
}

export interface AutomationSummary {
  id: string
  processName: string
  department: string
  hoursFreedPerMonth: number | null
  dollarValueFreed: number | null
  healthScore: number | null
  deployedAt: string | null
}

export interface SpendMetrics {
  totalDecisions: number
  totalSavingsIdentified: number
  totalSavingsRealized: number
  implementationBacklog: number
  decisionsByType: Record<string, number>
}

export interface DiscoveryMetrics {
  totalCards: number
  cardsByDepartment: Record<string, number>
  cardsByTier: Record<number, number>
  automationCandidates: number
  validated: number
}

export interface ActivityItem {
  id: string
  type: string
  title: string
  detail: string | null
  createdAt: string
}

// ── Scoring Engine Types ────────────────────────────────────

export interface ScoringInput {
  cfoTest: {
    greenCount: number
    yellowCount: number
    redCount: number
  } | null
  discoveryCards: {
    total: number
    classified: number
    automationCandidates: number
    validated: number
    departmentsCovered: number
  }
  automationCards: {
    deployed: number
    withMeasurements: number
    totalHoursFreed: number
    totalDollarValue: number
    averageHealthScore: number
  }
  spendDecisions: {
    total: number
    savingsIdentified: number
    savingsRealized: number
  }
  pulseSurveys: {
    total: number
    higherValueCount: number
    absorbedCount: number
    notVisibleCount: number
  }
  financialData: {
    revenue: number | null
    controllableSGA: number | null
    toolCount: number | null
    fteCount: number | null
    unitEconomicsCalculable: number
  }
  measurementConfidence: {
    systemIntegrationCoverage: number
    dataFreshness: number
    singleSourceOfTruth: number
    dashboardAdoption: number
  }
}

export interface ScoringOutput {
  compositeScore: number
  confidenceTier: ConfidenceTier
  confidencePercent: number
  financialClarity: number
  aiReadiness: number
  capacityRoi: number
  spendEfficiency: number
  financialDetail: Record<string, number>
  aiReadinessDetail: Record<string, number>
  capacityRoiDetail: Record<string, number>
  spendDetail: Record<string, number>
  operationalLeverage: number | null
}

// ── Admin Types ─────────────────────────────────────────────

export interface EngagementListItem {
  id: string
  companyName: string
  companyLogo: string | null
  stage: EngagementStage
  tier: EngagementTier
  latestScore: number | null
  confidenceTier: ConfidenceTier | null
  integratorId: string | null
  daysSinceStart: number
  userId: string
  userEmail: string
  userName: string | null
  createdAt: string
}
