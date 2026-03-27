"use client"

import { Check } from "lucide-react"
import { CFO_TEST_QUESTIONS } from "@/lib/ops-excellence/config"
import type { IntakeCFOData, CFOResponseScore } from "@/lib/ops-excellence/types"

interface StepCFOTestProps {
  data: IntakeCFOData
  onChange: (data: IntakeCFOData) => void
}

const scoreStyles: Record<CFOResponseScore, { idle: string; active: string; label: string }> = {
  GREEN: {
    idle: "border-emerald-800/40 bg-emerald-900/10 text-emerald-400 hover:bg-emerald-900/20",
    active: "border-emerald-600 bg-emerald-900/30 text-emerald-300 ring-1 ring-emerald-600/30",
    label: "Green",
  },
  YELLOW: {
    idle: "border-yellow-800/40 bg-yellow-900/10 text-yellow-400 hover:bg-yellow-900/20",
    active: "border-yellow-600 bg-yellow-900/30 text-yellow-300 ring-1 ring-yellow-600/30",
    label: "Yellow",
  },
  RED: {
    idle: "border-red-800/40 bg-red-900/10 text-red-400 hover:bg-red-900/20",
    active: "border-red-600 bg-red-900/30 text-red-300 ring-1 ring-red-600/30",
    label: "Red",
  },
}

function getResponseForQuestion(data: IntakeCFOData, questionId: string) {
  return data.responses.find((r) => r.questionId === questionId)
}

function getAnswerText(
  question: (typeof CFO_TEST_QUESTIONS)[number],
  score: CFOResponseScore
): string {
  if (score === "GREEN") return question.greenAnswer
  if (score === "YELLOW") return question.yellowAnswer
  return question.redAnswer
}

export function StepCFOTest({ data, onChange }: StepCFOTestProps) {
  function selectScore(questionId: string, score: CFOResponseScore) {
    const existing = data.responses.find((r) => r.questionId === questionId)
    const updatedResponses = existing
      ? data.responses.map((r) =>
          r.questionId === questionId ? { ...r, score } : r
        )
      : [...data.responses, { questionId, score, notes: "" }]

    onChange({ ...data, responses: updatedResponses })
  }

  const answeredCount = data.responses.length
  const totalQuestions = CFO_TEST_QUESTIONS.length
  const allAnswered = answeredCount === totalQuestions

  const greenCount = data.responses.filter((r) => r.score === "GREEN").length
  const yellowCount = data.responses.filter((r) => r.score === "YELLOW").length
  const redCount = data.responses.filter((r) => r.score === "RED").length

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-panel px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Answer each question based on how your organization would respond today. There
          are no wrong answers -- this diagnostic helps us understand where you are so we
          can build the right plan.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-[#C4972A] transition-all duration-300"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {answeredCount}/{totalQuestions}
        </span>
      </div>

      {/* Question Cards */}
      <div className="space-y-4">
        {CFO_TEST_QUESTIONS.map((q, idx) => {
          const response = getResponseForQuestion(data, q.id)
          const selectedScore = response?.score ?? null

          return (
            <div
              key={q.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-panel text-xs font-mono font-semibold text-muted-foreground">
                  {idx + 1}
                </span>
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {q.question}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(["GREEN", "YELLOW", "RED"] as const).map((score) => {
                  const isSelected = selectedScore === score
                  const style = scoreStyles[score]
                  const answerText = getAnswerText(q, score)

                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => selectScore(q.id, score)}
                      className={`relative rounded-lg border px-3 py-3 text-left transition-all ${
                        isSelected ? style.active : style.idle
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span className="text-xs font-semibold uppercase tracking-wide">
                          {style.label}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed opacity-80">
                        {answerText}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      {allAnswered && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm font-semibold text-foreground">Summary</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-sm font-mono text-foreground">{greenCount}/7 Green</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-sm font-mono text-foreground">{yellowCount}/7 Yellow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-sm font-mono text-foreground">{redCount}/7 Red</span>
            </div>
          </div>
          {redCount >= 3 && (
            <div className="rounded-lg border border-[#C4972A]/30 bg-[#C4972A]/5 px-4 py-3">
              <p className="text-sm text-[#C4972A]">
                Your Financial Clarity Package will address these gaps in Week 1.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
