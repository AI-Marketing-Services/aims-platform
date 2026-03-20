import type { Metadata } from "next"
import { auth, currentUser } from "@clerk/nextjs/server"
import Link from "next/link"
import {
  ArrowRight,
  BarChart2,
  Zap,
  Globe,
  DollarSign,
  Check,
  Bell,
  ShoppingCart,
  LifeBuoy,
  CreditCard,
  Mail,
  Users,
  MessageSquare,
  AlertTriangle,
} from "lucide-react"
import { db } from "@/lib/db"
import { getWorkspaceDashboard } from "@/lib/emailbison"
import { timeAgo } from "@/lib/utils"

export const metadata: Metadata = { title: "Dashboard" }

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-900/20 text-green-400",
  TRIALING: "bg-blue-900/20 text-blue-400",
  PAST_DUE: "bg-orange-900/20 text-orange-400",
  PAUSED: "bg-deep text-muted-foreground",
  CANCELLED: "bg-primary/15 text-primary",
}

export default async function PortalDashboard({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const { checkout } = await searchParams
  const { userId: clerkId } = await auth()
  const user = await currentUser()

  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? ""
  const firstName = user?.firstName ?? "there"

  const dbUser = clerkId
    ? await db.user.findUnique({
        where: { clerkId },
        include: {
          subscriptions: {
            where: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
            include: { serviceArm: true },
            orderBy: { createdAt: "desc" },
          },
        },
      })
    : null

  const subs = dbUser?.subscriptions ?? []
  const totalMrr = subs.reduce((sum, s) => sum + s.monthlyAmount, 0)

  // Email Bison campaign data (if connected)
  let emailCampaignData: Awaited<ReturnType<typeof getWorkspaceDashboard>> | null = null
  let emailWorkspaceName: string | null = null
  if (dbUser) {
    const ebConn = await db.emailBisonConnection.findUnique({ where: { userId: dbUser.id } })
    if (ebConn) {
      emailWorkspaceName = ebConn.workspaceName
      try {
        emailCampaignData = await getWorkspaceDashboard(ebConn.workspaceId)
      } catch {
        // graceful degradation
      }
    }
  }

  // Real metrics
  const [leadCount, meetingCount] = dbUser
    ? await Promise.all([
        db.deal.count({ where: { userId: dbUser.id } }),
        db.dealActivity.count({
          where: { deal: { userId: dbUser.id }, type: "DEMO_COMPLETED" },
        }),
      ])
    : [0, 0]

  // Onboarding checklist data
  let quizTaken = false
  let dealExists = false
  let recentActivity: Array<{
    id: string
    type: string
    title: string
    message: string
    sentAt: Date
  }> = []

  if (userEmail) {
    try {
      const [quizSub, deal, notifications] = await Promise.all([
        db.leadMagnetSubmission.findFirst({
          where: { email: userEmail, type: "AI_READINESS_QUIZ" },
        }),
        db.deal.findFirst({ where: { contactEmail: userEmail } }),
        clerkId
          ? db.notification.findMany({
              where: { userId: dbUser?.id },
              orderBy: { sentAt: "desc" },
              take: 10,
            })
          : Promise.resolve([]),
      ])
      quizTaken = !!quizSub
      dealExists = !!deal
      recentActivity = notifications
    } catch {
      // graceful degradation - leave defaults
    }
  }

  // Checklist progress
  const checklist = [
    { label: "Create your account", checked: true, href: null },
    {
      label: "Take the AI Readiness Quiz",
      checked: quizTaken,
      href: "/tools/ai-readiness-quiz",
    },
    {
      label: "Browse the marketplace",
      checked: false,
      href: "/portal/marketplace",
    },
    {
      label: "Add your first service",
      checked: subs.length > 0,
      href: "/portal/marketplace",
    },
    {
      label: "Book a strategy call",
      checked: dealExists,
      href: "/get-started",
    },
  ]
  const completedCount = checklist.filter((c) => c.checked).length
  const progressPct = Math.round((completedCount / checklist.length) * 100)

  // Smart upsell banner logic
  const activeSlugs = new Set(subs.map((s) => s.serviceArm.slug))
  let upsellValueProp = "Most clients start here."
  let upsellService = "Website + CRM + Chatbot"
  let upsellPrice = "from $97/mo"

  if (activeSlugs.has("website-crm-chatbot") && !activeSlugs.has("cold-outbound")) {
    upsellValueProp = "Your website is live. Now fill it with leads."
    upsellService = "Cold Outbound Engine"
    upsellPrice = "Custom"
  } else if (activeSlugs.has("cold-outbound") && !activeSlugs.has("voice-agents")) {
    upsellValueProp = "Email gets them interested. Voice closes the deal."
    upsellService = "AI Voice Agents"
    upsellPrice = "Custom"
  } else if (activeSlugs.has("voice-agents") && !activeSlugs.has("audience-targeting")) {
    upsellValueProp = "Know exactly who to call before they raise their hand."
    upsellService = "Audience Targeting"
    upsellPrice = "Custom"
  }

  return (
    <div className="space-y-8">
      {/* Checkout success banner */}
      {checkout === "success" && (
        <div className="rounded-xl border border-green-800 bg-green-900/15 px-5 py-4 text-sm text-green-800 font-medium">
          Your subscription is active. Our team will begin setup within 24 hours - check your email for next steps.
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {subs.length === 0
            ? `Welcome to AIMS, ${firstName}`
            : `Welcome back, ${firstName}`}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {subs.length === 0
            ? "Complete these steps to start generating leads."
            : "Here\u2019s an overview of your active AIMS services."}
        </p>
      </div>

      {/* ── ONBOARDING STATE (no subscriptions) ── */}
      {subs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          {/* Progress header */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                {completedCount} of {checklist.length} complete
              </span>
              <span className="text-xs text-muted-foreground">{progressPct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-[#C4972A] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Checklist items */}
          <ul className="space-y-3">
            {checklist.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      item.checked
                        ? "border-green-500 bg-green-900/15"
                        : "border-border bg-muted"
                    }`}
                  >
                    {item.checked && (
                      <Check className="h-3 w-3 text-green-400" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      item.checked
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {!item.checked && item.href && (
                  <Link
                    href={item.href}
                    className="shrink-0 flex items-center gap-1 text-sm font-medium text-[#C4972A] hover:text-[#A17D22] transition-colors"
                  >
                    Go <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        /* ── ACTIVE STATE: metric cards ── */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Active Services",
              value: String(subs.length),
              icon: Zap,
              active: subs.length > 0,
            },
            {
              label: "Monthly Spend",
              value: `$${totalMrr.toLocaleString()}`,
              icon: DollarSign,
              active: totalMrr > 0,
            },
            {
              label: "Leads Generated",
              value: leadCount > 0 ? String(leadCount) : "0",
              icon: BarChart2,
              active: leadCount > 0,
            },
            {
              label: "Meetings Booked",
              value: meetingCount > 0 ? String(meetingCount) : "0",
              icon: Globe,
              active: meetingCount > 0,
            },
          ].map(({ label, value, icon: Icon, active }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">{label}</p>
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-[#C4972A]" />
                </div>
              </div>
              <p className="text-3xl font-bold font-mono text-foreground">{value}</p>
              <p className={`mt-1 text-xs font-medium ${active ? "text-green-400" : "text-muted-foreground"}`}>
                {active ? "↑ Active" : "-"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── QUICK ACTIONS ── */}
      <div className="flex flex-wrap gap-3">
        {[
          { icon: BarChart2, label: "View Reports", href: "/portal/campaigns" },
          { icon: ShoppingCart, label: "Add Service", href: "/portal/marketplace" },
          { icon: LifeBuoy, label: "Get Help", href: "/portal/support" },
          { icon: CreditCard, label: "My Billing", href: "/portal/billing" },
        ].map(({ icon: Icon, label, href }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>

      {/* ── ACTIVE SERVICES ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Active Services</h2>
          <Link href="/portal/services" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>

        {subs.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <p className="text-muted-foreground mb-4">
              You don&apos;t have any active services yet.
            </p>
            <Link
              href="/portal/marketplace"
              className="inline-flex items-center gap-2 rounded-lg bg-[#C4972A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#A17D22] transition"
            >
              Browse Services <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {subs.map((sub) => {
              const statusClass = statusColors[sub.status] ?? "bg-deep text-muted-foreground"
              const renewsAt = sub.currentPeriodEnd
                ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : null
              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card p-5"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{sub.serviceArm.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClass}`}
                      >
                        {sub.status}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {sub.tier ? `${sub.tier} · ` : ""}${sub.monthlyAmount.toLocaleString()}/mo
                      {renewsAt ? ` · Renews ${renewsAt}` : ""}
                    </div>
                  </div>
                  <Link
                    href={`/portal/services/${sub.id}`}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── EMAIL CAMPAIGNS (if connected) ── */}
      {emailCampaignData && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#C4972A]" />
              <h2 className="text-lg font-semibold">Email Campaigns</h2>
              {emailWorkspaceName && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {emailWorkspaceName}
                </span>
              )}
            </div>
          </div>

          {/* Aggregate stat tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border">
            {[
              {
                label: "Emails Sent",
                value: emailCampaignData.totals.emailsSent.toLocaleString(),
                icon: Mail,
                color: "text-blue-400",
                bg: "bg-blue-900/20",
              },
              {
                label: "People Contacted",
                value: emailCampaignData.totals.peopleContacted.toLocaleString(),
                icon: Users,
                color: "text-purple-400",
                bg: "bg-purple-900/20",
              },
              {
                label: "Replies",
                value: `${emailCampaignData.totals.replies.toLocaleString()}`,
                sub: `${emailCampaignData.replyRate}% rate`,
                icon: MessageSquare,
                color: "text-green-400",
                bg: "bg-green-900/15",
              },
              {
                label: "Bounced",
                value: `${emailCampaignData.totals.bounced.toLocaleString()}`,
                sub: `${emailCampaignData.bounceRate}% rate`,
                icon: AlertTriangle,
                color: "text-orange-400",
                bg: "bg-orange-900/20",
              },
            ].map(({ label, value, sub, icon: Icon, color, bg }) => (
              <div key={label} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                  </div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
                <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
              </div>
            ))}
          </div>

          {/* Campaign list */}
          {emailCampaignData.campaigns.length > 0 && (
            <div className="border-t border-border">
              <div className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Active Campaigns
              </div>
              <div className="divide-y divide-border">
                {emailCampaignData.campaigns.map((c) => (
                  <div key={c.id} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.total_leads_contacted.toLocaleString()} contacted · {c.emails_sent.toLocaleString()} sent
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-3">
                      {/* Progress bar */}
                      <div className="hidden sm:block">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#C4972A] transition-all"
                              style={{ width: `${Math.min(c.completion_percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {c.completion_percentage.toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground text-right mt-0.5">complete</p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          c.status === "active"
                            ? "bg-green-900/15 text-green-400 border border-green-800"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SMART UPSELL BANNER ── */}
      <div className="border border-border rounded-2xl bg-card p-5 border-l-4 border-l-[#C4972A]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C4972A] mb-1">
              Recommended for you
            </p>
            <p className="font-semibold text-foreground">{upsellService}</p>
            <p className="mt-1 text-sm text-muted-foreground">{upsellValueProp}</p>
            <p className="mt-1 text-xs text-muted-foreground font-medium">{upsellPrice}</p>
          </div>
          <Link
            href="/portal/marketplace"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#C4972A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#A17D22] transition whitespace-nowrap"
          >
            Add to Plan <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* ── RECENT ACTIVITY ── */}
      <div className="rounded-2xl border border-border bg-card">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        {recentActivity.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No recent activity yet. Updates from your services will appear here.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recentActivity.map((notif) => (
              <li key={notif.id} className="flex items-start gap-3 px-5 py-4">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{notif.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">{notif.message}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {timeAgo(new Date(notif.sentAt))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
