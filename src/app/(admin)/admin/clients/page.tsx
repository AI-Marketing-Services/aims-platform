import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Search, Filter, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react"

const DEMO_CLIENTS = [
  { id: "c1", name: "Bill Santos", company: "Santos Auto Group", email: "bill@santosauto.com", services: ["Pro Bundle"], mrr: 297, status: "healthy", since: "2025-10-15", score: 92 },
  { id: "c2", name: "Mia Hoffman", company: "Hoffman & Co", email: "mia@hoffman.co", services: ["Elite Bundle"], mrr: 497, status: "healthy", since: "2025-09-01", score: 88 },
  { id: "c3", name: "Devon Park", company: "Park Hotels Group", email: "devon@parkhotels.com", services: ["Full Stack"], mrr: 297, status: "healthy", since: "2026-01-20", score: 79 },
  { id: "c4", name: "James Wu", company: "WuTech Solutions", email: "james@wutech.io", services: ["Elite Bundle"], mrr: 397, status: "at_risk", since: "2025-11-10", score: 41 },
  { id: "c5", name: "Kira Nolan", company: "Nolan Fitness", email: "kira@nolanfit.com", services: ["Growth Bundle"], mrr: 197, status: "healthy", since: "2026-02-01", score: 85 },
]

const statusConfig = {
  healthy: { icon: CheckCircle, label: "Healthy", class: "text-green-400 bg-green-500/10 border-green-500/20" },
  at_risk: { icon: AlertTriangle, label: "At Risk", class: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  churned: { icon: AlertTriangle, label: "Churned", class: "text-red-400 bg-red-500/10 border-red-500/20" },
}

export default async function AdminClientsPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  const totalMRR = DEMO_CLIENTS.reduce((sum, c) => sum + c.mrr, 0)

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Clients</h1>
          <p className="text-gray-400">{DEMO_CLIENTS.length} active clients · ${totalMRR}/mo MRR</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#DC2626] text-white text-sm font-medium rounded-lg hover:bg-[#B91C1C] transition-colors">
          Add Client
        </button>
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#151821] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#DC2626] text-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#151821] border border-white/10 rounded-lg text-gray-400 hover:text-white text-sm transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#151821] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Client</th>
              <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Services</th>
              <th className="text-right text-xs text-gray-500 font-medium px-4 py-3">MRR</th>
              <th className="text-center text-xs text-gray-500 font-medium px-4 py-3">Health</th>
              <th className="text-center text-xs text-gray-500 font-medium px-4 py-3">Score</th>
              <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Since</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {DEMO_CLIENTS.map((client) => {
              const sc = statusConfig[client.status as keyof typeof statusConfig]
              const scoreColor = client.score >= 80 ? "text-green-400" : client.score >= 60 ? "text-yellow-400" : "text-red-400"
              return (
                <tr key={client.id} className="hover:bg-white/2 transition-colors cursor-pointer">
                  <td className="px-5 py-4">
                    <div className="text-white font-medium text-sm">{client.name}</div>
                    <div className="text-gray-500 text-xs">{client.company}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {client.services.map((s) => (
                        <span key={s} className="text-xs px-2 py-0.5 bg-white/5 text-gray-400 rounded-md">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-white font-semibold text-sm">${client.mrr}</span>
                    <div className="text-xs text-gray-500">/mo</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${sc.class}`}>
                      <sc.icon className="w-3 h-3" />
                      {sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <TrendingUp className={`w-3.5 h-3.5 ${scoreColor}`} />
                      <span className={`text-sm font-bold ${scoreColor}`}>{client.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {new Date(client.since).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
