import "server-only"

import { db } from "@/lib/db"
import type { ScorecardRowKey } from "./targets"

/**
 * Auto-derive what the operator has done in the CRM during the given
 * week. These counts are HINTS — operators can click "apply" to copy
 * a value into the matching manual field on the scorecard, but the
 * displayed Actual is always the operator's manual entry.
 *
 * One query per row — pragmatic for nine simple counts. We can roll
 * these into a single grouped query later if it shows up in the perf
 * dashboard, but the current shape keeps the joins easy to reason
 * about and each query hits an existing index.
 */
export interface AutoTally {
  newProspects: number
  outreachSent: number
  followUpsSent: number
  referralAsks: number
  problemHypotheses: number
  discoveryRequested: number
  discoveryBooked: number
  discoveryCompleted: number
  quickWinHypotheses: number
}

export async function aggregateAutoTally(args: {
  userId: string
  weekStart: Date
  weekEndExclusive: Date
}): Promise<AutoTally> {
  const { userId, weekStart: gte, weekEndExclusive: lt } = args

  // ── Owned-by-the-operator deal scope ──────────────────────────────
  // All activity counts must be on deals the operator owns; the join
  // is via `clientDeal.userId` because operators can't see each
  // other's deals.
  const dealScope = { clientDeal: { userId } }

  const [
    newProspects,
    outreachSent,
    followUpsSent,
    referralAsks,
    problemHypotheses,
    discoveryRequested,
    discoveryBooked,
    discoveryCompleted,
    quickWinHypotheses,
  ] = await Promise.all([
    db.clientDeal.count({
      where: { userId, createdAt: { gte, lt } },
    }),
    db.clientDealActivity.count({
      where: { ...dealScope, type: "EMAIL", createdAt: { gte, lt } },
    }),
    db.clientDealActivity.count({
      where: { ...dealScope, type: "FOLLOW_UP_SENT", createdAt: { gte, lt } },
    }),
    db.clientDealActivity.count({
      where: { ...dealScope, type: "REFERRAL_ASK_SENT", createdAt: { gte, lt } },
    }),
    db.clientDealNote.count({
      where: {
        clientDeal: { userId },
        kind: "PROBLEM_HYPOTHESIS",
        createdAt: { gte, lt },
      },
    }),
    db.clientDealActivity.count({
      where: { ...dealScope, type: "DISCOVERY_REQUESTED", createdAt: { gte, lt } },
    }),
    // "Booked" is a stage transition into DISCOVERY_CALL — ClientDeal
    // doesn't store a per-stage timestamp, but every transition emits
    // a STAGE_CHANGE activity with the new stage in `description` (see
    // the existing CRM stage selector). Keep the heuristic conservative
    // and explicit so the UI tooltip can describe what's being counted.
    db.clientDealActivity.count({
      where: {
        ...dealScope,
        type: "STAGE_CHANGE",
        description: { contains: "DISCOVERY_CALL" },
        createdAt: { gte, lt },
      },
    }),
    db.clientDealActivity.count({
      where: { ...dealScope, type: "MEETING", createdAt: { gte, lt } },
    }),
    db.clientDealNote.count({
      where: {
        clientDeal: { userId },
        kind: "QUICK_WIN_HYPOTHESIS",
        createdAt: { gte, lt },
      },
    }),
  ])

  return {
    newProspects,
    outreachSent,
    followUpsSent,
    referralAsks,
    problemHypotheses,
    discoveryRequested,
    discoveryBooked,
    discoveryCompleted,
    quickWinHypotheses,
  }
}

export type AutoTallyByKey = Record<ScorecardRowKey, number>
