"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Send, RefreshCw, ExternalLink, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { cn, timeAgo } from "@/lib/utils"

export interface MightyInviteRecord {
  id: string
  email: string
  planId: number
  planName: string | null
  mightyInviteId: number | null
  mightyMemberId: number | null
  status: string
  errorMessage: string | null
  sentAt: string
  acceptedAt: string | null
  resentAt: string | null
}

interface Props {
  dealId: string
  contactEmail: string | null
  contactName: string
  initialInvites: MightyInviteRecord[]
  initialStatus: string | null
  initialMightyMemberId: number | null
  defaultTier?: "community" | "accelerator" | "innerCircle"
  networkSubdomain?: string
}

const TIER_OPTIONS: { value: "community" | "accelerator" | "innerCircle"; label: string }[] = [
  { value: "community", label: "Community" },
  { value: "accelerator", label: "Accelerator" },
  { value: "innerCircle", label: "Inner Circle" },
]

const STATUS_COLORS: Record<string, string> = {
  accepted: "text-green-400 bg-green-900/15 border-green-800",
  sent: "text-blue-400 bg-blue-900/15 border-blue-800",
  pending: "text-amber-400 bg-amber-900/15 border-amber-800",
  failed: "text-primary bg-primary/10 border-primary/30",
  expired: "text-muted-foreground bg-deep border-border",
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  accepted: <CheckCircle2 className="w-3 h-3" />,
  sent: <Send className="w-3 h-3" />,
  pending: <Clock className="w-3 h-3" />,
  failed: <AlertCircle className="w-3 h-3" />,
}

export function MightyInvitePanel({
  dealId,
  contactEmail,
  contactName,
  initialInvites,
  initialStatus,
  initialMightyMemberId,
  defaultTier = "community",
  networkSubdomain = "aioperatorcollective.mn.co",
}: Props) {
  const [invites, setInvites] = useState(initialInvites)
  const [status, setStatus] = useState(initialStatus)
  const [mightyMemberId, setMightyMemberId] = useState(initialMightyMemberId)
  const [tier, setTier] = useState(defaultTier)
  const [busy, setBusy] = useState(false)

  async function sendInvite() {
    if (!contactEmail) {
      toast.error("Deal is missing an email")
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/deals/${dealId}/invite-to-mighty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })
      const body = await res.json()
      if (!res.ok) {
        toast.error(body.error ?? "Invite failed")
        if (body.invite) {
          setInvites((prev) => [mapInvite(body.invite), ...prev])
        }
        return
      }
      toast.success(`Invited ${contactName || contactEmail} to ${tier}`)
      setInvites((prev) => [mapInvite(body.invite), ...prev])
      setStatus("pending")
    } catch (err) {
      toast.error("Network error")
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  async function resendLatest() {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/deals/${dealId}/invite-to-mighty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, resend: true }),
      })
      const body = await res.json()
      if (!res.ok) {
        toast.error(body.error ?? "Resend failed")
        return
      }
      toast.success("Invite resent")
      setInvites((prev) =>
        prev.map((i) => (i.id === body.invite.id ? mapInvite(body.invite) : i))
      )
    } catch (err) {
      toast.error("Network error")
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  const latestStatus = status ?? invites[0]?.status ?? null
  const headerColor = latestStatus ? STATUS_COLORS[latestStatus] : null
  const canResend = invites.some((i) => i.mightyInviteId && i.status !== "accepted")

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">AI Operator Collective</h2>
        {latestStatus && headerColor && (
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded border font-medium capitalize inline-flex items-center gap-1",
              headerColor
            )}
          >
            {STATUS_ICONS[latestStatus]}
            {latestStatus}
          </span>
        )}
      </div>

      {mightyMemberId && (
        <a
          href={`https://${networkSubdomain}/members/${mightyMemberId}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-[#981B1B] hover:underline"
        >
          View member in Mighty
          <ExternalLink className="w-3 h-3" />
        </a>
      )}

      <div className="space-y-2 mb-3">
        <label className="text-xs text-muted-foreground block">Plan</label>
        <select
          value={tier}
          onChange={(e) =>
            setTier(e.target.value as "community" | "accelerator" | "innerCircle")
          }
          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-[#981B1B]"
          disabled={busy}
        >
          {TIER_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          onClick={sendInvite}
          disabled={busy || !contactEmail}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#981B1B] text-white text-xs font-medium rounded-lg hover:bg-[#791515] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          {busy ? "Sending..." : invites.length > 0 ? "Send new invite" : "Invite to Collective"}
        </button>
        {canResend && (
          <button
            onClick={resendLatest}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-2 border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface rounded-lg disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", busy && "animate-spin")} />
            Resend
          </button>
        )}
      </div>

      {!contactEmail && (
        <p className="mt-2 text-xs text-primary">Add an email address first.</p>
      )}

      {invites.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            Invite History
          </h3>
          <div className="space-y-2">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-start justify-between gap-2 text-xs">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded border font-medium capitalize inline-flex items-center gap-1",
                        STATUS_COLORS[inv.status] ?? STATUS_COLORS.pending
                      )}
                    >
                      {STATUS_ICONS[inv.status]}
                      {inv.status}
                    </span>
                    <span className="text-foreground truncate">{inv.planName ?? `plan ${inv.planId}`}</span>
                  </div>
                  {inv.errorMessage && (
                    <p className="text-primary mt-0.5 truncate">{inv.errorMessage}</p>
                  )}
                </div>
                <span className="text-muted-foreground flex-shrink-0">
                  {timeAgo(inv.resentAt ?? inv.sentAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function mapInvite(raw: unknown): MightyInviteRecord {
  const r = raw as Record<string, unknown>
  return {
    id: String(r.id),
    email: String(r.email),
    planId: Number(r.planId),
    planName: (r.planName as string) ?? null,
    mightyInviteId: (r.mightyInviteId as number) ?? null,
    mightyMemberId: (r.mightyMemberId as number) ?? null,
    status: String(r.status),
    errorMessage: (r.errorMessage as string) ?? null,
    sentAt: new Date(String(r.sentAt)).toISOString(),
    acceptedAt: r.acceptedAt ? new Date(String(r.acceptedAt)).toISOString() : null,
    resentAt: r.resentAt ? new Date(String(r.resentAt)).toISOString() : null,
  }
}
