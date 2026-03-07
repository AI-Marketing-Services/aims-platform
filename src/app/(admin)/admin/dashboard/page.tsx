import type { Metadata } from "next"
import Link from "next/link"
import { DollarSign, Users, TrendingUp, Zap, ArrowRight } from "lucide-react"

export const metadata: Metadata = { title: "Admin Dashboard" }

const STATS = [
  { label: "MRR", value: "$12,450", change: "+18%", icon: DollarSign, color: "text-green-600" },
  { label: "Active Clients", value: "34", change: "+3", icon: Users, color: "text-blue-600" },
  { label: "Open Deals", value: "18", change: "+5", icon: TrendingUp, color: "text-orange-600" },
  { label: "Services Active", value: "67", change: "+8", icon: Zap, color: "text-purple-600" },
]

const RECENT_DEALS = [
  { name: "Vendingpreneurs Inc.", stage: "DEMO_BOOKED", value: 2970, assignee: "Adam" },
  { name: "AutoMax Dealerships", stage: "PROPOSAL_SENT", value: 1200, assignee: "Marco" },
  { name: "Southwest Healthcare", stage: "NEGOTIATION", value: 4500, assignee: "Adam" },
  { name: "TechForce Staffing", stage: "QUALIFIED", value: 800, assignee: "Ivan" },
]

const STAGE_COLORS: Record<string, string> = {
  NEW_LEAD: "bg-gray-100 text-gray-700",
  QUALIFIED: "bg-blue-100 text-blue-700",
  DEMO_BOOKED: "bg-indigo-100 text-indigo-700",
  PROPOSAL_SENT: "bg-yellow-100 text-yellow-800",
  NEGOTIATION: "bg-amber-100 text-amber-800",
  ACTIVE_CLIENT: "bg-green-100 text-green-700",
}

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">AIMS operational overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, value, change, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="mt-2 text-2xl font-bold font-mono">{value}</p>
            <p className="mt-1 text-xs font-medium text-green-500">{change} this month</p>
          </div>
        ))}
      </div>

      {/* Recent Deals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Deals</h2>
          <Link href="/admin/crm" className="flex items-center gap-1 text-sm text-primary hover:underline">
            View pipeline <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Company</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Stage</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">MRR</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Owner</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_DEALS.map((deal) => (
                <tr key={deal.name} className="border-b border-border last:border-0 hover:bg-muted/30 transition">
                  <td className="px-5 py-3.5 font-medium">{deal.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${STAGE_COLORS[deal.stage] ?? "bg-gray-100 text-gray-700"}`}>
                      {deal.stage.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono">${deal.value.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{deal.assignee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
