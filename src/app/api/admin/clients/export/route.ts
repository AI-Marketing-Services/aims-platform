import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function GET() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const role = (sessionClaims?.publicMetadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

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
  })

  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000)

  const rows = clients.map((client) => {
    const mrr = client.subscriptions.reduce((s, sub) => s + sub.monthlyAmount, 0)
    const hasPastDue = client.subscriptions.some((s) => s.status === "PAST_DUE")
    const isAtRisk = !hasPastDue && client.lastLoginAt != null && client.lastLoginAt < fourteenDaysAgo
    const status = hasPastDue ? "past_due" : isAtRisk ? "at_risk" : "healthy"
    const services = client.subscriptions.map((s) => s.serviceArm.name).join("; ")
    return [
      client.name ?? "",
      client.email,
      client.company ?? "",
      `$${mrr}`,
      status,
      services,
      new Date(client.createdAt).toLocaleDateString("en-US"),
      client.lastLoginAt ? new Date(client.lastLoginAt).toLocaleDateString("en-US") : "",
    ]
  })

  const header = ["Name", "Email", "Company", "MRR", "Status", "Services", "Client Since", "Last Login"]
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="clients-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
