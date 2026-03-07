import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { CheckCircle, Clock, PauseCircle, ExternalLink, Zap } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/db"

const PILLAR_COLORS: Record<string, string> = {
  MARKETING: "bg-green-100 text-green-700",
  SALES: "bg-blue-100 text-blue-700",
  OPERATIONS: "bg-orange-100 text-orange-700",
  FINANCE: "bg-purple-100 text-purple-700",
}

const statusConfig = {
  ACTIVE: { icon: CheckCircle, label: "Active", class: "text-green-700 bg-green-50 border-green-200" },
  TRIALING: { icon: CheckCircle, label: "Trial", class: "text-blue-700 bg-blue-50 border-blue-200" },
  PENDING_SETUP: { icon: Clock, label: "Setting Up", class: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  PAST_DUE: { icon: Clock, label: "Past Due", class: "text-red-700 bg-red-50 border-red-200" },
  PAUSED: { icon: PauseCircle, label: "Paused", class: "text-gray-500 bg-gray-50 border-gray-200" },
  CANCELLED: { icon: PauseCircle, label: "Cancelled", class: "text-gray-500 bg-gray-50 border-gray-200" },
}

export default async function PortalServicesPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    include: {
      subscriptions: {
        include: { serviceArm: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!dbUser) redirect("/sign-in")

  const subs = dbUser.subscriptions
  const totalMRR = subs
    .filter((s) => s.status === "ACTIVE" || s.status === "TRIALING")
    .reduce((sum, s) => sum + s.monthlyAmount, 0)

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Services</h1>
        <p className="text-gray-500">Active subscriptions and service status</p>
      </div>

      {/* MRR summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Monthly Investment", value: `$${totalMRR.toLocaleString()}`, sub: "/month" },
          { label: "Active Services", value: subs.filter(s => s.status === "ACTIVE" || s.status === "TRIALING").length.toString(), sub: "running" },
          { label: "Total Services", value: subs.length.toString(), sub: "subscriptions" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}<span className="text-sm text-gray-500 font-normal ml-1">{stat.sub}</span></div>
          </div>
        ))}
      </div>

      {/* Services list */}
      {subs.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500 mb-4">You don&apos;t have any active services yet.</p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#B91C1C] transition"
          >
            Browse Services
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {subs.map((svc) => {
            const statusKey = (svc.status === "ACTIVE" || svc.status === "TRIALING" || svc.status === "PAST_DUE" || svc.status === "PAUSED" || svc.status === "CANCELLED")
              ? svc.status
              : "PENDING_SETUP"
            const { icon: StatusIcon, label: statusLabel, class: statusClass } = statusConfig[statusKey] ?? statusConfig.PENDING_SETUP
            const pillarColor = PILLAR_COLORS[svc.serviceArm.pillar] ?? "bg-gray-100 text-gray-600"
            return (
              <div
                key={svc.id}
                className="bg-white border border-gray-200 rounded-xl p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-gray-900 font-semibold">{svc.serviceArm.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${pillarColor}`}>
                        {svc.serviceArm.pillar.charAt(0) + svc.serviceArm.pillar.slice(1).toLowerCase()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusClass} flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusLabel}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {svc.tier && <span>{svc.tier} tier</span>}
                      <span>${svc.monthlyAmount.toLocaleString()}/mo</span>
                      {svc.createdAt && (
                        <span>Since {new Date(svc.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                      )}
                      {svc.currentPeriodEnd && (
                        <span>Renews {new Date(svc.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/portal/services/${svc.id}`} className="text-gray-400 hover:text-gray-700 transition-colors p-2">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>

                {/* Pending setup message */}
                {svc.fulfillmentStatus === "PENDING_SETUP" && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-yellow-700">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    Our team is setting up your service. You&apos;ll receive an onboarding email within 24 hours.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Upsell CTA */}
      <div className="mt-8 bg-red-50 border border-red-100 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-[#DC2626]" />
            <span className="text-gray-900 font-semibold">Ready to scale further?</span>
          </div>
          <p className="text-gray-500 text-sm">Browse 15 AI services that plug directly into your existing stack.</p>
        </div>
        <Link
          href="/marketplace"
          className="px-5 py-2.5 bg-[#DC2626] text-white text-sm font-medium rounded-lg hover:bg-[#B91C1C] transition-colors whitespace-nowrap"
        >
          Browse Marketplace
        </Link>
      </div>
    </div>
  )
}
