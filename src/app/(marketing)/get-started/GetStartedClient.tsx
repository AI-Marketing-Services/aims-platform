"use client"

import { useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Check, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

function CalBooking() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-900/20 mb-4">
          <Check className="h-6 w-6 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Request submitted!</h2>
        <p className="mt-2 text-muted-foreground">Pick a time that works best for your strategy call below.</p>
      </div>
      <div className="rounded-sm border border-border overflow-hidden">
        <iframe
          src="https://cal.com/adamwolfe/aims?embed=true&layout=month_view&theme=dark&brandColor=%23C4972A&hideEventTypeDetails=true"
          width="100%"
          height="640"
          style={{ border: "none", display: "block" }}
          title="Book a strategy call"
        />
      </div>
    </div>
  )
}

const SERVICES = [
  { slug: "cold-outbound", name: "Wild Ducks", description: "Outbound pipeline, fully deployed", flagship: true },
  { slug: "seo-aeo", name: "Money Page", description: "Own your search presence across every channel", flagship: true },
  { slug: "revops-pipeline", name: "Steel Trap", description: "Revenue operations that never leak", flagship: true },
  { slug: "website-crm-chatbot", name: "Website + CRM + Chatbot", description: "Conversion-optimized site with AI lead capture", flagship: false },
  { slug: "voice-agents", name: "AI Voice Agents", description: "Inbound and outbound AI calling agents", flagship: false },
  { slug: "lead-reactivation", name: "Lead Reactivation", description: "Turn dead CRM contacts into booked meetings", flagship: false },
]

const INDUSTRIES = [
  "SaaS / Software",
  "Professional Services",
  "Healthcare",
  "Automotive",
  "Vending / Retail",
  "Real Estate",
  "Financial Services",
  "Other",
]

interface FormData {
  services: string[]
  name: string
  email: string
  company: string
  phone: string
  website: string
  industry: string
  locations: string
  goal: string
}

export function GetStartedClient() {
  const searchParams = useSearchParams()
  const preselectedService = searchParams.get("service") ?? ""

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>({
    services: preselectedService ? [preselectedService] : [],
    name: "",
    email: "",
    company: "",
    phone: "",
    website: "",
    industry: "",
    locations: "1",
    goal: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }, [])

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const fieldErrors: Record<string, string | null> = {
    name: touched.name && !form.name.trim() ? "Name is required" : null,
    email: touched.email ? (!form.email.trim() ? "Email is required" : !isValidEmail(form.email) ? "Enter a valid email" : null) : null,
    company: touched.company && !form.company.trim() ? "Company is required" : null,
  }
  const fieldValid: Record<string, boolean> = {
    name: touched.name ? !!form.name.trim() : false,
    email: touched.email ? isValidEmail(form.email) : false,
    company: touched.company ? !!form.company.trim() : false,
  }

  const toggleService = (slug: string) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(slug)
        ? prev.services.filter((s) => s !== slug)
        : [...prev.services, slug],
    }))
  }

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const errMsg = data.error ?? "Something went wrong. Please try again."
        setSubmitError(errMsg)
        toast.error(errMsg)
        setSubmitting(false)
        return
      }
      setSubmitted(true)
      toast.success("Request submitted! Now book your call.")
    } catch {
      setSubmitError("Network error. Please check your connection and try again.")
      toast.error("Network error. Please try again.")
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen pt-20 bg-background">
        <div className="container mx-auto max-w-2xl px-4 py-16">
          <CalBooking />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight">Book Your Strategy Call</h1>
          <p className="mt-3 text-muted-foreground">
            Free 30-minute audit of your current pipeline. We&rsquo;ll build a custom growth plan.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-10 flex items-center">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${step >= s ? "bg-primary text-white" : "bg-deep text-muted-foreground"}`}>
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {i < 2 && (
                <div className={`h-px flex-1 mx-2 transition-colors ${step > s ? "bg-primary" : "bg-surface"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="border border-border bg-card p-8 shadow-sm">
          {/* Step 1: Services */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-2">Which engagement interests you?</h2>
              <p className="text-sm text-muted-foreground mb-6">Select all that apply.</p>
              <div className="space-y-3">
                {SERVICES.map((service) => {
                  const selected = form.services.includes(service.slug)
                  return (
                    <button
                      key={service.slug}
                      onClick={() => toggleService(service.slug)}
                      className={`w-full flex items-center justify-between rounded-xl border-2 p-4 text-left transition ${selected ? "border-primary bg-primary/10" : service.flagship ? "border-primary/40 hover:border-primary" : "border-border hover:border-muted-foreground"}`}
                    >
                      <div>
                        <span className="font-medium text-foreground">{service.name}</span>
                        {service.flagship && (
                          <span className="ml-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            Flagship
                          </span>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={form.services.length === 0}
                className="mt-6 w-full rounded-sm bg-primary py-3.5 font-semibold text-white disabled:opacity-50 hover:bg-primary/90 transition flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 2: Business info */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Tell us about your business</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Your Name *</label>
                    <div className="relative">
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        onBlur={() => markTouched("name")}
                        placeholder="Adam Wolfe"
                        className={`w-full rounded-lg border px-4 py-2.5 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${fieldErrors.name ? "border-red-500" : fieldValid.name ? "border-green-500/50" : "border-border"}`}
                      />
                      {fieldValid.name && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400" />}
                    </div>
                    {fieldErrors.name && <p className="text-xs text-red-400 mt-1">{fieldErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Company *</label>
                    <div className="relative">
                      <input
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        onBlur={() => markTouched("company")}
                        placeholder="ACME Corp"
                        className={`w-full rounded-lg border px-4 py-2.5 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${fieldErrors.company ? "border-red-500" : fieldValid.company ? "border-green-500/50" : "border-border"}`}
                      />
                      {fieldValid.company && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400" />}
                    </div>
                    {fieldErrors.company && <p className="text-xs text-red-400 mt-1">{fieldErrors.company}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Work Email *</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      onBlur={() => markTouched("email")}
                      placeholder="you@company.com"
                      className={`w-full rounded-lg border px-4 py-2.5 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${fieldErrors.email ? "border-red-500" : fieldValid.email ? "border-green-500/50" : "border-border"}`}
                    />
                    {fieldValid.email && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400" />}
                    {fieldErrors.email && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />}
                  </div>
                  {fieldErrors.email && <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Website</label>
                  <input
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://yoursite.com"
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Industry</label>
                    <select
                      value={form.industry}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">Select industry</option>
                      {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Locations</label>
                    <input
                      type="number"
                      min="1"
                      value={form.locations}
                      onChange={(e) => setForm({ ...form, locations: e.target.value })}
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Primary Goal</label>
                  <textarea
                    value={form.goal}
                    onChange={(e) => setForm({ ...form, goal: e.target.value.slice(0, 500) })}
                    rows={3}
                    placeholder="e.g. Book 20 demos per month, reactivate old leads, build a cold email system..."
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right mt-1">{form.goal.length}/500</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-semibold text-foreground hover:bg-secondary transition"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!form.name || !form.email || !form.company}
                  className="flex-1 rounded-sm bg-primary py-3 font-semibold text-white disabled:opacity-50 hover:bg-primary/90 transition flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-2">Review & Submit</h2>
              <p className="text-sm text-muted-foreground mb-6">We&rsquo;ll reach out within 24 hours to schedule your call.</p>

              <div className="space-y-3 rounded-xl bg-secondary/50 p-5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{form.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Company</span>
                  <span className="font-medium">{form.company}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{form.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Services</span>
                  <span className="font-medium">{form.services.length} selected</span>
                </div>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                By submitting, you agree to receive follow-up communications from AIMS. We respect your privacy.
              </p>

              {submitError && (
                <div className="mt-4 rounded-sm bg-primary/10 border border-primary/30 px-4 py-3 text-sm text-primary">
                  {submitError}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-semibold text-foreground hover:bg-secondary transition disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 rounded-sm bg-primary py-3 font-semibold text-white hover:bg-primary/90 transition disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit & Book Call"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
