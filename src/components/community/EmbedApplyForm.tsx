"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, Calendar, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  QUESTIONS,
  ALLOWED_COUNTRIES,
  getCalendarUrl,
  getStepIntro,
  getCalendarIntro,
  getContactIntro,
  getCalendarOwner,
  type CountryCode,
} from "@/lib/collective-application"

/**
 * Embeddable version of the AI Operator Collective application form.
 * Designed to work inside an iframe on Mighty Networks or any external page.
 *
 * Embed via: <iframe src="https://aioperatorcollective.com/embed/apply" />
 *
 * Same VP-flip flow as ApplyForm but with embed-friendly sizing / no chrome.
 */

const TOTAL_FORM_STEPS = QUESTIONS.length + 2

type Phase = "form" | "submitting" | "calendar" | "done" | "error"

export function EmbedApplyForm() {
  const [phase, setPhase] = useState<Phase>("form")
  const [step, setStep] = useState(0)

  // Step 1
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")

  // Steps 2-6
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [otherText, setOtherText] = useState("")
  const [selected, setSelected] = useState<string | null>(null)

  // Step 7
  const [phone, setPhone] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [country, setCountry] = useState<CountryCode>("US")
  const [smsFollowup, setSmsFollowup] = useState(false)
  const [smsPromo, setSmsPromo] = useState(false)

  // Results
  const [scoreResult, setScoreResult] = useState<{
    normalizedScore: number
    tier: "hot" | "warm" | "cold"
  } | null>(null)
  const [preScore, setPreScore] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)

  const progress =
    phase === "calendar" || phase === "done"
      ? 100
      : step === 0
        ? 0
        : Math.round((step / (TOTAL_FORM_STEPS - 1)) * 100)

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const canAdvanceName =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    emailValid

  const canAdvanceContact =
    phone.replace(/\D/g, "").length >= 10 &&
    zipCode.trim().length >= 3 &&
    smsFollowup &&
    smsPromo

  const computePreScore = useCallback((ans: Record<string, string>) => {
    let raw = 0
    for (const q of QUESTIONS) {
      const opt = q.options.find((o) => o.value === ans[q.id])
      if (opt) raw += opt.points
    }
    setPreScore(Math.round((raw / 15) * 100))
  }, [])

  const handleSelect = useCallback(
    (questionId: string, value: string) => {
      setSelected(value)
      const updated = { ...answers, [questionId]: value }
      setAnswers(updated)

      const question = QUESTIONS.find((q) => q.id === questionId)
      if (question?.allowOther && value === "other") return

      const questionIndex = step - 2
      const isLastQuestion = questionIndex === QUESTIONS.length - 1

      setTimeout(() => {
        setSelected(null)
        if (isLastQuestion) {
          computePreScore(updated)
        }
        setStep((s) => s + 1)
      }, 350)
    },
    [answers, step, computePreScore]
  )

  const handleOtherContinue = useCallback(() => {
    const questionIndex = step - 2
    const isLastQuestion = questionIndex === QUESTIONS.length - 1
    setSelected(null)
    if (isLastQuestion) computePreScore(answers)
    setStep((s) => s + 1)
  }, [answers, step, computePreScore])

  const submitApplication = async () => {
    setPhase("submitting")
    try {
      const res = await fetch("/api/community/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          zipCode: zipCode.trim(),
          country,
          smsConsentFollowup: smsFollowup,
          smsConsentPromo: smsPromo,
          answers,
          backgroundOther:
            answers.background === "other" ? otherText.trim() : undefined,
          source: "embed-apply-form",
        }),
      })

      if (!res.ok) throw new Error("Submission failed")
      const data = await res.json()
      setScoreResult({ normalizedScore: data.score, tier: data.tier })
      setPhase("calendar")
    } catch {
      setPhase("error")
    }
  }

  useEffect(() => {
    if (phase !== "calendar" || typeof window === "undefined") return

    const container = document.getElementById("cal-inline-embed-aoc")
    if (!container) return

    const tier = scoreResult?.tier ?? "cold"
    const bookingUrl = getCalendarUrl(tier)

    container.innerHTML = ""
    container.setAttribute("data-url", bookingUrl)

    const initCalendly = () => {
      const Calendly = (window as unknown as { Calendly?: { initInlineWidget: (opts: Record<string, unknown>) => void } }).Calendly
      if (!Calendly) return
      const params = new URLSearchParams({
        hide_event_type_details: "0",
        hide_gdpr_banner: "1",
        background_color: "ffffff",
        text_color: "1A1A1A",
        primary_color: "981B1B",
      }).toString()
      const url = `${bookingUrl}${bookingUrl.includes("?") ? "&" : "?"}${params}`
      Calendly.initInlineWidget({
        url,
        parentElement: container,
        prefill: {
          name: `${firstName.trim()} ${lastName.trim()}`,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
        },
      })
    }

    const onMessage = (e: MessageEvent) => {
      const data = e.data as { event?: string }
      if (typeof data === "object" && data?.event === "calendly.event_scheduled") {
        setPhase("done")
      }
    }
    window.addEventListener("message", onMessage)

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://assets.calendly.com/assets/external/widget.js"]'
    )
    if (existing) {
      if ((window as unknown as { Calendly?: unknown }).Calendly) initCalendly()
      else existing.addEventListener("load", initCalendly, { once: true })
    } else {
      const script = document.createElement("script")
      script.src = "https://assets.calendly.com/assets/external/widget.js"
      script.async = true
      script.onload = initCalendly
      document.head.appendChild(script)

      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://assets.calendly.com/assets/external/widget.css"
      document.head.appendChild(link)
    }

    return () => window.removeEventListener("message", onMessage)
  }, [phase, firstName, lastName, email, scoreResult])

  const goBack = () => {
    if (step > 0) {
      setSelected(null)
      setOtherText("")
      setStep((s) => s - 1)
    }
  }

  const startedRef = useRef(false)
  const savePartialApplication = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true
    void fetch("/api/community/apply/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        source: "apply-form-embed",
      }),
      keepalive: true,
    }).catch(() => {})
  }, [firstName, lastName, email])

  const advanceFromName = useCallback(() => {
    if (!canAdvanceName) return
    savePartialApplication()
    setStep(2)
  }, [canAdvanceName, savePartialApplication])

  const questionIndex = step - 2
  const currentQuestion =
    questionIndex >= 0 && questionIndex < QUESTIONS.length
      ? QUESTIONS[questionIndex]
      : null

  /* ---- Done ---- */
  if (phase === "done") {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center px-5 py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-[#981B1B]/10 flex items-center justify-center mb-5">
          <CheckCircle2 className="w-7 h-7 text-[#981B1B]" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] mb-3">
          Application received.
        </h2>
        <p className="text-base text-[#737373] max-w-md mb-2">
          A real operator will review your application within 24 hours.
        </p>
        <p className="text-xs text-[#999] max-w-md">
          Your call will be held via Google Meet — plan to join from a computer or
          tablet.
        </p>
      </div>
    )
  }

  /* ---- Submitting ---- */
  if (phase === "submitting") {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center px-5">
        <Loader2 className="w-8 h-8 text-[#981B1B] animate-spin mb-4" />
        <p className="text-[#737373] font-mono text-sm uppercase tracking-wider">
          Submitting your application...
        </p>
      </div>
    )
  }

  /* ---- Error ---- */
  if (phase === "error") {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center px-5 text-center">
        <p className="text-sm text-red-600 mb-4">
          Something went wrong. Please try again.
        </p>
        <button
          onClick={() => {
            setPhase("form")
            setStep(7)
          }}
          className="inline-flex items-center gap-2 rounded-md bg-[#981B1B] text-white px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-[#7a1616] transition-all"
        >
          Go Back
        </button>
      </div>
    )
  }

  /* ---- Calendar ---- */
  if (phase === "calendar" && scoreResult) {
    const calOwner = getCalendarOwner(scoreResult.tier)
    const intro = getCalendarIntro(firstName.trim(), scoreResult.tier, answers)

    return (
      <div className="min-h-[500px] flex flex-col bg-white">
        <div className="w-full h-1 bg-[#E3E3E3]">
          <div className="h-full bg-[#981B1B] w-full" />
        </div>

        <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6">
          <div className="w-full max-w-xl text-center mb-5">
            <div className="inline-flex items-center gap-2 text-[#981B1B] mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-mono uppercase tracking-wider">
                Book your call with {calOwner}
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl text-[#1A1A1A] mb-2">
              {intro.heading}
            </h2>
            <p className="text-[#737373] text-sm max-w-md mx-auto">
              {intro.subheading}
            </p>
          </div>

          <div
            id="cal-inline-embed-aoc"
            className="calendly-inline-widget w-full max-w-xl rounded-lg overflow-hidden bg-white"
            style={{ minWidth: "320px", height: "660px" }}
          />
        </div>
      </div>
    )
  }

  /* ---- Form ---- */
  return (
    <div ref={containerRef} className="min-h-[500px] flex flex-col bg-white">
      {/* Progress bar */}
      <div className="w-full h-1 bg-[#E3E3E3]">
        <div
          className="h-full bg-[#981B1B] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        <div className="w-full max-w-xl">
          {/* Back + step counter */}
          {step > 0 && (
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 text-xs sm:text-sm text-[#737373] hover:text-[#1A1A1A] transition-colors min-h-[36px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#737373]">
                {step} / {TOTAL_FORM_STEPS - 1}
              </p>
            </div>
          )}

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A]">
                Apply to the AI Operator Collective
              </h2>
              <p className="text-[#737373] text-sm sm:text-base">
                3 minutes. No pitch call scheduled automatically. A real operator
                reads this within 24 hours.
              </p>
              <button
                onClick={() => setStep(1)}
                className="flex items-center justify-center gap-2 rounded-md bg-[#981B1B] text-white px-6 py-3.5 text-sm font-bold uppercase tracking-wider hover:bg-[#7a1616] shadow-[0_8px_24px_-4px_rgba(152,27,27,0.35)] transition-all"
              >
                Apply Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 1: Name + Email */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl text-[#1A1A1A] mb-1">
                  Let&apos;s get started
                </h2>
                <p className="text-[#737373] text-xs sm:text-sm">
                  Just your name and email — we&apos;ll personalize the rest.
                </p>
              </div>

              <div className="space-y-3 w-full max-w-md">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="embed-first"
                      className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#737373] mb-1.5"
                    >
                      First name
                    </label>
                    <input
                      id="embed-first"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3 text-base text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-[#981B1B] focus:ring-1 focus:ring-[#981B1B] transition-colors"
                      placeholder="First"
                      autoComplete="given-name"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="embed-last"
                      className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#737373] mb-1.5"
                    >
                      Last name
                    </label>
                    <input
                      id="embed-last"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3 text-base text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-[#981B1B] focus:ring-1 focus:ring-[#981B1B] transition-colors"
                      placeholder="Last"
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="embed-email"
                    className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#737373] mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="embed-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3 text-base text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-[#981B1B] focus:ring-1 focus:ring-[#981B1B] transition-colors"
                    placeholder="you@example.com"
                    autoComplete="email"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canAdvanceName) advanceFromName()
                    }}
                  />
                </div>

                <button
                  onClick={advanceFromName}
                  disabled={!canAdvanceName}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-bold uppercase tracking-wider transition-all mt-1",
                    canAdvanceName
                      ? "bg-[#981B1B] text-white hover:bg-[#7a1616] shadow-[0_8px_24px_-4px_rgba(152,27,27,0.35)]"
                      : "bg-[#E3E3E3] text-[#999] cursor-not-allowed"
                  )}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Steps 2-6: Questions */}
          {currentQuestion && (
            <div>
              <p className="text-[#981B1B] text-xs sm:text-sm font-medium mb-2">
                {getStepIntro(questionIndex, firstName.trim(), answers)}
              </p>

              <h2 className="font-serif text-lg sm:text-xl text-[#1A1A1A] mb-1.5 sm:mb-2 leading-snug">
                {currentQuestion.question}
              </h2>

              <p className="text-[#737373] text-xs mb-4">
                {currentQuestion.description}
              </p>

              <div
                className={cn(
                  "grid gap-2",
                  currentQuestion.options.length > 5
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-1"
                )}
              >
                {currentQuestion.options.map((option, i) => {
                  const isSelected =
                    selected === option.value ||
                    answers[currentQuestion.id] === option.value
                  return (
                    <button
                      key={option.value}
                      onClick={() =>
                        handleSelect(currentQuestion.id, option.value)
                      }
                      className={cn(
                        "group relative text-left rounded-md border px-3.5 py-2.5 sm:px-4 sm:py-3 transition-all active:scale-[0.98]",
                        isSelected
                          ? "border-[#981B1B] bg-[#981B1B]/5 shadow-[0_0_0_1px_rgba(152,27,27,0.3)]"
                          : "border-[#E3E3E3] bg-white hover:border-[#981B1B]/30 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border transition-colors",
                            isSelected
                              ? "bg-[#981B1B] text-white border-[#981B1B]"
                              : "bg-[#F5F5F5] text-[#737373] border-[#E3E3E3] group-hover:border-[#981B1B]/30"
                          )}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-sm text-[#1A1A1A] leading-snug">
                          {option.label}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {currentQuestion.allowOther &&
                answers[currentQuestion.id] === "other" && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3 text-base text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-[#981B1B] focus:ring-1 focus:ring-[#981B1B] transition-colors"
                      placeholder="Tell us about your background..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && otherText.trim().length > 0)
                          handleOtherContinue()
                      }}
                    />
                    <button
                      onClick={handleOtherContinue}
                      disabled={otherText.trim().length === 0}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all",
                        otherText.trim().length > 0
                          ? "bg-[#981B1B] text-white hover:bg-[#7a1616]"
                          : "bg-[#E3E3E3] text-[#999] cursor-not-allowed"
                      )}
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
            </div>
          )}

          {/* Step 7: Contact Details */}
          {step === QUESTIONS.length + 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-[#981B1B] text-xs sm:text-sm font-medium mb-1">
                  {getContactIntro(firstName.trim(), preScore)}
                </p>
                <h2 className="font-serif text-xl sm:text-2xl text-[#1A1A1A] mb-1">
                  Contact Details
                </h2>
                <p className="text-[#737373] text-xs">
                  On the next page, you&apos;ll book a call with our team.{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-[#981B1B] transition-colors"
                  >
                    View Terms of Service
                  </a>
                </p>
              </div>

              <div className="space-y-3 w-full max-w-md">
                <div>
                  <label
                    htmlFor="embed-phone"
                    className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#737373] mb-1.5"
                  >
                    Phone number *
                  </label>
                  <input
                    id="embed-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3 text-base text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-[#981B1B] focus:ring-1 focus:ring-[#981B1B] transition-colors"
                    placeholder="(555) 555-5555"
                    autoComplete="tel"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="embed-zip"
                      className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#737373] mb-1.5"
                    >
                      Zip / Postal code *
                    </label>
                    <input
                      id="embed-zip"
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3 text-base text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-[#981B1B] focus:ring-1 focus:ring-[#981B1B] transition-colors"
                      placeholder="90210"
                      autoComplete="postal-code"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="embed-country"
                      className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#737373] mb-1.5"
                    >
                      Country *
                    </label>
                    <select
                      id="embed-country"
                      value={country}
                      onChange={(e) =>
                        setCountry(e.target.value as CountryCode)
                      }
                      className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3 text-base text-[#1A1A1A] focus:outline-none focus:border-[#981B1B] focus:ring-1 focus:ring-[#981B1B] transition-colors appearance-none"
                    >
                      {ALLOWED_COUNTRIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SMS Consent */}
                <div className="space-y-2.5 pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={smsFollowup}
                      onChange={() => setSmsFollowup(!smsFollowup)}
                      className="sr-only peer"
                    />
                    <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors peer-checked:bg-[#981B1B] peer-checked:border-[#981B1B] border-[#D1D1D1] group-hover:border-[#981B1B]/50 peer-focus-visible:ring-2 peer-focus-visible:ring-[#981B1B]/50">
                      {smsFollowup && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="text-[11px] text-[#737373] leading-snug">
                      You agree to receive automated follow-up and reminder SMS
                      messages. Text and data rates may apply. Reply STOP to end.
                      Text HELP for help.*
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={smsPromo}
                      onChange={() => setSmsPromo(!smsPromo)}
                      className="sr-only peer"
                    />
                    <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors peer-checked:bg-[#981B1B] peer-checked:border-[#981B1B] border-[#D1D1D1] group-hover:border-[#981B1B]/50 peer-focus-visible:ring-2 peer-focus-visible:ring-[#981B1B]/50">
                      {smsPromo && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="text-[11px] text-[#737373] leading-snug">
                      You agree to receive promotional SMS messages. Text and data
                      rates may apply. Reply STOP to end. Text HELP for help.*
                    </span>
                  </label>
                </div>

                <button
                  onClick={submitApplication}
                  disabled={!canAdvanceContact}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-bold uppercase tracking-wider transition-all mt-1",
                    canAdvanceContact
                      ? "bg-[#981B1B] text-white hover:bg-[#7a1616] shadow-[0_8px_24px_-4px_rgba(152,27,27,0.35)]"
                      : "bg-[#E3E3E3] text-[#999] cursor-not-allowed"
                  )}
                >
                  Submit &amp; Book Your Call
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
