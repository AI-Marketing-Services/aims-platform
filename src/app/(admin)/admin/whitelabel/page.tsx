import { redirect } from "next/navigation"
import Link from "next/link"
import { requireAdmin } from "@/lib/auth"
import { db } from "@/lib/db"
import { isVercelDomainsConfigured } from "@/lib/vercel-domains"
import { WhitelabelTable, type WhitelabelRow } from "./WhitelabelTable"
import { Globe2, AlertTriangle } from "lucide-react"

export const metadata = { title: "Whitelabel Sites", robots: { index: false } }
export const dynamic = "force-dynamic"

export default async function AdminWhitelabelPage() {
  const adminUserId = await requireAdmin()
  if (!adminUserId) redirect("/admin/dashboard")

  const vercelConfigured = isVercelDomainsConfigured()

  // Fetch every site + owner. Also grab referredDeals _count so admins
  // can see which resellers are actually generating leads via their
  // whitelabel pages.
  const sites = await db.operatorSite.findMany({
    orderBy: [{ updatedAt: "desc" }],
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          memberProfile: {
            select: { businessName: true },
          },
          _count: {
            select: { referredDeals: true },
          },
        },
      },
    },
  })

  const rows: WhitelabelRow[] = sites.map((s) => ({
    id: s.id,
    subdomain: s.subdomain,
    customDomain: s.customDomain ?? null,
    customDomainVerified: s.customDomainVerified,
    isPublished: s.isPublished,
    updatedAt: s.updatedAt.toISOString(),
    owner: {
      id: s.user.id,
      email: s.user.email,
      name: s.user.name ?? null,
      businessName: s.user.memberProfile?.businessName ?? null,
      role: s.user.role,
    },
    referredDealCount: s.user._count.referredDeals,
  }))

  const stats = {
    total: rows.length,
    published: rows.filter((r) => r.isPublished).length,
    withCustomDomain: rows.filter((r) => r.customDomain).length,
    verified: rows.filter((r) => r.customDomain && r.customDomainVerified).length,
    unverified: rows.filter((r) => r.customDomain && !r.customDomainVerified).length,
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-2">
          WHITELABEL · RESELLER SITES
        </div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Globe2 className="h-6 w-6 text-primary" />
          Whitelabel Sites
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every reseller&apos;s public tenant page. Monitor publish status, custom-domain verification, and lead attribution.
        </p>
      </div>

      {!vercelConfigured && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">Vercel Domains API not configured</p>
            <p className="text-muted-foreground mt-1">
              Resellers can still pick subdomains, but custom domains won&apos;t resolve.
              Set <code className="font-mono bg-muted px-1 py-0.5 rounded">VERCEL_TOKEN</code>,{" "}
              <code className="font-mono bg-muted px-1 py-0.5 rounded">VERCEL_PROJECT_ID</code>, and{" "}
              <code className="font-mono bg-muted px-1 py-0.5 rounded">VERCEL_TEAM_ID</code> env vars to enable.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        <StatCard label="Total sites" value={stats.total} />
        <StatCard label="Published" value={stats.published} tone={stats.published > 0 ? "good" : "neutral"} />
        <StatCard label="Custom domains" value={stats.withCustomDomain} />
        <StatCard label="Verified" value={stats.verified} tone={stats.verified === stats.withCustomDomain ? "good" : "warn"} />
        <StatCard label="Pending verification" value={stats.unverified} tone={stats.unverified > 0 ? "warn" : "neutral"} />
      </div>

      <WhitelabelTable rows={rows} vercelConfigured={vercelConfigured} />

      <p className="text-xs text-muted-foreground">
        Domain verification failures are logged to the application logger. See{" "}
        <Link href="/admin/cron-status" className="underline hover:text-primary">Job Health</Link>{" "}
        for background job status.
      </p>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string
  value: number
  tone?: "good" | "warn" | "neutral"
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-600"
      : tone === "warn"
        ? "text-amber-500"
        : "text-foreground"

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</div>
    </div>
  )
}
