"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { FIRST_WIN_AUDIT_CONSENT_NOTICE } from "@/lib/first-win-audit"

type ClientDealOption = {
  id: string
  companyName: string
  industry: string | null
  stage: string
  contactName: string | null
}

interface FirstWinAuditCreateFormProps {
  deals: ClientDealOption[]
}

export function FirstWinAuditCreateForm({ deals }: FirstWinAuditCreateFormProps) {
  const router = useRouter()
  const [clientDealId, setClientDealId] = useState(deals[0]?.id ?? "")
  const selectedDeal = useMemo(
    () => deals.find((deal) => deal.id === clientDealId) ?? null,
    [clientDealId, deals]
  )
  const [companyName, setCompanyName] = useState(deals[0]?.companyName ?? "")
  const [industry, setIndustry] = useState(deals[0]?.industry ?? "")
  const [aggregateUseAllowed, setAggregateUseAllowed] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleDealChange(nextId: string) {
    setClientDealId(nextId)
    const nextDeal = deals.find((deal) => deal.id === nextId)
    setCompanyName(nextDeal?.companyName ?? "")
    setIndustry(nextDeal?.industry ?? "")
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!clientDealId || !companyName.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/portal/first-win-audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientDealId,
          companyName: companyName.trim(),
          industry: industry.trim() || null,
          aggregateUseAllowed,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? "Could not create audit")
      }

      router.push("/portal/first-win-audits")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create audit")
    } finally {
      setSubmitting(false)
    }
  }

  if (deals.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
        <p className="text-sm font-semibold text-foreground">No CRM clients or prospects yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Create a prospect in Client CRM first. The First Win Audit needs to belong to a specific business.
        </p>
        <Link
          href="/portal/crm"
          className="mt-4 inline-flex items-center rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Go to Client CRM
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <Link href="/portal/first-win-audits" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to First Win Audits
      </Link>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Create a First Win Audit</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick the client or prospect this diagnostic belongs to. This does not change the existing AI Audit quiz builder.
          </p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Client or prospect</span>
          <select
            value={clientDealId}
            onChange={(event) => handleDealChange(event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
            {deals.map((deal) => (
              <option key={deal.id} value={deal.id}>
                {deal.companyName} {deal.contactName ? `· ${deal.contactName}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Company name</span>
          <input
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Industry</span>
          <input
            value={industry}
            onChange={(event) => setIndustry(event.target.value)}
            placeholder="Optional"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>

        {selectedDeal && (
          <p className="text-xs text-muted-foreground">
            CRM stage: <span className="text-foreground">{selectedDeal.stage}</span>
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card/60 p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Consent boundary</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{FIRST_WIN_AUDIT_CONSENT_NOTICE}</p>
        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={aggregateUseAllowed}
            onChange={(event) => setAggregateUseAllowed(event.target.checked)}
            className="mt-1"
          />
          <span>Allow anonymized patterns from this audit to help improve AIOC training, templates, and product development.</span>
        </label>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !clientDealId || !companyName.trim()}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-opacity"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Create audit
      </button>
    </form>
  )
}
