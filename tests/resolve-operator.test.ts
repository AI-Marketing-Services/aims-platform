/**
 * Tests for the operator-resolution helper. We mock @/lib/db so we
 * can verify the host-parsing + lookup ordering without hitting Neon.
 */
import { afterEach, describe, expect, it, vi } from "vitest"

// `server-only` throws when imported from a non-server context. In the
// Vitest environment we're outside Next's RSC graph, so swap in a noop.
vi.mock("server-only", () => ({}))

vi.mock("@/lib/db", () => {
  const findFirst = vi.fn()
  return {
    db: { operatorSite: { findFirst } },
  }
})

import { db } from "@/lib/db"
import { resolveOperatorFromRequest } from "@/lib/tenant/resolve-operator"

const findFirst = (db as unknown as {
  operatorSite: { findFirst: ReturnType<typeof vi.fn> }
}).operatorSite.findFirst

afterEach(() => {
  findFirst.mockReset()
})

function fakeReq(headers: Record<string, string>): Request {
  return new Request("https://www.aioperatorcollective.com/api/lead-magnets/submit", {
    method: "POST",
    headers,
  })
}

describe("resolveOperatorFromRequest", () => {
  it("returns null for a platform-host request with no overrides", async () => {
    const result = await resolveOperatorFromRequest(
      fakeReq({ host: "www.aioperatorcollective.com" }),
    )
    expect(result).toBeNull()
    expect(findFirst).not.toHaveBeenCalled()
  })

  it("resolves by subdomain from x-forwarded-host", async () => {
    findFirst.mockResolvedValueOnce({
      id: "op_1",
      userId: "user_1",
      subdomain: "acme",
      customDomain: null,
    })
    const result = await resolveOperatorFromRequest(
      fakeReq({ "x-forwarded-host": "acme.aioperatorcollective.com" }),
    )
    expect(result).toEqual({
      operatorId: "op_1",
      operatorUserId: "user_1",
      subdomain: "acme",
      customDomain: null,
      via: "subdomain",
    })
  })

  it("ignores reserved subdomains like www", async () => {
    const result = await resolveOperatorFromRequest(
      fakeReq({ "x-forwarded-host": "www.aioperatorcollective.com" }),
    )
    expect(result).toBeNull()
    // Reserved subdomain short-circuits before the DB call.
    expect(findFirst).not.toHaveBeenCalled()
  })

  it("resolves by verified custom domain", async () => {
    findFirst.mockImplementation(async ({ where }) => {
      if (where.customDomain === "audits.acme.com" && where.customDomainVerified) {
        return {
          id: "op_2",
          userId: "user_2",
          subdomain: "acme",
          customDomain: "audits.acme.com",
        }
      }
      return null
    })
    const result = await resolveOperatorFromRequest(
      fakeReq({ host: "audits.acme.com" }),
    )
    expect(result?.via).toBe("custom")
    expect(result?.subdomain).toBe("acme")
  })

  it("respects an explicit body slug override", async () => {
    findFirst.mockResolvedValueOnce({
      id: "op_3",
      userId: "user_3",
      subdomain: "outbound",
      customDomain: null,
    })
    const result = await resolveOperatorFromRequest(
      fakeReq({ host: "www.aioperatorcollective.com" }),
      { operatorSlug: "outbound" },
    )
    expect(result?.via).toBe("explicit")
    expect(result?.subdomain).toBe("outbound")
  })

  it("falls back to Origin header when host is the platform apex", async () => {
    findFirst.mockResolvedValueOnce({
      id: "op_4",
      userId: "user_4",
      subdomain: "embed",
      customDomain: null,
    })
    const result = await resolveOperatorFromRequest(
      fakeReq({
        host: "www.aioperatorcollective.com",
        origin: "https://embed.aioperatorcollective.com",
      }),
    )
    expect(result?.subdomain).toBe("embed")
  })
})
