import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import {
  verifyDomain,
  buildDnsInstructions,
  VercelDomainsNotConfiguredError,
  type VerificationRecord,
} from "@/lib/vercel-domains"
import { invalidateTenantCache } from "@/lib/tenant/resolve-tenant"

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
  const { userId: clerkId, sessionClaims } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["RESELLER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

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

    const result = await verifyDomain(site.customDomain)

    if (result.verified && !site.customDomainVerified) {
      // First-time verification — flip the gate and bust cache so the
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
    }

    // Build records from stored verification data
    const stored = site.vercelDomainData as { verification?: VerificationRecord[] } | null
    const verification: VerificationRecord[] = stored?.verification ?? []
    const instructions = buildDnsInstructions(site.customDomain, verification[0]?.value ?? "")

    const records: DnsRecordShape[] = instructions.records.map((r) => ({
      ...r,
      status: result.verified
        ? ("detected" as const)
        : result.error?.code === "missing_txt_record"
          ? ("misconfigured" as const)
          : ("waiting" as const),
      friendlyLabel: friendlyLabel(r.type),
    }))

    return NextResponse.json({
      verified: result.verified,
      error: result.error,
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
