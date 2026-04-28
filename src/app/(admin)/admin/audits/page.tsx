import Link from "next/link"
import { redirect } from "next/navigation"
import { ClipboardCheck, ExternalLink } from "lucide-react"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"

export const metadata = { title: "AI Audits", robots: { index: false } }
export const dynamic = "force-dynamic"

type LeaderboardRow = {
  ownerId: string
  ownerName: string | null
  ownerEmail: string | null
  quizCount: number
  responseCount: number
  lastResponseAt: Date | null
}

type RecentQuizRow = {
  id: string
  title: string
  slug: string
  ownerName: string | null
  ownerEmail: string | null
  responseCount: number
  lastResponseAt: Date | null
  createdAt: Date
}

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

async function loadOverview() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalQuizzes,
    totalResponses,
    last7DayResponses,
    scoreAgg,
    quizzesWithCounts,
    recentQuizzesRaw,
    recentTaggedResponses,
  ] = await Promise.all([
    db.auditQuiz.count(),
    db.auditResponse.count(),
    db.auditResponse.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.auditResponse.aggregate({
      _avg: { aiScore: true },
      where: { aiScore: { not: null } },
    }),
    db.auditQuiz.findMany({
      select: {
        id: true,
        ownerId: true,
        owner: { select: { id: true, name: true, email: true } },
        responses: {
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { responses: true } },
      },
    }),
    db.auditQuiz.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        owner: { select: { name: true, email: true } },
        responses: {
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { responses: true } },
      },
    }),
    db.auditResponse.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { aiTags: true },
    }),
  ])

  // Build operator leaderboard from quizzesWithCounts
  const ownerMap = new Map<string, LeaderboardRow>()
  for (const q of quizzesWithCounts) {
    const ownerId = q.ownerId
    const existing = ownerMap.get(ownerId)
    const lastResp = q.responses[0]?.createdAt ?? null
    if (existing) {
      existing.quizCount += 1
      existing.responseCount += q._count.responses
      if (
        lastResp &&
        (!existing.lastResponseAt || lastResp > existing.lastResponseAt)
      ) {
        existing.lastResponseAt = lastResp
      }
    } else {
      ownerMap.set(ownerId, {
        ownerId,
        ownerName: q.owner?.name ?? null,
        ownerEmail: q.owner?.email ?? null,
        quizCount: 1,
        responseCount: q._count.responses,
        lastResponseAt: lastResp,
      })
    }
  }
  const leaderboard: LeaderboardRow[] = Array.from(ownerMap.values())
    .sort((a, b) => b.responseCount - a.responseCount)
    .slice(0, 25)

  const recentQuizzes: RecentQuizRow[] = recentQuizzesRaw.map((q) => ({
    id: q.id,
    title: q.title,
    slug: q.slug,
    ownerName: q.owner?.name ?? null,
    ownerEmail: q.owner?.email ?? null,
    responseCount: q._count.responses,
    lastResponseAt: q.responses[0]?.createdAt ?? null,
    createdAt: q.createdAt,
  }))

  // Top tags this week
  const tagCounts = new Map<string, number>()
  for (const r of recentTaggedResponses) {
    for (const tag of r.aiTags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const avgScore = scoreAgg._avg.aiScore ?? null

  return {
    totalQuizzes,
    totalResponses,
    last7DayResponses,
    avgScore,
    leaderboard,
    recentQuizzes,
    topTags,
  }
}

export default async function AdminAuditsPage() {
  const adminId = await requireAdmin()
  if (!adminId) redirect("/admin/dashboard")

  let data
  try {
    data = await loadOverview()
  } catch (error) {
    logger.error("admin audits overview failed", error, {
      endpoint: "/admin/audits",
      userId: adminId,
    })
    throw error
  }

  const kpis = [
    { label: "Total Quizzes", value: data.totalQuizzes },
    { label: "Total Responses", value: data.totalResponses },
    {
      label: "Responses (7d)",
      value: data.last7DayResponses,
      accent: "text-primary",
    },
    {
      label: "Avg AI Score",
      value:
        data.avgScore !== null
          ? `${Math.round(data.avgScore)}/100`
          : "—",
    },
  ]

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "AI Audits" },
        ]}
      />

      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ClipboardCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Audits</h1>
          <p className="text-sm text-muted-foreground">
            Operator-built intake funnels and collected responses across the platform.
          </p>
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
            <p
              className={`text-2xl font-bold mt-1 ${k.accent ?? "text-foreground"}`}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Top AI tags this week */}
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Top AI Tags · last 7 days
        </h2>
        {data.topTags.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tagged responses yet this week.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.topTags.map(([tag, count]) => (
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
        )}
      </section>

      {/* Operator leaderboard */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Operator Leaderboard
          </h2>
          <span className="text-xs text-muted-foreground">
            Top {data.leaderboard.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-deep">
                <th className="text-left px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Operator
                </th>
                <th className="text-right px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Quizzes
                </th>
                <th className="text-right px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Responses
                </th>
                <th className="text-right px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Last Response
                </th>
              </tr>
            </thead>
            <tbody>
              {data.leaderboard.map((row) => (
                <tr
                  key={row.ownerId}
                  className="border-b border-border last:border-0 hover:bg-deep/50 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <div className="text-foreground font-medium">
                      {row.ownerName ?? row.ownerEmail ?? "Unknown operator"}
                    </div>
                    {row.ownerEmail && row.ownerName && (
                      <div className="text-xs text-muted-foreground">
                        {row.ownerEmail}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-foreground font-mono">
                    {row.quizCount}
                  </td>
                  <td className="px-4 py-2.5 text-right text-foreground font-mono">
                    {row.responseCount}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">
                    {formatRelative(row.lastResponseAt)}
                  </td>
                </tr>
              ))}
              {data.leaderboard.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No operators have built audits yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent quizzes */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Quizzes
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-deep">
                <th className="text-left px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Title
                </th>
                <th className="text-left px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Owner
                </th>
                <th className="text-left px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Slug
                </th>
                <th className="text-right px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Responses
                </th>
                <th className="text-right px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Last Response
                </th>
                <th className="text-right px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {data.recentQuizzes.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-border last:border-0 hover:bg-deep/50 transition-colors"
                >
                  <td className="px-4 py-2.5 text-foreground font-medium">
                    {q.title}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {q.ownerName ?? q.ownerEmail ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <a
                      href={`/q/${q.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-xs"
                    >
                      {q.slug}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-right text-foreground font-mono">
                    {q.responseCount}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">
                    {formatRelative(q.lastResponseAt)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/admin/audits/${q.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              {data.recentQuizzes.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No audit quizzes yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
