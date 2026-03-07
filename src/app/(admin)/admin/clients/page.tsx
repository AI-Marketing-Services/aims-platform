import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { CheckCircle, AlertTriangle, Clock } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Clients" }

const statusConfig = {
  healthy: { icon: CheckCircle, label: "Healthy", class: "text-green-400 bg-green-500/10 border-green-500/20" },
  at_risk: { icon: AlertTriangle, label: "At Risk", class: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  past_due: { icon: AlertTriangle, label: "Past Due", class: "text-red-400 bg-red-500/10 border-red-500/20" },
  inactive: { icon: Clock, label: "Inactive", class: "text-gray-500 bg-white/5 border-white/10" },
}

export default async function AdminClientsPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  const clients = await db.user.findMany({
    where: {
      subscriptions: { some: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } } },
    },
    include: {
      subscriptions: {
        where: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
        include: { serviceArm: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000)

  const rows = clients.map((client) => {
    const mrr = client.subscriptions.reduce((s, sub) => s + sub.monthlyAmount, 0)
    const hasPastDue = client.subscriptions.some((s) => s.status === "PAST_DUE")
    const isAtRisk = !hasPastDue && client.lastLoginAt != null && client.lastLoginAt < fourteenDaysAgo
    const status: keyof typeof statusConfig = hasPastDue ? "past_due" : isAtRisk ? "at_risk" : "healthy"
    const services = client.subscriptions.map((s) => s.serviceArm.name)
    return { client, mrr, status, services }
  })

  const totalMRR = rows.reduce((s, r) => s + r.mrr, 0)
  const atRisk = rows.filter((r) => r.status !== "healthy").length

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Clients</h1>
          <p className="text-gray-400">
            {rows.length} active client{rows.length !== 1 ? "s" : ""} · ${totalMRR.toLocaleString()}/mo MRR
            {atRisk > 0 && (
              <span className="ml-2 text-yellow-400">· {atRisk} at risk</span>
            )}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-[#151821] border border-white/10 rounded-xl p-12 text-center">
          <p className="text-gray-400">No active clients yet.</p>
        </div>
      ) : (
        <div className="bg-[#151821] border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Client</th>
                <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Services</th>
                <th className="text-right text-xs text-gray-500 font-medium px-4 py-3">MRR</th>
                <th className="text-center text-xs text-gray-500 font-medium px-4 py-3">Status</th>
                <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map(({ client, mrr, status, services }) => {
                const sc = statusConfig[status]
                return (
                  <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="text-white font-medium text-sm">{client.name ?? client.email.split("@")[0]}</div>
                      <div className="text-gray-500 text-xs">{client.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {services.map((s) => (
                          <span key={s} className="text-xs px-2 py-0.5 bg-white/5 text-gray-400 rounded-md">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-white font-semibold text-sm">${mrr.toLocaleString()}</span>
                      <div className="text-xs text-gray-500">/mo</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${sc.class}`}>
                        <sc.icon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(client.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
