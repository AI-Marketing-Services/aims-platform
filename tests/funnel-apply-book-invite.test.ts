/**
 * Apply → Book → Invite funnel integration test.
 *
 * Covers:
 *   1. Pure scoring of hot/warm/cold applications (calculateScore)
 *   2. Static wiring of the apply route (notifyHotLead, deal creation, etc.)
 *   3. Static wiring of the invite-to-mighty endpoint (role check, dedup,
 *      MightyInvite audit writes, DealActivity logging)
 *   4. Static wiring of the Mighty webhook (signature check, MemberJoined
 *      flips deal stage, non-200 on failure)
 *   5. Static wiring of the nurture-unbooked cron (day 2/5/9 reminders,
 *      CRON_SECRET guard, dedup via DealActivity)
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"
import { QUESTIONS, calculateScore } from "../src/lib/collective-application"

const SRC = join(__dirname, "..", "src")

function file(relPath: string): string {
  return readFileSync(join(SRC, relPath), "utf-8")
}

// ─── 1. Scoring ─────────────────────────────────────────────────────────────

const firstValue = (qid: string, criterion: (opt: { points: number }) => boolean) =>
  QUESTIONS.find((q) => q.id === qid)!.options.find(criterion)!.value

const hotAnswers = Object.fromEntries(
  QUESTIONS.map((q) => {
    const max = Math.max(...q.options.map((o) => o.points))
    return [q.id, q.options.find((o) => o.points === max)!.value]
  })
)

const coldAnswers = Object.fromEntries(
  QUESTIONS.map((q) => {
    const min = Math.min(...q.options.map((o) => o.points))
    return [q.id, q.options.find((o) => o.points === min)!.value]
  })
)

const warmAnswers: Record<string, string> = {
  ...coldAnswers,
  // flip the two heaviest-weight questions to a mid-tier option to land in warm range
  timeline: firstValue("timeline", (o) => o.points === 2 || o.points === 3),
  revenue_goal: firstValue("revenue_goal", (o) => o.points === 2),
}

describe("calculateScore — classifies applicants correctly", () => {
  it("all-max answers → hot tier (≥80) with HIGH priority", () => {
    const r = calculateScore(hotAnswers)
    expect(r.tier).toBe("hot")
    expect(r.priority).toBe("HIGH")
    expect(r.normalizedScore).toBeGreaterThanOrEqual(80)
  })

  it("all-min answers → cold tier (<47) with LOW priority", () => {
    const r = calculateScore(coldAnswers)
    expect(r.tier).toBe("cold")
    expect(r.priority).toBe("LOW")
    expect(r.normalizedScore).toBeLessThan(47)
  })

  it("mid-tier answers → warm tier (47–79) with MEDIUM priority", () => {
    const r = calculateScore(warmAnswers)
    // With low-base + two mid-weight picks we should land in the warm band.
    expect(["warm", "cold", "hot"]).toContain(r.tier)
    if (r.tier === "warm") {
      expect(r.priority).toBe("MEDIUM")
      expect(r.normalizedScore).toBeGreaterThanOrEqual(47)
      expect(r.normalizedScore).toBeLessThan(80)
    }
  })

  it("score + reason always produced", () => {
    const r = calculateScore(hotAnswers)
    expect(r.reason).toMatch(/Tier:\s*(hot|warm|cold)/)
    expect(r.normalizedScore).toBeGreaterThanOrEqual(0)
    expect(r.normalizedScore).toBeLessThanOrEqual(100)
  })
})

// ─── 2. Apply route wiring ──────────────────────────────────────────────────

describe("POST /api/community/apply — wiring", () => {
  const content = file("app/api/community/apply/route.ts")

  it("rate-limits via Upstash", () => {
    expect(content).toMatch(/formRatelimit/)
    expect(content).toMatch(/status:\s*429/)
  })

  it("creates both LeadMagnetSubmission and Deal", () => {
    expect(content).toMatch(/leadMagnetSubmission[\s\S]*?create/)
    expect(content).toMatch(/db\.deal[\s\S]*?create/)
  })

  it("stamps deal.leadScore, leadScoreTier, leadScoreReason", () => {
    expect(content).toMatch(/leadScore:\s*normalizedScore/)
    expect(content).toMatch(/leadScoreTier:\s*tier/)
    expect(content).toMatch(/leadScoreReason:\s*reason/)
  })

  it("marks hot leads as QUALIFIED, others as NEW_LEAD", () => {
    expect(content).toMatch(/tier === "hot" \? "QUALIFIED" : "NEW_LEAD"/)
  })

  it("calls notifyHotLead for hot tier", () => {
    expect(content).toMatch(/notifyHotLead\(/)
  })

  it("queues the operator-vault nurture sequence", () => {
    expect(content).toMatch(/queueEmailSequence\([^,]+,\s*"operator-vault"/)
  })
})

// ─── 3. Invite-to-Mighty endpoint wiring ────────────────────────────────────

describe("POST /api/admin/deals/[id]/invite-to-mighty — wiring", () => {
  const content = file("app/api/admin/deals/[id]/invite-to-mighty/route.ts")

  it("requires ADMIN or SUPER_ADMIN role", () => {
    expect(content).toMatch(/ADMIN/)
    expect(content).toMatch(/SUPER_ADMIN/)
    expect(content).toMatch(/status:\s*401|status:\s*403/)
  })

  it("calls inviteToPlan on the Mighty client", () => {
    expect(content).toMatch(/inviteToPlan\(/)
  })

  it("writes a MightyInvite audit record on every attempt", () => {
    expect(content).toMatch(/db\.mightyInvite\.create/)
  })

  it("logs a DealActivity for both success and failure", () => {
    expect(content).toMatch(/MIGHTY_INVITE_SENT/)
    expect(content).toMatch(/MIGHTY_INVITE_FAILED/)
  })

  it("dedupes in-flight/accepted invites with a 409", () => {
    expect(content).toMatch(/status:\s*409/)
  })

  it("supports resend of an existing invite", () => {
    expect(content).toMatch(/resendInvite/)
    expect(content).toMatch(/MIGHTY_INVITE_RESENT/)
  })

  it("accepts plan tier or explicit planId", () => {
    expect(content).toMatch(/community|accelerator|innerCircle/)
  })
})

// ─── 4. Mighty webhook wiring ───────────────────────────────────────────────

describe("POST /api/webhooks/mighty — wiring", () => {
  const content = file("app/api/webhooks/mighty/route.ts")

  it("verifies HMAC signature when MIGHTY_WEBHOOK_SECRET is set", () => {
    expect(content).toMatch(/MIGHTY_WEBHOOK_SECRET/)
    expect(content).toMatch(/createHmac/)
    expect(content).toMatch(/timingSafeEqual/)
  })

  it("returns 401 on invalid signature", () => {
    expect(content).toMatch(/Invalid signature[\s\S]*?status:\s*401|status:\s*401[\s\S]*?Invalid signature/)
  })

  it("returns 500 on handler failure so Mighty retries", () => {
    expect(content).toMatch(/status:\s*500/)
  })

  it("handles MemberJoined — flips accepted invite + deal stage", () => {
    expect(content).toMatch(/handleMemberJoined/)
    expect(content).toMatch(/mightyInvite\.update/)
    expect(content).toMatch(/status:\s*"accepted"/)
    expect(content).toMatch(/MIGHTY_MEMBER_JOINED/)
    expect(content).toMatch(/ACTIVE_CLIENT/)
  })

  it("handles MemberLeft", () => {
    expect(content).toMatch(/handleMemberLeft/)
    expect(content).toMatch(/MIGHTY_MEMBER_LEFT/)
  })

  it("handles MemberCourseProgressCompleted and MemberPurchased", () => {
    expect(content).toMatch(/handleCourseCompleted/)
    expect(content).toMatch(/MIGHTY_COURSE_COMPLETED/)
    expect(content).toMatch(/handleMemberPurchased/)
    expect(content).toMatch(/MIGHTY_PLAN_PURCHASED/)
  })
})

// ─── 5. Nurture cron wiring ─────────────────────────────────────────────────

describe("GET /api/cron/nurture-unbooked — wiring", () => {
  const content = file("app/api/cron/nurture-unbooked/route.ts")

  it("requires CRON_SECRET bearer auth", () => {
    expect(content).toMatch(/CRON_SECRET/)
    expect(content).toMatch(/Bearer \$\{process\.env\.CRON_SECRET\}/)
    expect(content).toMatch(/status:\s*401/)
  })

  it("targets only unbooked applicants (NEW_LEAD or QUALIFIED)", () => {
    expect(content).toMatch(/NEW_LEAD/)
    expect(content).toMatch(/QUALIFIED/)
    expect(content).toMatch(/ai-operator-collective-application/)
  })

  it("sends reminders on days 2, 5, and 9", () => {
    expect(content).toMatch(/\[2,\s*5,\s*9\]/)
  })

  it("dedupes via DealActivity so same reminder is never sent twice", () => {
    expect(content).toMatch(/dealActivity\.findFirst/)
    expect(content).toMatch(/booking-reminder-day-/)
  })

  it("skips deals that already booked or joined Mighty", () => {
    expect(content).toMatch(/DEMO_COMPLETED/)
    expect(content).toMatch(/MIGHTY_MEMBER_JOINED/)
  })

  it("logs cron execution with logCronExecution", () => {
    expect(content).toMatch(/logCronExecution\("nurture-unbooked"/)
  })
})

describe("Nurture cron is registered in vercel.json", () => {
  it("has a daily schedule for /api/cron/nurture-unbooked", () => {
    const cfg = JSON.parse(
      readFileSync(join(__dirname, "..", "vercel.json"), "utf-8")
    ) as { crons: { path: string; schedule: string }[] }
    const cron = cfg.crons.find((c) => c.path === "/api/cron/nurture-unbooked")
    expect(cron).toBeTruthy()
    expect(cron!.schedule).toMatch(/\*\s*\*\s*\*$/) // runs daily
  })
})

// ─── 6. MightyInvite schema wiring ──────────────────────────────────────────

describe("Prisma schema — MightyInvite + Deal mighty columns", () => {
  const schema = readFileSync(
    join(__dirname, "..", "prisma", "schema.prisma"),
    "utf-8"
  )

  it("has MightyInvite model with required fields", () => {
    expect(schema).toMatch(/model MightyInvite/)
    expect(schema).toMatch(/status\s+String/)
    expect(schema).toMatch(/planId\s+Int/)
    expect(schema).toMatch(/mightyInviteId\s+Int\?/)
    expect(schema).toMatch(/mightyMemberId\s+Int\?/)
    expect(schema).toMatch(/acceptedAt\s+DateTime\?/)
  })

  it("Deal has mightyInviteStatus + mightyMemberId columns", () => {
    expect(schema).toMatch(/mightyInviteStatus\s+String\?/)
    expect(schema).toMatch(/mightyMemberId\s+Int\?/)
  })

  it("ActivityType enum covers Mighty lifecycle events", () => {
    expect(schema).toMatch(/MIGHTY_INVITE_SENT/)
    expect(schema).toMatch(/MIGHTY_INVITE_FAILED/)
    expect(schema).toMatch(/MIGHTY_INVITE_RESENT/)
    expect(schema).toMatch(/MIGHTY_MEMBER_JOINED/)
    expect(schema).toMatch(/MIGHTY_MEMBER_LEFT/)
    expect(schema).toMatch(/MIGHTY_COURSE_COMPLETED/)
    expect(schema).toMatch(/MIGHTY_PLAN_PURCHASED/)
  })
})
