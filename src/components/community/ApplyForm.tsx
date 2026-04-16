"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Calendar,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  QUESTIONS,
  ALLOWED_COUNTRIES,
  CAL_LINK,
  getStepIntro,
  getCalendarIntro,
  getContactIntro,
  getCalendarOwner,
  type CountryCode,
} from "@/lib/collective-application"

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Step layout (VP-flip model):
 *   0  Welcome screen
 *   1  Name + email (minimal friction)
 *   2–6 Qualifying questions (QUESTIONS[0..4])
 *   7  Contact details (phone, zip, country, SMS consent)
 *   —  After step 7 submission → calendar phase
 */
const TOTAL_FORM_STEPS = QUESTIONS.length + 2 // welcome(0) + name(1) + questions(5) + contact(7) = 8 steps total

type Phase = "form" | "submitting" | "calendar" | "done" | "error"

const slideVariants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ApplyForm() {
  const [phase, setPhase] = useState<Phase>("form")
  const [step, setStep] = useState(0)

  // Step 1 — Name + email
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")

  // Steps 2-6 — Qualification answers
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [otherText, setOtherText] = useState("")
  const [selected, setSelected] = useState<string | null>(null)

  // Step 7 — Contact details
  const [phone, setPhone] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [country, setCountry] = useState<CountryCode>("US")
  const [smsFollowup, setSmsFollowup] = useState(false)
  const [smsPromo, setSmsPromo] = useState(false)

  // Scoring result (set after submit)
  const [scoreResult, setScoreResult] = useState<{
    normalizedScore: number
    tier: "hot" | "warm" | "cold"
  } | null>(null)

  // Pre-computed score for contact-step intro (computed locally after last question)
  const [preScore, setPreScore] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)

  /* ---- Progress bar ---- */
  const progress =
    phase === "calendar" || phase === "done"
      ? 100
      : step === 0
        ? 0
        : Math.round((step / (TOTAL_FORM_STEPS - 1)) * 100)

  /* ---- Validation ---- */
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

  /* ---- Navigation ---- */
  const scrollTop = () =>
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" })

  const goBack = () => {
    if (step > 0) {
      setSelected(null)
      setOtherText("")
      setStep((s) => s - 1)
      scrollTop()
    }
  }

  /* ---- Compute pre-score after last question for contact step intro ---- */
  const computePreScore = useCallback(
    (ans: Record<string, string>) => {
      let raw = 0
      for (const q of QUESTIONS) {
        const opt = q.options.find((o) => o.value === ans[q.id])
        if (opt) raw += opt.points
      }
      setPreScore(Math.round((raw / 15) * 100))
    },
    []
  )

  /* ---- Question selection ---- */
  const handleSelect = useCallback(
    (questionId: string, value: string) => {
      setSelected(value)
      const updated = { ...answers, [questionId]: value }
      setAnswers(updated)

      // If "other" selected on a question with allowOther, don't auto-advance
      const question = QUESTIONS.find((q) => q.id === questionId)
      if (question?.allowOther && value === "other") {
        return
      }

      const questionIndex = step - 2 // steps 2..6 map to QUESTIONS[0..4]
      const isLastQuestion = questionIndex === QUESTIONS.length - 1

      setTimeout(() => {
        setSelected(null)
        if (isLastQuestion) {
          computePreScore(updated)
          setStep((s) => s + 1) // advance to contact details
          scrollTop()
        } else {
          setStep((s) => s + 1)
          scrollTop()
        }
      }, 350)
    },
    [answers, step, computePreScore]
  )

  /* ---- "Other" continue handler ---- */
  const handleOtherContinue = useCallback(() => {
    const questionIndex = step - 2
    const isLastQuestion = questionIndex === QUESTIONS.length - 1
    setSelected(null)
    if (isLastQuestion) {
      computePreScore(answers)
      setStep((s) => s + 1)
      scrollTop()
    } else {
      setStep((s) => s + 1)
      scrollTop()
    }
  }, [answers, step, computePreScore])

  /* ---- Form submission (after contact details) ---- */
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
          source: "apply-form",
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

  /* ---- Cal.com embed loader ---- */
  useEffect(() => {
    if (phase !== "calendar" || typeof window === "undefined") return

    const initCal = () => {
      const Cal = (window as unknown as Record<string, unknown>).Cal as ((...args: unknown[]) => void) & { ns: Record<string, (...args: unknown[]) => void> }
      if (!Cal) return

      Cal("init", "aoc", { origin: "https://app.cal.com" })

      Cal.ns.aoc("inline", {
        elementOrSelector: "#cal-inline-aoc",
        config: {
          layout: "month_view",
          useSlotsViewOnSmallScreen: "true",
          theme: "light",
          name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim().toLowerCase(),
        },
        calLink: CAL_LINK,
      })

      Cal.ns.aoc("ui", {
        theme: "light",
        cssVarsPerTheme: { light: { "cal-brand": "#981B1B" } },
        hideEventTypeDetails: true,
        layout: "month_view",
      })

      Cal.ns.aoc("on", {
        action: "bookingSuccessful",
        callback: () => setPhase("done"),
      })
    }

    if ((window as unknown as Record<string, unknown>).Cal) {
      initCal()
    } else {
      const script = document.createElement("script")
      script.src = "https://app.cal.com/embed/embed.js"
      script.async = true
      script.onload = initCal
      document.head.appendChild(script)
    }
  }, [phase, firstName, lastName, email])

  /* ---- Current question (steps 2-6) ---- */
  const questionIndex = step - 2
  const currentQuestion =
    questionIndex >= 0 && questionIndex < QUESTIONS.length
      ? QUESTIONS[questionIndex]
      : null

  /* ======================================================================== */
  /*  RENDER — Done phase                                                      */
  /* ======================================================================== */

  if (phase === "done") {
    return (
      <div className="min-h-[60vh] sm:min-h-[70vh] flex flex-col items-center justify-center px-5 sm:px-6 py-12 text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-crimson/10 flex items-center justify-center mb-5 sm:mb-6">
          <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-crimson" />
        </div>
        <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl text-[#1A1A1A] mb-3 sm:mb-4">
          Application received.
        </h2>
        <p className="text-base sm:text-lg text-[#737373] max-w-md mb-2">
          A real operator will review your application within 24 hours.
        </p>
        <p className="text-sm text-[#999] max-w-md">
          Your call will be held via Google Meet — please plan to join from a
          computer or tablet, as we&apos;ll be sharing our screen during the
          conversation.
        </p>
      </div>
    )
  }

  /* ======================================================================== */
  /*  RENDER — Submitting phase                                                */
  /* ======================================================================== */

  if (phase === "submitting") {
    return (
      <div className="min-h-[60vh] sm:min-h-[70vh] flex flex-col items-center justify-center px-5 sm:px-6">
        <Loader2 className="w-8 h-8 text-crimson animate-spin mb-4" />
        <p className="text-[#737373] font-mono text-sm uppercase tracking-wider">
          Submitting your application...
        </p>
      </div>
    )
  }

  /* ======================================================================== */
  /*  RENDER — Error phase                                                     */
  /* ======================================================================== */

  if (phase === "error") {
    return (
      <div className="min-h-[60vh] sm:min-h-[70vh] flex flex-col items-center justify-center px-5 sm:px-6 text-center">
        <p className="text-sm text-red-600 mb-4">
          Something went wrong. Please try again.
        </p>
        <button
          onClick={() => {
            setPhase("form")
            setStep(7) // go back to contact details
          }}
          className="inline-flex items-center gap-2 rounded-md bg-crimson text-white px-6 py-3.5 text-sm font-bold uppercase tracking-wider hover:bg-crimson-dark active:bg-crimson-dark transition-all min-h-[48px]"
        >
          Go Back
        </button>
      </div>
    )
  }

  /* ======================================================================== */
  /*  RENDER — Calendar phase                                                  */
  /* ======================================================================== */

  if (phase === "calendar" && scoreResult) {
    const calOwner = getCalendarOwner(scoreResult.tier)
    const intro = getCalendarIntro(firstName.trim(), scoreResult.tier, answers)

    return (
      <div className="min-h-[60vh] flex flex-col">
        {/* Progress bar — 100% */}
        <div className="w-full h-1 bg-[#E3E3E3] sticky top-16 z-10">
          <div className="h-full bg-crimson w-full" />
        </div>

        <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 sm:py-10">
          <div className="w-full max-w-2xl text-center mb-6">
            <div className="inline-flex items-center gap-2 text-crimson mb-3">
              <Calendar className="w-5 h-5" />
              <span className="text-xs font-mono uppercase tracking-wider">
                Book your call with {calOwner}
              </span>
            </div>
            <h2 className="font-playfair text-2xl sm:text-3xl text-[#1A1A1A] mb-3">
              {intro.heading}
            </h2>
            <p className="text-[#737373] text-sm sm:text-base max-w-lg mx-auto">
              {intro.subheading}
            </p>
            <p className="text-xs text-[#999] mt-3">
              This will be a 45-minute virtual discovery call. We&apos;ll cover
              your goals, how our approach works, and whether it&apos;s the right
              fit.
            </p>
          </div>

          {/* Cal.com inline widget */}
          <div
            id="cal-inline-aoc"
            className="w-full max-w-2xl rounded-lg overflow-hidden bg-white"
            style={{ minWidth: "320px", height: "660px", overflow: "auto" }}
          />
        </div>
      </div>
    )
  }

  /* ======================================================================== */
  /*  RENDER — Form phase                                                      */
  /* ======================================================================== */

  return (
    <div
      ref={containerRef}
      className="min-h-[60vh] sm:min-h-[70vh] flex flex-col"
    >
      {/* Progress bar */}
      <div className="w-full h-1 bg-[#E3E3E3] sticky top-16 z-10">
        <div
          className="h-full bg-crimson transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-4 sm:py-12 md:py-20">
        <div className="w-full max-w-2xl">
          {/* Back + step counter */}
          {step > 0 && (
            <div className="flex items-center justify-between mb-3 sm:mb-6">
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 text-xs sm:text-sm text-[#737373] hover:text-[#1A1A1A] active:text-[#1A1A1A] transition-colors min-h-[36px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#737373]">
                {step} / {TOTAL_FORM_STEPS - 1}
              </p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ---- Step 0: Welcome ---- */}
            {step === 0 && (
              <motion.div
                key="welcome"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-5 sm:space-y-6"
              >
                <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl text-[#1A1A1A]">
                  Apply to the AI Operator Collective
                </h2>
                <p className="text-[#737373] text-base sm:text-lg max-w-lg">
                  3 minutes. No pitch call scheduled automatically. A real
                  operator reads this within 24 hours.
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center justify-center gap-2 rounded-md bg-crimson text-white px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-crimson-dark active:bg-crimson-dark shadow-[0_8px_24px_-4px_rgba(153,27,27,0.35)] transition-all min-h-[52px]"
                >
                  Apply Now
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* ---- Step 1: Name + Email ---- */}
            {step === 1 && (
              <motion.div
                key="name-email"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-5 sm:space-y-6"
              >
                <div>
                  <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl text-[#1A1A1A] mb-2">
                    Let&apos;s get started
                  </h2>
                  <p className="text-[#737373] text-sm sm:text-base">
                    Just your name and email — we&apos;ll personalize the rest of
                    the application for you.
                  </p>
                </div>

                <div className="space-y-4 w-full max-w-md">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="apply-first"
                        className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#737373] mb-2"
                      >
                        First name
                      </label>
                      <input
                        id="apply-first"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3.5 text-base text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson transition-colors"
                        placeholder="First"
                        autoComplete="given-name"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="apply-last"
                        className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#737373] mb-2"
                      >
                        Last name
                      </label>
                      <input
                        id="apply-last"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3.5 text-base text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson transition-colors"
                        placeholder="Last"
                        autoComplete="family-name"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="apply-email"
                      className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#737373] mb-2"
                    >
                      Email address
                    </label>
                    <input
                      id="apply-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3.5 text-base text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson transition-colors"
                      placeholder="you@example.com"
                      autoComplete="email"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && canAdvanceName) setStep(2)
                      }}
                    />
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    disabled={!canAdvanceName}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 rounded-md px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all min-h-[52px]",
                      canAdvanceName
                        ? "bg-crimson text-white hover:bg-crimson-dark active:bg-crimson-dark shadow-[0_8px_24px_-4px_rgba(153,27,27,0.35)]"
                        : "bg-[#E3E3E3] text-[#999] cursor-not-allowed"
                    )}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ---- Steps 2-6: Qualifying Questions ---- */}
            {currentQuestion && (
              <motion.div
                key={`q-${currentQuestion.id}`}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                {/* Personalized intro */}
                <p className="text-crimson text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                  {getStepIntro(questionIndex, firstName.trim(), answers)}
                </p>

                <h2 className="font-playfair text-lg sm:text-2xl md:text-3xl text-[#1A1A1A] mb-2 sm:mb-3 leading-snug">
                  {currentQuestion.question}
                </h2>

                <p className="text-[#737373] text-xs sm:text-sm mb-4 sm:mb-6">
                  {currentQuestion.description}
                </p>

                <div
                  className={cn(
                    "grid gap-2 sm:gap-3",
                    currentQuestion.options.length > 5
                      ? "grid-cols-1 sm:grid-cols-2"
                      : "grid-cols-1 sm:grid-cols-2"
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
                          "group relative text-left rounded-md border px-3 py-3 sm:p-4 transition-all active:scale-[0.98]",
                          isSelected
                            ? "border-crimson bg-crimson/5 shadow-[0_0_0_1px_rgba(153,27,27,0.3)]"
                            : "border-[#E3E3E3] bg-white hover:border-crimson/30 hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.06)]"
                        )}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <span
                            className={cn(
                              "flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-mono font-bold border transition-colors",
                              isSelected
                                ? "bg-crimson text-white border-crimson"
                                : "bg-[#F5F5F5] text-[#737373] border-[#E3E3E3] group-hover:border-crimson/30"
                            )}
                          >
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="text-[13px] sm:text-base text-[#1A1A1A] leading-snug">
                            {option.label}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* "Other" text input (shown when "other" is selected) */}
                {currentQuestion.allowOther &&
                  answers[currentQuestion.id] === "other" && (
                    <div className="mt-4 space-y-3">
                      <input
                        type="text"
                        value={otherText}
                        onChange={(e) => setOtherText(e.target.value)}
                        className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3.5 text-base text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson transition-colors"
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
                          "w-full sm:w-auto flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-bold uppercase tracking-wider transition-all min-h-[48px]",
                          otherText.trim().length > 0
                            ? "bg-crimson text-white hover:bg-crimson-dark"
                            : "bg-[#E3E3E3] text-[#999] cursor-not-allowed"
                        )}
                      >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
              </motion.div>
            )}

            {/* ---- Step 7: Contact Details ---- */}
            {step === QUESTIONS.length + 2 && (
              <motion.div
                key="contact"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-5 sm:space-y-6"
              >
                {/* Personalized intro */}
                <div>
                  <p className="text-crimson text-xs sm:text-sm font-medium mb-2">
                    {getContactIntro(firstName.trim(), preScore)}
                  </p>
                  <h2 className="font-playfair text-xl sm:text-2xl md:text-3xl text-[#1A1A1A] mb-1">
                    Contact Details
                  </h2>
                  <p className="text-[#737373] text-xs sm:text-sm">
                    On the next page, you&apos;ll be able to book a call with our
                    team.{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-crimson transition-colors"
                    >
                      View Terms of Service and Privacy Policy
                    </a>
                  </p>
                </div>

                <div className="space-y-4 w-full max-w-md">
                  <div>
                    <label
                      htmlFor="apply-phone"
                      className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#737373] mb-2"
                    >
                      Phone number *
                    </label>
                    <input
                      id="apply-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3.5 text-base text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson transition-colors"
                      placeholder="(555) 555-5555"
                      autoComplete="tel"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="apply-zip"
                        className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#737373] mb-2"
                      >
                        Zip / Postal code *
                      </label>
                      <input
                        id="apply-zip"
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3.5 text-base text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson transition-colors"
                        placeholder="90210"
                        autoComplete="postal-code"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="apply-country"
                        className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#737373] mb-2"
                      >
                        Country *
                      </label>
                      <select
                        id="apply-country"
                        value={country}
                        onChange={(e) =>
                          setCountry(e.target.value as CountryCode)
                        }
                        className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3.5 text-base text-[#1A1A1A] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson transition-colors appearance-none"
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
                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={smsFollowup}
                        onChange={() => setSmsFollowup(!smsFollowup)}
                        className="sr-only peer"
                      />
                      <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors peer-checked:bg-crimson peer-checked:border-crimson border-[#D1D1D1] group-hover:border-crimson/50 peer-focus-visible:ring-2 peer-focus-visible:ring-crimson/50">
                        {smsFollowup && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </span>
                      <span className="text-xs text-[#737373] leading-snug">
                        You agree to receive automated follow-up and reminder SMS
                        messages with varying frequency. Text and data rates may
                        apply. Reply STOP to end. Text HELP for help.{" "}
                        <a
                          href="/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Terms of Service and Privacy Policy
                        </a>
                        *
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={smsPromo}
                        onChange={() => setSmsPromo(!smsPromo)}
                        className="sr-only peer"
                      />
                      <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors peer-checked:bg-crimson peer-checked:border-crimson border-[#D1D1D1] group-hover:border-crimson/50 peer-focus-visible:ring-2 peer-focus-visible:ring-crimson/50">
                        {smsPromo && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <span className="text-xs text-[#737373] leading-snug">
                        You agree to receive promotional SMS messages with varying
                        frequency. Text and data rates may apply. Reply STOP to
                        end. Text HELP for help.{" "}
                        <a
                          href="/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Terms of Service and Privacy Policy
                        </a>
                        *
                      </span>
                    </label>
                  </div>

                  <button
                    onClick={submitApplication}
                    disabled={!canAdvanceContact}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 rounded-md px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all min-h-[52px]",
                      canAdvanceContact
                        ? "bg-crimson text-white hover:bg-crimson-dark active:bg-crimson-dark shadow-[0_8px_24px_-4px_rgba(153,27,27,0.35)]"
                        : "bg-[#E3E3E3] text-[#999] cursor-not-allowed"
                    )}
                  >
                    Submit &amp; Book Your Call
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
