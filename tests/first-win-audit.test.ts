import { describe, expect, it } from "vitest"
import {
  FIRST_WIN_AUDIT_CONSENT_NOTICE,
  buildFirstWinAuditCreateData,
  calculateFirstWinScore,
  classifySolutionLevel,
  isAuditVisibleToUser,
} from "@/lib/first-win-audit"

describe("first win audit scoring", () => {
  it("prioritizes frequent, painful, low-risk workflows as strong first wins", () => {
    const score = calculateFirstWinScore({
      valueScore: 5,
      complexityScore: 1,
      riskScore: 1,
      frequencyScore: 5,
      painScore: 5,
    })

    expect(score).toBe(96)
  })

  it("penalizes high-complexity and high-risk workflows even when the pain is real", () => {
    const score = calculateFirstWinScore({
      valueScore: 5,
      complexityScore: 5,
      riskScore: 5,
      frequencyScore: 5,
      painScore: 5,
    })

    expect(score).toBe(56)
  })

  it("classifies solution levels from the amount of existing-tool support and custom build risk", () => {
    expect(
      classifySolutionLevel({ existingToolFit: 5, integrationNeed: 1, customBuildNeed: 1 })
    ).toBe("LEVEL_1")
    expect(
      classifySolutionLevel({ existingToolFit: 3, integrationNeed: 4, customBuildNeed: 2 })
    ).toBe("LEVEL_2")
    expect(
      classifySolutionLevel({ existingToolFit: 1, integrationNeed: 4, customBuildNeed: 5 })
    ).toBe("LEVEL_3")
  })
})

describe("first win audit creation data", () => {
  it("normalizes a new audit around the operator, client, and consent boundary", () => {
    const data = buildFirstWinAuditCreateData({
      userId: "operator_1",
      clientDealId: "deal_1",
      companyName: "  Acme Dental  ",
      industry: "  Healthcare  ",
      aggregateUseAllowed: false,
    })

    expect(data).toEqual({
      userId: "operator_1",
      clientDealId: "deal_1",
      companyName: "Acme Dental",
      industry: "Healthcare",
      status: "DRAFT",
      aggregateUseAllowed: false,
    })
  })

  it("stores the consent promise in plain English for the future survey flow", () => {
    expect(FIRST_WIN_AUDIT_CONSENT_NOTICE).toContain("AI readiness")
    expect(FIRST_WIN_AUDIT_CONSENT_NOTICE).toContain("Aggregated and anonymized")
    expect(FIRST_WIN_AUDIT_CONSENT_NOTICE).not.toContain("chatbot")
  })
})

describe("first win audit visibility", () => {
  const audit = {
    userId: "operator_1",
    clientDealId: "client_deal_1",
  }

  it("lets AIMS admins see every audit", () => {
    expect(isAuditVisibleToUser({ audit, userId: "admin_1", role: "ADMIN" })).toBe(true)
    expect(isAuditVisibleToUser({ audit, userId: "admin_2", role: "SUPER_ADMIN" })).toBe(true)
  })

  it("lets operators see only their own audits", () => {
    expect(isAuditVisibleToUser({ audit, userId: "operator_1", role: "CLIENT" })).toBe(true)
    expect(isAuditVisibleToUser({ audit, userId: "operator_2", role: "CLIENT" })).toBe(false)
  })
})
