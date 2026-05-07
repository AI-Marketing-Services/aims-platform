import { ensureDbUser } from "@/lib/auth/ensure-user"
import { db } from "@/lib/db"
import {
  LEAD_MAGNETS,
  MARKETPLACE_LEAD_MAGNETS,
  buildShareUrl,
} from "@/lib/tenant/lead-magnet-registry"
import { LeadMagnetsDashboard } from "@/components/portal/lead-magnets/LeadMagnetsDashboard"

export const metadata = { title: "Lead Magnets" }
export const dynamic = "force-dynamic"

export default async function LeadMagnetsPage() {
  const user = await ensureDbUser()

  // Operator branding + share-URL surface — pulls subdomain + verified
  // custom domain off the OperatorSite. Both can be null when the user
  // hasn't completed whitelabel onboarding yet.
  const operatorSite = await db.operatorSite.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      subdomain: true,
      customDomain: true,
      customDomainVerified: true,
      isPublished: true,
    },
  })

  // Aggregate per-tool submission counts attributed to this operator.
  // The lifetime + last-30-days groupBy queries are independent, so
  // run them in parallel — halves DB round-trip latency on first paint.
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const [groupedRows, recentRows] = operatorSite
    ? await Promise.all([
        db.leadMagnetSubmission.groupBy({
          by: ["type"],
          where: { operatorId: operatorSite.id },
          _count: { _all: true },
        }),
        db.leadMagnetSubmission.groupBy({
          by: ["type"],
          where: {
            operatorId: operatorSite.id,
            createdAt: { gte: since30 },
          },
          _count: { _all: true },
        }),
      ])
    : [[], []]

  const totalByType = Object.fromEntries(
    groupedRows.map((r) => [r.type, r._count._all]),
  ) as Record<string, number>
  const recentByType = Object.fromEntries(
    recentRows.map((r) => [r.type, r._count._all]),
  ) as Record<string, number>

  const tools = LEAD_MAGNETS.map((tool) => ({
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    iconName: tool.iconName,
    estimatedMinutes: tool.estimatedMinutes,
    hasBrandedPdf: tool.hasBrandedPdf,
    submissionType: tool.submissionType,
    shareUrl: buildShareUrl(tool, operatorSite),
    totalLeads: totalByType[tool.submissionType] ?? 0,
    last30Days: recentByType[tool.submissionType] ?? 0,
  }))

  return (
    <LeadMagnetsDashboard
      operatorSite={
        operatorSite
          ? {
              subdomain: operatorSite.subdomain,
              customDomain: operatorSite.customDomain,
              customDomainVerified: operatorSite.customDomainVerified,
              isPublished: operatorSite.isPublished,
            }
          : null
      }
      tools={tools}
      marketplace={MARKETPLACE_LEAD_MAGNETS}
    />
  )
}
