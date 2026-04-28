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
      const [crmDeals, recentCrmActivities] = await Promise.all([
        db.clientDeal.findMany({
          where: { userId: dbUser.id },
          select: { stage: true, value: true },
        }),
        db.clientDealActivity.findMany({
          where: { clientDeal: { userId: dbUser.id } },
          include: { clientDeal: { select: { companyName: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ])
      if (crmDeals.length > 0) {
        crmStats = {
          totalDeals: crmDeals.length,
          activeDeals: crmDeals.filter((d) => d.stage === "ACTIVE_RETAINER").length,
          pipelineValue: crmDeals
            .filter((d) => !["COMPLETED", "LOST"].includes(d.stage))
            .reduce((s, d) => s + d.value, 0),
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
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 font-medium">
          You&apos;re in. Our team will be in touch within 24 hours — check your email for next steps.
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Welcome, {firstName}</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Here&apos;s your setup roadmap. Complete these steps to get your AI operator business running.
        </p>
      </div>

      {/* ── ONBOARDING CHECKLIST — always primary ── */}
      <div className="rounded-2xl border border-border bg-card p-6">
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
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <Check className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Setup complete!</p>
              <p className="text-xs text-emerald-600 mt-0.5">
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
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Your Pipeline</h2>
            <Link href="/portal/crm" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
              Open CRM <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Link
              href="/portal/crm"
              className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Pipeline Value</p>
              <p className="text-xl font-bold text-foreground">
                {crmStats.pipelineValue > 0 ? `$${crmStats.pipelineValue.toLocaleString()}` : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{crmStats.totalDeals} deals tracked</p>
            </Link>
            <Link
              href="/portal/crm"
              className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Active Clients</p>
              <p className="text-xl font-bold text-emerald-600">{crmStats.activeDeals}</p>
              <p className="text-xs text-muted-foreground mt-0.5">on retainer</p>
            </Link>
            <Link
              href="/portal/crm/scout"
              className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Find More Leads</p>
              <p className="text-xl font-bold text-primary">Scout</p>
              <p className="text-xs text-muted-foreground mt-0.5">AI-powered search</p>
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
