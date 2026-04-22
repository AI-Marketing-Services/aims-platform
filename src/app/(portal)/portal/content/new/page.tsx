"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Linkedin,
  FileText,
  Mail,
  MessageSquare,
  Hash,
  Zap,
  Save,
  ArrowLeft,
  ChevronDown,
  AlertCircle,
} from "lucide-react"
import { ContentPieceType } from "@prisma/client"

// ── Types ──────────────────────────────────────────────────────────────────────

interface Deal {
  id: string
  companyName: string
  stage: string
}

interface ContentTypeOption {
  value: ContentPieceType
  label: string
  description: string
  icon: React.ElementType
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CONTENT_TYPES: ContentTypeOption[] = [
  {
    value: "LINKEDIN_POST",
    label: "LinkedIn Post",
    description: "Share a client win or insight",
    icon: Linkedin,
  },
  {
    value: "CASE_STUDY",
    label: "Case Study",
    description: "Document a success story",
    icon: FileText,
  },
  {
    value: "EMAIL_SEQUENCE",
    label: "Email Sequence",
    description: "3-email nurture drip",
    icon: Mail,
  },
  {
    value: "TESTIMONIAL",
    label: "Testimonial Request",
    description: "Request a client testimonial",
    icon: MessageSquare,
  },
  {
    value: "TWEET_THREAD",
    label: "Tweet Thread",
    description: "5-tweet educational thread",
    icon: Hash,
  },
]

const STAGE_LABELS: Record<string, string> = {
  PROSPECT: "Prospect",
  DISCOVERY_CALL: "Discovery Call",
  PROPOSAL_SENT: "Proposal Sent",
  ACTIVE_RETAINER: "Active Retainer",
  COMPLETED: "Completed",
  LOST: "Lost",
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NewContentPage() {
  const router = useRouter()

  // Form state
  const [selectedType, setSelectedType] = useState<ContentPieceType>("LINKEDIN_POST")
  const [selectedDealId, setSelectedDealId] = useState<string>("")
  const [context, setContext] = useState("")
  const [editableTitle, setEditableTitle] = useState("")
  const [editableContent, setEditableContent] = useState("")

  // UI state
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  // Data
  const [deals, setDeals] = useState<Deal[]>([])
  const [dealsLoading, setDealsLoading] = useState(true)

  useEffect(() => {
    const loadDeals = async () => {
      try {
        const res = await fetch("/api/portal/crm/deals")
        if (res.ok) {
          const data = await res.json()
          // Only show completed + active retainer deals as they make good case studies
          const eligible = (data.deals ?? []).filter(
            (d: Deal) => d.stage === "COMPLETED" || d.stage === "ACTIVE_RETAINER"
          )
          setDeals(eligible)
        }
      } finally {
        setDealsLoading(false)
      }
    }

    loadDeals()
  }, [])

  const handleGenerate = async () => {
    setGenerateError(null)
    setGenerating(true)
    setEditableTitle("")
    setEditableContent("")
    setHasGenerated(false)

    try {
      const body: Record<string, unknown> = { type: selectedType }
      if (selectedDealId) body.dealId = selectedDealId
      if (context.trim()) body.context = context.trim()

      const res = await fetch("/api/portal/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setGenerateError(data.error ?? "Generation failed. Please try again.")
        return
      }

      setEditableTitle(data.title)
      setEditableContent(data.content)
      setHasGenerated(true)
    } catch {
      setGenerateError("Network error. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!editableTitle.trim() || !editableContent.trim()) return
    setSaveError(null)
    setSaving(true)

    try {
      const body: Record<string, unknown> = {
        type: selectedType,
        title: editableTitle.trim(),
        content: editableContent.trim(),
        status: "DRAFT",
      }
      if (selectedDealId) body.clientDealId = selectedDealId

      const res = await fetch("/api/portal/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setSaveError(data.error ?? "Save failed. Please try again.")
        return
      }

      setSaved(true)
      setTimeout(() => {
        router.push("/portal/content")
      }, 800)
    } catch {
      setSaveError("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/portal/content")}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-[#F0EBE0]/40 hover:text-[#F0EBE0] hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-[#F0EBE0]">Create Content</h1>
          <p className="text-xs text-[#F0EBE0]/50">AI-powered content generator</p>
        </div>
      </div>

      {/* Content Type Selector */}
      <div className="rounded-xl border border-border bg-[#141923] p-5 space-y-3">
        <p className="text-xs font-semibold text-[#F0EBE0]/50 uppercase tracking-wider">
          Content Type
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {CONTENT_TYPES.map((option) => {
            const Icon = option.icon
            const isSelected = selectedType === option.value
            return (
              <button
                key={option.value}
                onClick={() => {
                  setSelectedType(option.value)
                  setHasGenerated(false)
                  setEditableTitle("")
                  setEditableContent("")
                }}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "border-[#C4972A]/50 bg-[#C4972A]/10"
                    : "border-border hover:border-[#C4972A]/20 hover:bg-white/3"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-[#C4972A]/20" : "bg-white/5"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${isSelected ? "text-[#C4972A]" : "text-[#F0EBE0]/40"}`}
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold ${
                      isSelected ? "text-[#C4972A]" : "text-[#F0EBE0]"
                    }`}
                  >
                    {option.label}
                  </p>
                  <p className="text-xs text-[#F0EBE0]/40 mt-0.5 leading-tight">
                    {option.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Deal Selector + Context */}
      <div className="rounded-xl border border-border bg-[#141923] p-5 space-y-4">
        <p className="text-xs font-semibold text-[#F0EBE0]/50 uppercase tracking-wider">
          Personalization
        </p>

        {/* Deal dropdown */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#F0EBE0]/70">
            Link to a Won Deal{" "}
            <span className="text-[#F0EBE0]/30 font-normal">(optional)</span>
          </label>
          {!dealsLoading && deals.length === 0 ? (
            <p className="text-xs text-[#F0EBE0]/30 italic">
              No completed or active retainer deals found. Close a deal first for the best results.
            </p>
          ) : (
            <div className="relative">
              <select
                value={selectedDealId}
                onChange={(e) => setSelectedDealId(e.target.value)}
                disabled={dealsLoading}
                className="w-full appearance-none rounded-lg border border-border bg-[#08090D] px-3 py-2.5 pr-9 text-sm text-[#F0EBE0] focus:outline-none focus:border-[#C4972A]/50 disabled:opacity-50 transition-colors"
              >
                <option value="">No deal — use general context</option>
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.companyName} — {STAGE_LABELS[deal.stage] ?? deal.stage}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#F0EBE0]/30" />
            </div>
          )}
        </div>

        {/* Context textarea */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#F0EBE0]/70">
            Additional Context{" "}
            <span className="text-[#F0EBE0]/30 font-normal">(optional)</span>
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="E.g. They cut their admin time in half, saved $8k/month, and referred two new clients after we automated their reporting..."
            rows={3}
            className="w-full rounded-lg border border-border bg-[#08090D] px-3 py-2.5 text-sm text-[#F0EBE0] placeholder-[#F0EBE0]/20 focus:outline-none focus:border-[#C4972A]/50 resize-none transition-colors"
          />
        </div>
      </div>

      {/* Generate Error */}
      {generateError && (
        <div className="flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {generateError}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#C4972A] text-[#08090D] text-sm font-bold hover:bg-[#C4972A]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Zap className={`h-4 w-4 ${generating ? "animate-pulse" : ""}`} />
        {generating ? "Generating…" : hasGenerated ? "Regenerate" : "Generate"}
      </button>

      {/* Generated Output */}
      {hasGenerated && (
        <div className="rounded-xl border border-[#C4972A]/20 bg-[#141923] p-5 space-y-4">
          <p className="text-xs font-semibold text-[#C4972A]/70 uppercase tracking-wider">
            Generated Content
          </p>

          {/* Title field */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#F0EBE0]/70">Title</label>
            <input
              type="text"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-[#08090D] px-3 py-2.5 text-sm text-[#F0EBE0] focus:outline-none focus:border-[#C4972A]/50 transition-colors"
            />
          </div>

          {/* Content textarea */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#F0EBE0]/70">Content</label>
            <textarea
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              rows={18}
              className="w-full rounded-lg border border-border bg-[#08090D] px-3 py-2.5 text-sm text-[#F0EBE0] leading-relaxed focus:outline-none focus:border-[#C4972A]/50 resize-y transition-colors"
            />
          </div>

          {saveError && (
            <div className="flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {saveError}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || saved || !editableTitle.trim() || !editableContent.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#C4972A]/40 bg-[#C4972A]/10 text-[#C4972A] text-sm font-semibold hover:bg-[#C4972A]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {saved ? "Saved! Redirecting…" : saving ? "Saving…" : "Save as Draft"}
          </button>
        </div>
      )}
    </div>
  )
}
