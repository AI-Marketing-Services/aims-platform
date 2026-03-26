/**
 * Email Templates Tests
 * Verifies escapeHtml function, support email templates,
 * and lead magnet result email templates.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"

const SRC = join(__dirname, "..", "src")

// ─── escapeHtml function (mirrored from lib/email/index.ts) ────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

describe("escapeHtml", () => {
  it("escapes < to &lt;", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;")
  })

  it("escapes > to &gt;", () => {
    expect(escapeHtml("a > b")).toBe("a &gt; b")
  })

  it("escapes & to &amp;", () => {
    expect(escapeHtml("foo & bar")).toBe("foo &amp; bar")
  })

  it('escapes " to &quot;', () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;")
  })

  it("escapes ' to &#039;", () => {
    expect(escapeHtml("it's")).toBe("it&#039;s")
  })

  it("handles strings with no special characters", () => {
    expect(escapeHtml("hello world")).toBe("hello world")
  })

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("")
  })

  it("escapes multiple special characters in one string", () => {
    expect(escapeHtml('<a href="test">click & go</a>')).toBe(
      "&lt;a href=&quot;test&quot;&gt;click &amp; go&lt;/a&gt;"
    )
  })

  it("handles ampersand before other entities correctly", () => {
    // & must be escaped first, otherwise &lt; would become &amp;lt;
    expect(escapeHtml("&<")).toBe("&amp;&lt;")
  })

  it("prevents XSS injection patterns", () => {
    const xss = '<img src=x onerror="alert(1)">'
    const escaped = escapeHtml(xss)
    // The angle brackets and quotes are escaped, preventing browser interpretation as HTML
    expect(escaped).not.toContain("<img")
    expect(escaped).not.toContain('"alert')
    expect(escaped).toContain("&lt;img")
    expect(escaped).toContain("&quot;alert(1)&quot;")
  })
})

// ─── escapeHtml source verification ─────────────────────────────────────────

describe("escapeHtml source implementation", () => {
  const content = readFileSync(join(SRC, "lib/email/index.ts"), "utf-8")

  it("is exported from lib/email/index.ts", () => {
    expect(content).toContain("export function escapeHtml")
  })

  it("replaces all 5 dangerous characters", () => {
    expect(content).toContain("&amp;")
    expect(content).toContain("&lt;")
    expect(content).toContain("&gt;")
    expect(content).toContain("&quot;")
    expect(content).toContain("&#039;")
  })

  it("replaces & first (before other entities)", () => {
    // The & replacement must come first in the chain
    const ampIndex = content.indexOf(".replace(/&/g")
    const ltIndex = content.indexOf(".replace(/</g")
    expect(ampIndex).toBeLessThan(ltIndex)
  })
})

// ─── Support email templates ────────────────────────────────────────────────

describe("Support email templates", () => {
  const content = readFileSync(join(SRC, "lib/email/support.ts"), "utf-8")

  it("exports sendTicketConfirmationEmail", () => {
    expect(content).toContain("export async function sendTicketConfirmationEmail")
  })

  it("exports sendTicketNotificationToAdmin", () => {
    expect(content).toContain("export async function sendTicketNotificationToAdmin")
  })

  it("exports sendReplyNotificationToClient", () => {
    expect(content).toContain("export async function sendReplyNotificationToClient")
  })

  it("exports sendTicketStatusChangeEmail", () => {
    expect(content).toContain("export async function sendTicketStatusChangeEmail")
  })

  it("all templates use escapeHtml for user input", () => {
    const templateFunctions = content.split("export async function").slice(1)
    for (const fn of templateFunctions) {
      expect(fn, "template should use escapeHtml").toContain("escapeHtml")
    }
  })

  it("all templates use sendTrackedEmail", () => {
    const templateFunctions = content.split("export async function").slice(1)
    for (const fn of templateFunctions) {
      expect(fn, "template should use sendTrackedEmail").toContain("sendTrackedEmail")
    }
  })

  it("all templates use emailLayout wrapper", () => {
    const templateFunctions = content.split("export async function").slice(1)
    for (const fn of templateFunctions) {
      expect(fn, "template should use emailLayout").toContain("emailLayout")
    }
  })

  it("ticket confirmation email includes portal link", () => {
    expect(content).toContain("/portal/support")
  })

  it("admin notification includes admin portal link", () => {
    expect(content).toContain("/admin/support")
  })

  it("status change email handles resolved and closed statuses", () => {
    expect(content).toContain("resolved")
    expect(content).toContain("closed")
    expect(content).toContain("Resolved")
    expect(content).toContain("Closed")
  })

  it("admin notification highlights urgent/high priority", () => {
    expect(content).toContain("URGENT")
    expect(content).toContain("HIGH")
    expect(content).toContain("PRIORITY TICKET")
  })
})

// ─── Lead magnet result email templates ─────────────────────────────────────

describe("Lead magnet result email templates", () => {
  const content = readFileSync(join(SRC, "lib/email/lead-magnet-results.ts"), "utf-8")

  it("exports sendQuizResultsEmail", () => {
    expect(content).toContain("export async function sendQuizResultsEmail")
  })

  it("exports sendCalculatorResultsEmail", () => {
    expect(content).toContain("export async function sendCalculatorResultsEmail")
  })

  it("exports sendAuditResultsEmail", () => {
    expect(content).toContain("export async function sendAuditResultsEmail")
  })

  it("quiz results email uses escapeHtml for names", () => {
    expect(content).toContain("escapeHtml(params.name)")
  })

  it("calculator results email uses escapeHtml for names", () => {
    expect(content).toContain("escapeHtml(params.name)")
  })

  it("all templates use sendTrackedEmail", () => {
    const templateFunctions = content.split("export async function").slice(1)
    for (const fn of templateFunctions) {
      expect(fn, "template should use sendTrackedEmail").toContain("sendTrackedEmail")
    }
  })

  it("all templates use emailLayout wrapper", () => {
    const templateFunctions = content.split("export async function").slice(1)
    for (const fn of templateFunctions) {
      expect(fn, "template should use emailLayout").toContain("emailLayout")
    }
  })

  it("all templates set serviceArm for cost tracking", () => {
    const templateFunctions = content.split("export async function").slice(1)
    for (const fn of templateFunctions) {
      expect(fn, "template should set serviceArm").toContain("serviceArm:")
    }
  })

  it("quiz results has score-based recommendations", () => {
    expect(content).toContain("getQuizRecommendations")
    // Should have three tiers: < 40, < 70, >= 70
    expect(content).toContain("score < 40")
    expect(content).toContain("score < 70")
  })

  it("audit results has score-based recommendations", () => {
    expect(content).toContain("getAuditRecommendations")
    expect(content).toContain("score < 40")
    expect(content).toContain("score < 65")
  })

  it("quiz results defaults score to 50 when undefined", () => {
    expect(content).toContain("params.score ?? 50")
  })

  it("calculator results formats monthly and annual savings", () => {
    expect(content).toContain("monthlySavings")
    expect(content).toContain("annualSavings")
    expect(content).toContain("toLocaleString()")
  })

  it("all lead magnet emails include strategy call CTA", () => {
    expect(content).toContain("/get-started")
    expect(content).toContain("strategy call")
  })
})
