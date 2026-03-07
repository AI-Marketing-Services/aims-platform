import type { Metadata } from "next"
import { auth, currentUser } from "@clerk/nextjs/server"
import Link from "next/link"
import { ArrowRight, BarChart2, Zap, Globe, DollarSign } from "lucide-react"

export const metadata: Metadata = { title: "Dashboard" }

const DEMO_SERVICES = [
  { name: "Website + CRM + Chatbot", status: "ACTIVE", tier: "Pro", amount: 297, nextBilling: "Apr 1, 2026" },
  { name: "Cold Outbound Engine", status: "ACTIVE", tier: "Custom", amount: 2500, nextBilling: "Apr 1, 2026" },
]

export default async function PortalDashboard() {
  const user = await currentUser()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.firstName ?? "there"}</h1>
        <p className="mt-1 text-muted-foreground">Here&apos;s an overview of your active AIMS services.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Services", value: "2", icon: Zap },
          { label: "Monthly Spend", value: "$2,797", icon: DollarSign },
          { label: "Leads Generated", value: "142", icon: BarChart2 },
          { label: "Meetings Booked", value: "18", icon: Globe },
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
        <div className="space-y-3">
          {DEMO_SERVICES.map((service) => (
            <div key={service.name} className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{service.name}</span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                    {service.status}
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {service.tier} · ${service.amount.toLocaleString()}/mo · Renews {service.nextBilling}
                </div>
              </div>
              <Link href="/portal/services" className="text-sm text-primary hover:underline flex items-center gap-1">
                View <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Upsell */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">Boost your pipeline with AI Voice Agents</p>
            <p className="mt-1 text-sm text-muted-foreground">Handle inbound calls 24/7 and run outbound campaigns while you sleep.</p>
          </div>
          <Link
            href="/portal/marketplace"
            className="ml-4 shrink-0 rounded-lg bg-[#DC2626] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B91C1C] transition"
          >
            Add Service
          </Link>
        </div>
      </div>
    </div>
  )
}
