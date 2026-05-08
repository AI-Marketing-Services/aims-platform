"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Check, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Calendar } from "lucide-react"
import { toast } from "sonner"

// Calendly URL for the AIMS sales team. Override per environment via
// NEXT_PUBLIC_CALENDLY_AIMS_INTAKE; falls back to the Ryan calendar that's
// already wired into the AOC apply flow so we don't ship a dead link if
// the new env var isn't set.
const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_AIMS_INTAKE ??
  process.env.NEXT_PUBLIC_CALENDLY_RYAN ??
  "https://calendly.com/ryan-breakthroughclosing"

interface CalBookingProps {
  name: string
  email: string
  company: string
  goal: string
  services: string[]
  utm: {
    source?: string | null
    medium?: string | null
    campaign?: string | null
  }
  onBooked: () => void
}

function CalBooking({ name, email, company, goal, services, utm, onBooked }: CalBookingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fallback, setFallback] = useState(false)
  const onBookedRef = useRef(onBooked)

  // Keep the latest onBooked callback in a ref so we don't re-init the
  // Calendly widget every time the parent re-renders (which would wipe
  // any in-progress booking state).
  useEffect(() => {
    onBookedRef.current = onBooked
  }, [onBooked])

  // Build a Calendly URL with `a1=...` style answers + UTMs so the booking
  // lands in Calendly with full context. The widget's prefill object only
  // covers name/email — everything else has to ride on the URL.
  const buildBookingUrl = useCallback(() => {
    const params = new URLSearchParams({
      hide_event_type_details: "1",
      hide_gdpr_banner: "1",
      // Visual tokens to match site palette without overriding Calendly's
      // light theme.
      primary_color: "C4972A",
    })
    if (utm.source) params.set("utm_source", utm.source)
    if (utm.medium) params.set("utm_medium", utm.medium)
    if (utm.campaign) params.set("utm_campaign", utm.campaign)
    return `${CALENDLY_URL}${CALENDLY_URL.includes("?") ? "&" : "?"}${params.toString()}`
  }, [utm.source, utm.medium, utm.campaign])

  // Widget setup — load script, init inline widget with prefill, listen
  // for the booking-complete postMessage from Calendly.
  useEffect(() => {
    if (typeof window === "undefined") return
    const container = containerRef.current
    if (!container) return

    const url = buildBookingUrl()
    let cancelled = false

    const initCalendly = () => {
      const Calendly = (
        window as unknown as {
          Calendly?: { initInlineWidget: (opts: Record<string, unknown>) => void }
        }
      ).Calendly
      if (!Calendly || cancelled) return false
      // Clear the skeleton state only once we're ready to inject.
      container.innerHTML = ""
      Calendly.initInlineWidget({
        url,
        parentElement: container,
        prefill: {
          name,
          email,
          customAnswers: {
            // a1/a2 map to the first/second custom questions on the
            // Calendly event. If the linked event doesn't have those
            // questions configured, Calendly silently ignores them — safe.
            a1: company,
            a2: services.join(", "),
            a3: goal,
          },
        },
      })
      return true
    }

    // Listen for the booking-complete postMessage so we can fire the
    // conversion event + advance the flow.
    const onMessage = (e: MessageEvent) => {
      const data = e.data as { event?: string }
      if (typeof data === "object" && data?.event === "calendly.event_scheduled") {
        onBookedRef.current()
      }
    }
    window.addEventListener("message", onMessage)

    // Load widget.js if not present already (ApplyForm may have loaded it).
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://assets.calendly.com/assets/external/widget.js"]'
    )
    if (existing) {
      if ((window as unknown as { Calendly?: unknown }).Calendly) {
        initCalendly()
      } else {
        existing.addEventListener("load", initCalendly, { once: true })
      }
    } else {
      const script = document.createElement("script")
      script.src = "https://assets.calendly.com/assets/external/widget.js"
      script.async = true
      script.onload = initCalendly
      script.onerror = () => {
        if (!cancelled) setFallback(true)
      }
      document.head.appendChild(script)

      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://assets.calendly.com/assets/external/widget.css"
      document.head.appendChild(link)
    }

    // Failsafe — if the widget hasn't initialised after 8 seconds (corp
    // network blocking, ad blocker, slow 3G), drop to the new-tab fallback
    // so the user can still book.
    const failsafe = setTimeout(() => {
      if (cancelled) return
      const Calendly = (window as unknown as { Calendly?: unknown }).Calendly
      if (!Calendly) setFallback(true)
    }, 8000)

    return () => {
      cancelled = true
      clearTimeout(failsafe)
      window.removeEventListener("message", onMessage)
    }
  }, [buildBookingUrl, name, email, company, goal, services])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-900/20 mb-4">
          <Check className="h-6 w-6 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Request submitted!</h2>
        <p className="mt-2 text-muted-foreground">
          Pick a time that works best for your strategy call below.
        </p>
      </div>

      {fallback ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Calendar className="w-10 h-10 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Your calendar is one click away</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Pick a time that works for you — opens Calendly in a new tab.
          </p>
          <a
            href={buildBookingUrl()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-primary/90 transition-colors"
          >
            Open the calendar
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="calendly-inline-widget rounded-sm border border-border overflow-hidden bg-white"
          style={{ minWidth: "320px", height: "720px" }}
        >
          {/* Skeleton until the widget injects */}
          <div className="flex flex-col items-center justify-center h-full p-6">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">
              Loading available times…
            </p>
            <p className="text-xs text-muted-foreground">
              This usually takes a few seconds.
            </p>
          </div>
        </div>
      )}
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

  // UTM/attribution from query string. We capture once on mount so the
  // values survive any state churn during the form steps and ride along
  // to both the intake API and the Calendly URL for end-to-end attribution.
  const [utm] = useState(() => ({
    source: searchParams.get("utm_source"),
    medium: searchParams.get("utm_medium"),
    campaign: searchParams.get("utm_campaign"),
    ref: searchParams.get("ref"),
  }))

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
  const [booked, setBooked] = useState(false)
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
        body: JSON.stringify({
          ...form,
          utmSource: utm.source ?? undefined,
          utmMedium: utm.medium ?? undefined,
          utmCampaign: utm.campaign ?? undefined,
          source: utm.ref ?? undefined,
        }),
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

      // Fire a generic intake-converted event so analytics tools (Vercel
      // Analytics, GA via gtag, Plausible, IDPixel) can attribute. Each
      // tool no-ops if not loaded — safe to call all of them.
      try {
        const w = window as unknown as {
          va?: (event: string, props?: Record<string, unknown>) => void
          gtag?: (cmd: string, action: string, props?: Record<string, unknown>) => void
          plausible?: (event: string, opts?: { props?: Record<string, unknown> }) => void
        }
        const props = {
          form: "get-started",
          services: form.services.join(","),
          utm_source: utm.source ?? undefined,
          utm_campaign: utm.campaign ?? undefined,
        }
        w.va?.("event", { name: "intake_submitted", ...props })
        w.gtag?.("event", "intake_submitted", props)
        w.plausible?.("intake_submitted", { props })
      } catch {
        // Analytics is best-effort — never block the funnel on it.
      }
    } catch {
      setSubmitError("Network error. Please check your connection and try again.")
      toast.error("Network error. Please try again.")
      setSubmitting(false)
    }
  }

  const handleBooked = useCallback(() => {
    setBooked(true)
    // Same multi-tool conversion fire as above. The booking event is the
    // primary KPI — capture it everywhere we have an analytics surface.
    try {
      const w = window as unknown as {
        va?: (event: string, props?: Record<string, unknown>) => void
        gtag?: (cmd: string, action: string, props?: Record<string, unknown>) => void
        plausible?: (event: string, opts?: { props?: Record<string, unknown> }) => void
      }
      const props = {
        form: "get-started",
        utm_source: utm.source ?? undefined,
        utm_campaign: utm.campaign ?? undefined,
      }
      w.va?.("event", { name: "consult_booked", ...props })
      w.gtag?.("event", "consult_booked", props)
      w.plausible?.("consult_booked", { props })
    } catch {
      // ignore analytics errors
    }
  }, [utm.source, utm.campaign])

  if (submitted) {
    return (
      <div className="min-h-screen pt-20 bg-background">
        <div className="container mx-auto max-w-2xl px-4 py-16">
          {booked ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-900/20 mb-4">
                <Check className="h-7 w-7 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-3">You&rsquo;re booked.</h2>
              <p className="text-muted-foreground mb-2">
                We just sent a confirmation to <span className="font-medium text-foreground">{form.email}</span> with
                everything you need to prep.
              </p>
              <p className="text-sm text-muted-foreground">
                Check your inbox (and spam folder, just in case).
              </p>
            </div>
          ) : (
            <CalBooking
              name={form.name}
              email={form.email}
              company={form.company}
              goal={form.goal}
              services={form.services}
              utm={{ source: utm.source, medium: utm.medium, campaign: utm.campaign }}
              onBooked={handleBooked}
            />
          )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
