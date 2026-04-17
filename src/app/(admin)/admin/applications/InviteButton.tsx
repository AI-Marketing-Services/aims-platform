"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Send, CheckCircle2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  dealId: string | null
  contactEmail: string
  contactName: string
  initialStatus: string | null
  initialMightyMemberId: number | null
}

const STATUS_COLORS: Record<string, string> = {
  accepted: "text-emerald-700 bg-emerald-50 border-emerald-200",
  sent: "text-muted-foreground bg-muted/50 border-border",
  pending: "text-muted-foreground bg-muted/50 border-border",
  failed: "text-primary bg-primary/10 border-primary/30",
}

export function InviteButton({
  dealId,
  contactEmail,
  contactName,
  initialStatus,
  initialMightyMemberId,
}: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [memberId, setMemberId] = useState(initialMightyMemberId)
  const [busy, setBusy] = useState(false)

  if (!dealId) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  if (status === "accepted" && memberId) {
    return (
      <a
        href={`https://aioperatorcollective.mn.co/members/${memberId}`}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border",
          STATUS_COLORS.accepted
        )}
      >
        <CheckCircle2 className="w-3 h-3" />
        Joined
        <ExternalLink className="w-2.5 h-2.5" />
      </a>
    )
  }

  if (status === "sent" || status === "pending") {
    return (
      <Link
        href={`/admin/crm/${dealId}`}
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border",
          STATUS_COLORS[status] ?? STATUS_COLORS.pending
        )}
      >
        Invited
      </Link>
    )
  }

  async function sendInvite() {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/deals/${dealId}/invite-to-mighty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "community" }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? "Invite failed")
        if (body.invite?.status === "failed") setStatus("failed")
        return
      }
      toast.success(`${contactName || contactEmail} invited to Collective`)
      setStatus(body.invite?.status ?? "sent")
      setMemberId(body.invite?.mightyMemberId ?? null)
    } catch (err) {
      toast.error("Network error")
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={sendInvite}
      disabled={busy}
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm border border-[#981B1B]/40 text-[#981B1B] hover:bg-[#981B1B]/10 disabled:opacity-40 transition-colors"
    >
      <Send className="w-3 h-3" />
      {busy ? "..." : "Invite"}
    </button>
  )
}
