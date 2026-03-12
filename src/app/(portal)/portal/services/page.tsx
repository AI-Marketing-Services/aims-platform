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
} from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/db"

const PILLAR_COLORS: Record<string, string> = {
  MARKETING: "bg-green-100 text-green-700",
  SALES: "bg-blue-100 text-blue-700",
  OPERATIONS: "bg-orange-100 text-orange-700",
  FINANCE: "bg-purple-100 text-purple-700",
}

const statusConfig = {
  ACTIVE: {
    icon: CheckCircle,
    label: "Active",
    class: "text-green-700 bg-green-50 border-green-200",
  },
  TRIALING: {
    icon: CheckCircle,
    label: "Trial",
    class: "text-blue-700 bg-blue-50 border-blue-200",
  },
  PENDING_SETUP: {
    icon: Clock,
    label: "Setting Up",
    class: "text-yellow-700 bg-yellow-50 border-yellow-200",
  },
  PAST_DUE: {
    icon: AlertCircle,
    label: "Needs Attention",
    class: "text-red-700 bg-red-50 border-red-200",
  },
  PAUSED: {
    icon: PauseCircle,
    label: "Paused",
    class: "text-gray-500 bg-gray-50 border-gray-200",
  },
  CANCELLED: {
    icon: PauseCircle,
    label: "Cancelled",
    class: "text-gray-500 bg-gray-50 border-gray-200",
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
          include: { serviceArm: true },
          orderBy: { createdAt: "desc" },
        },
      },
    })
  } catch {
    // DB failure — still render page with empty state
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
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Services</h1>
        <p className="text-gray-500">Active subscriptions and service status</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-border rounded-2xl p-5 flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Monthly Investment</div>
            <div className="text-2xl font-bold text-gray-900">
              ${totalMRR.toLocaleString()}
              <span className="text-sm text-gray-500 font-normal ml-1">/month</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-5 flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Active Services</div>
            <div className="text-2xl font-bold text-gray-900">
              {activeCount}
              <span className="text-sm text-gray-500 font-normal ml-1">running</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-5 flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Total Services</div>
            <div className="text-2xl font-bold text-gray-900">
              {subs.length}
              <span className="text-sm text-gray-500 font-normal ml-1">subscriptions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services list */}
      {subs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-10">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Start building your AI stack
            </h2>
            <p className="text-gray-500 text-sm">
              Most businesses start with one service and add more as they grow.
              Here are the 3 most popular starting points:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {STARTER_SERVICES.map((svc) => (
              <Link
                key={svc.name}
                href="/portal/marketplace"
                className="rounded-xl border border-border bg-card p-4 hover:border-[#DC2626]/40 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-semibold text-gray-900 text-sm leading-snug">
                    {svc.name}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#DC2626] transition-colors shrink-0 mt-0.5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{svc.price}</span>
                  {svc.badge && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#DC2626]/10 text-[#DC2626] font-medium">
                      {svc.badge}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <p className="text-sm text-gray-500">
            Or{" "}
            <Link
              href="/portal/marketplace"
              className="text-[#DC2626] font-medium hover:underline"
            >
              browse all 21 AI services &rarr;
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
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
              PILLAR_COLORS[svc.serviceArm.pillar] ?? "bg-gray-100 text-gray-600"

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
                className="bg-white border border-border rounded-2xl p-6"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3 className="text-gray-900 font-semibold">{svc.serviceArm.name}</h3>
                  {svc.tier && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {svc.tier}
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${statusClass} flex items-center gap-1`}
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
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Fulfillment progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#DC2626] rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="font-medium text-gray-900">
                    ${(svc.monthlyAmount / 100).toLocaleString()}/mo
                  </span>
                  {nextBilling && <span>Next billing: {nextBilling}</span>}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/portal/services/${svc.id}`}
                    className="px-4 py-1.5 text-sm font-medium rounded-lg bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors"
                  >
                    View Details
                  </Link>
                  <Link
                    href="/portal/billing"
                    className="px-4 py-1.5 text-sm font-medium rounded-lg border border-border text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Manage
                  </Link>
                  <Link
                    href="/portal/support"
                    className="px-4 py-1.5 text-sm font-medium rounded-lg border border-border text-gray-700 hover:bg-gray-50 transition-colors"
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
      <div className="mt-8 border-l-4 border-l-[#DC2626] border border-border rounded-2xl bg-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-[#DC2626]" />
            <span className="font-bold text-[#DC2626]">AIMS</span>
            <span className="text-gray-900 font-semibold">Ready to scale further?</span>
          </div>
          <p className="text-gray-500 text-sm">
            Plug more AI services directly into your existing stack.
          </p>
        </div>
        <Link
          href="/portal/marketplace"
          className="px-5 py-2.5 bg-[#DC2626] text-white text-sm font-medium rounded-lg hover:bg-[#B91C1C] transition-colors whitespace-nowrap shrink-0"
        >
          Browse 21 AI Services &rarr;
        </Link>
      </div>
    </div>
  )
}
