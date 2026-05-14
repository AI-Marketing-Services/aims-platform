import { describe, expect, it } from "vitest"
import { existsSync, readFileSync } from "fs"
import { join } from "path"

const SRC = join(__dirname, "..", "src")

function readSource(path: string) {
  return readFileSync(join(SRC, path), "utf8")
}

describe("First Win Audit portal navigation", () => {
  it("adds First Win Audit below the existing AI Audit without replacing it", () => {
    const sidebar = readSource("components/portal/Sidebar.tsx")
    const aiAuditIndex = sidebar.indexOf('label: "AI Audit"')
    const firstWinIndex = sidebar.indexOf('label: "First Win Audit"')

    expect(aiAuditIndex).toBeGreaterThan(-1)
    expect(firstWinIndex).toBeGreaterThan(aiAuditIndex)
    expect(sidebar).toContain('href: "/portal/audits"')
    expect(sidebar).toContain('href: "/portal/first-win-audits"')
  })

  it("has separate portal pages for the First Win Audit V2 workflow", () => {
    expect(existsSync(join(SRC, "app/(portal)/portal/first-win-audits/page.tsx"))).toBe(true)
    expect(existsSync(join(SRC, "app/(portal)/portal/first-win-audits/new/page.tsx"))).toBe(true)
    expect(existsSync(join(SRC, "app/(portal)/portal/audits/page.tsx"))).toBe(true)
  })
})
