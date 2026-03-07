import type { Metadata } from "next"
import { auth, currentUser } from "@clerk/nextjs/server"
import Link from "next/link"
import { ArrowRight, BarChart2, Zap, Globe, DollarSign } from "lucide-react"
import { db } from "@/lib/db"

export const metadata: Metadata = { title: "Dashboard" }

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  TRIALING: "bg-blue-100 text-blue-700",
  PAST_DUE: "bg-orange-100 text-orange-700",
  PAUSED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
}

export default async function PortalDashboard({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const { checkout } = await searchParams
  const { userId: clerkId } = await auth()
  const user = await currentUser()

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

  // Real metrics
  const [leadCount, meetingCount] = dbUser
    ? await Promise.all([
        db.deal.count({ where: { userId: dbUser.id } }),
        db.dealActivity.count({ where: { deal: { userId: dbUser.id }, type: "DEMO_COMPLETED" } }),
      ])
    : [0, 0]

  return (
    <div className="space-y-8">
      {/* Checkout success banner */}
      {checkout === "success" && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800 font-medium">
          Your subscription is active. Our team will begin setup within 24 hours — check your email for next steps.
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.firstName ?? "there"}</h1>
        <p className="mt-1 text-muted-foreground">Here&apos;s an overview of your active AIMS services.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Services", value: String(subs.length), icon: Zap },
          { label: "Monthly Spend", value: `$${totalMrr.toLocaleString()}`, icon: DollarSign },
          { label: "Leads Generated", value: leadCount > 0 ? String(leadCount) : "—", icon: BarChart2 },
          { label: "Meetings Booked", value: meetingCount > 0 ? String(meetingCount) : "—", icon: Globe },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold font-mono">{value}</p>
          </div>
        ))}
      </div>

      {/* Active Services */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Active Services</h2>
          <Link href="/portal/services" className="text-sm text-primary hover:underline">View all</Link>
        </div>

        {subs.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="text-muted-foreground mb-4">You don&apos;t have any active services yet.</p>
            <Link
              href="/portal/marketplace"
              className="inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#B91C1C] transition"
            >
              Browse Services <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {subs.map((sub) => {
              const statusClass = statusColors[sub.status] ?? "bg-gray-100 text-gray-600"
              const renewsAt = sub.currentPeriodEnd
                ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : null
              return (
                <div key={sub.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{sub.serviceArm.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClass}`}>
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

      {/* Upsell — only show if < 3 services */}
      {subs.length < 3 && (
        <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-1">Recommended for you</p>
              <p className="font-semibold text-foreground">
                {subs.some(s => s.serviceArm.slug === "cold-outbound")
                  ? "Add AI Voice Agents to close more deals"
                  : "Add Cold Outbound to fill your pipeline"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {subs.some(s => s.serviceArm.slug === "cold-outbound")
                  ? "Handle inbound calls 24/7 and follow up while you sleep."
                  : "Multi-domain sequences with AI personalization — 40+ meetings/mo."}
              </p>
            </div>
            <Link
              href="/marketplace"
              className="shrink-0 rounded-lg bg-[#DC2626] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B91C1C] transition whitespace-nowrap"
            >
              Explore Services
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
