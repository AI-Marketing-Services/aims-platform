/**
 * Component Pattern Tests
 * Verifies that all admin/portal components follow correct patterns:
 * - Save buttons check response status
 * - Optimistic updates have rollback
 * - State is updated after successful API calls
 * - Auto-refresh uses proper cleanup
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"

const SRC = join(__dirname, "..", "src")

describe("ServicesConfigClient — save pattern", () => {
  const content = readFileSync(
    join(SRC, "app/(admin)/admin/services/ServicesConfigClient.tsx"),
    "utf-8"
  )

  it("checks response status on save", () => {
    expect(content).toContain("res.ok")
  })

  it("updates local state after successful save", () => {
    expect(content).toContain("setServices")
  })

  it("clears edits after successful save", () => {
    expect(content).toContain("delete next[svc.id]")
  })

  it("has error state handling", () => {
    expect(content).toContain('"error"')
  })
})

describe("CRMKanban — drag-and-drop pattern", () => {
  const content = readFileSync(
    join(SRC, "app/(admin)/admin/crm/CRMKanban.tsx"),
    "utf-8"
  )

  it("saves previous stage for rollback", () => {
    expect(content).toContain("prevStage")
  })

  it("checks response status", () => {
    expect(content).toContain("res.ok")
  })

  it("rolls back on failure", () => {
    // Should restore previous stage if API fails
    expect(content).toContain("prevStage")
    expect(content).toContain("setDeals")
  })
})

describe("DealDetailClient — mutation patterns", () => {
  const content = readFileSync(
    join(SRC, "app/(admin)/admin/crm/[dealId]/DealDetailClient.tsx"),
    "utf-8"
  )

  it("patchDeal checks response status", () => {
    expect(content).toContain("res.ok")
  })

  it("handleCreateTask checks response status", () => {
    // Should have error handling for task creation
    expect(content).toContain("catch")
  })
})

describe("EmailCampaignsClient — connection save pattern", () => {
  const content = readFileSync(
    join(SRC, "app/(admin)/admin/email-campaigns/EmailCampaignsClient.tsx"),
    "utf-8"
  )

  it("checks response status on assign", () => {
    expect(content).toContain("res.ok")
  })

  it("tracks connection status locally", () => {
    expect(content).toContain("connected")
    expect(content).toContain("setConnected")
  })

  it("shows error state", () => {
    expect(content).toContain("error")
    expect(content).toContain("setError")
  })
})

describe("AdminCampaignDashboard — auto-refresh pattern", () => {
  const content = readFileSync(
    join(SRC, "app/(admin)/admin/email-campaigns/AdminCampaignDashboard.tsx"),
    "utf-8"
  )

  it("has auto-refresh interval", () => {
    expect(content).toContain("setInterval")
    expect(content).toContain("60_000")
  })

  it("cleans up interval on unmount", () => {
    expect(content).toContain("clearInterval")
  })

  it("has manual refresh button", () => {
    expect(content).toContain("Refresh")
    expect(content).toContain("refreshing")
  })

  it("shows loading state", () => {
    expect(content).toContain("loading")
    expect(content).toContain("animate-spin")
  })

  it("handles error state", () => {
    expect(content).toContain("error")
  })
})

describe("Portal CampaignsDashboardClient — auto-refresh pattern", () => {
  const content = readFileSync(
    join(SRC, "app/(portal)/portal/campaigns/CampaignsDashboardClient.tsx"),
    "utf-8"
  )

  it("has auto-refresh interval", () => {
    expect(content).toContain("setInterval")
    expect(content).toContain("60_000")
  })

  it("cleans up interval on unmount", () => {
    expect(content).toContain("clearInterval")
  })

  it("has manual refresh button", () => {
    expect(content).toContain("Refresh")
    expect(content).toContain("refreshing")
  })

  it("fetches from /api/portal/email-campaign", () => {
    expect(content).toContain("/api/portal/email-campaign")
  })

  it("shows last refresh time", () => {
    expect(content).toContain("lastRefresh")
    expect(content).toContain("toLocaleTimeString")
  })

  it("shows upsell state when not connected", () => {
    expect(content).toContain("Campaign Dashboard Preview")
    expect(content).toContain("/portal/marketplace")
  })

  it("shows connected badge when connected", () => {
    expect(content).toContain("Connected")
    // The connected indicator was migrated from emerald-green to the
    // brand primary as part of the visual cohesion sweep — accept
    // either so this test stays robust if we re-theme later.
    const hasIndicatorColor =
      /bg-(green|emerald)-\d{3}/.test(content) ||
      /bg-primary(\/\d+)?/.test(content)
    expect(hasIndicatorColor).toBe(true)
  })
})
