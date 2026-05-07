"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  MessageSquare,
  FileText,
  Receipt,
  Loader2,
  ExternalLink,
  Megaphone,
} from "lucide-react"
import { FollowUpDraftDialog } from "./FollowUpDraftDialog"
import { cn } from "@/lib/utils"
import { buildMetaAdLibraryUrl } from "@/lib/crm/meta-ad-library"

interface DealQuickActionsProps {
  dealId: string
  companyName: string
  website?: string | null
  defaultRecipientEmail: string | null
  hasEnrichment: boolean
}

/**
 * Single-row quick-actions bar at the top of the Deal detail page.
 * Most-used operator actions condensed into 4 buttons:
 *   1. Enrich (or Re-enrich if already enriched)
 *   2. Draft follow-up email
 *   3. Generate proposal (jumps to the existing proposal generator)
 *   4. Create invoice (jumps to /portal/invoices/new?dealId=…)
 *
 * The Enrich and Follow-up buttons open inline. Proposal + Invoice
 * navigate to existing pages (which are already mounted on the deal).
 */
export function DealQuickActions({
  dealId,
  companyName,
  website,
  defaultRecipientEmail,
  hasEnrichment,
}: DealQuickActionsProps) {
  const metaAdLibraryUrl = buildMetaAdLibraryUrl({ companyName, website })

  const router = useRouter()
  const [enriching, setEnriching] = useState(false)
  const [enrichError, setEnrichError] = useState<string | null>(null)
  const [followUpOpen, setFollowUpOpen] = useState(false)

  async function handleQuickEnrich() {
    setEnrichError(null)
    setEnriching(true)
    try {
      const res = await fetch(`/api/portal/crm/deals/${dealId}/enrich`, {
        method: "POST",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 402) {
          setEnrichError(
            `Need ${data.required ?? 80} credits but have ${data.available ?? 0}.`,
          )
        } else {
          setEnrichError(typeof data.error === "string" ? data.error : "Enrich failed")
        }
        return
      }
      router.refresh()
    } catch (err) {
      setEnrichError(err instanceof Error ? err.message : "Network error")
    } finally {
      setEnriching(false)
    }
  }

  function jumpToProposal() {
    // Anchor to the proposal section on this same page — saves a
    // round-trip and keeps context.
    const el = document.getElementById("proposal-section")
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  function jumpToInvoice() {
    router.push(`/portal/invoices/new?dealId=${dealId}`)
  }

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-2 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={handleQuickEnrich}
          disabled={enriching}
          className={cn(
            "flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
            "border border-border hover:border-primary hover:bg-primary/5 hover:text-primary",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
          title={hasEnrichment ? "Re-enrich (~80 credits)" : "Enrich (~80 credits)"}
        >
          {enriching ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Enriching…
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              {hasEnrichment ? "Re-enrich" : "Enrich"}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFollowUpOpen(true)}
          className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors"
          title="Draft a personalized follow-up email"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Draft follow-up
        </button>

        <button
          type="button"
          onClick={jumpToProposal}
          className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors"
          title="Jump to the proposal generator"
        >
          <FileText className="h-3.5 w-3.5" />
          Generate proposal
          <ExternalLink className="h-2.5 w-2.5 opacity-50" />
        </button>

        <button
          type="button"
          onClick={jumpToInvoice}
          className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors"
          title="Create an invoice for this deal"
        >
          <Receipt className="h-3.5 w-3.5" />
          New invoice
          <ExternalLink className="h-2.5 w-2.5 opacity-50" />
        </button>

        {metaAdLibraryUrl && (
          <a
            href={metaAdLibraryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors"
            title={`Search Meta Ad Library for ${companyName}`}
          >
            <Megaphone className="h-3.5 w-3.5" />
            Check Meta ads
            <ExternalLink className="h-2.5 w-2.5 opacity-50" />
          </a>
        )}
      </div>
      {enrichError && (
        <p className="text-[11px] text-destructive mt-1">{enrichError}</p>
      )}

      <FollowUpDraftDialog
        dealId={dealId}
        companyName={companyName}
        defaultRecipientEmail={defaultRecipientEmail}
        open={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
      />
    </>
  )
}
