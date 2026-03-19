import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ClientsTable } from "./ClientsTable"

export const metadata = { title: "Clients" }

export default async function AdminClientsPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  type SubWithArm = {
    id: string
    userId: string
    monthlyAmount: number
    serviceArm: { slug: string; name: string }
  }

  // Fetch all deals for stage/score/source data
  let deals: Awaited<ReturnType<typeof db.deal.findMany>> = []
  let allSubscriptions: SubWithArm[] = []

  try {
    deals = await db.deal.findMany({
      orderBy: { createdAt: "desc" },
    })
  } catch {}

  try {
    allSubscriptions = await db.subscription.findMany({
      where: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
      select: {
        id: true,
        userId: true,
        monthlyAmount: true,
        serviceArm: { select: { name: true, slug: true } },
      },
    }) as SubWithArm[]
  } catch {}

  // Build rows keyed by deal id — each deal is one "client" row
  const rows = deals.map((deal) => {
    // Find subscriptions for the deal's linked user
    const userSubs = deal.userId
      ? allSubscriptions.filter((s) => s.userId === deal.userId)
      : []
    const mrr = userSubs.reduce((s, sub) => s + sub.monthlyAmount, 0)
    const services = [...new Set(userSubs.map((s) => s.serviceArm.slug))]
    return {
      dealId: deal.id,
      userId: deal.userId ?? null,
      name: deal.contactName,
      email: deal.contactEmail,
      company: deal.company ?? "",
      stage: deal.stage as string,
      leadScore: deal.leadScore ?? null,
      mrr,
      services,
      source: deal.channelTag ?? null,
      createdAt: deal.createdAt.toISOString(),
    }
  })

  // Summary stats
  const totalClients = rows.filter((r) => r.stage === "ACTIVE_CLIENT").length
  const churned = rows.filter((r) => r.stage === "CHURNED" || r.stage === "LOST").length
  const activeRows = rows.filter((r) => r.stage === "ACTIVE_CLIENT")
  const totalMRR = activeRows.reduce((s, r) => s + r.mrr, 0)
  const avgMRR = totalClients > 0 ? Math.round(totalMRR / totalClients) : 0

  return (
    <div className="max-w-7xl">
      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {[
          { label: "Total Clients", value: rows.length.toString() },
          { label: "Active Clients", value: totalClients.toString() },
          { label: "Churned / Lost", value: churned.toString() },
          { label: "Avg MRR / Client", value: `$${avgMRR.toLocaleString()}` },
          { label: "Total MRR", value: `$${totalMRR.toLocaleString()}` },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card border border-border rounded-xl px-4 py-3"
          >
            <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
            <div className="text-lg font-bold font-mono text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      <ClientsTable rows={rows} />
    </div>
  )
}
