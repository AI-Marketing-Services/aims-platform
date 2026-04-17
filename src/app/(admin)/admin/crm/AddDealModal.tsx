"use client"

import { useState } from "react"
import { X } from "lucide-react"

type DealStage =
  | "NEW_LEAD"
  | "QUALIFIED"
  | "DEMO_BOOKED"
  | "PROPOSAL_SENT"
  | "NEGOTIATION"
  | "ACTIVE_CLIENT"

type NewDeal = {
  id: string
  contactName: string
  company?: string
  stage: DealStage
  value: number
  mrr: number
  source?: string
  serviceArms: string[]
  daysInStage: number
}

interface Props {
  stage: DealStage
  onClose: () => void
  onCreated: (deal: NewDeal) => void
}

export function AddDealModal({ stage, onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    contactName: "",
    contactEmail: "",
    company: "",
    phone: "",
    source: "direct",
  })

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, stage }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to create deal")
        setLoading(false)
        return
      }

      const deal = await res.json()
      onCreated({
        id: deal.id,
        contactName: deal.contactName,
        company: deal.company ?? undefined,
        stage: deal.stage as DealStage,
        value: deal.value,
        mrr: deal.mrr,
        source: deal.source ?? undefined,
        serviceArms: [],
        daysInStage: 0,
      })
      onClose()
    } catch {
      setError("Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">Add Deal</h2>
          <button onClick={onClose} aria-label="Close dialog" className="p-1 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
            <input
              value={form.contactName}
              onChange={(e) => set("contactName", e.target.value)}
              required
              placeholder="Sarah Chen"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email *</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
              required
              placeholder="sarah@company.com"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Company</label>
            <input
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="TechFlow Inc"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Source</label>
            <select
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-border"
            >
              {["direct", "referral", "reseller", "partner", "ai-readiness-quiz", "roi-calculator", "website-audit", "cold-email", "inbound"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-primary">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#C4972A] text-sm font-medium text-white hover:bg-[#A17D22] transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
