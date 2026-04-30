"use client"

import { useEffect, useState } from "react"
import { Check, Loader2, Globe, Brain, Mail, Database } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Visible progress indicator for the 4-stage enrichment pipeline.
 *
 * The actual pipeline runs server-side and doesn't stream progress, but
 * the stages are sequential and have known typical timings, so we can
 * advance the indicator on a timer for honest visual feedback. When
 * the request actually finishes (or fails), the parent flips the
 * `done` prop and any remaining stages snap to complete.
 *
 * Stages:
 *   1. Website scan        ~2s
 *   2. Perplexity research ~5s
 *   3. Hunter email search ~3s
 *   4. Prospeo deep dive   ~5s
 */

const STAGES = [
  {
    key: "website",
    label: "Scanning company website",
    detail: "Looking for emails, contact pages, About info",
    icon: Globe,
    ms: 2200,
  },
  {
    key: "perplexity",
    label: "AI research with Perplexity",
    detail: "Decision makers, recent news, fit signals",
    icon: Brain,
    ms: 5500,
  },
  {
    key: "hunter",
    label: "Verified email lookup",
    detail: "Hunter.io domain + targeted email finder",
    icon: Mail,
    ms: 3500,
  },
  {
    key: "prospeo",
    label: "Deep company enrichment",
    detail: "Industry, size, revenue, social profiles",
    icon: Database,
    ms: 4500,
  },
] as const

interface EnrichmentProgressProps {
  done: boolean
}

export function EnrichmentProgress({ done }: EnrichmentProgressProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (done) {
      // Snap to "all done" when the actual response lands
      setActiveIndex(STAGES.length)
      return
    }

    // Auto-advance through stages on a timer. We never advance past the
    // last stage on the timer alone — we wait for `done` to flip so we
    // don't claim completion before the server confirms.
    const timeouts: ReturnType<typeof setTimeout>[] = []
    let elapsed = 0
    for (let i = 1; i < STAGES.length; i++) {
      elapsed += STAGES[i - 1].ms
      timeouts.push(
        setTimeout(() => {
          setActiveIndex((current) => (current < i ? i : current))
        }, elapsed),
      )
    }
    return () => {
      for (const t of timeouts) clearTimeout(t)
    }
  }, [done])

  return (
    <div className="rounded-lg border border-border bg-background/50 p-3 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
          Enriching company data
        </p>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {Math.min(activeIndex, STAGES.length)} / {STAGES.length}
        </span>
      </div>

      <ul className="space-y-1.5">
        {STAGES.map((stage, i) => {
          const status: "done" | "active" | "pending" =
            i < activeIndex ? "done" : i === activeIndex ? "active" : "pending"
          const Icon = stage.icon
          return (
            <li
              key={stage.key}
              className={cn(
                "flex items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors",
                status === "active" && "bg-primary/5",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  status === "done"
                    ? "bg-primary border-primary text-primary-foreground"
                    : status === "active"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground/60",
                )}
              >
                {status === "done" ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : status === "active" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Icon className="h-2.5 w-2.5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-xs font-medium leading-tight transition-colors",
                    status === "pending"
                      ? "text-muted-foreground/60"
                      : "text-foreground",
                  )}
                >
                  {stage.label}
                </p>
                <p
                  className={cn(
                    "text-[10px] leading-tight mt-0.5 transition-colors",
                    status === "pending"
                      ? "text-muted-foreground/40"
                      : "text-muted-foreground",
                  )}
                >
                  {stage.detail}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
