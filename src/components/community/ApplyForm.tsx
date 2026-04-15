"use client"

import { useState, useCallback } from "react"
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { QUESTIONS } from "@/lib/collective-application"

const TOTAL_STEPS = QUESTIONS.length + 1 // intro + questions

type FormState = "idle" | "submitting" | "success" | "error"

export function ApplyForm() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [formState, setFormState] = useState<FormState>("idle")
  const [selected, setSelected] = useState<string | null>(null)

  const progress = step === 0 ? 0 : (step / TOTAL_STEPS) * 100

  const canAdvanceIntro = name.trim().length > 0 && email.includes("@")

  const handleSelect = useCallback(
    (questionId: string, value: string) => {
      setSelected(value)
      const updated = { ...answers, [questionId]: value }
      setAnswers(updated)

      const isLastQuestion = step === QUESTIONS.length

      setTimeout(() => {
        setSelected(null)
        if (isLastQuestion) {
          handleSubmit(updated)
        } else {
          setStep((s) => s + 1)
          window.scrollTo({ top: 0, behavior: "smooth" })
        }
      }, 350)
    },
    [answers, step]
  )

  const handleSubmit = async (finalAnswers: Record<string, string>) => {
    setFormState("submitting")
    try {
      const res = await fetch("/api/community/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          answers: finalAnswers,
          source: "apply-form",
        }),
      })

      if (!res.ok) throw new Error("Submission failed")
      setFormState("success")
    } catch {
      setFormState("error")
    }
  }

  const goBack = () => {
    if (step > 0) {
      setSelected(null)
      setStep((s) => s - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  if (formState === "success") {
    return (
      <div className="min-h-[60vh] sm:min-h-[70vh] flex flex-col items-center justify-center px-5 sm:px-6 py-12 text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-crimson/10 flex items-center justify-center mb-5 sm:mb-6">
          <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-crimson" />
        </div>
        <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl text-[#1A1A1A] mb-3 sm:mb-4">
          Application received.
        </h2>
        <p className="text-base sm:text-lg text-[#737373] max-w-md">
          Check your inbox for the AI Operator Playbook Vault. A real operator will
          review your application within 24 hours.
        </p>
      </div>
    )
  }

  if (formState === "submitting") {
    return (
      <div className="min-h-[60vh] sm:min-h-[70vh] flex flex-col items-center justify-center px-5 sm:px-6">
        <Loader2 className="w-8 h-8 text-crimson animate-spin mb-4" />
        <p className="text-[#737373] font-mono text-sm uppercase tracking-wider">
          Submitting your application...
        </p>
      </div>
    )
  }

  const currentQuestion = step > 0 ? QUESTIONS[step - 1] : null

  return (
    <div className="min-h-[60vh] sm:min-h-[70vh] flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-[#E3E3E3] sticky top-16 z-10">
        <div
          className="h-full bg-crimson transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-4 sm:py-12 md:py-20">
        <div className="w-full max-w-2xl">
          {/* Back + step counter row */}
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
                {step} / {QUESTIONS.length}
              </p>
            </div>
          )}

          {/* Intro step */}
          {step === 0 && (
            <div className="space-y-5 sm:space-y-6">
              <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl text-[#1A1A1A]">
                Apply to the AI Operator Collective
              </h2>
              <p className="text-[#737373] text-base sm:text-lg">
                Takes about 2 minutes. We will send you the AI Operator Playbook Vault
                the moment you finish.
              </p>

              <div className="space-y-4 w-full max-w-md">
                <div>
                  <label
                    htmlFor="apply-name"
                    className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#737373] mb-2"
                  >
                    Full name
                  </label>
                  <input
                    id="apply-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3.5 text-base text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson transition-colors"
                    placeholder="Your name"
                    autoComplete="name"
                    autoFocus
                  />
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
                      if (e.key === "Enter" && canAdvanceIntro) setStep(1)
                    }}
                  />
                </div>

                <button
                  onClick={() => setStep(1)}
                  disabled={!canAdvanceIntro}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-md px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all min-h-[52px]",
                    canAdvanceIntro
                      ? "bg-crimson text-white hover:bg-crimson-dark active:bg-crimson-dark shadow-[0_8px_24px_-4px_rgba(153,27,27,0.35)]"
                      : "bg-[#E3E3E3] text-[#999] cursor-not-allowed"
                  )}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Question steps */}
          {currentQuestion && (
            <div>
              <h2 className="font-playfair text-lg sm:text-2xl md:text-3xl text-[#1A1A1A] mb-3 sm:mb-8 leading-snug">
                {currentQuestion.question}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {currentQuestion.options.map((option, i) => {
                  const isSelected = selected === option.value || answers[currentQuestion.id] === option.value
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleSelect(currentQuestion.id, option.value)}
                      className={cn(
                        "group relative text-left rounded-md border px-3 py-3 sm:p-5 transition-all active:scale-[0.98]",
                        isSelected
                          ? "border-crimson bg-crimson/5 shadow-[0_0_0_1px_rgba(153,27,27,0.3)]"
                          : "border-[#E3E3E3] bg-white hover:border-crimson/30 hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.06)]"
                      )}
                    >
                      <div className="flex items-center gap-2.5 sm:items-start sm:gap-3">
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

              {formState === "error" && step === QUESTIONS.length && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-red-600 mb-3">
                    Something went wrong. Please try again.
                  </p>
                  <button
                    onClick={() => handleSubmit(answers)}
                    className="inline-flex items-center gap-2 rounded-md bg-crimson text-white px-6 py-3.5 text-sm font-bold uppercase tracking-wider hover:bg-crimson-dark active:bg-crimson-dark transition-all min-h-[48px]"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
