"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { FileText, Sparkles, ChevronDown, ChevronUp, ExternalLink, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Proposal {
  id: string
  title: string
  status: string
  totalValue: number
  currency: string
  createdAt: string
  shareToken: string | null
}

interface ProposalGeneratorProps {
  dealId: string
  companyName: string
  dealValue: number
  proposals: Proposal[]
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-surface text-muted-foreground border-border",
  SENT: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ACCEPTED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
}

export function ProposalGenerator({
  dealId,
  companyName,
  dealValue,
  proposals: initialProposals,
}: ProposalGeneratorProps) {
  const router = useRouter()
  const [proposals, setProposals] = useState(initialProposals)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    const payload = {
      title: (form.get("title") as string) || undefined,
      services: (form.get("services") as string) || undefined,
      additionalContext: (form.get("additionalContext") as string) || undefined,
    }

    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/portal/crm/deals/${dealId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to generate proposal")
        return
      }

      const { proposal } = await res.json()
      setProposals((prev) => [proposal, ...prev])
      setShowForm(false)
      router.push(`/portal/crm/${dealId}/proposals/${proposal.id}`)
    })
  }

  async function handleDelete(proposalId: string) {
    await fetch(`/api/portal/crm/proposals/${proposalId}`, { method: "DELETE" })
    setProposals((prev) => prev.filter((p) => p.id !== proposalId))
    router.refresh()
  }

  const inputClass =
    "w-full h-9 px-3 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"

  return (
    <div className="space-y-3">
      {/* Existing proposals */}
      {proposals.length > 0 && (
        <div className="space-y-2">
          {proposals.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 p-3 rounded-lg bg-surface/60 border border-border"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                    STATUS_COLORS[p.status] ?? STATUS_COLORS.DRAFT
                  )}
                >
                  {p.status}
                </span>
                <a
                  href={`/portal/crm/${dealId}/proposals/${p.id}`}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                  title="View proposal"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  title="Delete proposal"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate button / form */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 w-full p-3 rounded-lg border border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-left transition-all"
      >
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-medium text-foreground flex-1">Generate AI Proposal</span>
        {showForm ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {showForm && (
        <form onSubmit={handleGenerate} className="space-y-3 pt-1">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Proposal title</label>
            <input
              name="title"
              placeholder={`AI Automation Services for ${companyName}`}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Services to include</label>
            <input
              name="services"
              placeholder="e.g. AI chatbot, lead follow-up automation, review management"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Additional context</label>
            <textarea
              name="additionalContext"
              placeholder="Pain points discussed, budget range, specific integrations needed…"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isPending ? "Generating…" : "Generate"}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
