import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import {
  buildDnsInstructions,
  safeGetDomainStatus,
  VercelDomainsNotConfiguredError,
  type VerificationRecord,
} from "@/lib/vercel-domains"
import { invalidateTenantCache } from "@/lib/tenant/resolve-tenant"
import { checkWhitelabelAccess } from "@/lib/auth/whitelabel"

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

export async function POST() {
  const access = await checkWhitelabelAccess()
  if (!access.ok) {
    return NextResponse.json({ error: access.error, reason: access.reason }, { status: access.status })
  }
  const clerkId = access.clerkId

  try {
    const dbUser = await db.user.findUnique({
      where: { clerkId },
      include: { operatorSite: true },
    })
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const site = dbUser.operatorSite
    if (!site?.customDomain) {
      return NextResponse.json({ error: "No custom domain configured" }, { status: 404 })
    }

    // Use safeGetDomainStatus instead of bare verifyDomain so we get
    // BOTH the verify response and the live DNS config in one shot.
    // The gate only flips when ownership is verified AND DNS is not
    // misconfigured — Vercel will sometimes report verified=true even
    // when the A/CNAME records aren't pointing at the project, and
    // serving the tenant page in that state shows visitors a Vercel
    // 404 instead of the operator's branded site.
    const status = await safeGetDomainStatus(site.customDomain)
    if (!status.ok) {
      return NextResponse.json(
        { error: status.reason ?? "Vercel status check failed" },
        { status: 502 },
      )
    }
    const ownershipVerified = status.verify?.verified === true
    const dnsHealthy = status.config?.misconfigured === false
    const fullyVerified = ownershipVerified && dnsHealthy

    if (fullyVerified && !site.customDomainVerified) {
      // First-time fully-verified — flip the gate and bust cache so the
      // custom-domain URL starts serving the tenant page immediately
      // instead of after the 60s revalidate window.
      await db.operatorSite.update({
        where: { userId: dbUser.id },
        data: { customDomainVerified: true },
      })
      invalidateTenantCache({
        subdomains: [site.subdomain],
        customDomains: [site.customDomain],
      })
    } else if (!fullyVerified && site.customDomainVerified) {
      // Drift in the wrong direction — the DB says verified but live
      // truth disagrees. Downgrade and auto-unpublish so we stop
      // serving the tenant route over a misconfigured domain.
      await db.operatorSite.update({
        where: { userId: dbUser.id },
        data: { customDomainVerified: false, isPublished: false },
      })
      invalidateTenantCache({
        subdomains: [site.subdomain],
        customDomains: [site.customDomain],
      })
    }

    // Build records from stored verification data
    const stored = site.vercelDomainData as { verification?: VerificationRecord[] } | null
    const verification: VerificationRecord[] = stored?.verification ?? []
    const instructions = buildDnsInstructions(site.customDomain, verification[0]?.value ?? "")

    const records: DnsRecordShape[] = instructions.records.map((r) => ({
      ...r,
      status: fullyVerified
        ? ("detected" as const)
        : status.config?.misconfigured
          ? ("misconfigured" as const)
          : ("waiting" as const),
      friendlyLabel: friendlyLabel(r.type),
    }))

    return NextResponse.json({
      verified: fullyVerified,
      error: !fullyVerified
        ? {
            code: !ownershipVerified
              ? "ownership_unverified"
              : "dns_misconfigured",
            message: !ownershipVerified
              ? "Add the TXT verification record below — DNS changes can take up to 48 hours."
              : "Ownership verified, but your A/CNAME records aren't pointing at Vercel yet.",
          }
        : undefined,
      records,
    })
  } catch (err) {
    if (err instanceof VercelDomainsNotConfiguredError) {
      return NextResponse.json({ error: "not_configured" }, { status: 503 })
    }
    logger.error("Failed to verify domain", err, {
      endpoint: "POST /api/reseller/domain/verify",
      userId: clerkId,
    })
    return NextResponse.json({ error: "Failed to verify domain" }, { status: 500 })
  }
}
