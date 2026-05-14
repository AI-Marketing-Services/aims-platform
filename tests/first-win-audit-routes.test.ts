import { describe, expect, it } from "vitest"
import { existsSync, readFileSync } from "fs"
import { join } from "path"

const SRC = join(__dirname, "..", "src")

function readRoute(path: string) {
  return readFileSync(join(SRC, path), "utf-8")
}

describe("First Win Audit portal API routes", () => {
  const collectionRoute = "app/api/portal/first-win-audits/route.ts"
  const detailRoute = "app/api/portal/first-win-audits/[auditId]/route.ts"

  it("creates a collection route for listing and creating audits", () => {
    expect(existsSync(join(SRC, collectionRoute))).toBe(true)
    const content = readRoute(collectionRoute)

    expect(content).toContain("ensureDbUserIdForApi")
    expect(content).toContain("z.object")
    expect(content).toContain("firstWinAudit")
    expect(content).toContain("buildFirstWinAuditCreateData")
    expect(content).toContain("401")
    expect(content).not.toContain("AuditChatSession")
    expect(content).not.toContain("chatbot")
  })

  it("creates a detail route that verifies audit ownership before returning data", () => {
    expect(existsSync(join(SRC, detailRoute))).toBe(true)
    const content = readRoute(detailRoute)

    expect(content).toContain("ensureDbUserIdForApi")
    expect(content).toContain("isAuditVisibleToUser")
    expect(content).toContain("firstWinAudit")
    expect(content).toContain("401")
    expect(content).toContain("403")
    expect(content).not.toContain("AuditChatSession")
    expect(content).not.toContain("chatbot")
  })
})
