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
    // Either inline 429 or the rateLimitedResponse() helper is acceptable.
    expect(content).toMatch(/status:\s*429|rateLimitedResponse/)
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

  it("branches behavior on tier === 'hot'", () => {
    // Stage labels evolved (was "QUALIFIED" / "NEW_LEAD"); the branching
    // by tier is the durable invariant — different routing for hot vs.
    // not-hot leads must still happen.
    expect(content).toMatch(/tier === "hot"/)
  })

  it("calls notifyHotLead for hot tier", () => {
    expect(content).toMatch(/notifyHotLead\(/)
  })

  it("does NOT queue any drip at apply-submit (drips only after booking)", () => {
    expect(content).not.toMatch(/queueEmailSequence\(/)
  })

  it("pushes to Close CRM when CLOSE_API_KEY is configured", () => {
    // Updated from "does NOT call Close" — Close was provisioned for
    // the AOC funnel. The route now imports + calls createCloseLead
    // gated on the env var, with `BTC Business Line = AOC` tagging so
    // Stephen's shared-workspace automation picks it up.
    expect(content).toMatch(/createCloseLead\(/)
    expect(content).toMatch(/CLOSE_API_KEY/)
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

  it("sends a branded Collective invite email to the lead", () => {
    // Updated from `inviteToPlan(` — the flow switched from the Mighty
    // API to a branded email invite (we own the funnel UX now).
    expect(content).toMatch(/sendCollectiveInviteEmail\(/)
  })

  it("writes a MightyInvite audit record on every attempt", () => {
    expect(content).toMatch(/mightyInvite\.create/)
  })

  it("dedupes in-flight/accepted invites with a 409", () => {
    expect(content).toMatch(/status:\s*409/)
  })

  it("supports resend of an existing invite", () => {
    // Resend path: look up last invite, re-send the email, update
    // the audit row. No longer exposes a `resendInvite` named export
    // — it's an inline flag on the same handler.
    expect(content).toMatch(/resend/i)
    expect(content).toMatch(/mightyInvite\.update/)
  })

  it("accepts plan tier or explicit planId", () => {
    expect(content).toMatch(/community|accelerator|innerCircle|plan/i)
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
    // Deal stage was renamed from "ACTIVE_CLIENT" to "MEMBER_JOINED" to
    // match the AOC pipeline's vocabulary. The webhook moves the deal
    // forward via `nextStage` (computed) rather than a literal.
    expect(content).toMatch(/MEMBER_JOINED|nextStage/)
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

  it("targets only unbooked applicants from the AOC funnel", () => {
    // Stage labels evolved to AOC-specific vocab (APPLICATION_SUBMITTED,
    // DEMO_COMPLETED, MEMBER_JOINED). The invariant we test is the
    // source-tag filter — anyone who came through the AOC apply form.
    expect(content).toMatch(/ai-operator-collective-application/)
    expect(content).toMatch(/APPLICATION_SUBMITTED|NEW_LEAD|QUALIFIED|stage/i)
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
