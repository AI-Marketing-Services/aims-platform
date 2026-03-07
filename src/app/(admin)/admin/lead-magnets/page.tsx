import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { FileText, TrendingUp, Users, Award } from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata = { title: "Lead Magnets" }

const TYPE_LABEL: Record<string, string> = {
  AI_READINESS_QUIZ: "AI Readiness Quiz",
  ROI_CALCULATOR: "ROI Calculator",
  WEBSITE_AUDIT: "Website Audit",
  SEGMENT_EXPLORER: "Segment Explorer",
  STACK_CONFIGURATOR: "Stack Configurator",
}

const TYPE_COLOR: Record<string, string> = {
  AI_READINESS_QUIZ: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  ROI_CALCULATOR: "text-green-400 bg-green-500/10 border-green-500/20",
  WEBSITE_AUDIT: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  SEGMENT_EXPLORER: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  STACK_CONFIGURATOR: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
}

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function AdminLeadMagnetsPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  const [submissions, byType] = await Promise.all([
    db.leadMagnetSubmission.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        email: true,
        name: true,
        company: true,
        score: true,
        convertedToDeal: true,
        source: true,
        createdAt: true,
      },
    }),
    db.leadMagnetSubmission.groupBy({
      by: ["type"],
      _count: { id: true },
      _avg: { score: true },
    }),
  ])

  const total = submissions.length
  const converted = submissions.filter((s) => s.convertedToDeal).length
  const convRate = total > 0 ? Math.round((converted / total) * 100) : 0
  const avgScore = submissions.filter((s) => s.score !== null).reduce((s, sub) => s + (sub.score ?? 0), 0) /
    (submissions.filter((s) => s.score !== null).length || 1)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Lead Magnet Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Submissions, conversion rates, and scores across all lead magnets</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Submissions", value: total.toString(), icon: FileText },
          { label: "Converted to Deal", value: converted.toString(), icon: TrendingUp },
          { label: "Conversion Rate", value: `${convRate}%`, icon: Users },
          { label: "Avg. Score", value: isNaN(avgScore) ? "—" : avgScore.toFixed(1), icon: Award },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground font-mono">{value}</p>
          </div>
        ))}
      </div>

      {/* By type */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-5">Submissions by Type</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {byType.map((t) => (
            <div key={t.type} className={cn("rounded-lg border p-4", TYPE_COLOR[t.type] ?? "border-border bg-muted")}>
              <p className="text-sm font-medium mb-1">{TYPE_LABEL[t.type] ?? t.type}</p>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold font-mono">{t._count.id}</span>
                {t._avg.score && (
                  <span className="text-xs opacity-70">avg {t._avg.score.toFixed(1)} score</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent submissions */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Recent Submissions</h2>
        </div>
        {submissions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Contact", "Type", "Score", "Converted", "Source", "Time"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{sub.name ?? sub.email.split("@")[0]}</p>
                      <p className="text-xs text-muted-foreground">{sub.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", TYPE_COLOR[sub.type] ?? "border-border bg-muted text-muted-foreground")}>
                        {TYPE_LABEL[sub.type] ?? sub.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-foreground">{sub.score?.toFixed(0) ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs font-medium", sub.convertedToDeal ? "text-green-400" : "text-muted-foreground")}>
                        {sub.convertedToDeal ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{sub.source ?? "direct"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{timeAgo(sub.createdAt)}</span>
                    </td>
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
