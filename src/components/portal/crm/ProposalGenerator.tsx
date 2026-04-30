"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trash2,
  Wand2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Quote,
  Target,
  Plug,
  BookOpen,
} from "lucide-react"
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
  DRAFT: "bg-muted text-muted-foreground border-border",
  SENT: "bg-primary/[0.08] text-primary border-primary/30",
  ACCEPTED: "bg-primary text-primary-foreground border-primary",
  REJECTED: "bg-muted text-muted-foreground border-border line-through",
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
  const [suggesting, setSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const [aiSuggestion, setAiSuggestion] = useState<{
    services: string[]
    pitchAngle: string | null
    painPoints: string[]
    integrations: string[]
    estimatedMonthlyValue: string | null
    matchedPlaybook: string | null
  } | null>(null)
  const servicesInputRef = useRef<HTMLInputElement>(null)
  const contextTextareaRef = useRef<HTMLTextAreaElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  async function handleAiRecommend() {
    setSuggestError(null)
    setSuggesting(true)
    try {
      const res = await fetch(
        `/api/portal/crm/deals/${dealId}/suggest-services`,
        { method: "POST" },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 402) {
          setSuggestError(
            `Need ${data.required ?? 3} credits but have ${data.available ?? 0}.`,
          )
        } else {
          setSuggestError(typeof data.error === "string" ? data.error : "AI failed")
        }
        return
      }

      // Fill the form fields directly
      if (servicesInputRef.current) {
        servicesInputRef.current.value = (data.services ?? []).join(", ")
      }
      if (contextTextareaRef.current) {
        const lines: string[] = []
        if (data.pitchAngle) lines.push(`Pitch angle: ${data.pitchAngle}`)
        if (data.painPoints?.length) {
          lines.push("")
          lines.push("Pain points to address:")
          for (const pp of data.painPoints) lines.push(`• ${pp}`)
        }
        if (data.integrations?.length) {
          lines.push("")
          lines.push(`Integrations: ${data.integrations.join(", ")}`)
        }
        if (data.estimatedMonthlyValue) {
          lines.push("")
          lines.push(`Target monthly value: ${data.estimatedMonthlyValue}`)
        }
        contextTextareaRef.current.value = lines.join("\n")
      }
      if (titleInputRef.current && !titleInputRef.current.value) {
        titleInputRef.current.value = `AI Services Proposal — ${companyName}`
      }

      // Show the full structured AI recommendation as a deliverable
      setAiSuggestion({
        services: data.services ?? [],
        pitchAngle: data.pitchAngle ?? null,
        painPoints: data.painPoints ?? [],
        integrations: data.integrations ?? [],
        estimatedMonthlyValue: data.estimatedMonthlyValue ?? null,
        matchedPlaybook: data.matchedPlaybook ?? null,
      })
      const serviceCount = (data.services ?? []).length
      toast.success("AI recommendation ready", {
        description:
          serviceCount > 0
            ? `${serviceCount} services suggested. Form pre-filled below.`
            : "Form pre-filled below. Edit then generate.",
      })
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : "Network error")
    } finally {
      setSuggesting(false)
    }
  }

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
      toast.success("Proposal generated", {
        description: `"${proposal.title}" is ready to review and send.`,
      })
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
          {/* AI Recommend — auto-fill services + context based on the
              enriched company profile + matching playbook. */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Wand2 className="h-3.5 w-3.5 text-primary" />
                  Auto-recommend with AI
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Reads {companyName}&apos;s enriched profile + matched playbook,
                  fills services + pitch context. <strong>3 credits.</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={handleAiRecommend}
                disabled={suggesting}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {suggesting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Thinking…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Recommend
                  </>
                )}
              </button>
            </div>
            {suggestError && (
              <div className="mt-2 flex items-start gap-1.5 text-[11px] text-destructive">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                <span>{suggestError}</span>
              </div>
            )}
          </div>

          {aiSuggestion && (
            <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent p-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-tight">
                      AI Recommendation
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Tailored to {companyName} based on enrichment + playbook
                    </p>
                  </div>
                </div>
                {aiSuggestion.estimatedMonthlyValue && (
                  <div className="text-right shrink-0">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Target MRR
                    </p>
                    <p className="text-sm font-bold text-primary leading-tight">
                      {aiSuggestion.estimatedMonthlyValue}
                    </p>
                  </div>
                )}
              </div>

              {aiSuggestion.matchedPlaybook && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-semibold text-primary">
                  <BookOpen className="h-3 w-3" />
                  {aiSuggestion.matchedPlaybook} playbook matched
                </div>
              )}

              {aiSuggestion.pitchAngle && (
                <div className="rounded-lg border-l-2 border-primary bg-background/40 p-3">
                  <div className="flex items-start gap-2">
                    <Quote className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground italic leading-relaxed">
                      {aiSuggestion.pitchAngle}
                    </p>
                  </div>
                </div>
              )}

              {aiSuggestion.services.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    Recommended services
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {aiSuggestion.services.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2 py-1 text-[11px] text-foreground font-medium"
                      >
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {aiSuggestion.painPoints.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
                    <Target className="h-2.5 w-2.5" />
                    Pain points to address
                  </p>
                  <ul className="space-y-1">
                    {aiSuggestion.painPoints.map((p) => (
                      <li
                        key={p}
                        className="flex items-start gap-2 text-xs text-foreground leading-snug"
                      >
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSuggestion.integrations.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
                    <Plug className="h-2.5 w-2.5" />
                    Integration angles
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {aiSuggestion.integrations.map((i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground italic border-t border-primary/15 pt-2.5">
                The form below has been pre-filled. Edit any field then hit Generate to ship the full proposal.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Proposal title</label>
            <input
              ref={titleInputRef}
              name="title"
              placeholder={`AI Automation Services for ${companyName}`}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Services to include</label>
            <input
              ref={servicesInputRef}
              name="services"
              placeholder="e.g. AI chatbot, lead follow-up automation, review management"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Additional context</label>
            <textarea
              ref={contextTextareaRef}
              name="additionalContext"
              placeholder="Pain points discussed, budget range, specific integrations needed…"
              rows={6}
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
