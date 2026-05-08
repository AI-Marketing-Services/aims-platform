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
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  QUESTIONS,
  ALLOWED_COUNTRIES,
  getCalendarUrl,
  getStepIntro,
  getContactIntro,
  getOutcomeMessage,
  shouldShowCalendar,
  type CountryCode,
  type RoutingTier,
} from "@/lib/collective-application"

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Step layout:
 *   1               Name + email (minimal friction — first thing users see)
 *   2..(n+1)        Qualifying questions (QUESTIONS[0..n-1])
 *   n+2             Contact details (phone, zip, country, SMS consent)
 *   —               After contact submission → calendar phase
 *
 * Step 0 (welcome) was removed — visitors who clicked "Apply Now" from the
 * marketing page were greeted with a second "Apply Now" button, which felt
 * like a dead screen. Now they land straight on name+email.
 */
const TOTAL_FORM_STEPS = QUESTIONS.length + 2 // name(1) + questions(2..n+1) + contact(n+2)

/**
 * Application phases:
 *   form        — they're filling out the questions
 *   submitting  — POST in flight to /api/community/apply
 *   calendar    — green tier; show the Calendly embed (book the call)
 *   review      — yellow tier; "we'll review and follow up" message
 *   nurture     — red tier; "may not be the right room yet, here are
 *                 resources" + waitlist
 *   done        — booking confirmed (calendar.event_scheduled fired)
 *   error       — irrecoverable submit failure (very rare)
 */
type Phase =
  | "form"
  | "submitting"
  | "calendar"
  | "review"
  | "nurture"
  | "done"
  | "error"

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
  // Start on name+email (step 1). Welcome screen (legacy step 0) removed —
  // it was a redundant "Apply Now" button after the visitor already clicked
  // Apply Now on the marketing page.
  const [step, setStep] = useState(1)

  // Step 1 — Name + email
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")

  // Steps 2..(n+1) — Qualification answers.
  //
  // Single-select: answer is a string (option value).
  // Multi-select:  answer is a string[] of selected option values.
  // Text question: answer is a string (the typed answer).
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  // "Other" inline text for questions with allowOther — keyed per-question.
  const [otherTextById, setOtherTextById] = useState<Record<string, string>>({})
  // Free-text follow-ups that always show after a question (followUp.whenValue==="*").
  const [followUpTextById, setFollowUpTextById] = useState<Record<string, string>>({})
  // Single-select transient highlight state (still used for the auto-advance flash).
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
    routingTier: RoutingTier
  } | null>(null)

  // Pre-computed score for contact-step intro (computed locally after last question)
  const [preScore, setPreScore] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)

  /* ---- Preload Calendly widget.js on mount ----
     The biggest source of "blank calendar" complaints is the latency of
     loading widget.js the moment a visitor reaches the calendar step.
     In incognito (no cache), this can take 6-8 seconds — past our
     failsafe timeout. Loading the script while the visitor is still
     filling out the questionnaire means by the time they submit, the
     widget is already cached and renders instantly. */
  useEffect(() => {
    if (typeof window === "undefined") return
    if (
      document.querySelector(
        'script[src="https://assets.calendly.com/assets/external/widget.js"]'
      )
    ) {
      return
    }
    const script = document.createElement("script")
    script.src = "https://assets.calendly.com/assets/external/widget.js"
    script.async = true
    document.head.appendChild(script)
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://assets.calendly.com/assets/external/widget.css"
    document.head.appendChild(link)
  }, [])

  /* ---- Progress bar ---- */
  const progress =
    phase === "calendar" || phase === "done"
      ? 100
      : Math.round(((step - 1) / (TOTAL_FORM_STEPS - 1)) * 100)

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
    if (step > 1) {
      setSelected(null)
      setStep((s) => s - 1)
      scrollTop()
    }
  }

  // Fire once per session: captures name + email so we can follow up with
  // anyone who bounces before completing the full application.
  const startedRef = useRef(false)
  const savePartialApplication = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true
    const body = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      source: "apply-form",
    }
    void fetch("/api/community/apply/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {
      // Intentionally swallow — partial capture is best-effort.
    })
  }, [firstName, lastName, email])

  const advanceFromName = useCallback(() => {
    if (!canAdvanceName) return
    savePartialApplication()
    setStep(2)
    scrollTop()
  }, [canAdvanceName, savePartialApplication])

  /* ---- Compute pre-score after last question for contact step intro ----
   *
   * Lightweight client-side preview only — the authoritative score is
   * recalculated server-side in calculateScore(). We only sum single-
   * select option points here so multi-select arrays + free-text answers
   * don't break the math. Good enough to drive the personalised intro
   * copy on the contact step.
   */
  const computePreScore = useCallback(
    (ans: Record<string, string | string[]>) => {
      let raw = 0
      for (const q of QUESTIONS) {
        const v = ans[q.id]
        if (typeof v !== "string") continue
        const opt = q.options.find((o) => o.value === v)
        if (opt) raw += opt.points
      }
      setPreScore(Math.round((raw / 15) * 100))
    },
    []
  )

  /* ---- Advance helper (last question → contact, else → next question) ---- */
  const advanceQuestion = useCallback(
    (latestAnswers?: Record<string, string | string[]>) => {
      const questionIndex = step - 2
      const isLastQuestion = questionIndex === QUESTIONS.length - 1
      setSelected(null)
      if (isLastQuestion) {
        computePreScore(latestAnswers ?? answers)
      }
      setStep((s) => s + 1)
      scrollTop()
    },
    [answers, step, computePreScore]
  )

  /* ---- Single-select option click (auto-advances after a brief flash) ---- */
  const handleSingleSelect = useCallback(
    (questionId: string, value: string) => {
      setSelected(value)
      const updated = { ...answers, [questionId]: value }
      setAnswers(updated)

      // If "other" selected on a question with allowOther, don't auto-advance —
      // the inline text input needs to capture the operator's free-text first.
      const question = QUESTIONS.find((q) => q.id === questionId)
      if (question?.allowOther && value === "other") {
        return
      }

      // Brief delay so the selected state is visible before we transition.
      setTimeout(() => advanceQuestion(updated), 350)
    },
    [answers, advanceQuestion]
  )

  /* ---- Multi-select toggle (no auto-advance — Continue button drives it) ---- */
  const toggleMultiSelect = useCallback(
    (questionId: string, value: string) => {
      setAnswers((prev) => {
        const existing = prev[questionId]
        const arr = Array.isArray(existing) ? existing : []
        const next = arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value]
        return { ...prev, [questionId]: next }
      })
    },
    []
  )

  /* ---- Text-question commit (sets answers[id] = trimmed text, advances) ---- */
  const commitTextAnswer = useCallback(
    (questionId: string, text: string) => {
      const updated = { ...answers, [questionId]: text.trim() }
      setAnswers(updated)
      advanceQuestion(updated)
    },
    [answers, advanceQuestion]
  )

  /* ---- "Continue" handler for any question type that doesn't auto-advance ---- */
  const handleContinue = useCallback(() => {
    advanceQuestion()
  }, [advanceQuestion])

  /* ---- Form submission (after contact details) ----
     CRITICAL: the calendar must ALWAYS render. Booking is the
     conversion — the questionnaire is secondary qualifying data. If the
     save fails for any reason (rate limit, validation, transient DB
     hiccup, network), we still advance to the calendar phase so the
     visitor can book. The Calendly webhook will create the Deal from
     the booking itself; backfilling questionnaire data happens via a
     silent retry below.

     submittingRef guards re-entry against fast double-clicks (React's
     re-render unmounts the button on phase change, but a synchronous
     double-click can still fire this twice in the same microtask). */
  const submittingRef = useRef(false)
  const [saveWarning, setSaveWarning] = useState<string | null>(null)

  const buildPayload = () => ({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    zipCode: zipCode.trim(),
    country,
    smsConsentFollowup: smsFollowup,
    smsConsentPromo: smsPromo,
    answers,
    // "Other" free-text per question (current_role, industries, etc.) and
    // any followUp text that always shows for a question. Server-side
    // validators accept either map; keys are question ids.
    otherTextById,
    followUpTextById,
    source: "apply-form",
  })

  // Background retry: if the initial save failed, we keep trying for a
  // couple of minutes so the questionnaire data eventually lands without
  // ever blocking the visitor's booking flow.
  const retrySaveInBackground = async (payload: ReturnType<typeof buildPayload>) => {
    const delays = [4000, 12000, 30000, 60000]
    for (const ms of delays) {
      await new Promise((r) => setTimeout(r, ms))
      try {
        const res = await fetch("/api/community/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          console.info("Apply save retry succeeded")
          return
        }
      } catch {
        // keep trying
      }
    }
  }

  const submitApplication = async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSaveWarning(null)
    setPhase("submitting")

    const payload = buildPayload()
    // Default score (cold) so the form still routes if save fails. We
    // intentionally route a save-failure to the calendar (rather than
    // nurture) so a transient save bug never blocks an applicant from
    // booking — the team can clean up data afterwards.
    let resolvedScore: {
      normalizedScore: number
      tier: "hot" | "warm" | "cold"
      routingTier: RoutingTier
    } = {
      normalizedScore: 0,
      tier: "cold",
      routingTier: "green",
    }
    let saveFailed = false
    let serverMessage: string | null = null

    try {
      const res = await fetch("/api/community/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        resolvedScore = {
          normalizedScore: data.score,
          tier: data.tier,
          routingTier: data.routingTier ?? "green",
        }
      } else {
        saveFailed = true
        try {
          const errBody = await res.json()
          if (typeof errBody?.error === "string") serverMessage = errBody.error
        } catch {
          // not JSON
        }
        if (res.status === 429) {
          serverMessage =
            "We couldn't save your details right now (too many requests), but your call is booked from the calendar below."
        }
        console.error("Apply save failed:", res.status, serverMessage)
      }
    } catch (err) {
      saveFailed = true
      console.error("Apply save failed (network):", err)
      serverMessage =
        "We couldn't save your details right now, but you can still book your call below."
    }

    if (saveFailed) {
      setSaveWarning(
        serverMessage ??
          "We couldn't save your details right now, but you can still book your call below."
      )
      // Fire-and-forget retry so the data eventually lands.
      void retrySaveInBackground(payload)
    }

    setScoreResult(resolvedScore)
    // Branch on routing tier per Jess's spec: only green-tier applicants
    // see the Calendly embed. Yellow gets a "we'll review and follow up"
    // message; Red gets a nurture / waitlist screen with resources.
    if (shouldShowCalendar(resolvedScore.routingTier)) {
      setPhase("calendar")
    } else if (resolvedScore.routingTier === "yellow") {
      setPhase("review")
    } else {
      setPhase("nurture")
    }
    submittingRef.current = false
  }

  /* ---- Calendly inline embed ----
     Calendly d-links (team round-robin URLs like /d/xxx-yyy-zzz) serve with
     X-Frame-Options: DENY for direct iframe embedding — only their widget.js
     can render them inline (it bypasses XFO via a JSON API).

     Strategy: load widget.js, give it 4 seconds to render an iframe inside
     our container. If the script never loads (ad-blocker), or loads but
     fails to inject an iframe (XFO / network / config error), swap the
     container with a giant "Open calendar in new tab" button so the visitor
     ALWAYS has a path to book — we never lose a lead to a blank box. */
  const [calendarFallback, setCalendarFallback] = useState(false)

  useEffect(() => {
    if (phase !== "calendar" || typeof window === "undefined") return

    setCalendarFallback(false)
    const container = document.getElementById("cal-inline-aoc")
    if (!container) return

    const tier = scoreResult?.tier ?? "cold"
    const bookingUrl = getCalendarUrl(tier)

    const initCalendly = () => {
      const Calendly = (
        window as unknown as {
          Calendly?: { initInlineWidget: (opts: Record<string, unknown>) => void }
        }
      ).Calendly
      if (!Calendly) return false
      // Clear the loading text only once the widget is actually ready to
      // inject — avoids the previous bug where we wiped the container on
      // mount and showed nothing if init failed.
      container.innerHTML = ""
      const params = new URLSearchParams({
        hide_event_type_details: "1",
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
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
        },
      })
      return true
    }

    // Booking-complete listener — redirect to next-steps page.
    const onMessage = (e: MessageEvent) => {
      const data = e.data as { event?: string }
      if (
        typeof data === "object" &&
        data?.event === "calendly.event_scheduled"
      ) {
        setPhase("done")
        const query = new URLSearchParams({
          email: email.trim().toLowerCase(),
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        }).toString()
        setTimeout(() => {
          window.location.href = `/apply/next-steps?${query}`
        }, 600)
      }
    }
    window.addEventListener("message", onMessage)

    // Load widget.js if not yet present.
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
      script.onerror = () => setCalendarFallback(true)
      document.head.appendChild(script)

      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://assets.calendly.com/assets/external/widget.css"
      document.head.appendChild(link)
    }

    // Failsafe timeout: if no iframe rendered after 10s, surface the
    // clickthrough fallback. 10s is conservative — incognito + cold cache
    // + slow networks can take 6-8s. Catches ad-blocker / XFO / config
    // failure modes without false-positive-firing on a slow first paint.
    const timeoutId = window.setTimeout(() => {
      const renderedIframe = container.querySelector("iframe")
      if (!renderedIframe) {
        setCalendarFallback(true)
      }
    }, 10000)

    return () => {
      window.removeEventListener("message", onMessage)
      window.clearTimeout(timeoutId)
    }
  }, [phase, firstName, lastName, email, scoreResult])

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

  // The "error" phase is no longer reachable from submitApplication (every
  // submit advances to the calendar so visitors can always book). Keeping
  // a minimal fallback here for any edge case we missed — it deep-links
  // straight to Calendly so even this path doesn't lose the lead.
  if (phase === "error") {
    return (
      <div className="min-h-[60vh] sm:min-h-[70vh] flex flex-col items-center justify-center px-5 sm:px-6 text-center">
        <p className="text-base font-semibold text-[#1A1A1A] mb-3">
          Something hiccupped — but you can still book.
        </p>
        <a
          href={getCalendarUrl(scoreResult?.tier ?? "cold")}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-crimson text-white px-6 py-3.5 text-sm font-bold uppercase tracking-wider hover:bg-crimson-dark transition-all min-h-[48px]"
        >
          Open the calendar
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    )
  }

  /* ======================================================================== */
  /*  RENDER — Review (yellow) phase                                           */
  /* ======================================================================== */
  //
  // Yellow tier per Jess spec: applicant has potential but doesn't clear all
  // green-tier gates (e.g. 5-9 hours/week, mid-strength answers). We don't
  // expose Calendly — we tell them we'll review and reach back out. The
  // application is fully saved on the API side; the team picks them up
  // from the admin CRM.

  if (phase === "review" && scoreResult) {
    const outcome = getOutcomeMessage(firstName, "yellow")
    return (
      <div className="min-h-[60vh] sm:min-h-[70vh] flex flex-col items-center justify-center px-5 sm:px-6 py-12 text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-crimson/10 flex items-center justify-center mb-5 sm:mb-6">
          <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-crimson" />
        </div>
        <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl text-[#1A1A1A] mb-3 sm:mb-4">
          {outcome.heading}
        </h2>
        <p className="text-base sm:text-lg text-[#737373] max-w-xl mb-6 leading-relaxed">
          {outcome.body}
        </p>
        {saveWarning && (
          <p className="mt-2 text-xs text-[#999] max-w-md">
            (Note: there was a hiccup saving your application. We&apos;ve
            queued it to retry — no action needed on your side.)
          </p>
        )}
      </div>
    )
  }

  /* ======================================================================== */
  /*  RENDER — Nurture (red) phase                                             */
  /* ======================================================================== */
  //
  // Red tier per Jess spec: applicant tripped a hard gate (0-4 hrs/wk,
  // refused outreach, refused sales conversations, or "not ready to invest").
  // We don't reject — we offer free resources + waitlist instead.

  if (phase === "nurture" && scoreResult) {
    const outcome = getOutcomeMessage(firstName, "red")
    return (
      <div className="min-h-[60vh] sm:min-h-[70vh] flex flex-col items-center justify-center px-5 sm:px-6 py-12 text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-5 sm:mb-6">
          <Users className="w-7 h-7 sm:w-8 sm:h-8 text-[#737373]" />
        </div>
        <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl text-[#1A1A1A] mb-3 sm:mb-4">
          {outcome.heading}
        </h2>
        <p className="text-base sm:text-lg text-[#737373] max-w-xl mb-6 leading-relaxed">
          {outcome.body}
        </p>
        {outcome.cta && (
          <a
            href={outcome.cta.href}
            className="inline-flex items-center gap-2 rounded-md bg-crimson text-white px-7 py-3 text-sm font-bold uppercase tracking-wider hover:bg-crimson-dark transition-colors"
          >
            {outcome.cta.label}
            <ArrowRight className="w-4 h-4" />
          </a>
        )}
      </div>
    )
  }

  /* ======================================================================== */
  /*  RENDER — Calendar phase                                                  */
  /* ======================================================================== */

  if (phase === "calendar" && scoreResult) {
    return (
      <div className="min-h-[60vh] flex flex-col">
        {/* Progress bar — 100% */}
        <div className="w-full h-1 bg-[#E3E3E3] sticky top-16 z-10">
          <div className="h-full bg-crimson w-full" />
        </div>

        <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 sm:py-10">

          {/* ── ACTION HEADLINE — leads the page ── */}
          <div className="w-full max-w-2xl text-center mb-6">
            <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl text-[#1A1A1A] mb-3 leading-[1.1]">
              Book Your Consult Below
            </h2>
            <p className="text-[#4B5563] text-base sm:text-lg max-w-xl mx-auto">
              Your application stood out. Now let&apos;s see if we&apos;re the right fit for each other.
            </p>
          </div>

          {/* Soft warning if the questionnaire save failed. Visitor still
              proceeds to the calendar — booking takes priority. */}
          {saveWarning && (
            <div className="w-full max-w-2xl mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <strong className="font-semibold">Heads up:</strong> {saveWarning}
            </div>
          )}

          {/* ── CALENDLY WIDGET — directly below headline ── */}
          <div className="w-full max-w-2xl mb-4">
            {calendarFallback ? (
              <div className="w-full rounded-lg border border-[#E3E3E3] bg-white p-8 text-center">
                <Calendar className="w-10 h-10 text-crimson mx-auto mb-4" />
                <h3 className="font-playfair text-xl text-[#1A1A1A] mb-2">
                  Your calendar is one click away
                </h3>
                <p className="text-sm text-[#4B5563] mb-6 max-w-sm mx-auto">
                  Pick a time that works for you — opens Calendly in a new tab.
                </p>
                <a
                  href={getCalendarUrl(scoreResult.tier)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-crimson px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-[0_8px_24px_-4px_rgba(153,27,27,0.35)] hover:bg-crimson-dark transition-colors"
                >
                  Open the calendar
                  <ArrowRight className="w-4 h-4" />
                </a>
                <p className="mt-4 text-xs text-[#9CA3AF]">
                  Already booked? <a href="/apply/next-steps" className="underline">Continue here</a>
                </p>
              </div>
            ) : (
              <div
                id="cal-inline-aoc"
                className="calendly-inline-widget w-full rounded-lg overflow-hidden bg-white border border-[#E3E3E3]"
                style={{
                  minWidth: "320px",
                  height: "min(1100px, calc(100vh - 160px))",
                  minHeight: "900px",
                }}
              >
                {/* Calendar-skeleton loading state — looks like a real
                    calendar materialising rather than an error. The widget
                    replaces this innerHTML once it injects its iframe. */}
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <Loader2 className="w-8 h-8 text-crimson animate-spin mb-4" />
                  <p className="text-sm font-medium text-[#1A1A1A] mb-1">
                    Loading available times…
                  </p>
                  <p className="text-xs text-[#737373] mb-4">
                    This usually takes a few seconds.
                  </p>
                  <a
                    className="text-xs text-crimson font-semibold underline"
                    href={getCalendarUrl(scoreResult.tier)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Or open the calendar in a new tab →
                  </a>
                </div>
              </div>
            )}
            <p className="mt-3 text-center text-xs text-[#737373]">
              Trouble booking?{" "}
              <a
                className="text-crimson font-semibold underline"
                href={getCalendarUrl(scoreResult.tier)}
                target="_blank"
                rel="noreferrer"
              >
                Open the calendar in a new tab
              </a>
              .
            </p>
          </div>

          {/* ── COHORT SCARCITY NUDGE — below the calendar ── */}
          <div className="w-full max-w-2xl mb-6">
            <div className="rounded-lg border border-[#E3E3E3] bg-[#FAFAF7] px-5 py-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
              <span className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#737373]">
                <Calendar className="w-3.5 h-3.5 text-crimson shrink-0" />
                Next cohort opens Q2 2026
              </span>
              <span className="hidden sm:inline text-[#D1D1D1]">|</span>
              <span className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#737373]">
                <Users className="w-3.5 h-3.5 text-crimson shrink-0" />
                First cohort: limited to 10 members
              </span>
            </div>
          </div>

          {/* ── WHAT THIS CALL COVERS — below the calendar ── */}
          <div className="w-full max-w-2xl rounded-xl border border-[#E3E3E3] bg-white p-6 text-left">
            <h3 className="font-semibold text-[#1A1A1A] text-base sm:text-lg mb-2">
              AI Operator Collective Consult Call
            </h3>
            <p className="text-sm text-[#4B5563] leading-relaxed mb-3">
              45-minute virtual discovery call designed to have an open
              conversation about your goals and explore whether we&apos;re the
              right fit to work together. We&apos;ll cover:
            </p>
            <ul className="space-y-1.5 text-sm text-[#4B5563]">
              <li className="flex gap-2">
                <span className="text-crimson shrink-0">•</span>
                Who we are and how our approach works.
              </li>
              <li className="flex gap-2">
                <span className="text-crimson shrink-0">•</span>
                Your background, goals, and what you&apos;re hoping to build.
              </li>
              <li className="flex gap-2">
                <span className="text-crimson shrink-0">•</span>
                Investment expectations, cost overview, and potential ROI.
              </li>
              <li className="flex gap-2">
                <span className="text-crimson shrink-0">•</span>
                Whether this is the right time for you to start a business.
              </li>
              <li className="flex gap-2">
                <span className="text-crimson shrink-0">•</span>
                Mutual fit and what next steps could look like.
              </li>
            </ul>
          </div>

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
            {/* ---- Step 1: Name + Email (entry point) ---- */}
            {step === 1 && (
              <motion.div
                key="name-email"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-5 sm:space-y-6 text-center flex flex-col items-center"
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

                <div className="space-y-4 w-full max-w-md text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        if (e.key === "Enter" && canAdvanceName) advanceFromName()
                      }}
                    />
                  </div>

                  <button
                    onClick={advanceFromName}
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

            {/* ---- Steps 2..(n+1): Qualifying Questions ---- */}
            {currentQuestion && (() => {
              // Question type branches:
              //   - currentQuestion.text       → free-text textarea (e.g. "Why now?")
              //   - selection === "multi"      → multi-select toggles + Continue
              //   - default                    → single-select with auto-advance
              const isText = !!currentQuestion.text
              const isMulti = currentQuestion.selection === "multi"
              const currentAnswer = answers[currentQuestion.id]
              const selectedValues = Array.isArray(currentAnswer)
                ? currentAnswer
                : []
              const textAnswer =
                isText && typeof currentAnswer === "string" ? currentAnswer : ""
              const otherText = otherTextById[currentQuestion.id] ?? ""
              const followUpText = followUpTextById[currentQuestion.id] ?? ""
              const followUpAlwaysShown =
                currentQuestion.followUp?.whenValue === "*"
              const followUpMinLength = currentQuestion.followUp?.minLength ?? 0

              // Validation per question type — drives the Continue button.
              const textMinLength = currentQuestion.text?.minLength ?? 1
              const textValid = textAnswer.trim().length >= textMinLength
              const multiHasSelection = selectedValues.length > 0
              const otherRequired =
                currentQuestion.allowOther &&
                (isMulti
                  ? selectedValues.includes("other")
                  : currentAnswer === "other")
              const otherValid = !otherRequired || otherText.trim().length > 0
              const followUpValid =
                !followUpAlwaysShown ||
                followUpText.trim().length >= followUpMinLength
              const canAdvance = isText
                ? textValid
                : isMulti
                  ? multiHasSelection && otherValid && followUpValid
                  : false // single-select uses auto-advance, not the button

              return (
                <motion.div
                  key={`q-${currentQuestion.id}`}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className="text-center"
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

                  {/* ── Text-question branch (e.g. "Why now?") ── */}
                  {isText && (
                    <div className="space-y-3 text-left max-w-xl mx-auto">
                      <label className="sr-only" htmlFor="apply-text">
                        {currentQuestion.text?.question ?? "Your answer"}
                      </label>
                      <textarea
                        id="apply-text"
                        value={textAnswer}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [currentQuestion.id]: e.target.value,
                          }))
                        }
                        rows={4}
                        className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3.5 text-base text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson transition-colors resize-none"
                        placeholder="Type your answer here..."
                        autoFocus
                        onKeyDown={(e) => {
                          // Cmd/Ctrl+Enter to submit. Plain Enter inserts a
                          // newline so people can write multi-line answers.
                          if (
                            (e.metaKey || e.ctrlKey) &&
                            e.key === "Enter" &&
                            textValid
                          ) {
                            commitTextAnswer(currentQuestion.id, textAnswer)
                          }
                        }}
                      />
                      <p className="text-[11px] text-[#999] font-mono">
                        {textAnswer.trim().length} / min {textMinLength} characters
                      </p>
                      <button
                        onClick={() =>
                          commitTextAnswer(currentQuestion.id, textAnswer)
                        }
                        disabled={!textValid}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-bold uppercase tracking-wider transition-all min-h-[48px]",
                          textValid
                            ? "bg-crimson text-white hover:bg-crimson-dark"
                            : "bg-[#E3E3E3] text-[#999] cursor-not-allowed"
                        )}
                      >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* ── Option-grid branch (single + multi select) ── */}
                  {!isText && (
                    <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2">
                      {currentQuestion.options.map((option, i) => {
                        const isSelected = isMulti
                          ? selectedValues.includes(option.value)
                          : selected === option.value ||
                            currentAnswer === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={isMulti ? isSelected : undefined}
                            onClick={() =>
                              isMulti
                                ? toggleMultiSelect(
                                    currentQuestion.id,
                                    option.value,
                                  )
                                : handleSingleSelect(
                                    currentQuestion.id,
                                    option.value,
                                  )
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
                                  "flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-[10px] sm:text-xs font-mono font-bold border transition-colors",
                                  // Multi-select uses square checkbox-style;
                                  // single-select keeps the round letter chip.
                                  isMulti ? "rounded" : "rounded-full",
                                  isSelected
                                    ? "bg-crimson text-white border-crimson"
                                    : "bg-[#F5F5F5] text-[#737373] border-[#E3E3E3] group-hover:border-crimson/30"
                                )}
                              >
                                {isMulti && isSelected ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  String.fromCharCode(65 + i)
                                )}
                              </span>
                              <span className="text-[13px] sm:text-base text-[#1A1A1A] leading-snug">
                                {option.label}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* "Other" inline text (shown when "Other" is selected on
                      a question with allowOther). Works for both single
                      and multi select. */}
                  {!isText && otherRequired && (
                    <div className="mt-4 space-y-3 text-left max-w-xl mx-auto">
                      <label className="sr-only" htmlFor="apply-other">
                        Other — please specify
                      </label>
                      <input
                        id="apply-other"
                        type="text"
                        value={otherText}
                        onChange={(e) =>
                          setOtherTextById((prev) => ({
                            ...prev,
                            [currentQuestion.id]: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3.5 text-base text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson transition-colors"
                        placeholder="Tell us more..."
                        aria-label="Other — please specify"
                        autoFocus
                      />
                    </div>
                  )}

                  {/* Always-shown follow-up text (e.g. "Add any context") */}
                  {!isText && followUpAlwaysShown && (
                    <div className="mt-4 space-y-2 text-left max-w-xl mx-auto">
                      <label
                        htmlFor="apply-followup"
                        className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#737373]"
                      >
                        {currentQuestion.followUp?.question}
                      </label>
                      <textarea
                        id="apply-followup"
                        value={followUpText}
                        onChange={(e) =>
                          setFollowUpTextById((prev) => ({
                            ...prev,
                            [currentQuestion.id]: e.target.value,
                          }))
                        }
                        rows={3}
                        className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3.5 text-base text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson transition-colors resize-none"
                        placeholder="A sentence or two is plenty."
                      />
                      {followUpMinLength > 0 && (
                        <p className="text-[11px] text-[#999] font-mono">
                          {followUpText.trim().length} / min {followUpMinLength}
                          {" "}
                          characters
                        </p>
                      )}
                    </div>
                  )}

                  {/* Continue button — multi-select + allowOther single-select */}
                  {!isText &&
                    (isMulti ||
                      (currentQuestion.allowOther && otherRequired)) && (
                      <div className="mt-5">
                        <button
                          onClick={handleContinue}
                          disabled={!canAdvance}
                          className={cn(
                            "w-full sm:w-auto flex items-center justify-center gap-2 rounded-md px-8 py-3.5 text-sm font-bold uppercase tracking-wider transition-all min-h-[48px]",
                            canAdvance
                              ? "bg-crimson text-white hover:bg-crimson-dark"
                              : "bg-[#E3E3E3] text-[#999] cursor-not-allowed"
                          )}
                        >
                          Continue
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        {isMulti && !multiHasSelection && (
                          <p className="mt-2 text-[11px] text-[#999]">
                            Pick at least one to continue.
                          </p>
                        )}
                      </div>
                    )}
                </motion.div>
              )
            })()}

            {/* ---- Step 7: Contact Details ---- */}
            {step === QUESTIONS.length + 2 && (
              <motion.div
                key="contact"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-5 sm:space-y-6 text-center flex flex-col items-center"
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
                      Terms of Service
                    </a>
                    {" • "}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-crimson transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </p>
                </div>

                <div className="space-y-4 w-full max-w-md text-left">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          Terms of Service
                        </a>
                        {" • "}
                        <a
                          href="/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Privacy Policy
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
                          Terms of Service
                        </a>
                        {" • "}
                        <a
                          href="/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Privacy Policy
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
