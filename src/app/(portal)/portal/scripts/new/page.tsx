"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Mail,
  Phone,
  RefreshCw,
  MessageSquare,
  FileText,
  Zap,
  Save,
  ArrowLeft,
  ChevronDown,
  AlertCircle,
} from "lucide-react"
import { AiScriptType } from "@prisma/client"

// ── Types ──────────────────────────────────────────────────────────────────────

interface Deal {
  id: string
  companyName: string
  contactName: string | null
  stage: string
}

interface ScriptTypeOption {
  value: AiScriptType
  label: string
  description: string
  icon: React.ElementType
}

interface UsageItem {
  type: string
  used: number
  allowance: number
  remaining: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SCRIPT_TYPES: ScriptTypeOption[] = [
  {
    value: "COLD_EMAIL",
    label: "Cold Email",
    description: "Outreach to new prospects",
    icon: Mail,
  },
  {
    value: "DISCOVERY_CALL",
    label: "Discovery Call",
    description: "Structure your discovery conversations",
    icon: Phone,
  },
  {
    value: "FOLLOW_UP",
    label: "Follow-Up",
    description: "Re-engage prospects who went quiet",
    icon: RefreshCw,
  },
  {
    value: "LINKEDIN_DM",
    label: "LinkedIn DM",
    description: "Personalized LinkedIn outreach",
    icon: MessageSquare,
  },
  {
    value: "PROPOSAL_FOLLOW_UP",
    label: "Proposal Follow-Up",
    description: "Follow up after sending a proposal",
    icon: FileText,
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function NewScriptPage() {
  const router = useRouter()

  // Form state
  const [selectedType, setSelectedType] = useState<AiScriptType>("COLD_EMAIL")
  const [selectedDealId, setSelectedDealId] = useState<string>("")
  const [context, setContext] = useState("")
  const [generatedTitle, setGeneratedTitle] = useState("")
  const [generatedContent, setGeneratedContent] = useState("")
  const [editableTitle, setEditableTitle] = useState("")
  const [editableContent, setEditableContent] = useState("")

  // UI state
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Data
  const [deals, setDeals] = useState<Deal[]>([])
  const [dealsLoading, setDealsLoading] = useState(true)
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const [dealsRes, usageRes] = await Promise.all([
        fetch("/api/portal/crm/deals"),
        fetch("/api/portal/usage"),
      ])

      if (dealsRes.ok) {
        const data = await dealsRes.json()
        setDeals(data.deals ?? [])
      }
      setDealsLoading(false)

      if (usageRes.ok) {
        const data = await usageRes.json()
        const aiChat = (data.usage as UsageItem[]).find((u) => u.type === "ai_chat")
        setRemainingCredits(aiChat?.remaining ?? null)
      }
    }

    loadData()
  }, [])

  // Keep editable fields in sync when generation completes
  useEffect(() => {
    setEditableTitle(generatedTitle)
    setEditableContent(generatedContent)
  }, [generatedTitle, generatedContent])

  const handleGenerate = async () => {
    setError(null)
    setGenerating(true)
    setGeneratedTitle("")
    setGeneratedContent("")

    try {
      const body: Record<string, unknown> = { type: selectedType }
      if (selectedDealId) body.dealId = selectedDealId
      if (context.trim()) body.context = context.trim()

      const res = await fetch("/api/portal/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Generation failed. Please try again.")
        return
      }

      setGeneratedTitle(data.title)
      setGeneratedContent(data.content)

      // Decrement local credit count optimistically
      setRemainingCredits((prev) => (prev !== null ? Math.max(0, prev - 1) : null))
    } catch {
      setError("Network error. Please try again.")
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
      }
      if (selectedDealId) body.clientDealId = selectedDealId

      const res = await fetch("/api/portal/scripts", {
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
        router.push("/portal/scripts")
      }, 800)
    } catch {
      setSaveError("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const hasGenerated = generatedContent.length > 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/portal/scripts")}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-[#F0EBE0]/40 hover:text-[#F0EBE0] hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-[#F0EBE0]">Generate Script</h1>
          <p className="text-xs text-[#F0EBE0]/50">AI-powered sales script generator</p>
        </div>
        {remainingCredits !== null && (
          <div className="ml-auto text-right">
            <p className="text-[10px] text-[#F0EBE0]/30 uppercase tracking-wider">AI Credits</p>
            <p
              className={`text-sm font-bold ${
                remainingCredits === 0 ? "text-red-400" : "text-[#C4972A]"
              }`}
            >
              {remainingCredits} remaining
            </p>
          </div>
        )}
      </div>

      {/* Script Type Selector */}
      <div className="rounded-xl border border-border bg-[#141923] p-5 space-y-3">
        <p className="text-xs font-semibold text-[#F0EBE0]/50 uppercase tracking-wider">
          Script Type
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {SCRIPT_TYPES.map((option) => {
            const Icon = option.icon
            const isSelected = selectedType === option.value
            return (
              <button
                key={option.value}
                onClick={() => setSelectedType(option.value)}
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
          Personalization (optional)
        </p>

        {/* Deal dropdown */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#F0EBE0]/70">
            Link to a Deal
          </label>
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
                  {deal.companyName}
                  {deal.contactName ? ` · ${deal.contactName}` : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#F0EBE0]/30" />
          </div>
        </div>

        {/* Context textarea */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#F0EBE0]/70">
            Additional Context
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="E.g. They run a 3-location dental practice, recently mentioned struggling with no-shows, met at the local Chamber of Commerce event..."
            rows={3}
            className="w-full rounded-lg border border-border bg-[#08090D] px-3 py-2.5 text-sm text-[#F0EBE0] placeholder-[#F0EBE0]/20 focus:outline-none focus:border-[#C4972A]/50 resize-none transition-colors"
          />
        </div>
      </div>

      {/* Generate Button */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={generating || remainingCredits === 0}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#C4972A] text-[#08090D] text-sm font-bold hover:bg-[#C4972A]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Zap className={`h-4 w-4 ${generating ? "animate-pulse" : ""}`} />
        {generating ? "Generating…" : "Generate Script"}
      </button>

      {remainingCredits === 0 && (
        <p className="text-xs text-center text-[#F0EBE0]/30">
          You have used all AI credits for this month.
        </p>
      )}

      {/* Generated Output */}
      {hasGenerated && (
        <div className="rounded-xl border border-[#C4972A]/20 bg-[#141923] p-5 space-y-4">
          <p className="text-xs font-semibold text-[#C4972A]/70 uppercase tracking-wider">
            Generated Script
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
            <label className="text-sm font-medium text-[#F0EBE0]/70">Script Content</label>
            <textarea
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              rows={16}
              className="w-full rounded-lg border border-border bg-[#08090D] px-3 py-2.5 text-sm text-[#F0EBE0] font-mono leading-relaxed focus:outline-none focus:border-[#C4972A]/50 resize-y transition-colors"
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
            {saved ? "Saved! Redirecting…" : saving ? "Saving…" : "Save Script"}
          </button>
        </div>
      )}
    </div>
  )
}
