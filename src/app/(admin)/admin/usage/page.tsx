import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { MONTHLY_ALLOWANCES } from "@/lib/usage"
import { Zap, Users } from "lucide-react"

export const metadata = { title: "Usage Dashboard" }
export const dynamic = "force-dynamic"

type UsageEventType = keyof typeof MONTHLY_ALLOWANCES

async function getUsageData() {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const [events, members] = await Promise.all([
    db.usageEvent.groupBy({
      by: ["userId", "type"],
      where: { createdAt: { gte: start } },
      _sum: { credits: true },
      orderBy: { _sum: { credits: "desc" } },
    }),
    db.user.findMany({
      where: { role: "CLIENT" },
      select: {
        id: true,
        name: true,
        email: true,
        memberProfile: { select: { businessName: true } },
      },
    }),
  ])

  const memberMap = new Map(members.map((m) => [m.id, m]))

  // Aggregate per user
  const perUser = new Map<string, Record<string, number>>()
  for (const row of events) {
    if (!perUser.has(row.userId)) perUser.set(row.userId, {})
    perUser.get(row.userId)![row.type] = row._sum.credits ?? 0
  }

  // Platform totals by type
  const platformTotals: Record<string, number> = {}
  for (const row of events) {
    platformTotals[row.type] = (platformTotals[row.type] ?? 0) + (row._sum.credits ?? 0)
  }

  const rows = Array.from(perUser.entries()).map(([userId, usage]) => {
    const member = memberMap.get(userId)
    const total = Object.values(usage).reduce((s, v) => s + v, 0)
    return { userId, member, usage, total }
  }).sort((a, b) => b.total - a.total)

  return { rows, platformTotals, memberCount: members.length }
}

const TYPE_LABELS: Record<string, string> = {
  lead_scout: "Lead Scout",
  proposal_generate: "Proposals",
  signal_digest: "Signal",
  ai_chat: "AI Chat",
}

export default async function AdminUsagePage() {
  await requireAdmin()

  const { rows, platformTotals, memberCount } = await getUsageData()
  const types = Object.keys(MONTHLY_ALLOWANCES)

  return (
    <div className="px-6 py-6 space-y-6 max-w-6xl mx-auto">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Usage" }]} />

      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Zap className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">AI Usage Dashboard</h1>
          <p className="text-xs text-muted-foreground">Current month — credits consumed by member</p>
        </div>
      </div>

      {/* Platform totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {types.map((type) => {
          const used = platformTotals[type] ?? 0
          const allowance = MONTHLY_ALLOWANCES[type as UsageEventType]
          const pct = Math.min(100, Math.round((used / (allowance * memberCount || 1)) * 100))
          return (
            <div key={type} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                {TYPE_LABELS[type] ?? type}
              </p>
              <p className="text-2xl font-bold text-foreground">{used}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                {allowance}/member · {pct}% of capacity
              </p>
            </div>
          )
        })}
      </div>

      {/* Per-member table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Per-Member Usage</p>
          </div>
          <p className="text-xs text-muted-foreground">{rows.length} active this month</p>
        </div>

        {rows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-muted-foreground/60">No AI usage recorded this month</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Member
                  </th>
                  {types.map((t) => (
                    <th key={t} className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {TYPE_LABELS[t] ?? t}
                    </th>
                  ))}
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ userId, member, usage, total }) => (
                  <tr key={userId} className="hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">
                        {member?.memberProfile?.businessName ?? member?.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">{member?.email}</p>
                    </td>
                    {types.map((t) => {
                      const val = usage[t] ?? 0
                      const allowance = MONTHLY_ALLOWANCES[t as UsageEventType]
                      const warn = val >= allowance * 0.8
                      return (
                        <td key={t} className="text-right px-4 py-3">
                          <span className={warn ? "text-amber-400 font-semibold" : "text-foreground"}>
                            {val > 0 ? val : <span className="text-muted-foreground/40">—</span>}
                          </span>
                        </td>
                      )
                    })}
                    <td className="text-right px-5 py-3 font-bold text-primary">{total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
