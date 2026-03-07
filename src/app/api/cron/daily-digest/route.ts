import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { notify } from "@/lib/notifications"

export const maxDuration = 60

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const yesterday = new Date(now.getTime() - 86400000)
  const lastMonth = new Date(now.getTime() - 30 * 86400000)

  const [
    mrr,
    mrrLastMonth,
    newSubsYesterday,
    activeClients,
    newLeadsYesterday,
    hotLeads,
    warmLeads,
    coldLeads,
    dealsInNegotiation,
    atRiskClients,
    quizCompletions,
    calcCompletions,
    auditCompletions,
    chatbotLeads,
    activeTasks,
    overdueTasks,
    eodReports,
    expectedInterns,
    newSubAmount,
  ] = await Promise.all([
    db.subscription.aggregate({ where: { status: "ACTIVE" }, _sum: { monthlyAmount: true } }),
    db.subscription.aggregate({ where: { status: "ACTIVE", createdAt: { lt: lastMonth } }, _sum: { monthlyAmount: true } }),
    db.subscription.count({ where: { createdAt: { gte: yesterday }, status: "ACTIVE" } }),
    db.subscription.groupBy({ by: ["userId"], where: { status: "ACTIVE" } }).then(r => r.length),
    db.deal.count({ where: { createdAt: { gte: yesterday } } }),
    db.deal.count({ where: { leadScoreTier: "hot", stage: { in: ["NEW_LEAD", "QUALIFIED", "DEMO_BOOKED"] }, createdAt: { gte: yesterday } } }),
    db.deal.count({ where: { leadScoreTier: "warm", createdAt: { gte: yesterday } } }),
    db.deal.count({ where: { leadScoreTier: "cold", createdAt: { gte: yesterday } } }),
    db.deal.findMany({ where: { stage: { in: ["NEGOTIATION", "PROPOSAL_SENT"] } }, select: { contactName: true, value: true } }),
    db.user.findMany({
      where: { lastLoginAt: { lt: new Date(now.getTime() - 14 * 86400000) }, subscriptions: { some: { status: "ACTIVE" } } },
      include: { subscriptions: { where: { status: "ACTIVE" }, select: { monthlyAmount: true } } },
      take: 5,
    }),
    db.leadMagnetSubmission.count({ where: { type: "AI_READINESS_QUIZ", createdAt: { gte: yesterday } } }),
    db.leadMagnetSubmission.count({ where: { type: "ROI_CALCULATOR", createdAt: { gte: yesterday } } }),
    db.leadMagnetSubmission.count({ where: { type: "WEBSITE_AUDIT", createdAt: { gte: yesterday } } }),
    db.deal.count({ where: { channelTag: "website-chatbot", createdAt: { gte: yesterday } } }),
    db.fulfillmentTask.count({ where: { status: { not: "done" }, dueDate: { gte: now } } }),
    db.fulfillmentTask.findMany({
      where: { status: { not: "done" }, dueDate: { lt: now } },
      select: { title: true, assignedTo: true, dueDate: true },
      take: 10,
    }),
    db.eODReport.count({ where: { createdAt: { gte: yesterday } } }).catch(() => 0),
    db.internProfile.count({ where: { status: "ACTIVE" } }).catch(() => 0),
    db.subscription.aggregate({ where: { createdAt: { gte: yesterday }, status: "ACTIVE" }, _sum: { monthlyAmount: true } }),
  ])

  const currentMrr = mrr._sum.monthlyAmount ?? 0
  const previousMrr = mrrLastMonth._sum.monthlyAmount ?? 0
  const mrrChange = previousMrr > 0 ? ((currentMrr - previousMrr) / previousMrr * 100).toFixed(1) : "n/a"
  const atRiskMrr = atRiskClients.reduce((s, u) => s + u.subscriptions.reduce((a, sub) => a + sub.monthlyAmount, 0), 0)
  const negotiationValue = dealsInNegotiation.reduce((s, d) => s + (d.value ?? 0), 0)
  const newMrr = newSubAmount._sum.monthlyAmount ?? 0

  const lines: string[] = [
    `📊 *AIMS Daily Digest — ${now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}*`,
    "",
    `💰 *Revenue*`,
    `  MRR: $${currentMrr.toLocaleString()}${previousMrr > 0 ? ` (${Number(mrrChange) >= 0 ? "+" : ""}${mrrChange}% vs last month)` : ""}`,
    `  New subscriptions yesterday: ${newSubsYesterday}${newMrr > 0 ? ` worth $${newMrr.toLocaleString()}/mo` : ""}`,
    `  Active clients: ${activeClients}`,
    "",
    `🎯 *Pipeline*`,
    `  New leads (24h): ${newLeadsYesterday} (${hotLeads} hot, ${warmLeads} warm, ${coldLeads} cold)`,
    `  Deals in negotiation: ${dealsInNegotiation.length}${negotiationValue > 0 ? ` worth $${negotiationValue.toLocaleString()}` : ""}`,
    `  At risk (no login 14+ days): ${atRiskClients.length} clients ($${atRiskMrr.toLocaleString()} MRR at risk)`,
    "",
    `🧲 *Lead Magnets (last 24h)*`,
    `  Quiz completions: ${quizCompletions}`,
    `  ROI calculations: ${calcCompletions}`,
    `  Website audits: ${auditCompletions}`,
    `  Chatbot leads captured: ${chatbotLeads}`,
    "",
    `🔧 *Fulfillment*`,
    `  Active tasks: ${activeTasks}`,
    `  Overdue tasks: ${overdueTasks.length}${overdueTasks.length > 0 ? " ⚠️" : " ✓"}`,
  ]

  if (overdueTasks.length > 0) {
    overdueTasks.slice(0, 5).forEach(t => {
      const daysAgo = Math.floor((now.getTime() - (t.dueDate?.getTime() ?? 0)) / 86400000)
      lines.push(`    • ${t.title} (${t.assignedTo ?? "unassigned"}) — ${daysAgo}d overdue`)
    })
  }

  lines.push("")
  lines.push(`👥 *Team*`)
  lines.push(`  EOD reports submitted: ${eodReports}/${expectedInterns > 0 ? expectedInterns : "?"}`)
  if (eodReports === 0 && expectedInterns > 0) lines.push("  ⚠️ No EOD reports received!")

  const message = lines.join("\n")

  await notify({
    type: "daily_digest",
    title: `Daily Digest — ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    message,
    channel: "ALL",
    urgency: "low",
  })

  return NextResponse.json({
    sent: true,
    mrr: currentMrr,
    newLeadsYesterday,
    newSubsYesterday,
    activeClients,
    overdueCount: overdueTasks.length,
  })
}
