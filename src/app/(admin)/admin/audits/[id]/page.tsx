import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ClipboardCheck, ExternalLink } from "lucide-react"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import type { QuizQuestion } from "@/lib/audits/types"
import { AdminResponsesTable, type AdminResponseRow } from "./AdminResponsesTable"

export const metadata = { title: "Audit Quiz", robots: { index: false } }
export const dynamic = "force-dynamic"

function formatRelative(date: Date | null): string {
  if (!date) return "—"
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(days / 365)
  return `${years}y ago`
}

async function loadQuiz(id: string) {
  return db.auditQuiz.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      responses: {
        orderBy: { createdAt: "desc" },
      },
    },
  })
}

export default async function AdminAuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const adminId = await requireAdmin()
  if (!adminId) redirect("/admin/dashboard")

  const { id } = await params

  let quiz: Awaited<ReturnType<typeof loadQuiz>>
  try {
    quiz = await loadQuiz(id)
  } catch (error) {
    logger.error("admin audits detail failed", error, {
      endpoint: "/admin/audits/[id]",
      userId: adminId,
    })
    throw error
  }

  if (!quiz) notFound()

  const questions = quiz.questions as unknown as QuizQuestion[]

  const totalResponses = quiz.responses.length
  const completedResponses = quiz.responses.filter(
    (r) => r.completedAt !== null,
  ).length
  const completionRate =
    totalResponses > 0
      ? Math.round((completedResponses / totalResponses) * 100)
      : 0

  const scored = quiz.responses.filter(
    (r): r is typeof r & { aiScore: number } => r.aiScore !== null,
  )
  const avgScore =
    scored.length > 0
      ? Math.round(
          scored.reduce((sum, r) => sum + r.aiScore, 0) / scored.length,
        )
      : null

  const lastResponseAt = quiz.responses[0]?.createdAt ?? null

  // Score buckets
  const buckets = { low: 0, mid: 0, high: 0 }
  for (const r of scored) {
    if (r.aiScore < 50) buckets.low += 1
    else if (r.aiScore < 80) buckets.mid += 1
    else buckets.high += 1
  }
  const bucketTotal = scored.length || 1
  const bucketRows = [
    {
      label: "0–49",
      count: buckets.low,
      pct: (buckets.low / bucketTotal) * 100,
      color: "bg-red-500/70",
    },
    {
      label: "50–79",
      count: buckets.mid,
      pct: (buckets.mid / bucketTotal) * 100,
      color: "bg-amber-500/80",
    },
    {
      label: "80–100",
      count: buckets.high,
      pct: (buckets.high / bucketTotal) * 100,
      color: "bg-emerald-500/80",
    },
  ]

  // AI insights — top tags + concatenated recent summaries
  const tagCounts = new Map<string, number>()
  for (const r of quiz.responses) {
    for (const tag of r.aiTags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const recentSummaries = quiz.responses
    .filter((r) => r.aiSummary && r.aiSummary.trim().length > 0)
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      summary: r.aiSummary as string,
      createdAt: r.createdAt,
      leadIdentity:
        r.leadName ?? r.leadEmail ?? r.leadCompany ?? "Anonymous",
    }))

  const summariesAvailable = recentSummaries.length >= 3

  // Serialize responses for the client component (Date → ISO)
  const responses: AdminResponseRow[] = quiz.responses.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    leadEmail: r.leadEmail,
    leadName: r.leadName,
    leadCompany: r.leadCompany,
    leadPhone: r.leadPhone,
    leadRole: r.leadRole,
    answers: r.answers as Record<string, unknown>,
    aiSummary: r.aiSummary,
    aiScore: r.aiScore,
    aiTags: r.aiTags ?? [],
    aiArms:
      r.aiArms === null || r.aiArms === undefined
        ? null
        : (r.aiArms as unknown),
    aiGeneratedAt: r.aiGeneratedAt
      ? r.aiGeneratedAt.toISOString()
      : null,
    utmSource: r.utmSource,
    utmMedium: r.utmMedium,
    utmCampaign: r.utmCampaign,
    referer: r.referer,
  }))

  const kpis = [
    { label: "Total Responses", value: totalResponses },
    {
      label: "Avg AI Score",
      value: avgScore !== null ? `${avgScore}/100` : "—",
    },
    { label: "Completion Rate", value: `${completionRate}%` },
    { label: "Last Response", value: formatRelative(lastResponseAt) },
  ]

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "AI Audits", href: "/admin/audits" },
          { label: quiz.title },
        ]}
      />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {quiz.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Owner:{" "}
              <span className="text-foreground">
                {quiz.owner?.name ?? quiz.owner?.email ?? "Unknown"}
              </span>
              {quiz.owner?.email && quiz.owner?.name && (
                <span className="text-muted-foreground">
                  {" "}
                  · {quiz.owner.email}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/q/${quiz.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-deep transition-colors"
          >
            Open public link
            <ExternalLink className="h-3 w-3" />
          </a>
          <Link
            href={`/portal/audits/${quiz.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-deep transition-colors"
          >
            Open in operator portal
          </Link>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              {k.label}
            </p>
            <p className="text-2xl font-bold mt-1 text-foreground">
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Score distribution */}
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Score Distribution
        </h2>
        {scored.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No scored responses yet.
          </p>
        ) : (
          <div className="space-y-2">
            {bucketRows.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="w-16 text-xs font-mono text-muted-foreground">
                  {row.label}
                </span>
                <div className="flex-1 h-3 bg-deep rounded-full overflow-hidden">
                  <div
                    className={`h-full ${row.color} transition-all`}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
                <span className="w-12 text-right text-xs font-mono text-foreground">
                  {row.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI insights */}
      {summariesAvailable && (
        <section className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              AI Insights · Themes
            </h2>
            <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
              Aggregated · directional
            </span>
          </div>

          {topTags.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Top tags
              </p>
              <div className="flex flex-wrap gap-2">
                {topTags.map(([tag, count]) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-deep px-3 py-1 text-xs"
                  >
                    <span className="text-foreground">{tag}</span>
                    <span className="text-muted-foreground font-mono">
                      {count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-2">
              What we&apos;re hearing (last {recentSummaries.length} summaries)
            </p>
            <ul className="space-y-2">
              {recentSummaries.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-border bg-deep p-3 text-sm text-foreground"
                >
                  <p className="text-[11px] font-mono text-muted-foreground mb-1">
                    {s.leadIdentity} · {formatRelative(s.createdAt)}
                  </p>
                  <p className="text-foreground/90 leading-relaxed">
                    {s.summary}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Response inspector */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Response Inspector
          </h2>
          <span className="text-xs text-muted-foreground">
            {totalResponses} total
          </span>
        </div>
        <AdminResponsesTable responses={responses} questions={questions} />
      </section>
    </div>
  )
}
