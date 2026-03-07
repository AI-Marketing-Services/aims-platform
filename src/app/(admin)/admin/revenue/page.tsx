import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { TrendingUp, TrendingDown, DollarSign, Users, ArrowUpRight } from "lucide-react"
import { RevenueChart } from "./RevenueChart"

export default async function AdminRevenuePage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Revenue</h1>
        <p className="text-gray-400">MRR growth, churn, and financial metrics</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "MRR", value: "$12,450", change: "+18.4%", positive: true, icon: DollarSign },
          { label: "ARR", value: "$149,400", change: "+18.4%", positive: true, icon: TrendingUp },
          { label: "Active Clients", value: "34", change: "+3 this mo", positive: true, icon: Users },
          { label: "Churn Rate", value: "2.1%", change: "-0.4%", positive: true, icon: TrendingDown },
        ].map((m) => (
          <div key={m.label} className="bg-[#151821] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 font-medium">{m.label}</span>
              <m.icon className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">{m.value}</div>
            <div className={`flex items-center gap-1 text-xs ${m.positive ? "text-green-400" : "text-red-400"}`}>
              <ArrowUpRight className="w-3 h-3" />
              {m.change}
            </div>
          </div>
        ))}
      </div>

      {/* MRR Chart */}
      <div className="bg-[#151821] border border-white/10 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-white mb-6">MRR Growth (Last 12 Months)</h3>
        <RevenueChart />
      </div>

      {/* MRR breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[#151821] border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Revenue by Service Pillar</h3>
          <div className="space-y-3">
            {[
              { pillar: "Marketing", amount: 5640, pct: 45, color: "bg-green-500" },
              { pillar: "Sales", amount: 3726, pct: 30, color: "bg-blue-500" },
              { pillar: "Operations", amount: 1868, pct: 15, color: "bg-orange-500" },
              { pillar: "Finance", amount: 1216, pct: 10, color: "bg-purple-500" },
            ].map((row) => (
              <div key={row.pillar}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">{row.pillar}</span>
                  <span className="text-white font-medium">${row.amount.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full">
                  <div className={`h-2 rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#151821] border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">New vs Expansion vs Churn</h3>
          <div className="space-y-3">
            {[
              { label: "New MRR", value: "+$2,880", color: "text-green-400" },
              { label: "Expansion MRR", value: "+$890", color: "text-blue-400" },
              { label: "Contraction MRR", value: "-$120", color: "text-orange-400" },
              { label: "Churn MRR", value: "-$297", color: "text-red-400" },
              { label: "Net New MRR", value: "+$3,353", color: "text-white" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0">
                <span className="text-gray-400">{row.label}</span>
                <span className={`font-bold ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
