type ScoreInput = {
  valueScore: number
  complexityScore: number
  riskScore: number
  frequencyScore: number
  painScore: number
}

type SolutionLevelInput = {
  existingToolFit: number
  integrationNeed: number
  customBuildNeed: number
}

type AuditVisibilityInput = {
  audit: {
    userId: string
    clientDealId: string
  }
  userId: string
  role: string
}

type CreateAuditInput = {
  userId: string
  clientDealId: string
  companyName: string
  industry?: string | null
  aggregateUseAllowed?: boolean
}

export const FIRST_WIN_AUDIT_CONSENT_NOTICE =
  "Your responses will be used to create an AI readiness and workflow friction report for your organization. Aggregated and anonymized patterns may also be used by AIMS to improve training, templates, and product development. Individual responses will not be shared outside your organization and assigned audit team."

function clampScore(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)))
}

/**
 * Scores whether a use case is a good first win for a new operator.
 *
 * Higher is better. We reward obvious value, frequent work, and real pain,
 * then subtract complexity and risk because early wins should be safe and simple.
 */
export function calculateFirstWinScore(input: ScoreInput): number {
  const valueScore = clampScore(input.valueScore)
  const frequencyScore = clampScore(input.frequencyScore)
  const painScore = clampScore(input.painScore)
  const complexityScore = clampScore(input.complexityScore)
  const riskScore = clampScore(input.riskScore)

  const raw =
    96 -
    (5 - valueScore) * 6 -
    (5 - frequencyScore) * 5 -
    (5 - painScore) * 5 -
    (complexityScore - 1) * 6 -
    (riskScore - 1) * 4

  return Math.min(100, Math.max(0, raw))
}

/**
 * LEVEL_1 = use an existing AI feature/tool.
 * LEVEL_2 = connect existing systems with light workflow automation.
 * LEVEL_3 = custom build or higher-risk orchestration.
 */
export function classifySolutionLevel(input: SolutionLevelInput): "LEVEL_1" | "LEVEL_2" | "LEVEL_3" {
  const existingToolFit = clampScore(input.existingToolFit)
  const integrationNeed = clampScore(input.integrationNeed)
  const customBuildNeed = clampScore(input.customBuildNeed)

  if (customBuildNeed >= 4) return "LEVEL_3"
  if (existingToolFit >= 4 && integrationNeed <= 2) return "LEVEL_1"
  return "LEVEL_2"
}

export function buildFirstWinAuditCreateData(input: CreateAuditInput) {
  return {
    userId: input.userId,
    clientDealId: input.clientDealId,
    companyName: input.companyName.trim(),
    industry: input.industry?.trim() || null,
    status: "DRAFT" as const,
    aggregateUseAllowed: input.aggregateUseAllowed ?? true,
  }
}

export function isAuditVisibleToUser(input: AuditVisibilityInput): boolean {
  if (input.role === "ADMIN" || input.role === "SUPER_ADMIN") return true
  return input.audit.userId === input.userId
}
