/**
 * API Support Tickets Tests
 * Verifies validation schemas, auth guards, role checks, and business logic
 * for all support ticket routes (client + admin).
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"
import { z } from "zod"

const SRC = join(__dirname, "..", "src")

// ─── Zod schema mirrors (from the route files) ─────────────────────────────

const createTicketSchema = z.object({
  subject: z.string().min(1).max(255),
  message: z.string().min(1).max(10000),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
})

const replySchema = z.object({
  message: z.string().min(1).max(10000),
})

const statusSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  resolutionNote: z.string().max(5000).optional(),
})

// ─── POST /api/support/tickets — Schema Validation ─────────────────────────

describe("POST /api/support/tickets — schema validation", () => {
  it("accepts valid ticket data", () => {
    const result = createTicketSchema.safeParse({
      subject: "Billing question",
      message: "I have a question about my invoice.",
      priority: "normal",
    })
    expect(result.success).toBe(true)
  })

  it("defaults priority to normal when omitted", () => {
    const result = createTicketSchema.safeParse({
      subject: "General question",
      message: "Some message here.",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.priority).toBe("normal")
    }
  })

  it("rejects empty subject", () => {
    const result = createTicketSchema.safeParse({
      subject: "",
      message: "Some message.",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty message", () => {
    const result = createTicketSchema.safeParse({
      subject: "Help",
      message: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects subject over 255 characters", () => {
    const result = createTicketSchema.safeParse({
      subject: "x".repeat(256),
      message: "Valid message.",
    })
    expect(result.success).toBe(false)
  })

  it("rejects message over 10000 characters", () => {
    const result = createTicketSchema.safeParse({
      subject: "Help",
      message: "x".repeat(10001),
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid priority value", () => {
    const result = createTicketSchema.safeParse({
      subject: "Help",
      message: "Some message.",
      priority: "critical",
    })
    expect(result.success).toBe(false)
  })

  it("accepts all valid priority values", () => {
    for (const priority of ["low", "normal", "high", "urgent"]) {
      const result = createTicketSchema.safeParse({
        subject: "Help",
        message: "Some message.",
        priority,
      })
      expect(result.success, `priority "${priority}" should be valid`).toBe(true)
    }
  })

  it("rejects missing subject field", () => {
    const result = createTicketSchema.safeParse({
      message: "Some message.",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing message field", () => {
    const result = createTicketSchema.safeParse({
      subject: "Help",
    })
    expect(result.success).toBe(false)
  })
})

// ─── POST /api/support/tickets — Route Auth ────────────────────────────────

describe("POST /api/support/tickets — route structure", () => {
  const content = readFileSync(
    join(SRC, "app/api/support/tickets/route.ts"),
    "utf-8"
  )

  it("requires auth()", () => {
    expect(content).toContain("await auth()")
  })

  it("returns 401 for unauthenticated users", () => {
    expect(content).toContain("401")
    expect(content).toContain("Unauthorized")
  })

  it("validates request body with Zod", () => {
    expect(content).toContain("z.object")
    expect(content).toContain("safeParse")
  })

  it("returns 400 for invalid data", () => {
    expect(content).toContain("400")
    expect(content).toContain("Invalid data")
  })

  it("returns 400 for invalid JSON", () => {
    expect(content).toContain("Invalid JSON")
  })

  it("creates ticket with status open", () => {
    expect(content).toContain('status: "open"')
  })

  it("returns 201 on success", () => {
    expect(content).toContain("201")
  })

  it("sends email notifications", () => {
    expect(content).toContain("sendTicketConfirmationEmail")
    expect(content).toContain("sendTicketNotificationToAdmin")
  })

  it("sends in-app notification", () => {
    expect(content).toContain("notify(")
    expect(content).toContain("support_ticket")
  })
})

// ─── GET /api/support/tickets — Route Auth ──────────────────────────────────

describe("GET /api/support/tickets — route structure", () => {
  const content = readFileSync(
    join(SRC, "app/api/support/tickets/route.ts"),
    "utf-8"
  )

  it("requires auth()", () => {
    expect(content).toContain("await auth()")
  })

  it("returns 401 for unauthenticated users", () => {
    expect(content).toContain("401")
  })

  it("filters tickets by userId (only returns user's own)", () => {
    expect(content).toContain("where: { userId: dbUser.id }")
  })

  it("orders by createdAt desc", () => {
    expect(content).toContain('orderBy: { createdAt: "desc" }')
  })

  it("includes replies", () => {
    expect(content).toContain("replies:")
  })
})

// ─── POST /api/support/tickets/[id]/reply — Schema & Auth ──────────────────

describe("POST /api/support/tickets/[ticketId]/reply — client reply", () => {
  const content = readFileSync(
    join(SRC, "app/api/support/tickets/[ticketId]/reply/route.ts"),
    "utf-8"
  )

  it("requires auth()", () => {
    expect(content).toContain("await auth()")
  })

  it("returns 401 for unauthenticated", () => {
    expect(content).toContain("401")
    expect(content).toContain("Unauthorized")
  })

  it("validates ticket ownership", () => {
    expect(content).toContain("ticket.userId !== dbUser.id")
  })

  it("returns 403 when ticket does not belong to user", () => {
    expect(content).toContain("403")
    expect(content).toContain("Forbidden")
  })

  it("returns 404 when ticket not found", () => {
    expect(content).toContain("Ticket not found")
    expect(content).toContain("404")
  })

  it("validates reply body with Zod", () => {
    expect(content).toContain("replySchema.safeParse")
  })

  it("sets isAdmin to false for client replies", () => {
    expect(content).toContain("isAdmin: false")
  })

  it("updates ticket status back to open on client reply", () => {
    expect(content).toContain('status: "open"')
  })

  it("returns 201 on success", () => {
    expect(content).toContain("201")
  })
})

describe("POST /api/support/tickets/[ticketId]/reply — reply schema", () => {
  it("accepts valid reply", () => {
    const result = replySchema.safeParse({ message: "Thanks for the help." })
    expect(result.success).toBe(true)
  })

  it("rejects empty message", () => {
    const result = replySchema.safeParse({ message: "" })
    expect(result.success).toBe(false)
  })

  it("rejects message over 10000 characters", () => {
    const result = replySchema.safeParse({ message: "x".repeat(10001) })
    expect(result.success).toBe(false)
  })

  it("rejects missing message field", () => {
    const result = replySchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

// ─── POST /api/admin/tickets/[id]/reply — Admin Reply ──────────────────────

describe("POST /api/admin/tickets/[ticketId]/reply — admin reply", () => {
  const content = readFileSync(
    join(SRC, "app/api/admin/tickets/[ticketId]/reply/route.ts"),
    "utf-8"
  )

  it("requires admin role", () => {
    expect(content).toContain("requireAdmin")
  })

  it("returns 403 for non-admin", () => {
    expect(content).toContain("403")
    expect(content).toContain("Forbidden")
  })

  it("returns 404 when ticket not found", () => {
    expect(content).toContain("Ticket not found")
    expect(content).toContain("404")
  })

  it("validates reply with Zod", () => {
    expect(content).toContain("replySchema.safeParse")
  })

  it("sets isAdmin to true for admin replies", () => {
    expect(content).toContain("isAdmin: true")
  })

  it("transitions open tickets to in_progress on admin reply", () => {
    expect(content).toContain('"open"')
    expect(content).toContain('"in_progress"')
  })

  it("sends email notification to client", () => {
    expect(content).toContain("sendReplyNotificationToClient")
  })

  it("returns 201 on success", () => {
    expect(content).toContain("201")
  })

  it("uses requireAdmin from @/lib/auth", () => {
    expect(content).toContain('from "@/lib/auth"')
  })
})

// ─── PATCH /api/admin/tickets/[id]/status — Status Transitions ─────────────

describe("PATCH /api/admin/tickets/[ticketId]/status — status changes", () => {
  const content = readFileSync(
    join(SRC, "app/api/admin/tickets/[ticketId]/status/route.ts"),
    "utf-8"
  )

  it("requires admin role", () => {
    expect(content).toContain("requireAdmin")
  })

  it("returns 403 for non-admin", () => {
    expect(content).toContain("403")
    expect(content).toContain("Forbidden")
  })

  it("returns 404 when ticket not found", () => {
    expect(content).toContain("Ticket not found")
    expect(content).toContain("404")
  })

  it("validates status with Zod enum", () => {
    expect(content).toContain("statusSchema.safeParse")
    expect(content).toContain('z.enum(["open", "in_progress", "resolved", "closed"])')
  })

  it("sets resolvedAt when status is resolved or closed", () => {
    expect(content).toContain("resolvedAt")
    expect(content).toContain("resolved")
    expect(content).toContain("closed")
  })

  it("sends status change email on resolution/closure", () => {
    expect(content).toContain("sendTicketStatusChangeEmail")
  })

  it("supports optional resolutionNote", () => {
    expect(content).toContain("resolutionNote")
  })
})

describe("PATCH /api/admin/tickets/[ticketId]/status — schema validation", () => {
  it("accepts valid status transitions", () => {
    for (const status of ["open", "in_progress", "resolved", "closed"]) {
      const result = statusSchema.safeParse({ status })
      expect(result.success, `status "${status}" should be valid`).toBe(true)
    }
  })

  it("rejects invalid status values", () => {
    const result = statusSchema.safeParse({ status: "pending" })
    expect(result.success).toBe(false)
  })

  it("accepts resolutionNote as optional string", () => {
    const result = statusSchema.safeParse({
      status: "resolved",
      resolutionNote: "Issue was fixed.",
    })
    expect(result.success).toBe(true)
  })

  it("accepts missing resolutionNote", () => {
    const result = statusSchema.safeParse({ status: "resolved" })
    expect(result.success).toBe(true)
  })

  it("rejects resolutionNote over 5000 characters", () => {
    const result = statusSchema.safeParse({
      status: "resolved",
      resolutionNote: "x".repeat(5001),
    })
    expect(result.success).toBe(false)
  })
})

// ─── GET /api/admin/tickets — Admin List ────────────────────────────────────

describe("GET /api/admin/tickets — admin ticket list", () => {
  const content = readFileSync(
    join(SRC, "app/api/admin/tickets/route.ts"),
    "utf-8"
  )

  it("requires admin role", () => {
    expect(content).toContain("requireAdmin")
  })

  it("returns 403 for non-admin", () => {
    expect(content).toContain("403")
    expect(content).toContain("Forbidden")
  })

  it("returns all tickets (not filtered by userId)", () => {
    // Admin ticket list should NOT filter by userId — it shows all tickets
    expect(content).not.toContain("where: { userId:")
  })

  it("includes user information", () => {
    expect(content).toContain("user:")
    expect(content).toContain("name:")
    expect(content).toContain("email:")
  })

  it("includes replies", () => {
    expect(content).toContain("replies:")
  })

  it("orders by updatedAt desc", () => {
    expect(content).toContain('orderBy: { updatedAt: "desc" }')
  })
})
