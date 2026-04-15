"use client"

import { useState, useCallback } from "react"
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { QUESTIONS } from "@/lib/collective-application"

/**
 * Embeddable version of the AI Operator Collective application form.
 * Designed to work inside an iframe on Mighty Networks or any external page.
 *
 * Embed via: <iframe src="https://aioperatorcollective.com/embed/apply" />
 *
 * Steps:
 *  0 - Contact details (name, email, phone)
 *  1..N - Qualification questions from collective-application.ts
 *  Final - Confirmation screen
 */

const TOTAL_STEPS = QUESTIONS.length + 1

type FormState = "idle" | "submitting" | "success" | "error"

export function EmbedApplyForm() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [formState, setFormState] = useState<FormState>("idle")
  const [selected, setSelected] = useState<string | null>(null)

  const progress = step === 0 ? 0 : (step / TOTAL_STEPS) * 100

  const canAdvanceIntro =
    name.trim().length > 0 && email.includes("@") && email.includes(".")

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
          phone: phone.trim() || undefined,
          answers: finalAnswers,
          source: "embed-apply-form",
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
    }
  }

  // Success state
  if (formState === "success") {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center px-5 py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-[#981B1B]/10 flex items-center justify-center mb-5">
          <CheckCircle2 className="w-7 h-7 text-[#981B1B]" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] mb-3">
          Application received.
        </h2>
        <p className="text-base text-[#737373] max-w-md">
          Check your inbox for the AI Operator Playbook Vault. A real operator will
          review your application within 24 hours.
        </p>
      </div>
    )
  }

  // Submitting state
  if (formState === "submitting") {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center px-5">
        <Loader2 className="w-8 h-8 text-[#981B1B] animate-spin mb-4" />
        <p className="text-[#737373] font-mono text-sm uppercase tracking-wider">
          Submitting your application...
        </p>
      </div>
    )
  }

  const currentQuestion = step > 0 ? QUESTIONS[step - 1] : null

  return (
    <div className="min-h-[500px] flex flex-col bg-white">
      {/* Progress bar */}
      <div className="w-full h-1 bg-[#E3E3E3]">
        <div
          className="h-full bg-[#981B1B] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-12">
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
                {step} / {QUESTIONS.length}
              </p>
            </div>
          )}

          {/* Step 0: Contact Details */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] mb-2">
                  Apply to the AI Operator Collective
                </h2>
                <p className="text-[#737373] text-sm sm:text-base">
                  Takes about 2 minutes. We will send you the AI Operator Playbook Vault
                  the moment you finish.
                </p>
              </div>

              <div className="space-y-3 w-full max-w-md">
                <div>
                  <label
                    htmlFor="embed-name"
                    className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#737373] mb-1.5"
                  >
                    Full name *
                  </label>
                  <input
                    id="embed-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3 text-base text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-[#981B1B] focus:ring-1 focus:ring-[#981B1B] transition-colors"
                    placeholder="Your name"
                    autoComplete="name"
                    autoFocus
                  />
                </div>

                <div>
                  <label
                    htmlFor="embed-email"
                    className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#737373] mb-1.5"
                  >
                    Email address *
                  </label>
                  <input
                    id="embed-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3 text-base text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-[#981B1B] focus:ring-1 focus:ring-[#981B1B] transition-colors"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label
                    htmlFor="embed-phone"
                    className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#737373] mb-1.5"
                  >
                    Phone number
                  </label>
                  <input
                    id="embed-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-md border border-[#E3E3E3] bg-white px-4 py-3 text-base text-[#1A1A1A] placeholder:text-[#ccc] focus:outline-none focus:border-[#981B1B] focus:ring-1 focus:ring-[#981B1B] transition-colors"
                    placeholder="(555) 555-5555"
                    autoComplete="tel"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canAdvanceIntro) setStep(1)
                    }}
                  />
                </div>

                <button
                  onClick={() => setStep(1)}
                  disabled={!canAdvanceIntro}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-sm font-bold uppercase tracking-wider transition-all mt-2",
                    canAdvanceIntro
                      ? "bg-[#981B1B] text-white hover:bg-[#7a1616] shadow-[0_8px_24px_-4px_rgba(152,27,27,0.35)]"
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
              <h2 className="font-serif text-lg sm:text-2xl text-[#1A1A1A] mb-4 sm:mb-6 leading-snug">
                {currentQuestion.question}
              </h2>

              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {currentQuestion.options.map((option, i) => {
                  const isSelected =
                    selected === option.value ||
                    answers[currentQuestion.id] === option.value
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleSelect(currentQuestion.id, option.value)}
                      className={cn(
                        "group relative text-left rounded-md border px-3.5 py-3 sm:px-5 sm:py-4 transition-all active:scale-[0.98]",
                        isSelected
                          ? "border-[#981B1B] bg-[#981B1B]/5 shadow-[0_0_0_1px_rgba(152,27,27,0.3)]"
                          : "border-[#E3E3E3] bg-white hover:border-[#981B1B]/30 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold border transition-colors",
                            isSelected
                              ? "bg-[#981B1B] text-white border-[#981B1B]"
                              : "bg-[#F5F5F5] text-[#737373] border-[#E3E3E3] group-hover:border-[#981B1B]/30"
                          )}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-sm sm:text-base text-[#1A1A1A] leading-snug">
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
                    className="inline-flex items-center gap-2 rounded-md bg-[#981B1B] text-white px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-[#7a1616] transition-all"
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
