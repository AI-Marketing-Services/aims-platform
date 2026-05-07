import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import {
  addDomain,
  getDomainDetail,
  removeDomain,
  safeGetDomainStatus,
  buildDnsInstructions,
  VercelDomainsNotConfiguredError,
  VercelDomainsApiError,
  type VerificationRecord,
} from "@/lib/vercel-domains"
import { invalidateTenantCache } from "@/lib/tenant/resolve-tenant"
import { Prisma } from "@prisma/client"
import { checkWhitelabelAccess } from "@/lib/auth/whitelabel"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type DnsRecordShape = {
  type: "A" | "CNAME" | "TXT"
  name: string
  value: string
  status: "detected" | "waiting" | "unchecked" | "misconfigured"
  friendlyLabel: string
}

function friendlyLabel(type: string): string {
  if (type === "TXT") return "Domain ownership"
  if (type === "A") return "Point apex to Vercel"
  return "Point subdomain to Vercel"
}

function buildRecordsFromVerification(
  domain: string,
  verification: VerificationRecord[],
): DnsRecordShape[] {
  const txtRecord = verification.find((v) => v.type === "TXT")
  const challenge = txtRecord?.value ?? ""
  const instructions = buildDnsInstructions(domain, challenge)

  return instructions.records.map((r) => ({
    ...r,
    status: "unchecked" as const,
    friendlyLabel: friendlyLabel(r.type),
  }))
}

async function requireReseller() {
  const access = await checkWhitelabelAccess()
  if (!access.ok) {
    return { error: access.error, status: access.status, clerkId: null as string | null }
  }
  return { error: null, status: 200, clerkId: access.clerkId as string | null }
}

// ---------------------------------------------------------------------------
// POST — add domain
// ---------------------------------------------------------------------------

const addSchema = z.object({
  domain: z
    .string()
    .min(4)
    .max(253)
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, "Invalid domain format"),
})

export async function POST(req: Request) {
  const auth2 = await requireReseller()
  if (auth2.error || !auth2.clerkId) {
    return NextResponse.json({ error: auth2.error }, { status: auth2.status })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = addSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const { domain } = parsed.data

  try {
    const dbUser = await db.user.findUnique({ where: { clerkId: auth2.clerkId } })
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const result = await addDomain(domain)
    const records = buildRecordsFromVerification(domain, result.verification)

    const vercelDomainData: Prisma.InputJsonValue = {
      name: result.name,
      verified: result.verified,
      verification: result.verification as unknown as Prisma.InputJsonValue,
    }

    // IMPORTANT: We deliberately ignore `result.verified` here and always
    // write `customDomainVerified: false` on add. Vercel's `verified` flag
    // means "this project claims this domain" (e.g., the domain was
    // previously added, or Vercel auto-detected an existing TXT) — NOT
    // "DNS actually points to your deployment and the tenant page is
    // serving correctly". Trusting Vercel's verified=true here is what
    // caused the UI to flip to "Live at <domain>" the moment a reseller
    // typed the domain in, before they'd configured any DNS. The verify
    // endpoint (POST /api/reseller/domain/verify) is the only place that
    // flips this gate, and only when the live DNS config also shows
    // `misconfigured: false`.
    const existing = await db.operatorSite.findUnique({ where: { userId: dbUser.id } })
    if (existing) {
      await db.operatorSite.update({
        where: { userId: dbUser.id },
        data: {
          customDomain: domain,
          customDomainVerified: false,
          vercelDomainData,
        },
      })
      // Bust the old domain tag (if different) and the new one, plus subdomain.
      invalidateTenantCache({
        subdomains: [existing.subdomain],
        customDomains: [existing.customDomain, domain],
      })
    } else {
      // Need a unique subdomain — use userId prefix
      const fallbackSubdomain = `user-${dbUser.id.slice(-8)}`
      await db.operatorSite.create({
        data: {
          userId: dbUser.id,
          subdomain: fallbackSubdomain,
          customDomain: domain,
          customDomainVerified: false,
          vercelDomainData,
        },
      })
      invalidateTenantCache({
        subdomains: [fallbackSubdomain],
        customDomains: [domain],
      })
    }

    return NextResponse.json({ domain, records, verified: false })
  } catch (err) {
    if (err instanceof VercelDomainsNotConfiguredError) {
      return NextResponse.json({ error: "not_configured" }, { status: 503 })
    }
    // Translate known Vercel error codes into clean user-facing messages
    // instead of a generic 500. Domains that are already attached to a
    // different project in the same team return `domain_already_in_use`
    // (different from `domain_already_exists` which is same-project and
    // gets soft-handled inside addDomain()).
    if (err instanceof VercelDomainsApiError) {
      if (err.code === "domain_already_in_use") {
        return NextResponse.json(
          {
            error:
              "This domain is already attached to another project in your Vercel team. Detach it there first, or pick a different domain.",
            code: err.code,
          },
          { status: 409 },
        )
      }
      if (err.code === "forbidden" || err.code === "not_found") {
        return NextResponse.json(
          {
            error:
              "Couldn't attach this domain. Verify you own it and that it isn't claimed by another Vercel team.",
            code: err.code,
          },
          { status: 409 },
        )
      }
      if (err.code === "invalid_domain") {
        return NextResponse.json(
          { error: "That doesn't look like a valid domain.", code: err.code },
          { status: 400 },
        )
      }
      // Surface any other Vercel-side error verbatim instead of swallowing
      // it as a generic 500 — admins debugging custom-domain flows need
      // to see what actually went wrong.
      logger.error("Vercel domain API error", err, {
        endpoint: "POST /api/reseller/domain",
        userId: auth2.clerkId,
        vercelCode: err.code,
        vercelStatus: err.status,
      })
      return NextResponse.json(
        { error: err.message || "Vercel rejected the domain", code: err.code },
        { status: err.status >= 400 && err.status < 500 ? err.status : 502 },
      )
    }
    logger.error("Failed to add domain", err, {
      endpoint: "POST /api/reseller/domain",
      userId: auth2.clerkId,
    })
    return NextResponse.json({ error: "Failed to add domain" }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// GET — current domain status
// ---------------------------------------------------------------------------

export async function GET() {
  const auth2 = await requireReseller()
  if (auth2.error || !auth2.clerkId) {
    return NextResponse.json({ error: auth2.error }, { status: auth2.status })
  }

  try {
    const dbUser = await db.user.findUnique({
      where: { clerkId: auth2.clerkId },
      include: { operatorSite: true },
    })
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const site = dbUser.operatorSite
    if (!site?.customDomain) {
      return NextResponse.json({
        domain: null,
        records: [],
        verified: false,
        published: site?.isPublished ?? false,
      })
    }

    const statusResult = await safeGetDomainStatus(site.customDomain)

    // `liveDnsHealthy` is "Vercel says ownership is verified AND live
    // DNS isn't misconfigured." It's a diagnostic signal — used for
    // auto-correcting DB drift below and surfaced separately on the
    // response so the UI can show "DNS looks ready, click Check now"
    // hints — but it is NOT the canonical verified gate.
    let liveDnsHealthy = false
    if (statusResult.ok && statusResult.config && statusResult.verify) {
      liveDnsHealthy =
        statusResult.verify.verified === true &&
        statusResult.config.misconfigured === false
    }

    // Auto-correct drift in ONE direction only: DB says verified but
    // live truth disagrees (operator changed DNS, domain got removed
    // out-of-band on Vercel, or a previous bug stored verified=true
    // incorrectly) → downgrade + auto-unpublish so the tenant route
    // stops serving stale. We deliberately do NOT auto-upgrade here —
    // the explicit /verify endpoint is the only path that flips the
    // gate to true, even when DNS becomes healthy. This preserves the
    // "no silent flip" invariant introduced by this PR.
    if (
      statusResult.ok &&
      site.customDomainVerified &&
      !liveDnsHealthy
    ) {
      await db.operatorSite.update({
        where: { userId: dbUser.id },
        data: { customDomainVerified: false, isPublished: false },
      })
      invalidateTenantCache({
        subdomains: [site.subdomain],
        customDomains: [site.customDomain],
      })
      site.customDomainVerified = false
      site.isPublished = false
    }

    let records: DnsRecordShape[] = []
    if (statusResult.ok && statusResult.config) {
      // Build records from stored verification data if available.
      const stored = site.vercelDomainData as { verification?: VerificationRecord[] } | null
      let verification: VerificationRecord[] = stored?.verification ?? []

      // Auto-heal: when the stored verification array is empty (legacy
      // rows from before the verification-gate hotfix, or domains added
      // while Vercel was reporting them auto-verified), re-fetch the
      // live verification challenge from Vercel and persist it back.
      // Without this the TXT _vercel record shows up in the operator UI
      // with an empty Value column and the operator can't actually
      // configure the challenge.
      if (verification.length === 0) {
        try {
          const detail = await getDomainDetail(site.customDomain)
          if (detail.verification.length > 0) {
            verification = detail.verification
            const refreshedVercelData: Prisma.InputJsonValue = {
              name: detail.name,
              verified: detail.verified,
              verification: detail.verification as unknown as Prisma.InputJsonValue,
            }
            await db.operatorSite.update({
              where: { userId: dbUser.id },
              data: { vercelDomainData: refreshedVercelData },
            })
          }
        } catch (err) {
          // Non-fatal — keep going with empty verification so the rest
          // of the page renders. The verify endpoint will surface the
          // real issue if Vercel is misbehaving.
          logger.warn("Failed to refresh empty verification from Vercel", {
            endpoint: "GET /api/reseller/domain",
            domain: site.customDomain,
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }

      records = buildRecordsFromVerification(site.customDomain, verification)

      // Annotate status from config
      const misconfigured = statusResult.config.misconfigured
      records = records.map((r) => ({
        ...r,
        status: misconfigured ? ("misconfigured" as const) : ("detected" as const),
      }))
    }

    return NextResponse.json({
      domain: site.customDomain,
      records,
      // Canonical persisted gate — the middleware uses the same field
      // to decide whether to serve the tenant page on this domain, so
      // GET must always reflect the same value.
      verified: site.customDomainVerified,
      // Diagnostic-only: indicates Vercel says DNS is healthy.
      // Surfaces "DNS ready — click Check now to verify" UX states
      // without ever flipping the canonical gate behind the user's back.
      liveDnsHealthy,
      published: site.isPublished,
    })
  } catch (err) {
    if (err instanceof VercelDomainsNotConfiguredError) {
      return NextResponse.json({ error: "not_configured" }, { status: 503 })
    }
    logger.error("Failed to get domain status", err, {
      endpoint: "GET /api/reseller/domain",
      userId: auth2.clerkId,
    })
    return NextResponse.json({ error: "Failed to get domain status" }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE — remove domain
// ---------------------------------------------------------------------------

export async function DELETE() {
  const auth2 = await requireReseller()
  if (auth2.error || !auth2.clerkId) {
    return NextResponse.json({ error: auth2.error }, { status: auth2.status })
  }

  try {
    const dbUser = await db.user.findUnique({
      where: { clerkId: auth2.clerkId },
      include: { operatorSite: true },
    })
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const site = dbUser.operatorSite
    if (!site?.customDomain) {
      return NextResponse.json({ error: "No custom domain configured" }, { status: 404 })
    }

    const removedDomain = site.customDomain
    await removeDomain(removedDomain)

    await db.operatorSite.update({
      where: { userId: dbUser.id },
      data: {
        customDomain: null,
        customDomainVerified: false,
        vercelDomainData: Prisma.DbNull,
      },
    })

    invalidateTenantCache({
      subdomains: [site.subdomain],
      customDomains: [removedDomain],
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof VercelDomainsNotConfiguredError) {
      return NextResponse.json({ error: "not_configured" }, { status: 503 })
    }
    logger.error("Failed to remove domain", err, {
      endpoint: "DELETE /api/reseller/domain",
      userId: auth2.clerkId,
    })
    return NextResponse.json({ error: "Failed to remove domain" }, { status: 500 })
  }
}
