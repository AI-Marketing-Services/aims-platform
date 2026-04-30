import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { QUESTIONS } from "@/lib/collective-application"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"
import { InviteButton } from "./InviteButton"

export const dynamic = "force-dynamic"

const TIER_COLORS: Record<string, string> = {
  hot: "bg-primary/10 text-primary border-primary/30",
  warm: "bg-primary/5 text-primary/70 border-primary/20",
  cold: "bg-muted/50 text-muted-foreground border-border",
}

export default async function ApplicationsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const submissions = await db.leadMagnetSubmission.findMany({
    where: { type: "COLLECTIVE_APPLICATION" },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  const dealIds = submissions.map((s) => s.dealId).filter(Boolean) as string[]
  const deals = dealIds.length > 0
    ? await db.deal.findMany({ where: { id: { in: dealIds } } })
    : []
  const dealMap = new Map(deals.map((d) => [d.id, d]))

  const invited = dealIds.length > 0
    ? await db.mightyInvite.findMany({
        where: { dealId: { in: dealIds } },
        orderBy: { sentAt: "desc" },
      })
    : []
  const inviteByDeal = new Map<string, typeof invited[number]>()
  for (const inv of invited) {
    if (!inviteByDeal.has(inv.dealId)) inviteByDeal.set(inv.dealId, inv)
  }

  const now = new Date()
  const thisMonth = submissions.filter(
    (s) =>
      s.createdAt.getMonth() === now.getMonth() &&
      s.createdAt.getFullYear() === now.getFullYear()
  )
  const hotLeads = submissions.filter((s) => {
    const deal = s.dealId ? dealMap.get(s.dealId) : null
    return deal?.leadScoreTier === "hot"
  })
  const avgScore =
    submissions.length > 0
      ? Math.round(
          submissions.reduce((sum, s) => sum + (s.score ?? 0), 0) /
            submissions.length
        )
      : 0

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin/dashboard" },
            { label: "Applications" },
          ]}
        />
        <h1 className="text-2xl font-bold text-foreground">Collective Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI Operator Collective application submissions with lead scoring.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-md border border-line bg-surface p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-ink/60">
            Total Applications
          </p>
          <p className="text-3xl font-bold text-ink mt-1">{submissions.length}</p>
        </div>
        <div className="rounded-md border border-line bg-surface p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-ink/60">
            This Month
          </p>
          <p className="text-3xl font-bold text-ink mt-1">{thisMonth.length}</p>
        </div>
        <div className="rounded-md border border-line bg-surface p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-ink/60">
            Hot Leads
          </p>
          <p className="text-3xl font-bold text-primary mt-1">{hotLeads.length}</p>
        </div>
        <div className="rounded-md border border-line bg-surface p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-ink/60">
            Avg Score
          </p>
          <p className="text-3xl font-bold text-ink mt-1">{avgScore}/100</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-line bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-panel">
                <th className="text-left p-3 text-xs font-mono uppercase tracking-wider text-ink/60">
                  Name
                </th>
                <th className="text-left p-3 text-xs font-mono uppercase tracking-wider text-ink/60">
                  Email
                </th>
                <th className="text-center p-3 text-xs font-mono uppercase tracking-wider text-ink/60">
                  Score
                </th>
                <th className="text-center p-3 text-xs font-mono uppercase tracking-wider text-ink/60">
                  Tier
                </th>
                <th className="text-center p-3 text-xs font-mono uppercase tracking-wider text-ink/60">
                  Stage
                </th>
                <th className="text-center p-3 text-xs font-mono uppercase tracking-wider text-ink/60">
                  Collective
                </th>
                <th className="text-right p-3 text-xs font-mono uppercase tracking-wider text-ink/60">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => {
                const deal = s.dealId ? dealMap.get(s.dealId) : null
                const tier = deal?.leadScoreTier ?? "cold"
                const inviteStatus = s.dealId
                  ? (deal as { mightyInviteStatus?: string | null })?.mightyInviteStatus
                    ?? inviteByDeal.get(s.dealId)?.status
                    ?? null
                  : null
                const inviteMemberId = s.dealId
                  ? (deal as { mightyMemberId?: number | null })?.mightyMemberId
                    ?? inviteByDeal.get(s.dealId)?.mightyMemberId
                    ?? null
                  : null

                return (
                  <tr key={s.id} className="border-b border-line last:border-0 group">
                    <td className="p-3 text-ink font-medium">
                      {s.dealId ? (
                        <Link
                          href={`/admin/crm/${s.dealId}`}
                          className="hover:text-[#981B1B] hover:underline"
                        >
                          {s.name ?? "-"}
                        </Link>
                      ) : (
                        s.name ?? "-"
                      )}
                    </td>
                    <td className="p-3 text-ink/70">{s.email}</td>
                    <td className="p-3 text-center">
                      <span className="text-ink font-mono font-bold">
                        {s.score ?? 0}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border ${TIER_COLORS[tier] ?? TIER_COLORS.cold}`}
                      >
                        {tier}
                      </span>
                    </td>
                    <td className="p-3 text-center text-ink/60 text-xs font-mono uppercase">
                      {deal?.stage ?? "-"}
                    </td>
                    <td className="p-3 text-center">
                      <InviteButton
                        dealId={s.dealId ?? null}
                        contactEmail={s.email}
                        contactName={s.name ?? s.email}
                        initialStatus={inviteStatus}
                        initialMightyMemberId={inviteMemberId}
                      />
                    </td>
                    <td className="p-3 text-right text-ink/60 text-xs">
                      {s.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                )
              })}
              {submissions.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-ink/50 text-sm"
                  >
                    No applications yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Answer breakdown for each submission (expandable via details) */}
      {submissions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-ink">Answer Breakdown</h2>
          {submissions.slice(0, 20).map((s) => {
            const answers = (s.data ?? {}) as Record<string, string>
            return (
              <details
                key={s.id}
                className="rounded-md border border-line bg-surface overflow-hidden"
              >
                <summary className="p-4 cursor-pointer text-sm text-ink hover:bg-panel transition-colors">
                  <span className="font-medium">{s.name ?? s.email}</span>
                  <span className="text-ink/50 ml-2">
                    Score: {s.score ?? 0}/100
                  </span>
                </summary>
                <div className="p-4 pt-0 space-y-2 border-t border-line">
                  {QUESTIONS.map((q) => {
                    const selectedValue = answers[q.id]
                    const selectedOption = q.options.find(
                      (o) => o.value === selectedValue
                    )
                    return (
                      <div key={q.id} className="flex gap-3 text-sm">
                        <span className="text-ink/50 flex-shrink-0 w-5 font-mono">
                          Q{QUESTIONS.indexOf(q) + 1}
                        </span>
                        <div>
                          <p className="text-ink/70">{q.question}</p>
                          <p className="text-ink font-medium">
                            {selectedOption?.label ?? selectedValue ?? "-"}
                            <span className="text-ink/40 ml-2">
                              ({selectedOption?.points ?? 0} pts)
                            </span>
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
