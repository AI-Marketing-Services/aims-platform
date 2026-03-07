import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { CheckCircle, Clock, PauseCircle, ExternalLink, Zap } from "lucide-react"
import Link from "next/link"

const DEMO_SERVICES = [
  {
    id: "svc_1",
    name: "Website + CRM + Chatbot Bundle",
    pillar: "MARKETING",
    tier: "Pro",
    status: "active" as const,
    monthlyPrice: 297,
    activatedAt: "2025-12-01",
    nextBillingDate: "2026-04-01",
    pillarColor: "bg-green-100 text-green-700",
    metrics: { leads: 124, meetings: 18, revenue: 42000 },
  },
  {
    id: "svc_2",
    name: "Cold Outbound System",
    pillar: "SALES",
    tier: "Growth",
    status: "active" as const,
    monthlyPrice: 197,
    activatedAt: "2026-01-15",
    nextBillingDate: "2026-04-15",
    pillarColor: "bg-blue-100 text-blue-700",
    metrics: { leads: 89, meetings: 12, revenue: 28000 },
  },
  {
    id: "svc_3",
    name: "AI Voice Agents",
    pillar: "SALES",
    tier: "Starter",
    status: "pending" as const,
    monthlyPrice: 97,
    activatedAt: null,
    nextBillingDate: null,
    pillarColor: "bg-blue-100 text-blue-700",
    metrics: null,
  },
]

const statusConfig = {
  active: { icon: CheckCircle, label: "Active", class: "text-green-700 bg-green-50 border-green-200" },
  pending: { icon: Clock, label: "Setting Up", class: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  paused: { icon: PauseCircle, label: "Paused", class: "text-gray-500 bg-gray-50 border-gray-200" },
}

export default async function PortalServicesPage() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const totalMRR = DEMO_SERVICES.filter((s) => s.status === "active").reduce(
    (sum, s) => sum + s.monthlyPrice,
    0
  )

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Services</h1>
        <p className="text-gray-500">Active subscriptions and service status</p>
      </div>

      {/* MRR summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Monthly Investment", value: `$${totalMRR}`, sub: "/month" },
          { label: "Active Services", value: DEMO_SERVICES.filter(s => s.status === "active").length.toString(), sub: "running" },
          { label: "Leads Generated", value: "213", sub: "this month" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}<span className="text-sm text-gray-500 font-normal ml-1">{stat.sub}</span></div>
          </div>
        ))}
      </div>

      {/* Services list */}
      <div className="space-y-4">
        {DEMO_SERVICES.map((svc) => {
          const { icon: StatusIcon, label: statusLabel, class: statusClass } = statusConfig[svc.status]
          return (
            <div
              key={svc.id}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-gray-900 font-semibold">{svc.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${svc.pillarColor}`}>
                      {svc.pillar}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusClass} flex items-center gap-1`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusLabel}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span>{svc.tier} tier</span>
                    <span>${svc.monthlyPrice}/mo</span>
                    {svc.activatedAt && (
                      <span>Since {new Date(svc.activatedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                    )}
                    {svc.nextBillingDate && (
                      <span>Renews {new Date(svc.nextBillingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    )}
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-700 transition-colors p-2">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>

              {/* Metrics (active only) */}
              {svc.metrics && (
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
                  {[
                    { label: "Leads Generated", value: svc.metrics.leads },
                    { label: "Meetings Booked", value: svc.metrics.meetings },
                    { label: "Pipeline Value", value: `$${(svc.metrics.revenue / 1000).toFixed(0)}K` },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="text-xs text-gray-500">{m.label}</div>
                      <div className="text-lg font-bold text-gray-900">{m.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pending setup message */}
              {svc.status === "pending" && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-yellow-700">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  Our team is setting up your service. You&apos;ll receive an onboarding email within 24 hours.
                </div>
              )}
            </div>
          )
        })}
      </div>

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
