import type { Metadata } from "next"
import { auth, currentUser } from "@clerk/nextjs/server"
import Link from "next/link"
import {
  ArrowRight,
  Bell,
  Check,
  MapPin,
  BookOpen,
  Calculator,
  Briefcase,
} from "lucide-react"
import { db } from "@/lib/db"
import { timeAgo } from "@/lib/utils"
import { getProgressForUser } from "@/lib/onboarding/progress"
import { TOTAL_STEPS } from "@/lib/onboarding/steps"
import { OnboardingChecklist } from "@/components/portal/OnboardingChecklist"
import { TodayCard } from "@/components/portal/TodayCard"
import { FirstRunWelcomeCard } from "@/components/portal/FirstRunWelcomeCard"

export const metadata: Metadata = { title: "Dashboard" }

export default async function PortalDashboard({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const { checkout } = await searchParams
  const { userId: clerkId } = await auth()
  const user = await currentUser()

  const dbUser = clerkId
    ? await db.user.findUnique({ where: { clerkId } })
    : null

  const firstName =
    user?.firstName ||
    user?.fullName?.split(" ")[0] ||
    dbUser?.name?.split(" ")[0] ||
    "there"

  // Onboarding progress
  let onboardingCompletedKeys: string[] = []
  let onboardingCompletedCount = 0
  let onboardingPercent = 0

  if (dbUser) {
    try {
      const progress = await getProgressForUser(dbUser.id)
      onboardingCompletedKeys = [...progress.completedKeys]
      onboardingCompletedCount = progress.completedCount
      onboardingPercent = progress.percent
    } catch {
      // graceful degradation
    }
  }

  // CRM quick stats — only shown if they have deals
  let crmStats: {
    totalDeals: number
    activeDeals: number
    pipelineValue: number
    funnel: Array<{ stage: string; label: string; count: number; value: number }>
    topDeals: Array<{
      id: string
      companyName: string
      stage: string
      value: number
      currency: string
      leadScore: number | null
      updatedAt: Date
    }>
    recentActivities: Array<{
      id: string
      type: string
      description: string | null
      clientDeal: { companyName: string }
      createdAt: Date
    }>
  } | null = null

  if (dbUser) {
    try {
      const [crmDeals, topOpenDeals, recentCrmActivities] = await Promise.all([
        db.clientDeal.findMany({
          where: { userId: dbUser.id },
          select: { stage: true, value: true },
        }),
        // Top 5 highest-value deals still in active pipeline.
        // Used for the leaderboard visualization.
        db.clientDeal.findMany({
          where: {
            userId: dbUser.id,
            stage: { notIn: ["COMPLETED", "LOST"] },
          },
          select: {
            id: true,
            companyName: true,
            stage: true,
            value: true,
            currency: true,
            leadScore: true,
            updatedAt: true,
          },
          orderBy: [{ value: "desc" }, { updatedAt: "desc" }],
          take: 5,
        }),
        db.clientDealActivity.findMany({
          where: { clientDeal: { userId: dbUser.id } },
          include: { clientDeal: { select: { companyName: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ])
      if (crmDeals.length > 0) {
        // Build funnel stage counts in pipeline order so the dashboard
        // can render a one-glance funnel visualization.
        const FUNNEL_STAGES: Array<{ stage: string; label: string }> = [
          { stage: "PROSPECT", label: "Prospect" },
          { stage: "DISCOVERY_CALL", label: "Discovery" },
          { stage: "PROPOSAL_SENT", label: "Proposal" },
          { stage: "ACTIVE_RETAINER", label: "Active" },
          { stage: "COMPLETED", label: "Won" },
        ]
        const funnel = FUNNEL_STAGES.map(({ stage, label }) => {
          const matching = crmDeals.filter((d) => d.stage === stage)
          return {
            stage,
            label,
            count: matching.length,
            value: matching.reduce((s, d) => s + d.value, 0),
          }
        })

        crmStats = {
          totalDeals: crmDeals.length,
          activeDeals: crmDeals.filter((d) => d.stage === "ACTIVE_RETAINER").length,
          pipelineValue: crmDeals
            .filter((d) => !["COMPLETED", "LOST"].includes(d.stage))
            .reduce((s, d) => s + d.value, 0),
          funnel,
          topDeals: topOpenDeals,
          recentActivities: recentCrmActivities,
        }
      }
    } catch {
      // graceful degradation
    }
  }

  // Recent notifications
  let recentNotifications: Array<{
    id: string
    title: string
    message: string
    sentAt: Date
  }> = []
  if (dbUser) {
    try {
      recentNotifications = await db.notification.findMany({
        where: { userId: dbUser.id },
        orderBy: { sentAt: "desc" },
        take: 5,
      })
    } catch {
      // graceful degradation
    }
  }

  return (
    <div className="space-y-6">
      {/* Checkout success banner */}
      {checkout === "success" && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 text-sm text-foreground font-medium">
          You&apos;re in. Our team will be in touch within 24 hours. Check your email for next steps.
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Welcome, {firstName}</h1>
        <p className="mt-1 text-muted-foreground text-xs sm:text-sm">
          Here&apos;s what&apos;s happening across your pipeline today.
        </p>
      </div>

      {/* ── FIRST-RUN — only renders for fresh operators with zero activity ── */}
      {dbUser && <FirstRunWelcomeCard userId={dbUser.id} firstName={firstName} />}

      {/* ── TODAY CARD — daily-open hook, surfaces hot leads + follow-ups ── */}
      {dbUser && <TodayCard userId={dbUser.id} />}

      {/* ── ONBOARDING CHECKLIST — always primary ── */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Getting Started</h2>
            <span className="text-xs text-muted-foreground">
              {onboardingCompletedCount}/{TOTAL_STEPS} complete
            </span>
          </div>
          <Link
            href="/portal/onboard"
            className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            View full roadmap <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {onboardingPercent === 100 ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-4">
            <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Check className="h-4 w-4 text-primary" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Setup complete!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                All {TOTAL_STEPS} steps done. You&apos;re ready to start landing clients.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">{onboardingPercent}% complete</span>
                <span className="text-xs text-muted-foreground">
                  {TOTAL_STEPS - onboardingCompletedCount} remaining
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${onboardingPercent}%` }}
                />
              </div>
            </div>
            <OnboardingChecklist
              initialCompletedKeys={onboardingCompletedKeys}
              variant="compact"
            />
          </>
        )}
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            icon: MapPin,
            label: "Find Leads",
            description: "Use AI to scout prospects by industry, location, and company size. Build your target list in minutes.",
            href: "/portal/crm/scout",
          },
          {
            icon: BookOpen,
            label: "Playbooks",
            description: "Industry-specific scripts, discovery frameworks, and pitch structures for your niche.",
            href: "/portal/playbooks",
          },
          {
            icon: Calculator,
            label: "Price Builder",
            description: "Build accurate proposals and scope engagements with the interactive pricing calculator.",
            href: "/portal/calculator",
          },
        ].map(({ icon: Icon, label, description, href }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
              {label}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
              Open <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>

      {/* ── CRM PIPELINE — only if they have deals ── */}
      {crmStats && (
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Your Pipeline</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {crmStats.pipelineValue > 0
                  ? `$${crmStats.pipelineValue.toLocaleString()} open across ${crmStats.totalDeals} deal${crmStats.totalDeals === 1 ? "" : "s"}`
                  : `${crmStats.totalDeals} deal${crmStats.totalDeals === 1 ? "" : "s"} tracked`}
              </p>
            </div>
            <Link
              href="/portal/crm"
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium"
            >
              Open CRM <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Two-column layout on desktop: funnel left, top-deals right.
              Stacks vertically on mobile. */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funnel visualization — bar widths reflect deal counts at
                each stage. The 'Won' bar gets a fully filled fill so
                wins read as a payoff state visually. */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                Stage breakdown
              </p>
              {(() => {
                const maxCount = Math.max(...crmStats.funnel.map((s) => s.count), 1)
                return (
                  <div className="space-y-2">
                    {crmStats.funnel.map((s) => {
                      const widthPct =
                        s.count > 0 ? Math.max(8, (s.count / maxCount) * 100) : 0
                      const isWon = s.stage === "COMPLETED"
                      return (
                        <Link
                          key={s.stage}
                          href="/portal/crm"
                          className="group flex items-center gap-3 hover:bg-primary/5 -mx-2 px-2 py-1.5 rounded-md transition-colors"
                        >
                          <span className="w-16 sm:w-20 text-xs font-medium text-muted-foreground group-hover:text-foreground shrink-0">
                            {s.label}
                          </span>
                          <div className="flex-1 h-6 rounded-md bg-muted/40 overflow-hidden relative">
                            {s.count > 0 && (
                              <div
                                className={`h-full rounded-md transition-all ${
                                  isWon
                                    ? "bg-primary"
                                    : "bg-primary/30 group-hover:bg-primary/50"
                                }`}
                                style={{ width: `${widthPct}%` }}
                              />
                            )}
                          </div>
                          <div className="shrink-0 w-20 sm:w-24 text-right">
                            <span className="text-sm font-bold tabular-nums text-foreground">
                              {s.count}
                            </span>
                            {s.value > 0 && (
                              <span className="ml-1.5 text-[10px] text-muted-foreground tabular-nums">
                                ${s.value >= 1000 ? `${Math.round(s.value / 100) / 10}K` : s.value}
                              </span>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {/* Top open deals leaderboard. Inspired by the Nexus
                'List of Integration' table — each row has a horizontal
                progress bar visualizing deal value relative to the
                largest open deal, plus a lead-score chip. Click anywhere
                on the row to drill into that deal. */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                Top open deals
              </p>
              {crmStats.topDeals.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    No open deals yet. Scout for leads or import a CSV.
                  </p>
                </div>
              ) : (
                (() => {
                  const maxValue = Math.max(
                    ...crmStats.topDeals.map((d) => d.value),
                    1,
                  )
                  return (
                    <div className="space-y-2">
                      {crmStats.topDeals.map((d) => {
                        const widthPct =
                          d.value > 0 ? Math.max(8, (d.value / maxValue) * 100) : 0
                        return (
                          <Link
                            key={d.id}
                            href={`/portal/crm/${d.id}`}
                            className="group block rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-primary/[0.02] transition-all px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <p className="text-xs font-semibold text-foreground truncate flex-1">
                                {d.companyName}
                              </p>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {typeof d.leadScore === "number" && d.leadScore > 0 && (
                                  <span className="text-[10px] font-bold tabular-nums text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                    {d.leadScore}
                                  </span>
                                )}
                                <span className="text-xs font-bold tabular-nums text-foreground">
                                  {d.value > 0
                                    ? `$${d.value.toLocaleString()}`
                                    : "—"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                                {d.value > 0 && (
                                  <div
                                    className="h-full rounded-full bg-primary group-hover:bg-primary transition-all"
                                    style={{ width: `${widthPct}%` }}
                                  />
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0 w-16 text-right">
                                {d.stage.replace(/_/g, " ").toLowerCase()}
                              </span>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )
                })()
              )}
            </div>
          </div>

          {/* Quick stats row + scout shortcut */}
          <div className="mt-5 pt-5 border-t border-border grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                Pipeline value
              </p>
              <p className="text-base sm:text-lg font-bold text-foreground">
                {crmStats.pipelineValue > 0
                  ? `$${crmStats.pipelineValue.toLocaleString()}`
                  : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                Active retainers
              </p>
              <p className="text-base sm:text-lg font-bold text-foreground">
                {crmStats.activeDeals}
              </p>
            </div>
            <Link
              href="/portal/crm/scout"
              className="rounded-lg border border-border bg-background p-3 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                Scout new leads
              </p>
              <p className="text-base sm:text-lg font-bold text-primary group-hover:text-primary/80 inline-flex items-center gap-1">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </p>
            </Link>
          </div>
        </div>
      )}

      {/* ── RECENT ACTIVITY ── */}
      {(() => {
        type FeedItem = { id: string; icon: "crm" | "bell"; title: string; sub: string; time: Date }
        const feed: FeedItem[] = []

        if (crmStats?.recentActivities) {
          for (const a of crmStats.recentActivities) {
            feed.push({
              id: `crm-${a.id}`,
              icon: "crm",
              title: a.description ?? a.type.replace(/_/g, " ").toLowerCase(),
              sub: a.clientDeal.companyName,
              time: new Date(a.createdAt),
            })
          }
        }
        for (const n of recentNotifications) {
          feed.push({ id: n.id, icon: "bell", title: n.title, sub: n.message, time: new Date(n.sentAt) })
        }
        feed.sort((a, b) => b.time.getTime() - a.time.getTime())
        const top = feed.slice(0, 6)

        if (top.length === 0) return null

        return (
          <div className="rounded-2xl border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
            </div>
            <ul className="divide-y divide-border">
              {top.map((item) => (
                <li key={item.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${item.icon === "crm" ? "bg-primary/10" : "bg-muted"}`}>
                    {item.icon === "crm" ? (
                      <Briefcase className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground capitalize">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">{item.sub}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(item.time)}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })()}
    </div>
  )
}
