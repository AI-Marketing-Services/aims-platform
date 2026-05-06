"use client"

import { useEffect, useMemo, useReducer, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react"

import type {
  AnswerMap,
  AnswerValue,
  LeadIdentity,
  QuizQuestion,
} from "@/lib/audits/types"

interface QuizClientProps {
  slug: string
  title: string
  subtitle: string | null
  ctaLabel: string
  questions: QuizQuestion[]
  collectEmail: boolean
  emailRequired: boolean
  success: {
    headline: string | null
    message: string | null
    cta: string | null
    ctaUrl: string | null
  }
  branding: {
    logoUrl: string | null
    brandColor: string
    accentColor: string | null
    ownerName: string | null
    ownerCompany: string | null
  }
}

type Stage = "welcome" | "question" | "lead" | "submitting" | "success" | "error"

interface State {
  stage: Stage
  questionIndex: number
  answers: AnswerMap
  lead: LeadIdentity
  errorMessage: string | null
  successOverride: {
    headline?: string | null
    message?: string | null
    cta?: string | null
    ctaUrl?: string | null
  } | null
}

type Action =
  | { type: "start" }
  | { type: "back" }
  | { type: "answer"; questionId: string; value: AnswerValue }
  | { type: "next" }
  | { type: "lead-update"; patch: Partial<LeadIdentity> }
  | { type: "go-lead" }
  | { type: "submit-start" }
  | { type: "submit-success"; payload: State["successOverride"] }
  | { type: "submit-error"; message: string }
  | { type: "reset-error" }

const initialState: State = {
  stage: "welcome",
  questionIndex: 0,
  answers: {},
  lead: {},
  errorMessage: null,
  successOverride: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start":
      return { ...state, stage: "question", questionIndex: 0 }
    case "back": {
      if (state.stage === "lead") {
        return { ...state, stage: "question" }
      }
      if (state.stage === "question" && state.questionIndex > 0) {
        return { ...state, questionIndex: state.questionIndex - 1 }
      }
      if (state.stage === "question" && state.questionIndex === 0) {
        return { ...state, stage: "welcome" }
      }
      return state
    }
    case "answer":
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.value },
      }
    case "next":
      return { ...state, questionIndex: state.questionIndex + 1 }
    case "go-lead":
      return { ...state, stage: "lead" }
    case "lead-update":
      return { ...state, lead: { ...state.lead, ...action.patch } }
    case "submit-start":
      return { ...state, stage: "submitting", errorMessage: null }
    case "submit-success":
      return { ...state, stage: "success", successOverride: action.payload }
    case "submit-error":
      return { ...state, stage: "error", errorMessage: action.message }
    case "reset-error":
      return { ...state, stage: state.stage === "error" ? "lead" : state.stage, errorMessage: null }
    default:
      return state
  }
}

function isAnswered(question: QuizQuestion, value: AnswerValue): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === "string") return value.trim().length > 0
  if (typeof value === "number") return Number.isFinite(value)
  if (Array.isArray(value)) return value.length > 0
  return false
}

function emailLooksValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function readUtmFromUrl(): {
  utm: { source?: string; medium?: string; campaign?: string }
  referer: string | undefined
} {
  if (typeof window === "undefined") return { utm: {}, referer: undefined }
  const params = new URLSearchParams(window.location.search)
  const get = (k: string) => params.get(k) ?? undefined
  return {
    utm: {
      source: get("utm_source"),
      medium: get("utm_medium"),
      campaign: get("utm_campaign"),
    },
    referer: document.referrer || undefined,
  }
}

export default function QuizClient(props: QuizClientProps) {
  const { questions } = props
  const [state, dispatch] = useReducer(reducer, initialState)
  const reduceMotion = useReducedMotion()

  const totalQuestions = questions.length
  const currentQuestion = questions[state.questionIndex]

  const progressPct = useMemo(() => {
    if (state.stage === "welcome") return 0
    if (state.stage === "lead") return 95
    if (state.stage === "submitting" || state.stage === "success") return 100
    if (totalQuestions === 0) return 0
    return Math.min(
      95,
      Math.round((state.questionIndex / totalQuestions) * 90) + 5,
    )
  }, [state.stage, state.questionIndex, totalQuestions])

  const isShowingProgress =
    state.stage === "question" || state.stage === "lead"

  function handleAnswer(question: QuizQuestion, value: AnswerValue) {
    dispatch({ type: "answer", questionId: question.id, value })
  }

  function advanceFromQuestion(
    question: QuizQuestion,
    overrideValue?: AnswerValue,
  ) {
    // Read the just-selected value when provided — closure-captured
    // state.answers can lag a click→advance dispatch by a render, which
    // makes auto-advance silently no-op the first tap on single_select.
    const value =
      overrideValue !== undefined ? overrideValue : state.answers[question.id]
    if (question.required && !isAnswered(question, value ?? null)) return
    if (state.questionIndex < totalQuestions - 1) {
      dispatch({ type: "next" })
    } else if (props.collectEmail) {
      dispatch({ type: "go-lead" })
    } else {
      void submit()
    }
  }

  async function submit(latestLead?: LeadIdentity) {
    const lead = latestLead ?? state.lead
    if (props.collectEmail && props.emailRequired) {
      if (!lead.email || !emailLooksValid(lead.email)) {
        dispatch({ type: "submit-error", message: "Please enter a valid email." })
        return
      }
    }

    // Verify all required questions are answered before sending.
    const missing = questions.find(
      (q) => q.required && !isAnswered(q, state.answers[q.id] ?? null),
    )
    if (missing) {
      dispatch({
        type: "submit-error",
        message: `"${missing.label}" is required.`,
      })
      return
    }

    dispatch({ type: "submit-start" })

    const { utm, referer } = readUtmFromUrl()

    try {
      const res = await fetch("/api/audits/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: props.slug,
          answers: state.answers,
          lead,
          utm,
          referer,
        }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        dispatch({
          type: "submit-error",
          message: data.error ?? "Something went wrong. Please try again.",
        })
        return
      }

      const data = (await res.json()) as {
        ok: boolean
        responseId: string
        success: {
          headline?: string | null
          message?: string | null
          cta?: string | null
          ctaUrl?: string | null
        }
      }
      dispatch({ type: "submit-success", payload: data.success ?? null })
    } catch {
      dispatch({
        type: "submit-error",
        message: "Network error. Please try again.",
      })
    }
  }

  const brandColor = props.branding.brandColor
  const operatorLabel =
    props.branding.ownerCompany ?? props.branding.ownerName ?? "this operator"

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      {/* Brand top bar + progress */}
      <div className="sticky top-0 z-10 bg-white border-b border-neutral-100">
        <div
          aria-hidden
          className="h-1 w-full"
          style={{ background: brandColor, opacity: 0.15 }}
        >
          {isShowingProgress && (
            <div
              className="h-1 transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%`, background: brandColor }}
            />
          )}
        </div>
        <div className="max-w-2xl mx-auto px-5 sm:px-6 py-3 flex items-center gap-3">
          {props.branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={props.branding.logoUrl}
              alt={operatorLabel}
              className="h-7 w-auto object-contain"
            />
          ) : (
            <span
              className="text-xs font-semibold tracking-[0.2em] uppercase"
              style={{ color: brandColor }}
            >
              AI Audit
            </span>
          )}
          <div className="ml-auto flex items-center gap-3">
            {state.stage === "question" && state.questionIndex > 0 && (
              <button
                type="button"
                onClick={() => dispatch({ type: "back" })}
                className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            {state.stage === "lead" && (
              <button
                type="button"
                onClick={() => dispatch({ type: "back" })}
                className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            {isShowingProgress && totalQuestions > 0 && (
              <span className="text-xs text-neutral-400 font-mono">
                {Math.min(state.questionIndex + 1, totalQuestions)}/{totalQuestions}
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 w-full">
        <div className="max-w-2xl mx-auto px-5 sm:px-6 py-12 sm:py-20">
          <AnimatePresence mode="wait" initial={false}>
            {state.stage === "welcome" && (
              <Screen key="welcome" reduceMotion={!!reduceMotion}>
                <WelcomeStage
                  title={props.title}
                  subtitle={props.subtitle}
                  ctaLabel={props.ctaLabel}
                  brandColor={brandColor}
                  onStart={() => dispatch({ type: "start" })}
                  hasQuestions={totalQuestions > 0}
                />
              </Screen>
            )}

            {state.stage === "question" && currentQuestion && (
              <Screen
                key={`q-${state.questionIndex}-${currentQuestion.id}`}
                reduceMotion={!!reduceMotion}
              >
                <QuestionStage
                  question={currentQuestion}
                  value={state.answers[currentQuestion.id] ?? null}
                  onChange={(v) => handleAnswer(currentQuestion, v)}
                  onAdvance={(overrideValue) =>
                    advanceFromQuestion(currentQuestion, overrideValue)
                  }
                  brandColor={brandColor}
                  isLast={
                    state.questionIndex === totalQuestions - 1 &&
                    !props.collectEmail
                  }
                />
              </Screen>
            )}

            {state.stage === "lead" && (
              <Screen key="lead" reduceMotion={!!reduceMotion}>
                <LeadStage
                  lead={state.lead}
                  onChange={(patch) =>
                    dispatch({ type: "lead-update", patch })
                  }
                  emailRequired={props.emailRequired}
                  brandColor={brandColor}
                  errorMessage={state.errorMessage}
                  onSubmit={(lead) => {
                    dispatch({ type: "lead-update", patch: lead })
                    void submit({ ...state.lead, ...lead })
                  }}
                />
              </Screen>
            )}

            {state.stage === "submitting" && (
              <Screen key="submitting" reduceMotion={!!reduceMotion}>
                <div className="text-center py-16">
                  <Loader2
                    className="w-10 h-10 mx-auto mb-6 animate-spin"
                    style={{ color: brandColor }}
                  />
                  <p className="text-lg text-neutral-700">
                    Reviewing your answers&hellip;
                  </p>
                </div>
              </Screen>
            )}

            {state.stage === "success" && (
              <Screen key="success" reduceMotion={!!reduceMotion}>
                <SuccessStage
                  headline={
                    state.successOverride?.headline ??
                    props.success.headline ??
                    "Thanks - we've got it."
                  }
                  message={
                    state.successOverride?.message ??
                    props.success.message ??
                    "We'll review your answers and follow up shortly."
                  }
                  ctaLabel={
                    state.successOverride?.cta ?? props.success.cta ?? null
                  }
                  ctaUrl={
                    state.successOverride?.ctaUrl ??
                    props.success.ctaUrl ??
                    null
                  }
                  brandColor={brandColor}
                />
              </Screen>
            )}

            {state.stage === "error" && (
              <Screen key="error" reduceMotion={!!reduceMotion}>
                <div className="text-center py-12">
                  <p className="text-base text-red-600 mb-6">
                    {state.errorMessage ?? "Something went wrong."}
                  </p>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "reset-error" })}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium border border-neutral-300 hover:border-neutral-900 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </Screen>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="py-6 px-5 sm:px-6 text-center">
        <p className="text-xs text-neutral-400">
          Powered by{" "}
          <span className="font-medium text-neutral-600">{operatorLabel}</span>
        </p>
      </footer>
    </div>
  )
}

function Screen({
  children,
  reduceMotion,
}: {
  children: React.ReactNode
  reduceMotion: boolean
}) {
  if (reduceMotion) {
    return <div>{children}</div>
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}

function WelcomeStage({
  title,
  subtitle,
  ctaLabel,
  brandColor,
  onStart,
  hasQuestions,
}: {
  title: string
  subtitle: string | null
  ctaLabel: string
  brandColor: string
  onStart: () => void
  hasQuestions: boolean
}) {
  return (
    <div className="text-center">
      <span
        className="inline-block text-xs font-semibold tracking-[0.2em] uppercase mb-6"
        style={{ color: brandColor }}
      >
        AI Audit
      </span>
      <h1 className="text-4xl sm:text-5xl font-semibold leading-tight mb-5 text-neutral-900">
        {title}
      </h1>
      {subtitle ? (
        <p className="text-lg text-neutral-600 mb-10 max-w-xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      ) : (
        <div className="mb-10" />
      )}
      <button
        type="button"
        onClick={onStart}
        disabled={!hasQuestions}
        className="inline-flex items-center gap-2 px-8 py-4 rounded-md font-semibold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        style={{ background: brandColor }}
      >
        {ctaLabel}
        <ArrowRight className="w-4 h-4" />
      </button>
      {!hasQuestions && (
        <p className="mt-6 text-sm text-neutral-400">
          This audit isn&apos;t available yet.
        </p>
      )}
    </div>
  )
}

function QuestionStage({
  question,
  value,
  onChange,
  onAdvance,
  brandColor,
  isLast,
}: {
  question: QuizQuestion
  value: AnswerValue
  onChange: (v: AnswerValue) => void
  onAdvance: (overrideValue?: AnswerValue) => void
  brandColor: string
  isLast: boolean
}) {
  const answered = isAnswered(question, value)
  const canAdvance = !question.required || answered

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (canAdvance) onAdvance()
    }
  }

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-semibold leading-snug mb-2 text-neutral-900">
        {question.label}
        {question.required && (
          <span className="ml-1 text-base align-top" style={{ color: brandColor }}>
            *
          </span>
        )}
      </h2>
      {question.helper && (
        <p className="text-sm text-neutral-500 mb-6">{question.helper}</p>
      )}
      {!question.helper && <div className="mb-6" />}

      {question.type === "single_select" && (
        <SingleSelectInput
          question={question}
          value={value as string | null}
          brandColor={brandColor}
          onSelect={(optionId) => {
            onChange(optionId)
            // Auto-advance after a short beat for tactile feel — pass the
            // optionId through so the parent doesn't depend on still-stale
            // state.answers when the timer fires.
            window.setTimeout(() => onAdvance(optionId), 180)
          }}
        />
      )}

      {question.type === "multi_select" && (
        <MultiSelectInput
          question={question}
          value={(value as string[] | null) ?? []}
          brandColor={brandColor}
          onChange={(next) => onChange(next)}
        />
      )}

      {(question.type === "short_text" ||
        question.type === "email" ||
        question.type === "number") && (
        <input
          type={
            question.type === "email"
              ? "email"
              : question.type === "number"
              ? "number"
              : "text"
          }
          inputMode={question.type === "number" ? "numeric" : undefined}
          value={value == null ? "" : String(value)}
          placeholder={question.placeholder ?? ""}
          onChange={(e) => {
            const raw = e.target.value
            if (question.type === "number") {
              if (raw === "") onChange(null)
              else {
                const n = Number(raw)
                onChange(Number.isFinite(n) ? n : null)
              }
            } else {
              onChange(raw)
            }
          }}
          onKeyDown={handleKey}
          autoFocus
          className="w-full px-4 py-4 text-lg border-b-2 border-neutral-200 focus:outline-none focus:border-neutral-900 transition-colors bg-transparent text-neutral-900 placeholder:text-neutral-300"
          style={
            { ["--tw-border-opacity" as string]: 1 } as React.CSSProperties
          }
        />
      )}

      {question.type === "long_text" && (
        <textarea
          value={value == null ? "" : String(value)}
          placeholder={question.placeholder ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              if (canAdvance) onAdvance()
            }
          }}
          rows={4}
          autoFocus
          className="w-full px-4 py-4 text-lg border-2 border-neutral-200 rounded-md focus:outline-none focus:border-neutral-900 transition-colors bg-transparent text-neutral-900 placeholder:text-neutral-300 resize-none"
        />
      )}

      {question.type !== "single_select" && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => onAdvance()}
            disabled={!canAdvance}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-medium text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-40"
            style={{ background: brandColor }}
          >
            {isLast ? "Submit" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="ml-3 text-xs text-neutral-400 hidden sm:inline">
            press Enter
          </span>
        </div>
      )}
    </div>
  )
}

function SingleSelectInput({
  question,
  value,
  brandColor,
  onSelect,
}: {
  question: QuizQuestion
  value: string | null
  brandColor: string
  onSelect: (optionId: string) => void
}) {
  const options = question.options ?? []
  return (
    <div className="space-y-2.5">
      {options.map((opt) => {
        const selected = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            className="w-full text-left px-5 py-4 rounded-md border-2 transition-all duration-150 group"
            style={{
              borderColor: selected ? brandColor : "rgb(229 229 229)",
              background: selected ? `${brandColor}10` : "white",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  borderColor: selected ? brandColor : "rgb(212 212 212)",
                  background: selected ? brandColor : "transparent",
                }}
              >
                {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </span>
              <span className="text-base text-neutral-900 font-medium">
                {opt.label}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function MultiSelectInput({
  question,
  value,
  brandColor,
  onChange,
}: {
  question: QuizQuestion
  value: string[]
  brandColor: string
  onChange: (next: string[]) => void
}) {
  const options = question.options ?? []
  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id))
    } else {
      onChange([...value, id])
    }
  }
  return (
    <div className="space-y-2.5">
      {options.map((opt) => {
        const selected = value.includes(opt.id)
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className="w-full text-left px-5 py-4 rounded-md border-2 transition-all duration-150"
            style={{
              borderColor: selected ? brandColor : "rgb(229 229 229)",
              background: selected ? `${brandColor}10` : "white",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="w-5 h-5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  borderColor: selected ? brandColor : "rgb(212 212 212)",
                  background: selected ? brandColor : "transparent",
                }}
              >
                {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </span>
              <span className="text-base text-neutral-900 font-medium">
                {opt.label}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function LeadStage({
  lead,
  onChange,
  emailRequired,
  brandColor,
  errorMessage,
  onSubmit,
}: {
  lead: LeadIdentity
  onChange: (patch: Partial<LeadIdentity>) => void
  emailRequired: boolean
  brandColor: string
  errorMessage: string | null
  onSubmit: (lead: LeadIdentity) => void
}) {
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    setLocalError(errorMessage)
  }, [errorMessage])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (emailRequired) {
      if (!lead.email || !emailLooksValid(lead.email)) {
        setLocalError("Please enter a valid email.")
        return
      }
    }
    setLocalError(null)
    onSubmit(lead)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-2xl sm:text-3xl font-semibold mb-2 text-neutral-900">
          Where should we send your results?
        </h2>
        <p className="text-sm text-neutral-500">
          We&apos;ll review your answers and follow up.
        </p>
      </div>

      <Field label={`Email${emailRequired ? "" : " (optional)"}`}>
        <input
          type="email"
          required={emailRequired}
          autoFocus
          value={lead.email ?? ""}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="you@company.com"
          className="w-full px-4 py-3 border-2 border-neutral-200 rounded-md focus:outline-none focus:border-neutral-900 transition-colors text-neutral-900 placeholder:text-neutral-300"
        />
      </Field>

      <Field label="Name (optional)">
        <input
          type="text"
          value={lead.name ?? ""}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Jane Smith"
          className="w-full px-4 py-3 border-2 border-neutral-200 rounded-md focus:outline-none focus:border-neutral-900 transition-colors text-neutral-900 placeholder:text-neutral-300"
        />
      </Field>

      <Field label="Company (optional)">
        <input
          type="text"
          value={lead.company ?? ""}
          onChange={(e) => onChange({ company: e.target.value })}
          placeholder="Acme Inc."
          className="w-full px-4 py-3 border-2 border-neutral-200 rounded-md focus:outline-none focus:border-neutral-900 transition-colors text-neutral-900 placeholder:text-neutral-300"
        />
      </Field>

      <Field label="Phone (optional)">
        <input
          type="tel"
          value={lead.phone ?? ""}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder="(555) 123-4567"
          className="w-full px-4 py-3 border-2 border-neutral-200 rounded-md focus:outline-none focus:border-neutral-900 transition-colors text-neutral-900 placeholder:text-neutral-300"
        />
      </Field>

      {localError && (
        <p className="text-sm text-red-600">{localError}</p>
      )}

      <button
        type="submit"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
        style={{ background: brandColor }}
      >
        See my results
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold tracking-wider uppercase text-neutral-500 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  )
}

function SuccessStage({
  headline,
  message,
  ctaLabel,
  ctaUrl,
  brandColor,
}: {
  headline: string
  message: string
  ctaLabel: string | null
  ctaUrl: string | null
  brandColor: string
}) {
  return (
    <div className="text-center py-8">
      <div
        className="w-14 h-14 rounded-full mx-auto mb-6 flex items-center justify-center"
        style={{ background: `${brandColor}20` }}
      >
        <Check
          className="w-7 h-7"
          strokeWidth={3}
          style={{ color: brandColor }}
        />
      </div>
      <h2 className="text-3xl sm:text-4xl font-semibold mb-4 text-neutral-900">
        {headline}
      </h2>
      <p className="text-base text-neutral-600 max-w-md mx-auto leading-relaxed mb-8">
        {message}
      </p>
      {ctaUrl && (
        <a
          href={ctaUrl}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: brandColor }}
        >
          {ctaLabel ?? "View next step"}
          <ArrowRight className="w-4 h-4" />
        </a>
      )}
    </div>
  )
}
