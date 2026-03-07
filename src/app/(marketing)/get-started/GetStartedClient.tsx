"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Check, ArrowRight, ArrowLeft } from "lucide-react"

const SERVICES = [
  { slug: "website-crm-chatbot", name: "Website + CRM + Chatbot", price: "from $97/mo" },
  { slug: "cold-outbound", name: "Cold Outbound Engine", price: "Custom" },
  { slug: "voice-agents", name: "AI Voice Agents", price: "Custom" },
  { slug: "seo-aeo", name: "SEO & AEO Automation", price: "Custom" },
  { slug: "lead-reactivation", name: "Lead Reactivation", price: "Custom" },
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

  const toggleService = (slug: string) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(slug)
        ? prev.services.filter((s) => s !== slug)
        : [...prev.services, slug],
    }))
  }

  const handleSubmit = async () => {
    try {
      await fetch("/api/lead-magnets/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "get-started", ...form }),
      })
    } catch {}
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-background">
        <div className="text-center max-w-lg px-4">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold">You&rsquo;re on the calendar!</h2>
          <p className="mt-4 text-muted-foreground">
            We received your request and will reach out within 24 hours to confirm your strategy call.
          </p>
          <p className="mt-2 text-muted-foreground">
            Check your email at <strong>{form.email}</strong> for confirmation.
          </p>
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
        <div className="mb-10 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${step >= s ? "bg-[#DC2626] text-white" : "bg-muted text-muted-foreground"}`}>
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              <div className={`h-px flex-1 ${s < 3 ? (step > s ? "bg-[#DC2626]" : "bg-border") : "hidden"}`} />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
          {/* Step 1: Services */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-2">Which services interest you?</h2>
              <p className="text-sm text-muted-foreground mb-6">Select all that apply.</p>
              <div className="space-y-3">
                {SERVICES.map((service) => {
                  const selected = form.services.includes(service.slug)
                  return (
                    <button
                      key={service.slug}
                      onClick={() => toggleService(service.slug)}
                      className={`w-full flex items-center justify-between rounded-xl border-2 p-4 text-left transition ${selected ? "border-[#DC2626] bg-red-50" : "border-border hover:border-muted-foreground"}`}
                    >
                      <span className="font-medium text-foreground">{service.name}</span>
                      <span className="text-sm text-muted-foreground">{service.price}</span>
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={form.services.length === 0}
                className="mt-6 w-full rounded-lg bg-[#DC2626] py-3.5 font-semibold text-white disabled:opacity-50 hover:bg-[#B91C1C] transition flex items-center justify-center gap-2"
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
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Adam Wolfe"
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Company *</label>
                    <input
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="ACME Corp"
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Work Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.com"
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Website</label>
                  <input
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://yoursite.com"
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Industry</label>
                    <select
                      value={form.industry}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
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
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Primary Goal</label>
                  <textarea
                    value={form.goal}
                    onChange={(e) => setForm({ ...form, goal: e.target.value })}
                    rows={3}
                    placeholder="e.g. Book 20 demos per month, reactivate old leads, build a cold email system..."
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626] resize-none"
                  />
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
                  className="flex-1 rounded-lg bg-[#DC2626] py-3 font-semibold text-white disabled:opacity-50 hover:bg-[#B91C1C] transition flex items-center justify-center gap-2"
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

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-semibold text-foreground hover:bg-secondary transition"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 rounded-lg bg-[#DC2626] py-3 font-semibold text-white hover:bg-[#B91C1C] transition"
                >
                  Submit & Book Call
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
