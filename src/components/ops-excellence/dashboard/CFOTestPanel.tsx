"use client"

import { motion } from "framer-motion"
import { CheckCircle2, AlertTriangle, XCircle, ClipboardCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { CFO_TEST_QUESTIONS } from "@/lib/ops-excellence/config"
import type { CFOTestSummary } from "@/lib/ops-excellence/types"

interface CFOTestPanelProps {
  cfoTest: CFOTestSummary | null
}

const SCORE_CONFIG = {
  GREEN: {
    label: "Green",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bgColor: "bg-emerald-900/15",
    borderColor: "border-emerald-800",
    barColor: "bg-emerald-400",
    description: "Full visibility",
  },
  YELLOW: {
    label: "Yellow",
    icon: AlertTriangle,
    color: "text-yellow-400",
    bgColor: "bg-yellow-900/15",
    borderColor: "border-yellow-800",
    barColor: "bg-yellow-400",
    description: "Partial visibility",
  },
  RED: {
    label: "Red",
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-900/15",
    borderColor: "border-red-800",
    barColor: "bg-red-400",
    description: "No visibility",
  },
} as const

export default function CFOTestPanel({ cfoTest }: CFOTestPanelProps) {
  return (
    <motion.div
      className="rounded-2xl border border-border bg-card overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <ClipboardCheck className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Financial Visibility Check</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              7-question CFO diagnostic — can leadership answer these on demand?
            </p>
          </div>
        </div>
      </div>

      {cfoTest ? (
        <>
          {/* Summary bar */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex flex-wrap items-center gap-4 mb-3">
              {(["GREEN", "YELLOW", "RED"] as const).map((tier) => {
                const config = SCORE_CONFIG[tier]
                const count = tier === "GREEN"
                  ? cfoTest.greenCount
                  : tier === "YELLOW"
                  ? cfoTest.yellowCount
                  : cfoTest.redCount
                const Icon = config.icon
                return (
                  <div key={tier} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border", config.bgColor, config.borderColor)}>
                    <Icon className={cn("h-3.5 w-3.5", config.color)} />
                    <span className={cn("text-sm font-semibold font-mono", config.color)}>{count}</span>
                    <span className="text-xs text-muted-foreground">{config.description}</span>
                  </div>
                )
              })}
            </div>

            {/* Stacked bar */}
            <div className="h-2 w-full rounded-full overflow-hidden flex bg-deep">
              {[
                { count: cfoTest.greenCount, color: "bg-emerald-400" },
                { count: cfoTest.yellowCount, color: "bg-yellow-400" },
                { count: cfoTest.redCount, color: "bg-red-400" },
              ].filter(s => s.count > 0).map((seg, i) => (
                <motion.div
                  key={i}
                  className={cn("h-full", seg.color)}
                  initial={{ width: 0 }}
                  animate={{ width: `${(seg.count / 7) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.6 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}
            </div>
          </div>

          {/* Question breakdown */}
          <div className="divide-y divide-border">
            {CFO_TEST_QUESTIONS.map((q, i) => {
              const response = cfoTest.responses.find((r) => r.questionId === q.id)
              const tier = response?.score ?? null
              const config = tier ? SCORE_CONFIG[tier] : null
              const Icon = config?.icon ?? null

              return (
                <motion.div
                  key={q.id}
                  className="flex items-start gap-3 px-6 py-3.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.55 + i * 0.05 }}
                >
                  <div className="shrink-0 mt-0.5">
                    {Icon && config ? (
                      <Icon className={cn("h-4 w-4", config.color)} />
                    ) : (
                      <span className="block h-4 w-4 rounded-full border-2 border-border" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{q.question}</p>
                    {response?.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic leading-relaxed">
                        &ldquo;{response.notes}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {config ? (
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full border",
                          config.bgColor,
                          config.borderColor,
                          config.color
                        )}
                      >
                        {config.label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                        Pending
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-deep mx-auto mb-3">
            <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">CFO Test not completed yet</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Your AIMS integrator will administer this 7-question financial visibility diagnostic during your onboarding call.
          </p>
        </div>
      )}
    </motion.div>
  )
}
