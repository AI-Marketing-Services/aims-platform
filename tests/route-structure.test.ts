/**
 * Route Structure Tests
 * Verifies all expected pages and API routes exist and are properly structured.
 */
import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "fs"
import { join } from "path"

const SRC = join(__dirname, "..", "src")

describe("Portal pages exist", () => {
  const portalPages = [
    "app/(portal)/portal/dashboard/page.tsx",
    "app/(portal)/portal/marketplace/page.tsx",
    "app/(portal)/portal/campaigns/page.tsx",
    "app/(portal)/portal/services/page.tsx",
    "app/(portal)/portal/billing/page.tsx",
    "app/(portal)/portal/settings/page.tsx",
    "app/(portal)/portal/support/page.tsx",
  ]

  for (const page of portalPages) {
    it(`${page} exists`, () => {
      expect(existsSync(join(SRC, page))).toBe(true)
    })
  }
})

describe("Admin pages exist", () => {
  const adminPages = [
    "app/(admin)/admin/email-campaigns/page.tsx",
    "app/(admin)/admin/services/page.tsx",
    "app/(admin)/admin/crm/page.tsx",
  ]

  for (const page of adminPages) {
    it(`${page} exists`, () => {
      expect(existsSync(join(SRC, page))).toBe(true)
    })
  }
})

describe("Admin auth guards", () => {
  it("admin layout has auth guard protecting all admin pages", () => {
    const content = readFileSync(join(SRC, "app/(admin)/layout.tsx"), "utf-8")
    // Admin layout now delegates to the shared effective-role helper.
    // The helper internally calls auth() + Clerk backend + DB fallback.
    expect(content).toContain("getEffectiveRole")
    expect(content).toContain("ADMIN")
    expect(content).toContain("SUPER_ADMIN")
    expect(content).toContain('redirect("/sign-in")')
    // Non-admins bounce via dashboardForRole() so admins don't need to
    // hardcode /portal/dashboard.
    expect(content).toContain("dashboardForRole")
  })

  // Some admin pages add an extra page-level check
  const pagesWithOwnAuth = [
    "app/(admin)/admin/email-campaigns/page.tsx",
    "app/(admin)/admin/crm/page.tsx",
  ]

  for (const page of pagesWithOwnAuth) {
    it(`${page} — has page-level admin role check`, () => {
      const content = readFileSync(join(SRC, page), "utf-8")
      expect(content).toContain("auth()")
      const hasRoleCheck = content.includes("ADMIN") || content.includes("requireAdmin")
      expect(hasRoleCheck, `${page} missing admin role check`).toBe(true)
    })
  }
})

describe("API routes exist", () => {
  const apiRoutes = [
    "app/api/admin/services/route.ts",
    "app/api/admin/emailbison/connections/route.ts",
    "app/api/admin/emailbison/workspaces/route.ts",
    "app/api/admin/emailbison/dashboard/route.ts",
    "app/api/portal/email-campaign/route.ts",
  ]

  for (const route of apiRoutes) {
    it(`${route} exists`, () => {
      expect(existsSync(join(SRC, route))).toBe(true)
    })
  }
})

describe("Client components are properly marked", () => {
  const clientComponents = [
    "app/(admin)/admin/email-campaigns/EmailCampaignsClient.tsx",
    "app/(admin)/admin/email-campaigns/AdminCampaignDashboard.tsx",
    "app/(admin)/admin/services/ServicesConfigClient.tsx",
    "app/(admin)/admin/crm/CRMKanban.tsx",
    "app/(portal)/portal/marketplace/PortalMarketplaceClient.tsx",
    "app/(portal)/portal/campaigns/CampaignsDashboardClient.tsx",
  ]

  for (const comp of clientComponents) {
    it(`${comp} — has "use client" directive`, () => {
      const content = readFileSync(join(SRC, comp), "utf-8")
      expect(content.startsWith('"use client"')).toBe(true)
    })
  }
})

describe("Admin email campaigns page wires both components", () => {
  it("imports and renders EmailCampaignsClient", () => {
    const content = readFileSync(
      join(SRC, "app/(admin)/admin/email-campaigns/page.tsx"),
      "utf-8"
    )
    expect(content).toContain("EmailCampaignsClient")
  })

  it("imports and renders AdminCampaignDashboard", () => {
    const content = readFileSync(
      join(SRC, "app/(admin)/admin/email-campaigns/page.tsx"),
      "utf-8"
    )
    expect(content).toContain("AdminCampaignDashboard")
    expect(content).toContain("<AdminCampaignDashboard")
  })
})

describe("Portal campaigns page uses client component", () => {
  it("imports CampaignsDashboardClient", () => {
    const content = readFileSync(
      join(SRC, "app/(portal)/portal/campaigns/page.tsx"),
      "utf-8"
    )
    expect(content).toContain("CampaignsDashboardClient")
  })

  it("is a server component with auth check", () => {
    const content = readFileSync(
      join(SRC, "app/(portal)/portal/campaigns/page.tsx"),
      "utf-8"
    )
    expect(content).toContain("auth()")
    expect(content).not.toContain('"use client"')
  })
})
