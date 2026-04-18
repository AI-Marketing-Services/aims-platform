"use client"

import { useState, useMemo } from "react"
import { toast } from "sonner"
import {
  Phone,
  MessageSquare,
  Mail,
  CheckCircle2,
  X,
  Undo2,
  AlertCircle,
  Clock,
  Flame,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"

export interface PartialRow {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  source: string | null
  utmSource: string | null
  utmCampaign: string | null
  createdAt: string
  reminderSentAt: string | null
  contactedAt: string | null
  contactedBy: string | null
  contactNote: string | null
  dismissedAt: string | null
}

interface Props {
  needsOutreach: PartialRow[]
  alreadyContacted: PartialRow[]
  dismissed: PartialRow[]
  finishedCount: number
  stillOpenCount: number
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—"
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.round(ms / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}

function formatPhone(raw: string | null): string | null {
  if (!raw) return null
  const d = raw.replace(/[^0-9]/g, "")
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  if (d.length === 11 && d.startsWith("1"))
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  return raw
}

function useRowAction(
  onLocalUpdate: (id: string, patch: Partial<PartialRow>) => void
) {
  const [busyId, setBusyId] = useState<string | null>(null)

  async function run(
    id: string,
    action: "markContacted" | "undoContacted" | "dismiss" | "undoDismiss",
    note?: string
  ) {
    setBusyId(id)
    try {
      const res = await fetch("/api/admin/partial-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, note }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? "Update failed")
        return
      }
      onLocalUpdate(id, {
        contactedAt: data.row?.contactedAt ?? null,
        contactedBy: data.row?.contactedBy ?? null,
        contactNote: data.row?.contactNote ?? null,
        dismissedAt: data.row?.dismissedAt ?? null,
      })
      if (action === "markContacted") toast.success("Marked as contacted")
      if (action === "dismiss") toast.success("Dismissed")
      if (action === "undoContacted" || action === "undoDismiss")
        toast.success("Back in queue")
    } catch {
      toast.error("Network error")
    } finally {
      setBusyId(null)
    }
  }

  return { busyId, run }
}

export function FollowUpsClient({
  needsOutreach: initialNeedsOutreach,
  alreadyContacted: initialContacted,
  dismissed: initialDismissed,
  finishedCount,
  stillOpenCount,
}: Props) {
  const [needsOutreach, setNeedsOutreach] = useState(initialNeedsOutreach)
  const [alreadyContacted, setAlreadyContacted] = useState(initialContacted)
  const [dismissed, setDismissed] = useState(initialDismissed)
  const [tab, setTab] = useState<"needs" | "contacted" | "dismissed">("needs")

  const { busyId, run } = useRowAction((id, patch) => {
    // After a patch, re-bucket the row across the three lists in place.
    const allRows = [...needsOutreach, ...alreadyContacted, ...dismissed]
    const target = allRows.find((r) => r.id === id)
    if (!target) return
    const updated: PartialRow = { ...target, ...patch }

    const nextNeeds = needsOutreach.filter((r) => r.id !== id)
    const nextContacted = alreadyContacted.filter((r) => r.id !== id)
    const nextDismissed = dismissed.filter((r) => r.id !== id)

    if (updated.dismissedAt) {
      nextDismissed.unshift(updated)
    } else if (updated.contactedAt) {
      nextContacted.unshift(updated)
    } else {
      nextNeeds.unshift(updated)
    }

    setNeedsOutreach(nextNeeds)
    setAlreadyContacted(nextContacted)
    setDismissed(nextDismissed)
  })

  const completionRate = useMemo(() => {
    const denom = finishedCount + stillOpenCount
    return denom > 0 ? Math.round((finishedCount / denom) * 100) : 0
  }, [finishedCount, stillOpenCount])

  const tabs = [
    { key: "needs", label: "Needs Outreach", count: needsOutreach.length, icon: Flame },
    { key: "contacted", label: "Contacted", count: alreadyContacted.length, icon: CheckCircle2 },
    { key: "dismissed", label: "Dismissed", count: dismissed.length, icon: X },
  ] as const

  const activeRows =
    tab === "needs" ? needsOutreach : tab === "contacted" ? alreadyContacted : dismissed

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin/dashboard" },
            { label: "Follow-ups" },
          ]}
        />
        <h1 className="text-2xl font-bold text-foreground">Application Follow-ups</h1>
        <p className="text-sm text-muted-foreground mt-1">
          People who started the AI Operator Collective application, received
          the auto-reminder email, and still haven&apos;t finished. Call or text
          them.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <Kpi
          label="Needs outreach"
          value={needsOutreach.length}
          tone="alert"
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <Kpi
          label="Already contacted"
          value={alreadyContacted.length}
          tone="muted"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <Kpi
          label="Completion rate"
          value={`${completionRate}%`}
          tone="muted"
          icon={<Clock className="h-4 w-4" />}
          sub={`${finishedCount} finished / ${finishedCount + stillOpenCount} started`}
        />
        <Kpi
          label="Dismissed"
          value={dismissed.length}
          tone="muted"
          icon={<X className="h-4 w-4" />}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-[#981B1B] text-[#981B1B]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            <span
              className={cn(
                "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-sm text-[11px] font-mono",
                tab === t.key ? "bg-[#981B1B] text-white" : "bg-muted text-muted-foreground"
              )}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {activeRows.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <ul className="space-y-3">
          {activeRows.map((row) => (
            <li
              key={row.id}
              className="rounded-lg border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground">
                    {row.firstName} {row.lastName}
                  </p>
                  {row.source && (
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border border-border bg-muted text-muted-foreground">
                      {row.source}
                    </span>
                  )}
                </div>

                <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <a
                      href={`mailto:${row.email}?subject=AI Operator Collective — finishing your application`}
                      className="hover:text-[#981B1B]"
                    >
                      {row.email}
                    </a>
                  </span>
                  {row.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <a
                        href={`tel:${row.phone.replace(/[^0-9+]/g, "")}`}
                        className="hover:text-[#981B1B]"
                      >
                        {formatPhone(row.phone)}
                      </a>
                    </span>
                  )}
                </div>

                <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Started {timeAgo(row.createdAt)}</span>
                  {row.reminderSentAt && (
                    <span>Auto-reminder {timeAgo(row.reminderSentAt)}</span>
                  )}
                  {row.contactedAt && (
                    <span className="text-emerald-700">
                      Contacted {timeAgo(row.contactedAt)}
                    </span>
                  )}
                  {row.utmSource && <span>UTM: {row.utmSource}/{row.utmCampaign ?? "-"}</span>}
                </div>

                {row.contactNote && (
                  <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-border pl-2">
                    “{row.contactNote}”
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 shrink-0">
                {tab === "needs" && (
                  <>
                    {row.phone && (
                      <a
                        href={`sms:${row.phone.replace(/[^0-9+]/g, "")}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[#981B1B]/30 text-[#981B1B] hover:bg-[#981B1B]/5 transition-colors"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Text
                      </a>
                    )}
                    {row.phone && (
                      <a
                        href={`tel:${row.phone.replace(/[^0-9+]/g, "")}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[#981B1B]/30 text-[#981B1B] hover:bg-[#981B1B]/5 transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call
                      </a>
                    )}
                    <button
                      disabled={busyId === row.id}
                      onClick={() => run(row.id, "markContacted")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[#981B1B] text-white hover:bg-[#791515] disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mark contacted
                    </button>
                    <button
                      disabled={busyId === row.id}
                      onClick={() => run(row.id, "dismiss")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Dismiss
                    </button>
                  </>
                )}
                {tab === "contacted" && (
                  <button
                    disabled={busyId === row.id}
                    onClick={() => run(row.id, "undoContacted")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                    Back to queue
                  </button>
                )}
                {tab === "dismissed" && (
                  <button
                    disabled={busyId === row.id}
                    onClick={() => run(row.id, "undoDismiss")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                    Re-queue
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Kpi({
  label,
  value,
  tone,
  icon,
  sub,
}: {
  label: string
  value: number | string
  tone: "alert" | "muted"
  icon: React.ReactNode
  sub?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md",
            tone === "alert" ? "bg-[#981B1B]/10 text-[#981B1B]" : "bg-muted text-muted-foreground"
          )}
        >
          {icon}
        </div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p className={cn("text-2xl font-mono font-bold", tone === "alert" ? "text-[#981B1B]" : "text-foreground")}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

function EmptyState({ tab }: { tab: string }) {
  const copy =
    tab === "needs"
      ? "No leads need outreach right now. Auto-reminder + follow-up queue is caught up."
      : tab === "contacted"
      ? "Nobody marked contacted yet. Hit Call / Text / Mark-contacted on a lead in Needs Outreach."
      : "No dismissed rows."
  return (
    <div className="py-12 text-center">
      <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">{copy}</p>
    </div>
  )
}
