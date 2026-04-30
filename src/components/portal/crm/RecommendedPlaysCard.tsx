"use client"

import { useState } from "react"
import {
  BookOpen,
  Copy,
  Check,
  DollarSign,
  Clock,
  Wrench,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import type { PlaybookUseCase } from "@/lib/playbooks/manifest"

interface RecommendedPlaysCardProps {
  dealId: string
  industry: string | null
  matchedIndustry: string
  matchType: "exact" | "substring" | "keyword"
  plays: Array<{
    id: string
    title: string
    problem: string
    solution: string
    tools: string[]
    monthlyValue: string
    difficulty: PlaybookUseCase["difficulty"]
    timeToDeliver: string
    pitchLine: string
  }>
  industryId: string
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Advanced: "bg-red-500/10 text-red-500 border-red-500/20",
}

export function RecommendedPlaysCard({
  dealId,
  industry,
  matchedIndustry,
  matchType,
  plays,
  industryId,
}: RecommendedPlaysCardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function handleCopyPitch(play: (typeof plays)[number]) {
    try {
      await navigator.clipboard.writeText(play.pitchLine)
      setCopiedId(play.id)
      setTimeout(() => setCopiedId(null), 2000)
      // Track usage as PLAYBOOK_USED
      void fetch("/api/portal/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "playbook_used",
          entityType: "Playbook",
          entityId: `${industryId}:${play.id}`,
          metadata: {
            industryId,
            useCaseId: play.id,
            title: play.title,
            dealId,
            via: "deal-page-recommendation",
          },
        }),
      }).catch(() => {})
    } catch {
      // ignore
    }
  }

  if (plays.length === 0) return null

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Recommended plays
          </p>
        </div>
        <Link
          href={`/portal/playbooks?industry=${industryId}`}
          className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-1"
        >
          See all
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Based on{" "}
        <span className="text-foreground font-medium">
          {industry ?? matchedIndustry}
        </span>
        {matchType !== "exact" ? (
          <span className="italic"> · matched to {matchedIndustry} playbook</span>
        ) : null}
      </p>

      <ul className="space-y-2">
        {plays.map((play) => (
          <li
            key={play.id}
            className="rounded-lg border border-border bg-background p-3 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{play.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                  {play.problem}
                </p>
              </div>
              <span
                className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                  DIFFICULTY_COLORS[play.difficulty] ?? DIFFICULTY_COLORS.Medium
                }`}
              >
                {play.difficulty}
              </span>
            </div>

            <div className="rounded bg-primary/5 border border-primary/15 px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                Pitch line
              </p>
              <p className="text-xs text-foreground italic leading-relaxed">
                &ldquo;{play.pitchLine}&rdquo;
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {play.monthlyValue}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {play.timeToDeliver}
              </span>
              <span className="inline-flex items-center gap-1 truncate">
                <Wrench className="h-3 w-3 shrink-0" />
                <span className="truncate">{play.tools.slice(0, 2).join(", ")}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleCopyPitch(play)}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {copiedId === play.id ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Pitch copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Use this play (copy pitch)
                </>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
