/**
 * Shared client-side types for the scorecard surface. Mirrors the API
 * payload from /api/portal/scorecard so the client can be strict about
 * what's in flight.
 */
import type { ScorecardRowKey } from "@/lib/scorecard/targets"

export interface ScorecardWeek {
  start: string // YYYY-MM-DD
  endExclusive: string // YYYY-MM-DD
}

export interface ScorecardProfile {
  businessName: string | null
  focusNiche: string | null
  weeklyGoalText: string
  weeklyRule: string
  commitmentLevel: "PART_TIME" | "FULL_TIME"
}

export interface ScorecardKpis {
  revenueImpact: number
  strongOpportunities: number
}

export type ScorecardCounts = Record<ScorecardRowKey, number>

export interface ScorecardPayload {
  week: ScorecardWeek
  profile: ScorecardProfile
  targets: ScorecardCounts
  manual: ScorecardCounts
  auto: ScorecardCounts
  kpis: ScorecardKpis
  notes: string
}

export interface TrackerRow {
  id: string
  companyName: string
  contactName: string | null
  contactRole: string | null
  relationship: string | null
  possibleProblem: string | null
  outreachType: string | null
  messageStatus: string | null
  firstMessageAt: string | null
  followUp1At: string | null
  followUp2At: string | null
  discoveryAskAt: string | null
  nextAction: string | null
  nextActionDueAt: string | null
  notes: string | null
  stage: string
  createdAt: string
  updatedAt: string
}
