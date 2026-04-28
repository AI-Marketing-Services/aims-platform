"use client"

import { useMemo, useState } from "react"
import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  Sparkles,
  User,
} from "lucide-react"
import type {
  AnswerMap,
  AnswerValue,
  QuizOption,
  QuizQuestion,
} from "@/lib/audits/types"

export interface AuditResponseDto {
  id: string
  leadEmail: string | null
  leadName: string | null
  leadCompany: string | null
  leadPhone: string | null
  leadRole: string | null
  answers: AnswerMap
  aiSummary: string | null
  aiScore: number | null
  aiTags: string[]
  aiGeneratedAt: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  completedAt: string | null
  createdAt: string
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function scoreBucket(score: number | null) {
  if (score === null || score === undefined) {
    return {
      label: "—",
      className: "bg-muted/40 text-muted-foreground border-border",
    }
  }
  if (score >= 80) {
    return {
      label: String(score),
      className:
        "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    }
  }
  if (score >= 50) {
    return {
      label: String(score),
      className: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    }
  }
  return {
    label: String(score),
    className: "bg-red-500/10 text-red-500 border-red-500/30",
  }
}

function answerToText(
  question: QuizQuestion | undefined,
  value: AnswerValue
): string {
  if (value === null || value === undefined) return "—"

  if (Array.isArray(value)) {
    if (value.length === 0) return "—"
    if (question?.options) {
      const map = new Map(
        question.options.map((opt: QuizOption) => [opt.id, opt.label])
      )
      return value.map((v) => map.get(String(v)) ?? String(v)).join(", ")
    }
    return value.join(", ")
  }

  if (typeof value === "number") return String(value)

  // string-shaped — single_select stores the option id; resolve to label.
  if (question?.options) {
    const match = question.options.find((opt: QuizOption) => opt.id === value)
    if (match) return match.label
  }
  return value || "—"
}

interface ResponsesListProps {
  responses: AuditResponseDto[]
  questions: QuizQuestion[]
}

export function ResponsesList({ responses, questions }: ResponsesListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const questionMap = useMemo(() => {
    const map = new Map<string, QuizQuestion>()
    for (const q of questions) map.set(q.id, q)
    return map
  }, [questions])

  return (
    <div className="space-y-2">
      {responses.map((response) => (
        <ResponseRow
          key={response.id}
          response={response}
          expanded={expandedId === response.id}
          onToggle={() =>
            setExpandedId((prev) => (prev === response.id ? null : response.id))
          }
          questions={questions}
          questionMap={questionMap}
        />
      ))}
    </div>
  )
}

interface ResponseRowProps {
  response: AuditResponseDto
  expanded: boolean
  onToggle: () => void
  questions: QuizQuestion[]
  questionMap: Map<string, QuizQuestion>
}

function ResponseRow({
  response,
  expanded,
  onToggle,
  questions,
  questionMap,
}: ResponseRowProps) {
  const score = scoreBucket(response.aiScore)
  const identity =
    response.leadName?.trim() ||
    response.leadEmail?.trim() ||
    response.leadCompany?.trim() ||
    "Anonymous"

  const completed = response.completedAt ?? response.createdAt

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-all">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
        aria-expanded={expanded}
      >
        <span className="shrink-0 text-muted-foreground">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">
              {identity}
            </span>
            {response.leadCompany && response.leadName && (
              <span className="text-xs text-muted-foreground truncate">
                · {response.leadCompany}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
            {response.leadEmail && (
              <span className="inline-flex items-center gap-1 truncate max-w-[220px]">
                <Mail className="h-3 w-3" />
                {response.leadEmail}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(completed)}
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {response.aiTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-primary/5 text-primary border-primary/20"
            >
              {tag}
            </span>
          ))}
          <span
            className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-[11px] font-semibold border ${score.className}`}
            title={
              response.aiScore !== null
                ? `AI score: ${response.aiScore}`
                : "No AI score yet"
            }
          >
            {score.label}
          </span>
        </div>
      </button>

      {expanded && (
        <ResponseDetail
          response={response}
          questions={questions}
          questionMap={questionMap}
        />
      )}
    </div>
  )
}

function ResponseDetail({
  response,
  questions,
  questionMap,
}: {
  response: AuditResponseDto
  questions: QuizQuestion[]
  questionMap: Map<string, QuizQuestion>
}) {
  // Prefer the operator's question order. Tack any answers without a matching
  // question onto the bottom so nothing is silently hidden.
  const answeredQuestionIds = Object.keys(response.answers)
  const orderedIds = [
    ...questions.map((q) => q.id),
    ...answeredQuestionIds.filter((id) => !questionMap.has(id)),
  ]

  return (
    <div className="border-t border-border bg-background/40 p-4 sm:p-5 space-y-5">
      {/* Lead block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DetailRow icon={User} label="Name" value={response.leadName} />
        <DetailRow icon={Mail} label="Email" value={response.leadEmail} />
        <DetailRow
          icon={Building2}
          label="Company"
          value={response.leadCompany}
        />
        <DetailRow icon={Phone} label="Phone" value={response.leadPhone} />
        <DetailRow icon={User} label="Role" value={response.leadRole} />
        <DetailRow
          icon={Calendar}
          label="Submitted"
          value={formatDate(response.completedAt ?? response.createdAt)}
        />
      </div>

      {/* AI summary */}
      {(response.aiSummary || response.aiScore !== null) && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI summary
            </span>
            {response.aiGeneratedAt && (
              <span className="text-[10px] text-muted-foreground">
                {formatDate(response.aiGeneratedAt)}
              </span>
            )}
          </div>
          {response.aiSummary ? (
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {response.aiSummary}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Summary still generating…
            </p>
          )}
          {response.aiTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {response.aiTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-primary/5 text-primary border-primary/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Answers */}
      <div className="space-y-3">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Answers
        </span>
        <div className="space-y-2">
          {orderedIds.map((questionId) => {
            const question = questionMap.get(questionId)
            const value = response.answers[questionId] ?? null
            return (
              <div
                key={questionId}
                className="rounded-lg border border-border bg-card px-3 py-2.5"
              >
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {question?.label ?? questionId}
                </p>
                <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">
                  {answerToText(question, value)}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* UTM block */}
      {(response.utmSource ||
        response.utmMedium ||
        response.utmCampaign) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border">
          <DetailRow label="UTM source" value={response.utmSource} />
          <DetailRow label="UTM medium" value={response.utmMedium} />
          <DetailRow label="UTM campaign" value={response.utmCampaign} />
        </div>
      )}
    </div>
  )
}

interface DetailRowProps {
  label: string
  value: string | null
  icon?: React.ComponentType<{ className?: string }>
}

function DetailRow({ label, value, icon: Icon }: DetailRowProps) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm text-foreground mt-0.5 inline-flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {value || "—"}
      </p>
    </div>
  )
}
