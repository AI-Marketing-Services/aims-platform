import { Suspense } from "react"
import Link from "next/link"
import {
  UserPlus,
  Calendar,
  ClipboardCheck,
  Compass,
  FlaskConical,
  Mail,
  TrendingUp,
  ArrowRight,
} from "lucide-react"
import { db } from "@/lib/db"
import { ActionInbox } from "@/components/admin/ActionInbox"
import { CommunityFunnelChart } from "@/components/admin/CommunityFunnelChart"

export const dynamic = "force-dynamic"

/**
 * Minimal community-focused admin dashboard.
 *
 * The platform has a lot of dormant paying-client surfaces (MRR,
 * fulfillment, service revenue, reseller commissions) that are noise
 * until the software arm launches. This default view shows only what
 * matters day-one:
 *
 *   1. Action Inbox — what needs your attention right now
 *   2. Community funnel — applications -> consults -> invites -> joined
 *   3. Quick links to the three surfaces admins actually work from
 *   4. Most-recent applications
 *
 * Full metrics dashboard (charts, MRR, team workload, tickets,
 * subscriptions) lives at /admin/dashboard/full for when there's data
 * to visualise.
 */
export default async function AdminDashboardPage() {
  const [funnel, recentSubmissions] = await Promise.all([
    db.deal.groupBy({
      by: ["stage"],
      _count: { id: true },
    }),
    db.leadMagnetSubmission.findMany({
      where: { type: "COLLECTIVE_APPLICATION" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        email: true,
        name: true,
        score: true,
        createdAt: true,
        dealId: true,
      },
    }),
  ])

  // LeadMagnetSubmission has no Prisma relation to Deal (they're linked
  // by dealId only), so hydrate the deal tier/stage in one extra query
  // instead of a join.
  const dealIds = recentSubmissions
    .map((s) => s.dealId)
    .filter((d): d is string => !!d)
  const relatedDeals = dealIds.length
    ? await db.deal.findMany({
        where: { id: { in: dealIds } },
        select: { id: true, leadScoreTier: true, stage: true },
      })
    : []
  const dealById = new Map(relatedDeals.map((d) => [d.id, d]))
  const recentApplications = recentSubmissions.map((s) => ({
    ...s,
    deal: s.dealId ? dealById.get(s.dealId) ?? null : null,
  }))

  const stageCounts: Record<string, number> = {}
  for (const row of funnel) {
    stageCounts[row.stage] = row._count?.id ?? 0
  }

  const totalApplicants =
    (stageCounts.APPLICATION_SUBMITTED ?? 0) +
    (stageCounts.CONSULT_BOOKED ?? 0) +
    (stageCounts.CONSULT_COMPLETED ?? 0) +
    (stageCounts.MIGHTY_INVITED ?? 0) +
    (stageCounts.MEMBER_JOINED ?? 0)

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Greeting row */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalApplicants === 0
              ? "No applicants yet — share the apply link to start filling the pipeline."
              : `${totalApplicants} applicant${totalApplicants === 1 ? "" : "s"} in the funnel across all stages.`}
          </p>
        </div>
        <Link
          href="/admin/dashboard/full"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Full metrics
          <ArrowRight className="h-3 w-3" />
        </Link>
      </header>

      {/* Action Inbox — what needs you right now */}
      <Suspense
        fallback={
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="h-5 w-32 bg-muted/60 rounded animate-pulse mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        }
      >
        <ActionInbox />
      </Suspense>

      {/* Community funnel bar */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Community funnel</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live state of every applicant by stage.
            </p>
          </div>
          <Link
            href="/admin/crm"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Open pipeline <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <CommunityFunnelChart counts={stageCounts} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent applications (2/3) */}
        <section className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              Recent applications
            </h2>
            <Link
              href="/admin/applications"
              className="text-xs text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          {recentApplications.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <p>No applications yet.</p>
              <p className="text-xs mt-1">
                Share{" "}
                <code className="text-primary bg-primary/10 px-1 py-0.5 rounded text-[11px]">
                  aioperatorcollective.com/apply
                </code>{" "}
                to start filling the pipeline.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentApplications.map((a) => {
                const tier = a.deal?.leadScoreTier ?? null
                const tierClass =
                  tier === "hot"
                    ? "text-primary bg-primary/10 border-primary/30"
                    : tier === "warm"
                    ? "text-primary/70 bg-primary/5 border-primary/20"
                    : "text-muted-foreground bg-muted/40 border-border"
                return (
                  <li key={a.id}>
                    <Link
                      href={a.deal ? `/admin/crm/${a.deal.id}` : "/admin/applications"}
                      className="flex items-center gap-3 py-3 hover:bg-muted/30 -mx-2 px-2 rounded transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">
                        {(a.name ?? a.email).slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground font-medium truncate">
                          {a.name ?? a.email}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {a.email}
                        </p>
                      </div>
                      {tier && (
                        <span
                          className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border flex-shrink-0 capitalize ${tierClass}`}
                        >
                          {tier}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground font-mono flex-shrink-0 w-16 text-right">
                        {timeAgo(a.createdAt)}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Quick links (1/3) */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Jump to</h2>
          <div className="space-y-2">
            <QuickLink
              href="/admin/crm"
              icon={<ClipboardCheck className="h-4 w-4" />}
              label="CRM Pipeline"
            />
            <QuickLink
              href="/admin/mighty-invites"
              icon={<UserPlus className="h-4 w-4" />}
              label="Mighty Invite Audit"
            />
            <QuickLink
              href="/admin/close"
              icon={<TrendingUp className="h-4 w-4" />}
              label="Close CRM (revenue)"
            />
            <QuickLink
              href="/admin/applications"
              icon={<Mail className="h-4 w-4" />}
              label="All applications"
            />
            <QuickLink
              href="/admin/follow-ups"
              icon={<Calendar className="h-4 w-4" />}
              label="Follow-up queue"
            />
            <QuickLink
              href="/admin/wizard-funnel"
              icon={<Compass className="h-4 w-4" />}
              label="Wizard funnel"
            />
            <QuickLink
              href="/admin/simulate"
              icon={<FlaskConical className="h-4 w-4" />}
              label="Simulate a lead (testing)"
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-sm font-medium text-foreground transition-colors group"
    >
      <span className="text-muted-foreground group-hover:text-primary transition-colors">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
    </Link>
  )
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  return `${months}mo`
}
