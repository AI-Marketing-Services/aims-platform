"use client"

import { useState, useEffect } from "react"
import { Play, CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react"

interface ServiceArm {
  id: string
  name: string
  slug: string
  pillar: string
  tiers?: { name: string; monthlyPrice: number }[]
}

interface SimulateResult {
  success: boolean
  userId?: string
  subscriptionId?: string
  message?: string
  error?: string
}

export default function SimulatePurchasePage() {
  const [services, setServices] = useState<ServiceArm[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SimulateResult | null>(null)

  const [form, setForm] = useState({
    serviceArmId: "",
    tier: "",
    clientName: "",
    clientEmail: "",
    monthlyAmount: 297,
  })

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        setServices(Array.isArray(data) ? data : [])
        if (data.length > 0) setForm((f) => ({ ...f, serviceArmId: data[0].id }))
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false))
  }, [])

  const selectedService = services.find((s) => s.id === form.serviceArmId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)

    try {
      const res = await fetch("/api/admin/simulate-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ success: true, ...data })
        setForm((f) => ({ ...f, clientName: "", clientEmail: "" }))
      } else {
        setResult({ success: false, error: data.error ?? "Something went wrong" })
      }
    } catch {
      setResult({ success: false, error: "Network error" })
    } finally {
      setSubmitting(false)
    }
  }

  const PRESETS = [
    { label: "Growth — $197/mo", amount: 197 },
    { label: "Pro — $297/mo", amount: 297 },
    { label: "Elite — $497/mo", amount: 497 },
    { label: "Full Stack — $797/mo", amount: 797 },
  ]

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Simulate Purchase</h1>
        <p className="text-gray-400 text-sm">
          Create a test client subscription + auto-generate onboarding tasks. Use for demos, QA, or training.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service selector */}
        <div className="bg-[#151821] border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Service</h2>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading services...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {services.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.serviceArmId === s.id
                      ? "border-[#DC2626] bg-[#DC2626]/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="serviceArmId"
                    value={s.id}
                    checked={form.serviceArmId === s.id}
                    onChange={() => setForm((f) => ({ ...f, serviceArmId: s.id, tier: "" }))}
                    className="sr-only"
                  />
                  <div className="w-2 h-2 rounded-full border-2 border-current flex-shrink-0"
                    style={{ borderColor: form.serviceArmId === s.id ? "#DC2626" : "#4B5563" }}
                  >
                    {form.serviceArmId === s.id && (
                      <div className="w-1 h-1 rounded-full bg-[#DC2626] mx-auto mt-px" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{s.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{s.pillar.toLowerCase().replace("_", " ")}</div>
                  </div>
                </label>
              ))}

              {services.length === 0 && (
                <div className="text-sm text-gray-500 py-2">
                  No services found. Seed service arms first via Prisma Studio.
                </div>
              )}
            </div>
          )}

          {/* Tier if service has tiers */}
          {selectedService?.tiers && selectedService.tiers.length > 0 && (
            <div>
              <label className="block text-xs text-gray-400 mb-2">Tier (optional)</label>
              <select
                value={form.tier}
                onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
                className="w-full bg-[#0D0F14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              >
                <option value="">No specific tier</option>
                {selectedService.tiers.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} — ${t.monthlyPrice}/mo
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Client info */}
        <div className="bg-[#151821] border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Client Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Full Name</label>
              <input
                required
                value={form.clientName}
                onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                placeholder="Jane Smith"
                className="w-full bg-[#0D0F14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email</label>
              <input
                required
                type="email"
                value={form.clientEmail}
                onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
                placeholder="jane@example.com"
                className="w-full bg-[#0D0F14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Monthly Amount</label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PRESETS.map((p) => (
                <button
                  key={p.amount}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, monthlyAmount: p.amount }))}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    form.monthlyAmount === p.amount
                      ? "border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626]"
                      : "border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  ${p.amount}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={0}
              value={form.monthlyAmount}
              onChange={(e) => setForm((f) => ({ ...f, monthlyAmount: Number(e.target.value) }))}
              className="w-full bg-[#0D0F14] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
            />
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`rounded-xl p-4 border flex items-start gap-3 ${
            result.success
              ? "bg-green-500/10 border-green-500/20"
              : "bg-red-500/10 border-red-500/20"
          }`}>
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className={`text-sm font-medium ${result.success ? "text-green-300" : "text-red-300"}`}>
                {result.success ? "Purchase simulated!" : "Simulation failed"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {result.success ? result.message : result.error}
              </p>
              {result.success && result.subscriptionId && (
                <p className="text-xs text-gray-500 mt-1">
                  Subscription: {result.subscriptionId}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting || !form.serviceArmId || !form.clientName || !form.clientEmail}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {submitting ? "Simulating..." : "Simulate Purchase"}
          </button>

          {result?.success && (
            <button
              type="button"
              onClick={() => setResult(null)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#151821] border border-white/10 text-gray-400 hover:text-white text-sm rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Simulate Another
            </button>
          )}
        </div>
      </form>

      {/* Info callout */}
      <div className="mt-8 bg-[#0D0F14] border border-white/5 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">What this does</h3>
        <ul className="space-y-2 text-sm text-gray-500">
          <li className="flex items-start gap-2">
            <span className="text-[#DC2626] mt-0.5">1.</span>
            Finds or creates a user account with CLIENT role
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#DC2626] mt-0.5">2.</span>
            Creates an ACTIVE subscription for the selected service
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#DC2626] mt-0.5">3.</span>
            Auto-generates onboarding fulfillment tasks with due dates
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#DC2626] mt-0.5">4.</span>
            Creates an ACTIVE_CLIENT deal in the CRM pipeline
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#DC2626] mt-0.5">5.</span>
            Fires a &quot;New Purchase&quot; notification to the team
          </li>
        </ul>
      </div>
    </div>
  )
}
