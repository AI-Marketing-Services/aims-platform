import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import {
  addDomain,
  removeDomain,
  safeGetDomainStatus,
  buildDnsInstructions,
  VercelDomainsNotConfiguredError,
  type VerificationRecord,
} from "@/lib/vercel-domains"
import { invalidateTenantCache } from "@/lib/tenant/resolve-tenant"
import { Prisma } from "@prisma/client"

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
  const { userId: clerkId, sessionClaims } = await auth()
  if (!clerkId) return { error: "Unauthorized", status: 401, clerkId: null }

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["RESELLER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return { error: "Forbidden", status: 403, clerkId: null }
  }
  return { error: null, status: 200, clerkId }
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

    // Upsert OperatorSite
    const existing = await db.operatorSite.findUnique({ where: { userId: dbUser.id } })
    if (existing) {
      await db.operatorSite.update({
        where: { userId: dbUser.id },
        data: {
          customDomain: domain,
          customDomainVerified: result.verified,
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
          customDomainVerified: result.verified,
          vercelDomainData,
        },
      })
      invalidateTenantCache({
        subdomains: [fallbackSubdomain],
        customDomains: [domain],
      })
    }

    return NextResponse.json({ domain, records, verified: result.verified })
  } catch (err) {
    if (err instanceof VercelDomainsNotConfiguredError) {
      return NextResponse.json({ error: "not_configured" }, { status: 503 })
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

    let records: DnsRecordShape[] = []
    if (statusResult.ok && statusResult.config) {
      // Build records from stored verification data if available
      const stored = site.vercelDomainData as { verification?: VerificationRecord[] } | null
      const verification: VerificationRecord[] = stored?.verification ?? []
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
      verified: site.customDomainVerified,
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
