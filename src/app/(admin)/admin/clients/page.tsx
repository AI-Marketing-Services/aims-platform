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
    const status = hasPastDue ? "past_due" as const : isAtRisk ? "at_risk" as const : "healthy" as const
    const services = client.subscriptions.map((s) => s.serviceArm.name)
    return {
      id: client.id,
      name: client.name ?? "",
      email: client.email,
      company: client.company ?? "",
      mrr,
      status,
      services,
      createdAt: new Date(client.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    }
  })

  const totalMRR = rows.reduce((s, r) => s + r.mrr, 0)
  const atRisk = rows.filter((r) => r.status !== "healthy").length

  return (
    <div className="max-w-5xl">
      <ClientsTable rows={rows} totalMRR={totalMRR} atRisk={atRisk} />
    </div>
  )
}
