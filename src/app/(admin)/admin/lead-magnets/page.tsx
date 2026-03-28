import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { FileText, TrendingUp, Users, Award } from "lucide-react"
import {
  SubmissionsByTypeChart,
  SubmissionsOverTimeChart,
  type SubmissionsByTypeEntry,
  type SubmissionOverTimeEntry,
} from "@/components/admin/LeadMagnetCharts"
import { LeadMagnetTable, type SubmissionRow } from "@/components/admin/LeadMagnetTable"

export const metadata = { title: "Lead Magnets" }

const LEAD_MAGNET_TYPES = [
  "AI_READINESS_QUIZ",
  "ROI_CALCULATOR",
  "WEBSITE_AUDIT",
  "SEGMENT_EXPLORER",
  "STACK_CONFIGURATOR",
]

const TYPE_LABEL: Record<string, string> = {
  AI_READINESS_QUIZ: "AI Readiness Quiz",
  ROI_CALCULATOR: "ROI Calculator",
  WEBSITE_AUDIT: "Website Audit",
  SEGMENT_EXPLORER: "Segment Explorer",
  STACK_CONFIGURATOR: "Stack Configurator",
}

export default async function AdminLeadMagnetsPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  // Date helpers
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalCount,
    thisMonthCount,
    convertedCount,
    allScores,
    byType,
    submissionsForTable,
    last30Days,
  ] = await Promise.all([
    // Total submissions
    db.leadMagnetSubmission.count(),
    // This month
    db.leadMagnetSubmission.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    // Converted to deal where deal stage is ACTIVE_CLIENT
    db.leadMagnetSubmission.count({
      where: {
        convertedToDeal: true,
      },
    }),
    // Scores for average
    db.leadMagnetSubmission.findMany({
      where: { score: { not: null } },
      select: { score: true },
    }),
    // By type counts + conversion per type
    db.leadMagnetSubmission.groupBy({
      by: ["type"],
      _count: { id: true },
    }),
    // All submissions for table
    db.leadMagnetSubmission.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        email: true,
        name: true,
        score: true,
        convertedToDeal: true,
        dealId: true,
        source: true,
        data: true,
        createdAt: true,
      },
    }),
    // Last 30 days for area chart
    db.leadMagnetSubmission.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ])

  // Conversion rate: converted / total
  const convRate = totalCount > 0 ? Math.round((convertedCount / totalCount) * 100) : 0

  // Average score
  const scoresArr = allScores.map((s) => s.score as number)
  const avgScore =
    scoresArr.length > 0
      ? scoresArr.reduce((acc, v) => acc + v, 0) / scoresArr.length
      : null

  // Submissions by type data
  const typeCountMap: Record<string, number> = {}
  for (const t of byType) {
    typeCountMap[t.type] = t._count.id
  }
  const submissionsByTypeData: SubmissionsByTypeEntry[] = LEAD_MAGNET_TYPES.map((type) => ({
    type,
    count: typeCountMap[type] ?? 0,
  }))

  // Submissions over time: group by day
  const dayMap: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000)
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    dayMap[key] = 0
  }
  for (const sub of last30Days) {
    const key = new Date(sub.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    if (key in dayMap) {
      dayMap[key] = (dayMap[key] ?? 0) + 1
    }
  }
  const overTimeData: SubmissionOverTimeEntry[] = Object.entries(dayMap).map(
    ([date, count]) => ({ date, count })
  )

  // Per-type conversion rates for insight card
  const typeConvMap: Record<string, { total: number; converted: number }> = {}
  for (const sub of submissionsForTable) {
    if (!typeConvMap[sub.type]) typeConvMap[sub.type] = { total: 0, converted: 0 }
    typeConvMap[sub.type]!.total++
    if (sub.convertedToDeal) typeConvMap[sub.type]!.converted++
  }
  let bestType = ""
  let bestConvRate = 0
  for (const [type, vals] of Object.entries(typeConvMap)) {
    const r = vals.total > 0 ? Math.round((vals.converted / vals.total) * 100) : 0
    if (r > bestConvRate) {
      bestConvRate = r
      bestType = type
    }
  }

  // Serialize for client components
  const tableRows: SubmissionRow[] = submissionsForTable.map((s) => ({
    id: s.id,
    type: s.type,
    email: s.email,
    name: s.name,
    score: s.score,
    convertedToDeal: s.convertedToDeal,
    dealId: s.dealId,
    source: s.source,
    data: s.data,
    createdAt: s.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Lead Magnet Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submissions, conversion rates, and scores across all lead magnets
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 stagger-in">
        {[
          {
            label: "Total Submissions",
            value: totalCount.toLocaleString(),
            sub: "All time",
            icon: FileText,
          },
          {
            label: "This Month",
            value: thisMonthCount.toLocaleString(),
            sub: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
            icon: TrendingUp,
          },
          {
            label: "Conversion Rate",
            value: `${convRate}%`,
            sub: `${convertedCount} converted`,
            icon: Users,
          },
          {
            label: "Avg. Score",
            value: avgScore != null ? avgScore.toFixed(1) : "-",
            sub: `${scoresArr.length} scored`,
            icon: Award,
          },
        ].map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5 micro-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground font-mono">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-5">Submissions by Type</h2>
          <SubmissionsByTypeChart data={submissionsByTypeData} />
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-1">Submissions Over Time</h2>
          <p className="text-xs text-muted-foreground mb-4">Last 30 days</p>
          <SubmissionsOverTimeChart data={overTimeData} />
        </div>
      </div>

      {/* Submissions table */}
      <LeadMagnetTable submissions={tableRows} />

      {/* Insight card */}
      {bestType && (
        <div className="rounded-xl border border-[#C4972A]/20 bg-[#C4972A]/5 p-5">
          <p className="text-sm text-foreground">
            <span className="font-semibold text-[#C4972A]">Insight: </span>
            Your highest-converting tool is{" "}
            <span className="font-semibold">{TYPE_LABEL[bestType] ?? bestType}</span> at{" "}
            <span className="font-semibold text-green-400">{bestConvRate}% conversion</span>.{" "}
            {bestConvRate > 0
              ? "Consider driving more traffic to this tool."
              : "No conversions recorded yet - consider improving follow-up sequences."}
          </p>
        </div>
      )}
    </div>
  )
}
