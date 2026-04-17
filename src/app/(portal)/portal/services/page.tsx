import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import {
  CheckCircle,
  Clock,
  AlertCircle,
  PauseCircle,
  ArrowRight,
  DollarSign,
  Layers,
  Package,
  Zap,
  Circle,
  ClipboardList,
  User,
} from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/db"

const PILLAR_COLORS: Record<string, string> = {
  MARKETING: "bg-primary/5 text-primary/80",
  SALES: "bg-primary/10 text-primary",
  OPERATIONS: "bg-primary/15 text-primary",
  FINANCE: "bg-muted/50 text-muted-foreground",
}

const statusConfig = {
  ACTIVE: {
    icon: CheckCircle,
    label: "Active",
    class: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  TRIALING: {
    icon: CheckCircle,
    label: "Trial",
    class: "text-primary bg-primary/5 border-primary/30",
  },
  PENDING_SETUP: {
    icon: Clock,
    label: "Setting Up",
    class: "text-primary/70 bg-primary/5 border-primary/20",
  },
  PAST_DUE: {
    icon: AlertCircle,
    label: "Needs Attention",
    class: "text-primary bg-primary/10 border-primary/30",
  },
  PAUSED: {
    icon: PauseCircle,
    label: "Paused",
    class: "text-muted-foreground bg-deep border-border",
  },
  CANCELLED: {
    icon: PauseCircle,
    label: "Cancelled",
    class: "text-muted-foreground bg-deep border-border",
  },
}

function getFulfillmentProgress(
  subStatus: string,
  fulfillmentStatus: string
): number {
  if (subStatus === "ACTIVE" || fulfillmentStatus === "ACTIVE_MANAGED" || fulfillmentStatus === "COMPLETED") {
    return 100
  }
  if (fulfillmentStatus === "IN_PROGRESS" || subStatus === "TRIALING") {
    return 60
  }
  return 40
}

const STARTER_SERVICES = [
  {
    name: "Website + CRM + Chatbot",
    price: "from $97/mo",
    badge: "Most Popular",
  },
  {
    name: "Cold Outbound Engine",
    price: "Custom pricing",
    badge: null,
  },
  {
    name: "AI Voice Agents",
    price: "Custom pricing",
    badge: null,
  },
]

export default async function PortalServicesPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  let dbUser = null
  try {
    dbUser = await db.user.findUnique({
      where: { clerkId },
      include: {
        subscriptions: {
          include: {
            serviceArm: true,
            fulfillmentTasks: {
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })
  } catch {
    // DB failure - still render page with empty state
  }

  if (!dbUser) redirect("/sign-in")

  const subs = dbUser.subscriptions
  const totalMRR = subs
    .filter((s) => s.status === "ACTIVE" || s.status === "TRIALING")
    .reduce((sum, s) => sum + s.monthlyAmount, 0)

  const activeCount = subs.filter(
    (s) => s.status === "ACTIVE" || s.status === "TRIALING"
  ).length

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">My Services</h1>
        <p className="text-muted-foreground">Active subscriptions and service status</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 stagger-in">
        <div className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 text-[#981B1B]" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Monthly Investment</div>
            <div className="text-2xl font-bold text-foreground">
              ${totalMRR.toLocaleString()}
              <span className="text-sm text-muted-foreground font-normal ml-1">/month</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-[#981B1B]" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Active Services</div>
            <div className="text-2xl font-bold text-foreground">
              {activeCount}
              <span className="text-sm text-muted-foreground font-normal ml-1">running</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-[#981B1B]" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Total Services</div>
            <div className="text-2xl font-bold text-foreground">
              {subs.length}
              <span className="text-sm text-muted-foreground font-normal ml-1">subscriptions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services list */}
      {subs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Start building your AI stack
            </h2>
            <p className="text-muted-foreground text-sm">
              Most businesses start with one service and add more as they grow.
              Here are the 3 most popular starting points:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {STARTER_SERVICES.map((svc) => (
              <Link
                key={svc.name}
                href="/portal/marketplace"
                className="rounded-xl border border-border bg-card p-4 hover:border-[#981B1B]/40 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-semibold text-foreground text-sm leading-snug">
                    {svc.name}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[#981B1B] transition-colors shrink-0 mt-0.5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{svc.price}</span>
                  {svc.badge && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#981B1B]/10 text-[#981B1B] font-medium">
                      {svc.badge}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            Or{" "}
            <Link
              href="/portal/marketplace"
              className="text-[#981B1B] font-medium hover:underline"
            >
              browse all 21 AI services &rarr;
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-4 stagger-in">
          {subs.map((svc) => {
            const statusKey =
              svc.status === "ACTIVE" ||
              svc.status === "TRIALING" ||
              svc.status === "PAST_DUE" ||
              svc.status === "PAUSED" ||
              svc.status === "CANCELLED"
                ? svc.status
                : "PENDING_SETUP"
            const {
              icon: StatusIcon,
              label: statusLabel,
              class: statusClass,
            } = statusConfig[statusKey as keyof typeof statusConfig] ??
              statusConfig.PENDING_SETUP

            const pillarColor =
              PILLAR_COLORS[svc.serviceArm.pillar] ?? "bg-deep text-muted-foreground"

            const progress = getFulfillmentProgress(
              svc.status,
              svc.fulfillmentStatus
            )

            const nextBilling = svc.currentPeriodEnd
              ? new Date(svc.currentPeriodEnd).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : null

            return (
              <div
                key={svc.id}
                className="bg-card border border-border rounded-2xl p-6"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3 className="text-foreground font-semibold">{svc.serviceArm.name}</h3>
                  {svc.tier && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-deep text-muted-foreground font-medium">
                      {svc.tier}
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${statusClass} flex items-center gap-1 ${statusKey === "ACTIVE" ? "status-live" : ""}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusLabel}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${pillarColor}`}>
                    {svc.serviceArm.pillar.charAt(0) +
                      svc.serviceArm.pillar.slice(1).toLowerCase()}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Fulfillment progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-deep rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#981B1B] rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="font-medium text-foreground">
                    ${svc.monthlyAmount.toLocaleString()}/mo
                  </span>
                  {nextBilling && <span>Next billing: {nextBilling}</span>}
                </div>

                {/* Fulfillment tasks checklist */}
                {svc.fulfillmentTasks.length > 0 && (
                  <div className="mb-4 border border-border rounded-lg overflow-hidden">
                    <div className="px-4 py-2 bg-deep border-b border-border flex items-center gap-2">
                      <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Setup Tasks ({svc.fulfillmentTasks.filter((t) => t.status === "done").length}/{svc.fulfillmentTasks.length})
                      </span>
                    </div>
                    <div className="divide-y divide-border">
                      {svc.fulfillmentTasks.map((task) => {
                        const isDone = task.status === "done"
                        return (
                          <div
                            key={task.id}
                            className="flex items-center gap-3 px-4 py-2.5"
                          >
                            {isDone ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                            <span
                              className={`text-sm flex-1 ${
                                isDone
                                  ? "text-muted-foreground line-through"
                                  : "text-foreground"
                              }`}
                            >
                              {task.title}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                isDone
                                  ? "bg-emerald-50 text-emerald-700"
                                  : task.status === "in_progress"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted/40 text-muted-foreground"
                              }`}
                            >
                              {task.status === "done"
                                ? "Done"
                                : task.status === "in_progress"
                                ? "In Progress"
                                : "To Do"}
                            </span>
                            {task.assignedTo && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="w-3 h-3" />
                                {task.assignedTo}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {!svc.onboardingCompletedAt &&
                    svc.serviceArm.onboardingFormSchema && (
                      <Link
                        href={`/portal/onboarding/${svc.id}`}
                        className="px-4 py-1.5 text-sm font-medium rounded-lg bg-[#981B1B] text-white hover:bg-[#791515] transition-colors"
                      >
                        Complete Onboarding
                      </Link>
                    )}
                  <Link
                    href={`/portal/services/${svc.serviceArmId}`}
                    className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      !svc.onboardingCompletedAt && svc.serviceArm.onboardingFormSchema
                        ? "border border-border text-foreground hover:bg-surface"
                        : "bg-[#981B1B] text-white hover:bg-[#791515]"
                    }`}
                  >
                    View Details
                  </Link>
                  <Link
                    href="/portal/billing"
                    className="px-4 py-1.5 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-surface transition-colors"
                  >
                    Manage
                  </Link>
                  <Link
                    href="/portal/support"
                    className="px-4 py-1.5 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-surface transition-colors"
                  >
                    Get Help
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upsell banner */}
      <div className="mt-8 border-l-4 border-l-[#981B1B] border border-border rounded-2xl bg-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-[#981B1B]" />
            <span className="font-bold text-[#981B1B]">AIMS</span>
            <span className="text-foreground font-semibold">Ready to scale further?</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Plug more AI services directly into your existing stack.
          </p>
        </div>
        <Link
          href="/portal/marketplace"
          className="px-5 py-2.5 bg-[#981B1B] text-white text-sm font-medium rounded-lg hover:bg-[#791515] transition-colors whitespace-nowrap shrink-0"
        >
          Browse 21 AI Services &rarr;
        </Link>
      </div>
    </div>
  )
}
