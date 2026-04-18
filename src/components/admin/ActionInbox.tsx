import Link from "next/link"
import { AlertCircle, ArrowRight, Clock, Sparkles, UserPlus } from "lucide-react"
import { db } from "@/lib/db"
import { cn } from "@/lib/utils"

type ActionItem = {
  label: string
  count: number
  href: string
  description: string
  icon: React.ReactNode
  tone: "neutral" | "accent" | "urgent"
}

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Server-side collector for the Action Inbox. Every query runs in parallel,
 * any single failure degrades gracefully to a zero-count tile instead of
 * taking down the whole dashboard.
 */
async function collectActionItems(): Promise<ActionItem[]> {
  const today = startOfToday()
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000)

  const [
    newAppsToday,
    consultsAwaitingInvite,
    failedInvites,
    abandonedApplications,
  ] = await Promise.allSettled([
    // 1. New Collective applications submitted today — admin should
    // skim them for hot leads to prioritise.
    db.leadMagnetSubmission.count({
      where: {
        type: "COLLECTIVE_APPLICATION",
        createdAt: { gte: today },
      },
    }),

    // 2. Consults booked or completed where no MightyInvite exists yet.
    // These are the applicants who've demoed but haven't been invited —
    // the funnel's most common stall point.
    db.deal.count({
      where: {
        stage: { in: ["CONSULT_BOOKED", "CONSULT_COMPLETED"] },
        mightyInvites: { none: {} },
      },
    }),

    // 3. Mighty invites that returned failed — member provisioning or
    // email send blew up and needs retry from the audit page.
    db.mightyInvite.count({
      where: { status: "failed" },
    }),

    // 4. Partial applications (step-1 dropoffs) from the last 7 days that
    // haven't been contacted or dismissed yet.
    db.partialApplication.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        completedAt: null,
        contactedAt: null,
        dismissedAt: null,
      },
    }),
  ])

  const getCount = (r: PromiseSettledResult<number>) =>
    r.status === "fulfilled" ? r.value : 0

  return [
    {
      label: "New Today",
      count: getCount(newAppsToday),
      href: "/admin/applications",
      description: "Overnight applications",
      icon: <Sparkles className="h-4 w-4" />,
      tone: "neutral",
    },
    {
      label: "Awaiting Invite",
      count: getCount(consultsAwaitingInvite),
      href: "/admin/crm",
      description: "Consults done, no Mighty invite",
      icon: <UserPlus className="h-4 w-4" />,
      tone: getCount(consultsAwaitingInvite) > 0 ? "accent" : "neutral",
    },
    {
      label: "Failed Invites",
      count: getCount(failedInvites),
      href: "/admin/mighty-invites?status=failed",
      description: "Provisioning errors — retry",
      icon: <AlertCircle className="h-4 w-4" />,
      tone: getCount(failedInvites) > 0 ? "urgent" : "neutral",
    },
    {
      label: "Abandoned (7d)",
      count: getCount(abandonedApplications),
      href: "/admin/follow-ups",
      description: "Step-1 dropoffs",
      icon: <Clock className="h-4 w-4" />,
      tone: "neutral",
    },
  ]
}

export async function ActionInbox() {
  const items = await collectActionItems()
  const hasAction = items.some((i) => i.count > 0)

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Action Inbox</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasAction
              ? "Things that need you right now."
              : "Nothing on the board — you're caught up."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => {
          const zero = item.count === 0
          const toneClass =
            zero
              ? "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
              : item.tone === "urgent"
              ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
              : item.tone === "accent"
              ? "border-primary/25 bg-primary/5 text-primary hover:bg-primary/10"
              : "border-border bg-card text-foreground hover:bg-muted/30"

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "group flex flex-col gap-3 rounded-xl border p-4 transition-colors",
                toneClass
              )}
            >
              <div className="flex items-center justify-between">
                <span className="opacity-70">{item.icon}</span>
                <ArrowRight className="h-3.5 w-3.5 opacity-30 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-3xl font-bold font-mono leading-none tabular-nums">
                {item.count}
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">
                  {item.label}
                </div>
                <div className="text-[11px] opacity-60 leading-tight mt-0.5 truncate">
                  {item.description}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
