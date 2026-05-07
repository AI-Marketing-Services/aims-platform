import type { OperatorCommitmentLevel } from "@prisma/client"

/**
 * Weekly targets per scorecard row.
 *
 * Defined as part-time targets; full-time targets are derived by 3×
 * multiplier (operator request — keeps the scaling explicit + tunable
 * from one place).
 */
export const PART_TIME_TARGETS = {
  newProspects: 10,
  outreachSent: 10,
  followUpsSent: 10,
  referralAsks: 2,
  problemHypotheses: 2,
  discoveryRequested: 1,
  discoveryBooked: 1,
  discoveryCompleted: 1,
  quickWinHypotheses: 1,
} as const

export type ScorecardRowKey = keyof typeof PART_TIME_TARGETS

const FULL_TIME_MULTIPLIER = 3

export function getTargets(
  level: OperatorCommitmentLevel,
): Record<ScorecardRowKey, number> {
  if (level === "FULL_TIME") {
    return Object.fromEntries(
      (Object.entries(PART_TIME_TARGETS) as Array<[ScorecardRowKey, number]>).map(
        ([k, v]) => [k, v * FULL_TIME_MULTIPLIER],
      ),
    ) as Record<ScorecardRowKey, number>
  }
  return { ...PART_TIME_TARGETS }
}

/**
 * Static row metadata — labels + manual-field key + the optional
 * activity log "kind" the +1 affordance creates. Driving the table
 * from this list keeps the order, copy, and logging behaviour in
 * one place so the UI and API can't drift.
 */
export interface ScorecardRowMeta {
  key: ScorecardRowKey
  label: string
  /** Field on `OperatorWeeklyScorecard` that stores the manual count. */
  manualField:
    | "manualNewProspects"
    | "manualOutreachSent"
    | "manualFollowUpsSent"
    | "manualReferralAsks"
    | "manualProblemHypotheses"
    | "manualDiscoveryRequested"
    | "manualDiscoveryBooked"
    | "manualDiscoveryCompleted"
    | "manualQuickWinHypotheses"
  /** What the auto-tally hint counts in the CRM. `null` = no auto. */
  autoSource:
    | "client_deal_created"
    | "activity_email"
    | "activity_follow_up_sent"
    | "activity_referral_ask_sent"
    | "note_problem_hypothesis"
    | "activity_discovery_requested"
    | "stage_changed_to_discovery"
    | "activity_meeting"
    | "note_quick_win_hypothesis"
    | null
}

export const SCORECARD_ROWS: ScorecardRowMeta[] = [
  {
    key: "newProspects",
    label: "New people/businesses added",
    manualField: "manualNewProspects",
    autoSource: "client_deal_created",
  },
  {
    key: "outreachSent",
    label: "Warm outreach messages sent",
    manualField: "manualOutreachSent",
    autoSource: "activity_email",
  },
  {
    key: "followUpsSent",
    label: "Follow-ups sent",
    manualField: "manualFollowUpsSent",
    autoSource: "activity_follow_up_sent",
  },
  {
    key: "referralAsks",
    label: "Referral asks sent",
    manualField: "manualReferralAsks",
    autoSource: "activity_referral_ask_sent",
  },
  {
    key: "problemHypotheses",
    label: "Problem hypotheses written",
    manualField: "manualProblemHypotheses",
    autoSource: "note_problem_hypothesis",
  },
  {
    key: "discoveryRequested",
    label: "Discovery conversations requested",
    manualField: "manualDiscoveryRequested",
    autoSource: "activity_discovery_requested",
  },
  {
    key: "discoveryBooked",
    label: "Discovery conversations booked",
    manualField: "manualDiscoveryBooked",
    autoSource: "stage_changed_to_discovery",
  },
  {
    key: "discoveryCompleted",
    label: "Discovery conversations completed",
    manualField: "manualDiscoveryCompleted",
    autoSource: "activity_meeting",
  },
  {
    key: "quickWinHypotheses",
    label: "Quick-win hypotheses written",
    manualField: "manualQuickWinHypotheses",
    autoSource: "note_quick_win_hypothesis",
  },
]
