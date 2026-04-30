"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, BookOpen, ChevronDown, ChevronUp, Plus, DollarSign, Wrench, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import type { IndustryPlaybook, PlaybookUseCase } from "@/lib/playbooks/manifest"

interface PlaybooksViewProps {
  playbooks: IndustryPlaybook[]
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "bg-green-50 text-green-700 border-green-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Advanced: "bg-red-50 text-red-600 border-red-200",
}

export function PlaybooksView({ playbooks }: PlaybooksViewProps) {
  const [activeIndustry, setActiveIndustry] = useState<string>(playbooks[0]?.id ?? "")
  const [expandedCase, setExpandedCase] = useState<string | null>(null)

  const current = playbooks.find((p) => p.id === activeIndustry)

  return (
    <div className="flex gap-4 h-full">
      {/* Industry selector */}
      <div className="w-48 shrink-0 space-y-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 mb-2">Industries</p>
        {playbooks.map((pb) => (
          <button
            key={pb.id}
            onClick={() => {
              setActiveIndustry(pb.id)
              setExpandedCase(null)
            }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all",
              activeIndustry === pb.id
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium truncate">{pb.industry}</span>
          </button>
        ))}
      </div>

      {/* Playbook content */}
      {current && (
        <div className="flex-1 min-w-0 space-y-4">
          {/* Industry header */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-foreground mb-1">{current.industry}</h2>
                <p className="text-sm text-muted-foreground">{current.description}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg deal</p>
                <p className="text-sm font-bold text-primary">{current.avgDealSize}</p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 bg-muted/60 border border-border rounded-lg px-3 py-2">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Top pain: </span>
                {current.topPain}
              </p>
            </div>
          </div>

          {/* Use cases */}
          <div className="space-y-2">
            {current.useCases.map((useCase) => (
              <UseCaseCard
                key={useCase.id}
                useCase={useCase}
                industryId={current.id}
                expanded={expandedCase === useCase.id}
                onToggle={() => setExpandedCase(expandedCase === useCase.id ? null : useCase.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UseCaseCard({
  useCase,
  expanded,
  onToggle,
  industryId,
}: {
  useCase: PlaybookUseCase
  expanded: boolean
  onToggle: () => void
  industryId: string
}) {
  const router = useRouter()

  function trackEvent(type: string) {
    void fetch("/api/portal/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        entityType: "Playbook",
        entityId: `${industryId}:${useCase.id}`,
        metadata: {
          industryId,
          useCaseId: useCase.id,
          title: useCase.title,
          monthlyValue: useCase.monthlyValue,
          difficulty: useCase.difficulty,
        },
      }),
    }).catch(() => {})
  }

  function handleToggle() {
    // Fire view event only when expanding (not when collapsing)
    if (!expanded) trackEvent("playbook_viewed")
    onToggle()
  }

  function importToCrm() {
    trackEvent("playbook_used")
    router.push(`/portal/crm/scout?pitch=${encodeURIComponent(useCase.pitchLine)}`)
  }

  return (
    <div
      className={cn(
        "bg-card border rounded-xl transition-all duration-150",
        expanded ? "border-primary/30" : "border-border"
      )}
    >
      {/* Header row */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{useCase.title}</p>
            <span
              className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
                DIFFICULTY_COLORS[useCase.difficulty]
              )}
            >
              {useCase.difficulty}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{useCase.problem}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">{useCase.monthlyValue}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {useCase.timeToDeliver}
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
          {/* Pitch line */}
          <div className="bg-primary/5 border border-primary/15 rounded-lg px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Pitch line</p>
            <p className="text-sm font-medium text-foreground italic">&ldquo;{useCase.pitchLine}&rdquo;</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Problem */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">The Problem</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{useCase.problem}</p>
            </div>

            {/* Solution */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">The Solution</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{useCase.solution}</p>
            </div>
          </div>

          {/* Tools */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Wrench className="h-3 w-3 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tools Needed</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {useCase.tools.map((tool) => (
                <span
                  key={tool}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={importToCrm}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Find leads for this
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
