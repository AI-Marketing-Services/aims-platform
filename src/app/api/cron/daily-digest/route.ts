import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { notify } from "@/lib/notifications"

// Vercel Cron: runs daily at 8am UTC (Monday–Friday)
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/daily-digest", "schedule": "0 8 * * 1-5" }] }

export const maxDuration = 60

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())

  // Gather yesterday's metrics in parallel
  const [
    newLeads,
    newPurchases,
    totalMrr,
    activeClients,
    openTickets,
    overdueTasksCount,
    hotLeads,
    recentActivities,
  ] = await Promise.all([
    db.deal.count({
      where: { createdAt: { gte: startOfYesterday, lt: startOfToday } },
    }),
    db.subscription.count({
      where: { createdAt: { gte: startOfYesterday, lt: startOfToday }, status: "ACTIVE" },
    }),
    db.subscription.aggregate({
      where: { status: "ACTIVE" },
      _sum: { monthlyAmount: true },
    }),
    db.subscription.groupBy({
      by: ["userId"],
      where: { status: "ACTIVE" },
    }).then((r) => r.length),
    db.supportTicket.count({ where: { status: "OPEN" } }).catch(() => 0),
    db.fulfillmentTask.count({
      where: {
        status: { not: "DONE" },
        dueDate: { lt: now },
      },
    }),
    db.deal.findMany({
      where: {
        leadScoreTier: "hot",
        stage: { in: ["NEW_LEAD", "QUALIFIED", "DEMO_BOOKED"] },
      },
      select: { contactName: true, company: true, leadScore: true },
      orderBy: { leadScore: "desc" },
      take: 5,
    }),
    db.dealActivity.findMany({
      where: { createdAt: { gte: startOfYesterday } },
      include: { deal: { select: { contactName: true, company: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ])

  const mrr = totalMrr._sum.monthlyAmount ?? 0

  // Build digest message
  const lines: string[] = [
    `*AIMS Daily Digest — ${now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}*`,
    "",
    `*Revenue*`,
    `MRR: $${mrr.toLocaleString()} | Active clients: ${activeClients}`,
    "",
    `*Yesterday*`,
    `New leads: ${newLeads} | New purchases: ${newPurchases}`,
    "",
  ]

  if (hotLeads.length > 0) {
    lines.push(`*Hot Leads to Follow Up*`)
    hotLeads.forEach((l) => {
      lines.push(`• ${l.contactName}${l.company ? ` (${l.company})` : ""} — Score: ${l.leadScore ?? "?"}`)
    })
    lines.push("")
  }

  if (overdueTasksCount > 0) {
    lines.push(`*Action Required*`)
    lines.push(`${overdueTasksCount} overdue fulfillment task${overdueTasksCount !== 1 ? "s" : ""}`)
    lines.push("")
  }

  if (openTickets > 0) {
    lines.push(`${openTickets} open support ticket${openTickets !== 1 ? "s" : ""} awaiting response`)
    lines.push("")
  }

  if (recentActivities.length > 0) {
    lines.push(`*Activity*`)
    recentActivities.slice(0, 5).forEach((a) => {
      const who = a.deal.company ?? a.deal.contactName
      lines.push(`• ${who}: ${a.type.replace(/_/g, " ").toLowerCase()}`)
    })
  }

  const message = lines.join("\n")

  // Send via notify (Slack + in-app)
  await notify({
    type: "daily_digest",
    title: "Daily Digest",
    message,
    channel: "ALL",
    urgency: "low",
  })

  return NextResponse.json({
    sent: true,
    newLeads,
    newPurchases,
    mrr,
    activeClients,
    hotLeads: hotLeads.length,
    overdueTasksCount,
    openTickets,
    timestamp: now.toISOString(),
  })
}
