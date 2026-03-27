// ============================================================
// Ops Excellence Credit Score — Scoring Engine
// Pure functions. No side effects. Fully testable.
// ============================================================

import type { ConfidenceTier } from "@prisma/client"
import type { ScoringInput, ScoringOutput } from "./types"

// ── Constants ───────────────────────────────────────────────

const MAX_DIMENSION_SCORE = 25
const MAX_COMPOSITE = 100

// Confidence tier thresholds & caps
const CONFIDENCE_THRESHOLDS = {
  GREEN: { min: 85, cap: MAX_COMPOSITE },
  YELLOW: { min: 60, cap: 80 },
  RED: { min: 0, cap: 60 },
} as const

// ── Main Calculator ─────────────────────────────────────────

export function calculateCreditScore(input: ScoringInput): ScoringOutput {
  const fc = scoreFinancialClarity(input)
  const ai = scoreAIReadiness(input)
  const cr = scoreCapacityROI(input)
  const se = scoreSpendEfficiency(input)

  const { tier, percent } = calculateConfidenceTier(input.measurementConfidence)

  const rawComposite = fc.total + ai.total + cr.total + se.total
  const cap = CONFIDENCE_THRESHOLDS[tier].cap
  const compositeScore = Math.min(rawComposite, cap)

  const operationalLeverage =
    input.financialData.revenue && input.financialData.controllableSGA
      ? input.financialData.revenue / input.financialData.controllableSGA
      : null

  return {
    compositeScore: round(compositeScore),
    confidenceTier: tier,
    confidencePercent: round(percent),
    financialClarity: round(fc.total),
    aiReadiness: round(ai.total),
    capacityRoi: round(cr.total),
    spendEfficiency: round(se.total),
    financialDetail: fc.detail,
    aiReadinessDetail: ai.detail,
    capacityRoiDetail: cr.detail,
    spendDetail: se.detail,
    operationalLeverage: operationalLeverage ? round(operationalLeverage) : null,
  }
}

// ── D1: Financial Clarity ───────────────────────────────────

function scoreFinancialClarity(input: ScoringInput): DimensionResult {
  const detail: Record<string, number> = {}

  // CFO Test score (0-10 points)
  if (input.cfoTest) {
    const totalQuestions = input.cfoTest.greenCount + input.cfoTest.yellowCount + input.cfoTest.redCount
    const weightedScore = totalQuestions > 0
      ? (input.cfoTest.greenCount * 1.0 + input.cfoTest.yellowCount * 0.5) / totalQuestions
      : 0
    detail.cfoTestScore = round(weightedScore * 10)
  } else {
    detail.cfoTestScore = 0
  }

  // Revenue segmentation completeness (0-5 points)
  // Proxy: if revenue data exists and CFO answered green on Q1
  const hasRevenue = input.financialData.revenue !== null && input.financialData.revenue > 0
  detail.revenueSegmentation = hasRevenue ? 5 : 0

  // Unit economics calculability (0-5 points)
  detail.unitEconomics = round(Math.min(input.financialData.unitEconomicsCalculable / 4, 1) * 5)

  // Cost structure taxonomy (0-5 points)
  const hasSGA = input.financialData.controllableSGA !== null && input.financialData.controllableSGA > 0
  const hasFTE = input.financialData.fteCount !== null && input.financialData.fteCount > 0
  detail.costStructure = (hasSGA ? 2.5 : 0) + (hasFTE ? 2.5 : 0)

  const total = Math.min(
    detail.cfoTestScore + detail.revenueSegmentation + detail.unitEconomics + detail.costStructure,
    MAX_DIMENSION_SCORE
  )

  return { total, detail }
}

// ── D2: AI Readiness ────────────────────────────────────────

function scoreAIReadiness(input: ScoringInput): DimensionResult {
  const detail: Record<string, number> = {}

  // Discovery completion (0-8 points)
  // Target: 30-40 cards is full score
  detail.discoveryCompletion = round(Math.min(input.discoveryCards.total / 35, 1) * 8)

  // Classification rate (0-5 points)
  const classificationRate = input.discoveryCards.total > 0
    ? input.discoveryCards.classified / input.discoveryCards.total
    : 0
  detail.classificationRate = round(classificationRate * 5)

  // Department coverage (0-4 points)
  // Target: 6-8 departments
  detail.departmentCoverage = round(Math.min(input.discoveryCards.departmentsCovered / 7, 1) * 4)

  // Deployment rate (0-5 points)
  const pipelineDepth = input.discoveryCards.automationCandidates
  const deploymentRate = pipelineDepth > 0
    ? input.automationCards.deployed / pipelineDepth
    : 0
  detail.deploymentRate = round(Math.min(deploymentRate, 1) * 5)

  // Automation health (0-3 points)
  const healthScore = input.automationCards.deployed > 0
    ? input.automationCards.averageHealthScore / 100
    : 0
  detail.automationHealth = round(healthScore * 3)

  const total = Math.min(
    detail.discoveryCompletion + detail.classificationRate +
    detail.departmentCoverage + detail.deploymentRate + detail.automationHealth,
    MAX_DIMENSION_SCORE
  )

  return { total, detail }
}

// ── D3: Capacity ROI ────────────────────────────────────────

function scoreCapacityROI(input: ScoringInput): DimensionResult {
  const detail: Record<string, number> = {}

  // Automations deployed (0-6 points)
  // Target: 6-8 automations for full score
  detail.automationsDeployed = round(Math.min(input.automationCards.deployed / 7, 1) * 6)

  // Hours freed per month (0-6 points)
  // Target: 200+ hours for full score
  detail.hoursFreed = round(Math.min(input.automationCards.totalHoursFreed / 200, 1) * 6)

  // Dollar value of freed capacity (0-6 points)
  // Target: $15,000+/month for full score
  detail.dollarValue = round(Math.min(input.automationCards.totalDollarValue / 15000, 1) * 6)

  // Measured automations (0-4 points)
  const measuredRate = input.automationCards.deployed > 0
    ? input.automationCards.withMeasurements / input.automationCards.deployed
    : 0
  detail.measuredRate = round(measuredRate * 4)

  // Capacity conversion rate (0-3 points)
  const totalSurveys = input.pulseSurveys.total
  const conversionRate = totalSurveys > 0
    ? input.pulseSurveys.higherValueCount / totalSurveys
    : 0
  detail.conversionRate = round(conversionRate * 3)

  const total = Math.min(
    detail.automationsDeployed + detail.hoursFreed + detail.dollarValue +
    detail.measuredRate + detail.conversionRate,
    MAX_DIMENSION_SCORE
  )

  return { total, detail }
}

// ── D4: Spend Efficiency ────────────────────────────────────

function scoreSpendEfficiency(input: ScoringInput): DimensionResult {
  const detail: Record<string, number> = {}

  // Operational Leverage Ratio (0-10 points)
  if (input.financialData.revenue && input.financialData.controllableSGA) {
    const ratio = input.financialData.controllableSGA / input.financialData.revenue
    // Lower ratio is better. <20% = 10, 20-35% = 7, 35-50% = 4, >50% = 2
    if (ratio < 0.2) detail.leverageRatio = 10
    else if (ratio < 0.35) detail.leverageRatio = 7
    else if (ratio < 0.5) detail.leverageRatio = 4
    else detail.leverageRatio = 2
  } else {
    detail.leverageRatio = 0
  }

  // Spend decisions logged (0-6 points)
  // Target: 10-15 decisions for full score
  detail.decisionsLogged = round(Math.min(input.spendDecisions.total / 12, 1) * 6)

  // Savings realization rate (0-5 points)
  const realizationRate = input.spendDecisions.savingsIdentified > 0
    ? input.spendDecisions.savingsRealized / input.spendDecisions.savingsIdentified
    : 0
  detail.realizationRate = round(realizationRate * 5)

  // Tools per FTE (0-4 points)
  if (input.financialData.toolCount && input.financialData.fteCount) {
    const toolsPerFTE = input.financialData.toolCount / input.financialData.fteCount
    // Lower is better. <2 = 4, 2-4 = 3, 4-6 = 2, >6 = 1
    if (toolsPerFTE < 2) detail.toolsPerFTE = 4
    else if (toolsPerFTE < 4) detail.toolsPerFTE = 3
    else if (toolsPerFTE < 6) detail.toolsPerFTE = 2
    else detail.toolsPerFTE = 1
  } else {
    detail.toolsPerFTE = 0
  }

  const total = Math.min(
    detail.leverageRatio + detail.decisionsLogged +
    detail.realizationRate + detail.toolsPerFTE,
    MAX_DIMENSION_SCORE
  )

  return { total, detail }
}

// ── Measurement Confidence ──────────────────────────────────

function calculateConfidenceTier(confidence: ScoringInput["measurementConfidence"]): {
  tier: ConfidenceTier
  percent: number
} {
  const percent = (
    confidence.systemIntegrationCoverage +
    confidence.dataFreshness +
    confidence.singleSourceOfTruth +
    confidence.dashboardAdoption
  ) / 4

  const tier: ConfidenceTier =
    percent >= CONFIDENCE_THRESHOLDS.GREEN.min ? "GREEN" :
    percent >= CONFIDENCE_THRESHOLDS.YELLOW.min ? "YELLOW" :
    "RED"

  return { tier, percent }
}

// ── Helpers ─────────────────────────────────────────────────

interface DimensionResult {
  total: number
  detail: Record<string, number>
}

function round(n: number): number {
  return Math.round(n * 10) / 10
}

// ── Tier Calculator ─────────────────────────────────────────

export function calculateProcessTier(complexityScore: number, valueScore: number): number {
  const isLowComplexity = complexityScore <= 3
  const isHighValue = valueScore >= 3

  if (isLowComplexity && isHighValue) return 1
  if (!isLowComplexity && isHighValue) return 2
  if (isLowComplexity && !isHighValue) return 3
  return 4
}
