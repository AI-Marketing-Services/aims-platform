import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { OPERATOR_VAULT_SEQUENCE, getCommunityInviteUrl } from "@/lib/email/community-sequence"
import {
  CheckCircle2,
  Clock,
  Inbox,
  Mail,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Users,
  Send,
} from "lucide-react"

export const metadata = { title: "Community Sequence" }

type SequenceStatus = "pending" | "sent" | "cancelled" | "failed"

function statusPill(status: string) {
  const map: Record<string, { label: string; bg: string; color: string; Icon: typeof Clock }> = {
    pending: { label: "Pending", bg: "bg-amber-500/10 border-amber-500/30", color: "text-amber-400", Icon: Clock },
    sent: { label: "Sent", bg: "bg-emerald-500/10 border-emerald-500/30", color: "text-emerald-400", Icon: CheckCircle2 },
    cancelled: { label: "Cancelled", bg: "bg-slate-500/10 border-slate-500/30", color: "text-slate-400", Icon: XCircle },
    failed: { label: "Failed", bg: "bg-red-500/10 border-red-500/30", color: "text-red-400", Icon: AlertTriangle },
  }
  const cfg = map[status] ?? map.pending
  const Icon = cfg.Icon
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${cfg.bg} ${cfg.color}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

export default async function AdminCommunitySequencePage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  // Pull queue items for the operator-vault sequence (most recent first by recipient)
  const queueItems = await db.emailQueueItem.findMany({
    where: { sequenceKey: "operator-vault" },
    orderBy: [{ createdAt: "desc" }, { emailIndex: "asc" }],
    take: 500,
  })

  // Group queue items by recipient email so we can show per-lead progress
  const byRecipient = new Map<
    string,
    {
      email: string
      items: typeof queueItems
      totalSent: number
      totalPending: number
      totalCancelled: number
      totalFailed: number
      enrolledAt: Date | null
      lastEventAt: Date | null
    }
  >()

  for (const item of queueItems) {
    const key = item.recipientEmail
    if (!byRecipient.has(key)) {
      byRecipient.set(key, {
        email: key,
        items: [],
        totalSent: 0,
        totalPending: 0,
        totalCancelled: 0,
        totalFailed: 0,
        enrolledAt: null,
        lastEventAt: null,
      })
    }
    const rec = byRecipient.get(key)!
    rec.items.push(item)
    if (item.status === "sent") rec.totalSent++
    else if (item.status === "pending") rec.totalPending++
    else if (item.status === "cancelled") rec.totalCancelled++
    else if (item.status === "failed") rec.totalFailed++
    if (!rec.enrolledAt || item.createdAt < rec.enrolledAt) rec.enrolledAt = item.createdAt
    const eventAt = item.sentAt ?? item.createdAt
    if (!rec.lastEventAt || eventAt > rec.lastEventAt) rec.lastEventAt = eventAt
  }

  const recipients = Array.from(byRecipient.values()).sort(
    (a, b) => (b.lastEventAt?.getTime() ?? 0) - (a.lastEventAt?.getTime() ?? 0),
  )

  // Aggregate counters for header stats
  const totalEnrolled = recipients.length
  const totalSent = queueItems.filter((i) => i.status === "sent").length
  const totalPending = queueItems.filter((i) => i.status === "pending").length
  const totalFailed = queueItems.filter((i) => i.status === "failed").length

  // Sort steps by delay for the visual timeline
  const steps = [...OPERATOR_VAULT_SEQUENCE.steps].sort((a, b) => a.delayDays - b.delayDays)

  const inviteUrl = getCommunityInviteUrl()
  const inviteUrlIsPlaceholder = inviteUrl === "https://aioperatorcollective.com/#apply"

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-cream">Community Sequence</h1>
        <p className="mt-1 text-sm text-cream/60">
          The AI Operator Collective post-signup drip. Chapter 1 + community invite fires inline
          on form submission. Chapters 2–5 + the closing email are scheduled here and dispatched
          hourly by the email queue cron.
        </p>
      </div>

      {/* Config warning if invite URL isn't set */}
      {inviteUrlIsPlaceholder && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-200">
                COMMUNITY_INVITE_URL is not set.
              </p>
              <p className="mt-1 text-xs text-amber-200/75 leading-relaxed">
                Emails currently link community buttons back to the landing page&apos;s
                application anchor (<code className="font-mono text-[11px]">{inviteUrl}</code>).
                Set <code className="font-mono text-[11px]">COMMUNITY_INVITE_URL</code> (or{" "}
                <code className="font-mono text-[11px]">NEXT_PUBLIC_COMMUNITY_INVITE_URL</code>)
                in your Vercel env to your real Skool / Circle / portal invite link and every
                email in the drip will start using it immediately — no redeploy required on copy.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Enrolled leads" value={totalEnrolled} />
        <StatCard icon={Send} label="Emails sent" value={totalSent} />
        <StatCard icon={Clock} label="Emails pending" value={totalPending} />
        <StatCard icon={AlertTriangle} label="Failed" value={totalFailed} tone={totalFailed > 0 ? "warn" : "default"} />
      </div>

      {/* Sequence definition / timeline */}
      <section className="rounded-md border border-line bg-surface/40 p-6">
        <div className="flex items-start justify-between mb-5 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-cream">Sequence timeline</h2>
            <p className="text-xs text-cream/55 mt-1">
              {OPERATOR_VAULT_SEQUENCE.description}
            </p>
          </div>
          <a
            href={inviteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-aims-gold hover:text-aims-gold-light whitespace-nowrap"
          >
            Preview invite link <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <ol className="space-y-3">
          {/* T+0 is the inline Chapter 1 email — not in the queue, but shown for clarity */}
          <li className="relative rounded-sm border border-aims-gold/30 bg-aims-gold/5 p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-sm bg-aims-gold/20 border border-aims-gold/40">
                <Inbox className="w-4 h-4 text-aims-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="text-sm font-semibold text-cream">
                    Chapter 1: Your First 5 Operator Moves (+ community invite)
                  </p>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-aims-gold whitespace-nowrap">
                    T + 0 · immediate
                  </span>
                </div>
                <p className="mt-1 text-xs text-cream/55 leading-relaxed">
                  Fires inline from <code className="font-mono">/api/community/lead</code> via{" "}
                  <code className="font-mono">sendOperatorVaultEmail()</code>. Not scheduled in
                  the queue because it must land before the success toast on the form.
                </p>
              </div>
            </div>
          </li>

          {steps.map((step) => (
            <li
              key={step.key}
              className="relative rounded-sm border border-line bg-ink/40 p-4"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-sm bg-surface border border-line">
                  <Mail className="w-4 h-4 text-cream/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <p className="text-sm font-semibold text-cream">{step.subject}</p>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cream/55 whitespace-nowrap">
                      T + {step.delayDays}d
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-cream/55 leading-relaxed">{step.preview}</p>
                  <p className="mt-1 text-[11px] text-cream/40 italic">Purpose: {step.purpose}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Enrolled leads */}
      <section className="rounded-md border border-line bg-surface/40">
        <div className="p-6 border-b border-line">
          <h2 className="text-lg font-semibold text-cream">Enrolled leads</h2>
          <p className="text-xs text-cream/55 mt-1">
            Latest 500 queue items grouped by recipient. Click through the per-step status to
            audit individual sends.
          </p>
        </div>

        {recipients.length === 0 ? (
          <div className="p-10 text-center text-sm text-cream/55">
            No one has been enrolled in the operator-vault sequence yet. Submissions from the
            landing page form will show up here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-cream/45 border-b border-line">
                  <th className="px-5 py-3">Recipient</th>
                  <th className="px-5 py-3">Enrolled</th>
                  <th className="px-5 py-3">Progress</th>
                  <th className="px-5 py-3">Steps</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((rec) => {
                  const byIndex = new Map<number, { status: string; scheduledFor: Date; sentAt: Date | null }>()
                  for (const it of rec.items) {
                    byIndex.set(it.emailIndex, {
                      status: it.status,
                      scheduledFor: it.scheduledFor,
                      sentAt: it.sentAt,
                    })
                  }
                  return (
                    <tr key={rec.email} className="border-b border-line/60 hover:bg-ink/40">
                      <td className="px-5 py-4 text-cream font-mono text-xs break-all">
                        {rec.email}
                      </td>
                      <td className="px-5 py-4 text-cream/55 text-xs whitespace-nowrap">
                        {rec.enrolledAt
                          ? new Date(rec.enrolledAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-xs text-cream/80 font-mono">
                          {rec.totalSent}/{steps.length} sent
                        </span>
                        {rec.totalFailed > 0 && (
                          <span className="ml-2 text-[10px] font-mono text-red-400">
                            · {rec.totalFailed} failed
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {steps.map((step) => {
                            const entry = byIndex.get(step.index)
                            const status = (entry?.status ?? "pending") as SequenceStatus
                            return (
                              <div
                                key={step.key}
                                className="flex items-center gap-1"
                                title={`${step.subject} · ${status}${
                                  entry?.sentAt
                                    ? ` · sent ${new Date(entry.sentAt).toLocaleString()}`
                                    : entry?.scheduledFor
                                      ? ` · scheduled ${new Date(entry.scheduledFor).toLocaleString()}`
                                      : ""
                                }`}
                              >
                                <span className="text-[10px] font-mono text-cream/40">
                                  {step.index + 2}
                                </span>
                                {statusPill(status)}
                              </div>
                            )
                          })}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Clock
  label: string
  value: number
  tone?: "default" | "warn"
}) {
  return (
    <div
      className={`rounded-md border p-4 ${
        tone === "warn" && value > 0
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-line bg-surface/40"
      }`}
    >
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-cream/45">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-cream">{value}</p>
    </div>
  )
}
