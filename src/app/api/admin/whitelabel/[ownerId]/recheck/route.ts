import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { db } from "@/lib/db"
import { verifyDomain, VercelDomainsNotConfiguredError } from "@/lib/vercel-domains"
import { invalidateTenantCache } from "@/lib/tenant/resolve-tenant"
import { logger } from "@/lib/logger"

/**
 * POST /api/admin/whitelabel/[ownerId]/recheck
 *
 * Admin-triggered equivalent of /api/reseller/domain/verify. Lets
 * admins kick a DNS recheck on any reseller's domain without logging
 * in as them. Returns { verified, reason }.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ ownerId: string }> },
) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { ownerId } = await params

  try {
    const site = await db.operatorSite.findUnique({
      where: { userId: ownerId },
    })
    if (!site?.customDomain) {
      return NextResponse.json({ error: "No custom domain for this owner" }, { status: 404 })
    }

    const result = await verifyDomain(site.customDomain)

    if (result.verified && !site.customDomainVerified) {
      await db.operatorSite.update({
        where: { userId: ownerId },
        data: { customDomainVerified: true },
      })
      invalidateTenantCache({
        subdomains: [site.subdomain],
        customDomains: [site.customDomain],
      })
    }

    return NextResponse.json({
      verified: result.verified,
      reason: result.error?.message ?? result.error?.code ?? null,
    })
  } catch (err) {
    if (err instanceof VercelDomainsNotConfiguredError) {
      return NextResponse.json({ error: "Vercel Domains API not configured" }, { status: 503 })
    }
    logger.error("Admin domain recheck failed", err, {
      endpoint: "POST /api/admin/whitelabel/[ownerId]/recheck",
      ownerId,
    })
    return NextResponse.json({ error: "Recheck failed" }, { status: 500 })
  }
}
