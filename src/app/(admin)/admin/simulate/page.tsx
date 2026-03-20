"use client"

import { useState } from "react"
import {
  Play,
  CheckCircle,
  AlertCircle,
  Loader2,
  Zap,
  Target,
  Settings,
  Users,
  Star,
  FileText,
  Calculator,
  Globe,
  Layers,
  Wrench,
} from "lucide-react"

// ============ TYPES ============

interface SimulateResult {
  success: boolean
  userId?: string
  subscriptionId?: string
  dealId?: string
  taskCount?: number
  notificationId?: string
  serviceName?: string
  message?: string
  error?: string
}

interface LeadResult {
  success: boolean
  submission?: { id: string; type: string; email: string }
  deal?: { id: string; stage: string }
  error?: string
}

// ============ STATIC DATA ============

const SERVICES = [
  { id: "ai-growth-engine", name: "AI Growth Engine", price: 997, icon: Zap, slug: "ai-growth-engine" },
  { id: "ai-sales-engine", name: "AI Sales Engine", price: 1497, icon: Target, slug: "ai-sales-engine" },
  { id: "ai-ops-engine", name: "AI Ops Engine", price: 1997, icon: Settings, slug: "ai-ops-engine" },
  { id: "ghl-community-os", name: "GHL Community OS", price: 297, icon: Users, slug: "ghl-community-os" },
  { id: "ai-reputation-engine", name: "AI Reputation Engine", price: 397, icon: Star, slug: "ai-reputation-engine" },
]

const LEAD_TYPES = [
  { value: "AI_READINESS_QUIZ", label: "Quiz", icon: FileText },
  { value: "ROI_CALCULATOR", label: "Calculator", icon: Calculator },
  { value: "WEBSITE_AUDIT", label: "Audit", icon: Globe },
  { value: "SEGMENT_EXPLORER", label: "Segment Explorer", icon: Layers },
  { value: "STACK_CONFIGURATOR", label: "Stack Configurator", icon: Wrench },
]

// ============ SHARED STYLES ============

const inputCls =
  "w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C4972A]"

// ============ PURCHASE PANEL ============

function PurchasePanel() {
  const [serviceSlug, setServiceSlug] = useState("")
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SimulateResult | null>(null)

  const selectedService = SERVICES.find((s) => s.slug === serviceSlug)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedService) return
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch("/api/admin/simulate-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceArmId: serviceSlug, // will be resolved by name match server-side if needed
          clientName,
          clientEmail,
          monthlyAmount: selectedService.price,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ success: true, ...data })
        setClientName("")
        setClientEmail("")
      } else {
        setResult({ success: false, error: data.error ?? "Something went wrong" })
      }
    } catch {
      setResult({ success: false, error: "Network error" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">Simulate New Client Purchase</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Creates subscription, tasks, CRM deal, and notification.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Service radio cards */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Select Service</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SERVICES.map((s) => {
              const Icon = s.icon
              const active = serviceSlug === s.slug
              return (
                <label
                  key={s.slug}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    active
                      ? "border-[#C4972A] bg-[#C4972A]/10"
                      : "border-border hover:border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="service"
                    value={s.slug}
                    checked={active}
                    onChange={() => setServiceSlug(s.slug)}
                    className="sr-only"
                  />
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: active ? "#C4972A" : "#F3F4F6" }}
                  >
                    <Icon className="w-3.5 h-3.5 text-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">${s.price}/mo</div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* Client fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Client Name</label>
            <input
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Jane Smith"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Email</label>
            <input
              required
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="jane@example.com"
              className={inputCls}
            />
          </div>
        </div>

        {/* Error */}
        {result && !result.success && (
          <div className="rounded-lg p-3 border flex items-start gap-3 bg-primary/100/10 border-primary/20">
            <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-400">{result.error}</p>
          </div>
        )}

        {/* Success */}
        {result?.success && (
          <div className="rounded-lg border border-green-500/20 bg-green-400/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <p className="text-xs font-semibold text-green-300">Purchase simulated</p>
            </div>
            <div className="space-y-1.5">
              {[
                { label: "User account", ok: !!result.userId, value: result.userId ? `ID …${result.userId.slice(-8)}` : null },
                { label: "Subscription", ok: !!result.subscriptionId, value: result.subscriptionId ? `ID …${result.subscriptionId.slice(-8)}` : null },
                { label: "Fulfillment tasks", ok: (result.taskCount ?? 0) > 0, value: `${result.taskCount ?? 0} tasks` },
                { label: "CRM deal", ok: !!result.dealId, value: result.dealId ? `ID …${result.dealId.slice(-8)}` : null },
                { label: "Notification", ok: !!result.notificationId, value: result.notificationId ? "Fired" : null },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-2">
                  {c.ok ? (
                    <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                  )}
                  <span className="text-xs text-foreground">{c.label}</span>
                  {c.value && <span className="text-xs text-muted-foreground font-mono ml-auto">{c.value}</span>}
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-1 border-t border-border text-xs">
              <a href="/admin/clients" className="text-[#C4972A] hover:underline">Clients →</a>
              <a href="/admin/fulfillment" className="text-[#C4972A] hover:underline">Tasks →</a>
              <a href="/admin/crm" className="text-[#C4972A] hover:underline">CRM →</a>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !serviceSlug || !clientName || !clientEmail}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C4972A] hover:bg-[#A17D22] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {submitting ? "Simulating..." : "Simulate Purchase"}
        </button>
      </form>
    </div>
  )
}

// ============ LEAD MAGNET PANEL ============

function LeadMagnetPanel() {
  const [leadType, setLeadType] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [score, setScore] = useState(50)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<LeadResult | null>(null)

  const scoreColor =
    score >= 70 ? "text-primary" : score >= 40 ? "text-yellow-400" : "text-muted-foreground"

  const scoreThumbColor =
    score >= 70 ? "#C4972A" : score >= 40 ? "#EAB308" : "#6B7280"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!leadType) return
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch("/api/admin/simulate-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, type: leadType, score }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ success: true, ...data })
        setName("")
        setEmail("")
        setScore(50)
      } else {
        setResult({ success: false, error: data.error ?? "Something went wrong" })
      }
    } catch {
      setResult({ success: false, error: "Network error" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">Simulate Lead Magnet Submission</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Creates a lead submission, deal, and notification in the CRM.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type radio cards */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Lead Magnet Type</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {LEAD_TYPES.map((t) => {
              const Icon = t.icon
              const active = leadType === t.value
              return (
                <label
                  key={t.value}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    active
                      ? "border-[#C4972A] bg-[#C4972A]/10"
                      : "border-border hover:border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="leadType"
                    value={t.value}
                    checked={active}
                    onChange={() => setLeadType(t.value)}
                    className="sr-only"
                  />
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? "text-[#C4972A]" : "text-muted-foreground"}`} />
                  <span className="text-xs font-medium text-foreground leading-tight">{t.label}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Name + email */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className={inputCls}
            />
          </div>
        </div>

        {/* Score slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground">Lead Score</label>
            <span className={`text-sm font-mono font-bold ${scoreColor}`}>{score}</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            style={{ accentColor: scoreThumbColor }}
            className="w-full h-2 rounded-full bg-background appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Cold</span>
            <span>Warm</span>
            <span>Hot</span>
          </div>
        </div>

        {/* Error */}
        {result && !result.success && (
          <div className="rounded-lg p-3 border flex items-start gap-3 bg-primary/100/10 border-primary/20">
            <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-400">{result.error}</p>
          </div>
        )}

        {/* Success */}
        {result?.success && (
          <div className="rounded-lg border border-green-500/20 bg-green-400/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <p className="text-xs font-semibold text-green-300">Lead submission created</p>
            </div>
            <div className="space-y-1.5">
              {[
                {
                  label: "Submission",
                  ok: !!result.submission,
                  value: result.submission ? `ID …${result.submission.id.slice(-8)}` : null,
                },
                {
                  label: "CRM deal",
                  ok: !!result.deal,
                  value: result.deal ? `Stage: ${result.deal.stage}` : null,
                },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-2">
                  {c.ok ? (
                    <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                  )}
                  <span className="text-xs text-foreground">{c.label}</span>
                  {c.value && <span className="text-xs text-muted-foreground font-mono ml-auto">{c.value}</span>}
                </div>
              ))}
            </div>
            <a href="/admin/crm" className="block text-xs text-[#C4972A] hover:underline pt-1 border-t border-border">
              View in CRM →
            </a>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !leadType || !name || !email}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C4972A] hover:bg-[#A17D22] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {submitting ? "Simulating..." : "Simulate Submission"}
        </button>
      </form>
    </div>
  )
}

// ============ PAGE ============

export default function SimulatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Simulate</h1>
        <p className="text-sm text-muted-foreground mt-1">
          E2E testing tools for purchases and lead submissions. Use for demos, QA, and training.
        </p>
        {process.env.NODE_ENV === "production" && (
          <div className="mt-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-4 py-2.5">
            <p className="text-xs font-semibold text-yellow-400">
              Production environment - purchase simulation is disabled unless ALLOW_SIMULATE=true is set.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PurchasePanel />
        <LeadMagnetPanel />
      </div>
    </div>
  )
}
