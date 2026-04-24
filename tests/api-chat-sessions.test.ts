/**
 * API Chat Sessions Tests
 * Verifies sessionId validation, email handling per route type,
 * rate limiting patterns, and input validation for all AI chat routes.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"

const SRC = join(__dirname, "..", "src")

// ─── Session ID regex (mirrored from lib/db/chat-sessions.ts) ──────────────

const SESSION_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/

describe("Chat session ID validation", () => {
  it("accepts valid 8-character alphanumeric sessionId", () => {
    expect(SESSION_ID_RE.test("abcd1234")).toBe(true)
  })

  it("accepts valid 64-character sessionId", () => {
    expect(SESSION_ID_RE.test("a".repeat(64))).toBe(true)
  })

  it("accepts sessionId with hyphens and underscores", () => {
    expect(SESSION_ID_RE.test("abc-def_1234")).toBe(true)
  })

  it("accepts mixed case sessionId", () => {
    expect(SESSION_ID_RE.test("AbCdEfGh")).toBe(true)
  })

  it("rejects sessionId shorter than 8 characters", () => {
    expect(SESSION_ID_RE.test("abc1234")).toBe(false)
  })

  it("rejects sessionId longer than 64 characters", () => {
    expect(SESSION_ID_RE.test("a".repeat(65))).toBe(false)
  })

  it("rejects sessionId with spaces", () => {
    expect(SESSION_ID_RE.test("abcd 1234")).toBe(false)
  })

  it("rejects sessionId with special characters", () => {
    expect(SESSION_ID_RE.test("abcd!@#$")).toBe(false)
  })

  it("rejects empty string", () => {
    expect(SESSION_ID_RE.test("")).toBe(false)
  })

  it("rejects sessionId with dots", () => {
    expect(SESSION_ID_RE.test("abcd.1234")).toBe(false)
  })
})

// ─── Intake chat route ─────────────────────────────────────────────────────

describe("POST /api/ai/intake-chat — route structure", () => {
  const content = readFileSync(
    join(SRC, "app/api/ai/intake-chat/route.ts"),
    "utf-8"
  )

  it("does not require auth (public route)", () => {
    // intake-chat is public, should not import or call auth()
    expect(content).not.toContain("await auth()")
  })

  it("has rate limiting", () => {
    expect(content).toContain("chatRatelimit")
    expect(content).toContain("limit(")
  })

  it("returns 429 when rate limited", () => {
    expect(content).toContain("429")
    expect(content).toContain("Too many requests")
  })

  it("validates messages is an array", () => {
    expect(content).toContain("Array.isArray(rawMessages)")
    expect(content).toContain("messages must be an array")
  })

  it("returns 400 for invalid request body", () => {
    expect(content).toContain("400")
    expect(content).toContain("Invalid request body")
  })

  it("accepts sessionId from request body", () => {
    expect(content).toContain("sessionId")
    expect(content).toContain("body?.sessionId")
  })

  it("accepts email on intake route", () => {
    expect(content).toContain("email")
    expect(content).toContain("body?.email")
  })

  it("calls upsertChatSession with source intake", () => {
    expect(content).toContain("upsertChatSession")
    expect(content).toContain('source: "intake"')
  })

  it("drops leading assistant messages", () => {
    expect(content).toContain("firstUserIdx")
    expect(content).toContain('role === "user"')
  })

  it("limits messages to MAX_MESSAGES", () => {
    expect(content).toContain("MAX_MESSAGES")
    expect(content).toContain(".slice(-MAX_MESSAGES)")
  })

  it("returns 503 when API key not configured", () => {
    expect(content).toContain("503")
    expect(content).toContain("AI not configured")
  })
})

// ─── Onboarding chat route ──────────────────────────────────────────────────

describe("POST /api/ai/onboarding-chat — route structure", () => {
  const content = readFileSync(
    join(SRC, "app/api/ai/onboarding-chat/route.ts"),
    "utf-8"
  )

  it("does not require auth (public route)", () => {
    expect(content).not.toContain("await auth()")
  })

  it("has rate limiting", () => {
    expect(content).toContain("chatRatelimit")
  })

  it("accepts email on onboarding route", () => {
    expect(content).toContain("email")
    expect(content).toContain("body?.email")
  })

  it("calls upsertChatSession with source onboarding", () => {
    expect(content).toContain("upsertChatSession")
    expect(content).toContain('source: "onboarding"')
  })

  it("drops leading assistant messages", () => {
    expect(content).toContain("firstUserIdx")
  })

  it("returns 503 when API key not configured", () => {
    expect(content).toContain("503")
    expect(content).toContain("AI not configured")
  })
})

// ─── Portal chat route ──────────────────────────────────────────────────────

describe("POST /api/ai/portal-chat — route structure", () => {
  const content = readFileSync(
    join(SRC, "app/api/ai/portal-chat/route.ts"),
    "utf-8"
  )

  it("requires auth (protected route)", () => {
    expect(content).toContain("await auth()")
  })

  it("returns 401 for unauthenticated users", () => {
    expect(content).toContain("401")
    expect(content).toContain("Unauthorized")
  })

  it("does NOT accept email parameter", () => {
    // Portal chat uses authenticated userId, should not accept email
    // The route reads sessionId but not email from the body
    const bodyParsing = content.split("body = await req.json()")[1]?.split("if (!Array.isArray")[0] ?? ""
    expect(bodyParsing).not.toContain("body?.email")
  })

  it("calls upsertChatSession with source portal", () => {
    expect(content).toContain("upsertChatSession")
    expect(content).toContain('source: "portal"')
  })

  it("passes clerkUserId to upsertChatSession", () => {
    expect(content).toContain("clerkUserId")
  })

  it("has rate limiting per authenticated user", () => {
    expect(content).toContain("chatRatelimit")
    expect(content).toContain("portal-chat")
  })

  it("fetches member context from database", () => {
    // Portal chat was re-scoped from "service buyer" to "collective member";
    // we now fetch member identity + open support tickets, not subscriptions.
    expect(content).toContain("clientContext")
    expect(content).toContain("supportTickets")
  })

  it("has create_ticket tool", () => {
    expect(content).toContain("create_ticket")
    expect(content).toContain("supportTicket.create")
  })

  it("has search_knowledge tool (Mighty knowledge base)", () => {
    // Replaced suggest_service — that pitched /portal/marketplace which
    // isn't open to members yet. New tool queries the Mighty-backed
    // knowledge index (scaffolded, returns empty until ingestion lands).
    expect(content).toContain("search_knowledge")
    expect(content).toContain("searchKnowledge")
  })

  it("does not pitch services or the marketplace", () => {
    // Hard guard: the portal chat route must not reference services or
    // the marketplace. Those surfaces aren't accessible to members yet.
    expect(content).not.toContain("suggest_service")
    expect(content).not.toContain("/portal/marketplace")
    expect(content).not.toContain("AIMS_KNOWLEDGE_BASE")
  })

  it("drops leading assistant messages", () => {
    expect(content).toContain("firstUserIdx")
  })
})

// ─── Marketing chat route ───────────────────────────────────────────────────

describe("POST /api/ai/chat — marketing chat route", () => {
  const content = readFileSync(
    join(SRC, "app/api/ai/chat/route.ts"),
    "utf-8"
  )

  it("does not require auth (public route)", () => {
    expect(content).not.toContain("import { auth }")
  })

  it("has rate limiting", () => {
    expect(content).toContain("chatRatelimit")
  })

  it("accepts sessionId from request body", () => {
    expect(content).toContain("sessionId")
  })

  it("calls upsertChatSession with source marketing", () => {
    expect(content).toContain("upsertChatSession")
    expect(content).toContain('source: "marketing"')
  })

  it("has capture_lead tool", () => {
    expect(content).toContain("capture_lead")
  })

  it("has get_booking_link tool", () => {
    expect(content).toContain("get_booking_link")
  })

  it("drops leading assistant messages", () => {
    expect(content).toContain("firstUserIdx")
  })

  it("returns 503 when API key not configured", () => {
    expect(content).toContain("503")
  })
})

// ─── Chat session upsert logic ──────────────────────────────────────────────

describe("Chat session upsert logic", () => {
  const content = readFileSync(
    join(SRC, "lib/db/chat-sessions.ts"),
    "utf-8"
  )

  it("validates sessionId with regex before DB operation", () => {
    expect(content).toContain("SESSION_ID_RE.test(sessionId)")
  })

  it("returns early for invalid sessionId (no throw)", () => {
    expect(content).toContain("if (!SESSION_ID_RE.test(sessionId)) return")
  })

  it("uses upsert pattern (create or update)", () => {
    expect(content).toContain("chatSession.upsert")
  })

  it("stores messages as JSON", () => {
    expect(content).toContain("JSON.parse(JSON.stringify(messages))")
  })

  it("tracks message count", () => {
    expect(content).toContain("messageCount: messages.length")
  })

  it("conditionally updates email (only when provided)", () => {
    expect(content).toContain("...(email ? { email } : {})")
  })

  it("catches and logs errors without throwing", () => {
    expect(content).toContain("catch (error)")
    expect(content).toContain("logger.error")
  })
})
