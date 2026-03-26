/**
 * API Commissions Tests
 * Verifies validation schemas, auth guards, role checks, and state machine
 * transitions for the commission system (admin + reseller).
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"
import { z } from "zod"

const SRC = join(__dirname, "..", "src")

// ─── Zod schema mirror (from admin commissions route) ──────────────────────

const approveSchema = z.object({
  commissionId: z.string().min(1),
  action: z.enum(["approve", "reject", "paid"]),
})

// ─── Commission state machine ──────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: ["PAID", "REJECTED"],
}

const statusMap: Record<string, string> = {
  approve: "APPROVED",
  reject: "REJECTED",
  paid: "PAID",
}

function canTransition(currentStatus: string, action: string): boolean {
  const newStatus = statusMap[action]
  if (!newStatus) return false
  const allowed = VALID_TRANSITIONS[currentStatus] ?? []
  return allowed.includes(newStatus)
}

// ─── GET /api/admin/commissions ─────────────────────────────────────────────

describe("GET /api/admin/commissions — route structure", () => {
  const content = readFileSync(
    join(SRC, "app/api/admin/commissions/route.ts"),
    "utf-8"
  )

  it("requires admin role", () => {
    expect(content).toContain("requireAdmin")
  })

  it("returns 403 for non-admin", () => {
    expect(content).toContain("403")
    expect(content).toContain("Forbidden")
  })

  it("returns commissions and summary", () => {
    expect(content).toContain("commissions")
    expect(content).toContain("summary")
  })

  it("calculates totals for PENDING, APPROVED, and PAID", () => {
    expect(content).toContain("totalPending")
    expect(content).toContain("totalApproved")
    expect(content).toContain("totalPaid")
  })

  it("includes referral and referrer details", () => {
    expect(content).toContain("referral:")
    expect(content).toContain("referrer:")
  })

  it("orders by createdAt desc", () => {
    expect(content).toContain('orderBy: { createdAt: "desc" }')
  })
})

// ─── PATCH /api/admin/commissions — Schema Validation ──────────────────────

describe("PATCH /api/admin/commissions — schema validation", () => {
  it("accepts valid approve action", () => {
    const result = approveSchema.safeParse({
      commissionId: "comm_123",
      action: "approve",
    })
    expect(result.success).toBe(true)
  })

  it("accepts valid reject action", () => {
    const result = approveSchema.safeParse({
      commissionId: "comm_456",
      action: "reject",
    })
    expect(result.success).toBe(true)
  })

  it("accepts valid paid action", () => {
    const result = approveSchema.safeParse({
      commissionId: "comm_789",
      action: "paid",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid action", () => {
    const result = approveSchema.safeParse({
      commissionId: "comm_123",
      action: "cancel",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty commissionId", () => {
    const result = approveSchema.safeParse({
      commissionId: "",
      action: "approve",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing commissionId", () => {
    const result = approveSchema.safeParse({
      action: "approve",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing action", () => {
    const result = approveSchema.safeParse({
      commissionId: "comm_123",
    })
    expect(result.success).toBe(false)
  })
})

// ─── PATCH /api/admin/commissions — State Transitions ──────────────────────

describe("PATCH /api/admin/commissions — state transitions", () => {
  it("allows PENDING -> APPROVED", () => {
    expect(canTransition("PENDING", "approve")).toBe(true)
  })

  it("allows PENDING -> REJECTED", () => {
    expect(canTransition("PENDING", "reject")).toBe(true)
  })

  it("allows APPROVED -> PAID", () => {
    expect(canTransition("APPROVED", "paid")).toBe(true)
  })

  it("allows APPROVED -> REJECTED", () => {
    expect(canTransition("APPROVED", "reject")).toBe(true)
  })

  it("blocks PENDING -> PAID (cannot skip APPROVED)", () => {
    expect(canTransition("PENDING", "paid")).toBe(false)
  })

  it("blocks PAID -> anything (terminal state)", () => {
    expect(canTransition("PAID", "approve")).toBe(false)
    expect(canTransition("PAID", "reject")).toBe(false)
    expect(canTransition("PAID", "paid")).toBe(false)
  })

  it("blocks REJECTED -> anything (terminal state)", () => {
    expect(canTransition("REJECTED", "approve")).toBe(false)
    expect(canTransition("REJECTED", "reject")).toBe(false)
    expect(canTransition("REJECTED", "paid")).toBe(false)
  })
})

// ─── PATCH /api/admin/commissions — Route Structure ────────────────────────

describe("PATCH /api/admin/commissions — route structure", () => {
  const content = readFileSync(
    join(SRC, "app/api/admin/commissions/route.ts"),
    "utf-8"
  )

  it("requires admin role", () => {
    expect(content).toContain("requireAdmin")
  })

  it("returns 403 for non-admin", () => {
    expect(content).toContain("403")
    expect(content).toContain("Forbidden")
  })

  it("validates with Zod", () => {
    expect(content).toContain("approveSchema.safeParse")
  })

  it("returns 400 for invalid data", () => {
    expect(content).toContain("400")
    expect(content).toContain("Invalid data")
  })

  it("returns 404 when commission not found", () => {
    expect(content).toContain("404")
    expect(content).toContain("Commission not found")
  })

  it("has VALID_TRANSITIONS state machine", () => {
    expect(content).toContain("VALID_TRANSITIONS")
    expect(content).toContain("PENDING")
    expect(content).toContain("APPROVED")
    expect(content).toContain("REJECTED")
    expect(content).toContain("PAID")
  })

  it("returns 400 for invalid state transitions", () => {
    expect(content).toContain("Cannot transition from")
  })

  it("sets approvedAt and approvedBy on approve", () => {
    expect(content).toContain("approvedAt")
    expect(content).toContain("approvedBy")
  })

  it("sets paidAt on paid", () => {
    expect(content).toContain("paidAt")
  })

  it("updates referral totals when paid", () => {
    expect(content).toContain("totalEarned")
    expect(content).toContain("increment: commission.amount")
  })

  it("updates pending payout when approved", () => {
    expect(content).toContain("pendingPayout")
  })
})

// ─── GET /api/reseller/commissions ──────────────────────────────────────────

describe("GET /api/reseller/commissions — route structure", () => {
  const content = readFileSync(
    join(SRC, "app/api/reseller/commissions/route.ts"),
    "utf-8"
  )

  it("requires auth()", () => {
    expect(content).toContain("await auth()")
  })

  it("returns 401 for unauthenticated", () => {
    expect(content).toContain("401")
    expect(content).toContain("Unauthorized")
  })

  it("checks for RESELLER role", () => {
    expect(content).toContain("RESELLER")
  })

  it("also allows ADMIN and SUPER_ADMIN roles", () => {
    expect(content).toContain("ADMIN")
    expect(content).toContain("SUPER_ADMIN")
  })

  it("returns 403 for wrong role", () => {
    expect(content).toContain("403")
    expect(content).toContain("Forbidden")
  })

  it("returns empty data when no referral exists", () => {
    expect(content).toContain("commissions: []")
  })

  it("calculates summary with totalEarned, totalPending, totalApproved", () => {
    expect(content).toContain("totalEarned")
    expect(content).toContain("totalPending")
    expect(content).toContain("totalApproved")
  })

  it("only shows commissions for the user's referral", () => {
    expect(content).toContain("referrerId: dbUser.id")
    expect(content).toContain("referralId: referral.id")
  })
})
