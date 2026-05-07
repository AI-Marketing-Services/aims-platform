import { describe, expect, it } from "vitest"
import {
  PART_TIME_TARGETS,
  SCORECARD_ROWS,
  getTargets,
} from "@/lib/scorecard/targets"

describe("getTargets", () => {
  it("returns the part-time targets verbatim for PART_TIME", () => {
    const result = getTargets("PART_TIME")
    expect(result).toEqual(PART_TIME_TARGETS)
  })

  it("3× multiplies every target for FULL_TIME", () => {
    const result = getTargets("FULL_TIME")
    for (const [key, value] of Object.entries(PART_TIME_TARGETS)) {
      expect(result[key as keyof typeof PART_TIME_TARGETS]).toBe(value * 3)
    }
  })
})

describe("SCORECARD_ROWS", () => {
  it("has nine rows in the canonical order from the sheet design", () => {
    expect(SCORECARD_ROWS).toHaveLength(9)
    expect(SCORECARD_ROWS.map((r) => r.key)).toEqual([
      "newProspects",
      "outreachSent",
      "followUpsSent",
      "referralAsks",
      "problemHypotheses",
      "discoveryRequested",
      "discoveryBooked",
      "discoveryCompleted",
      "quickWinHypotheses",
    ])
  })

  it("each row maps to a target key", () => {
    for (const row of SCORECARD_ROWS) {
      expect(PART_TIME_TARGETS).toHaveProperty(row.key)
    }
  })

  it("manualField names match the OperatorWeeklyScorecard schema", () => {
    const expectedFields = new Set([
      "manualNewProspects",
      "manualOutreachSent",
      "manualFollowUpsSent",
      "manualReferralAsks",
      "manualProblemHypotheses",
      "manualDiscoveryRequested",
      "manualDiscoveryBooked",
      "manualDiscoveryCompleted",
      "manualQuickWinHypotheses",
    ])
    for (const row of SCORECARD_ROWS) {
      expect(expectedFields.has(row.manualField)).toBe(true)
    }
  })
})
