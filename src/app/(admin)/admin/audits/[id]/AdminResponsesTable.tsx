"use client"

import { Fragment, useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { QuizQuestion } from "@/lib/audits/types"

export type AdminResponseRow = {
  id: string
  createdAt: string
  completedAt: string | null
  leadEmail: string | null
  leadName: string | null
  leadCompany: string | null
  leadPhone: string | null
  leadRole: string | null
  answers: Record<string, unknown>
  aiSummary: string | null
  aiScore: number | null
  aiTags: string[]
  aiArms: unknown
  aiGeneratedAt: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  referer: string | null
}

interface Props {
  responses: AdminResponseRow[]
  questions: QuizQuestion[]
}

function scoreBadgeClasses(score: number | null): string {
  if (score === null) return "bg-muted/30 text-muted-foreground border-border"
  if (score >= 80) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
  if (score >= 50) return "bg-amber-500/15 text-amber-400 border-amber-500/30"
  return "bg-red-500/15 text-red-400 border-red-500/30"
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatAnswerValue(
  question: QuizQuestion,
  raw: unknown,
): string {
  if (raw === null || raw === undefined || raw === "") return "—"

  if (Array.isArray(raw)) {
    if (raw.length === 0) return "—"
    const labels = raw.map((v) => {
      const matched = question.options?.find(
        (o) => o.id === v || o.value === v,
      )
      return matched?.label ?? String(v)
    })
    return labels.join(", ")
  }

  if (typeof raw === "string" || typeof raw === "number") {
    const matched = question.options?.find(
      (o) => o.id === raw || o.value === raw,
    )
    return matched?.label ?? String(raw)
  }

  return JSON.stringify(raw)
}

function ArmsList({ arms }: { arms: unknown }) {
  if (!arms) return null

  // Handle array of strings or array of objects
  if (Array.isArray(arms)) {
    if (arms.length === 0) return null
    return (
      <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/90">
        {arms.map((item, idx) => {
          if (typeof item === "string") {
            return <li key={idx}>{item}</li>
          }
          if (item && typeof item === "object") {
            const obj = item as Record<string, unknown>
            const name =
              (obj.name as string | undefined) ??
              (obj.arm as string | undefined) ??
              (obj.title as string | undefined) ??
              `Arm ${idx + 1}`
            const reason =
              (obj.reason as string | undefined) ??
              (obj.why as string | undefined) ??
              (obj.note as string | undefined) ??
              null
            return (
              <li key={idx}>
                <span className="text-foreground font-medium">{name}</span>
                {reason && (
                  <span className="text-muted-foreground"> — {reason}</span>
                )}
              </li>
            )
          }
          return <li key={idx}>{JSON.stringify(item)}</li>
        })}
      </ul>
    )
  }

  if (typeof arms === "object") {
    return (
      <pre className="text-xs bg-deep border border-border rounded-md p-2 overflow-x-auto text-foreground/80">
        {JSON.stringify(arms, null, 2)}
      </pre>
    )
  }

  return <p className="text-sm text-foreground/90">{String(arms)}</p>
}

export function AdminResponsesTable({ responses, questions }: Props) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (responses.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        No responses yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-deep">
            <th className="w-8 px-2 py-2" aria-hidden />
            <th className="text-left px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Created
            </th>
            <th className="text-left px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Lead
            </th>
            <th className="text-center px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Score
            </th>
            <th className="text-left px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Tags
            </th>
          </tr>
        </thead>
        <tbody>
          {responses.map((r) => {
            const isOpen = openIds.has(r.id)
            const visibleTags = r.aiTags.slice(0, 3)
            const overflow = r.aiTags.length - visibleTags.length
            const identity =
              r.leadName ??
              r.leadEmail ??
              r.leadCompany ??
              "Anonymous"

            return (
              <Fragment key={r.id}>
                <tr
                  className="border-b border-border last:border-0 hover:bg-deep/50 transition-colors cursor-pointer"
                  onClick={() => toggle(r.id)}
                >
                  <td className="w-8 px-2 py-2.5 align-middle">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="text-foreground font-medium">
                      {identity}
                    </div>
                    {r.leadEmail && r.leadName && (
                      <div className="text-xs text-muted-foreground">
                        {r.leadEmail}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className={`inline-flex items-center justify-center min-w-[44px] px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md border ${scoreBadgeClasses(r.aiScore)}`}
                    >
                      {r.aiScore !== null ? r.aiScore : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {visibleTags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-foreground"
                        >
                          {t}
                        </span>
                      ))}
                      {overflow > 0 && (
                        <span className="inline-flex items-center rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
                          +{overflow}
                        </span>
                      )}
                      {r.aiTags.length === 0 && (
                        <span className="text-xs text-muted-foreground">
                          —
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="border-b border-border">
                    <td colSpan={5} className="bg-deep/30 px-4 py-4">
                      <div className="space-y-4">
                        {/* Lead identity block */}
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                            Lead
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                            {[
                              ["Name", r.leadName],
                              ["Email", r.leadEmail],
                              ["Company", r.leadCompany],
                              ["Phone", r.leadPhone],
                              ["Role", r.leadRole],
                            ].map(([label, value]) => (
                              <div key={label as string}>
                                <span className="text-muted-foreground">
                                  {label}:{" "}
                                </span>
                                <span className="text-foreground">
                                  {value ?? "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Q+A list */}
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                            Answers
                          </p>
                          <div className="space-y-2">
                            {questions.map((q) => {
                              const value = r.answers[q.id]
                              return (
                                <div
                                  key={q.id}
                                  className="border-l-2 border-border pl-3"
                                >
                                  <p className="text-xs text-muted-foreground">
                                    {q.label}
                                  </p>
                                  <p className="text-sm text-foreground">
                                    {formatAnswerValue(q, value)}
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* AI summary */}
                        {r.aiSummary && (
                          <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                              AI Summary
                            </p>
                            <p className="text-sm text-foreground/90 leading-relaxed">
                              {r.aiSummary}
                            </p>
                          </div>
                        )}

                        {/* AI tags */}
                        {r.aiTags.length > 0 && (
                          <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                              AI Tags
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {r.aiTags.map((t) => (
                                <span
                                  key={t}
                                  className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] text-foreground"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* AI arms */}
                        {r.aiArms !== null && r.aiArms !== undefined && (
                          <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                              AI Recommended Arms
                            </p>
                            <ArmsList arms={r.aiArms} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
