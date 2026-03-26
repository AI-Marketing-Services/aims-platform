"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Rocket } from "lucide-react"

const WD_DEPARTMENTS = [
  { label: "Sales", sinks: [{ task: "Manual lead qualification", hrs: 12 }, { task: "CRM data entry", hrs: 8 }, { task: "Proposal formatting", hrs: 6 }] },
  { label: "Marketing", sinks: [{ task: "Content repurposing", hrs: 10 }, { task: "Campaign reporting", hrs: 7 }, { task: "Social scheduling", hrs: 5 }] },
  { label: "Ops", sinks: [{ task: "Vendor follow-ups", hrs: 14 }, { task: "Invoice reconciliation", hrs: 9 }, { task: "Status update meetings", hrs: 6 }] },
  { label: "Finance", sinks: [{ task: "Expense categorization", hrs: 11 }, { task: "P&L assembly", hrs: 8 }, { task: "Renewal tracking", hrs: 4 }] },
]

const WD_OPPORTUNITY_MAP = [
  { name: "AI Lead Scoring", impact: 94, dept: "Sales", effort: "Low" },
  { name: "Auto-Invoice Pipeline", impact: 89, dept: "Ops", effort: "Med" },
  { name: "Content Repurpose Agent", impact: 85, dept: "Marketing", effort: "Low" },
  { name: "Expense Auto-Categorizer", impact: 82, dept: "Finance", effort: "Low" },
  { name: "EOS Meeting Automator", impact: 78, dept: "Ops", effort: "Med" },
]

export function WildDucksDemo() {
  const [tab, setTab] = useState(0)
  const [phase, setPhase] = useState<"scan" | "map" | "deploy">("scan")
  const [scanProgress, setScanProgress] = useState(0)
  const [deployed, setDeployed] = useState(false)

  useEffect(() => {
    setScanProgress(0)
    const t = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) { clearInterval(t); return 100 }
        return p + 2
      })
    }, 35)
    return () => clearInterval(t)
  }, [tab])

  const dept = WD_DEPARTMENTS[tab]
  const totalHrs = dept.sinks.reduce((a, s) => a + s.hrs, 0)

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {WD_DEPARTMENTS.map((d, i) => (
          <button
            key={d.label}
            onClick={() => { setTab(i); setPhase("scan"); setDeployed(false) }}
            className="flex-1 rounded-lg px-1 py-2 text-center transition-all text-[11px] font-semibold"
            style={{ backgroundColor: tab === i ? "#C4972A" : "#141923", color: tab === i ? "white" : "#9CA3AF" }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {phase === "scan" && (
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            <div className="rounded-sm border border-border bg-card p-3 mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">AI Opportunity Score</span>
                <span className="text-[10px] font-bold text-foreground">{scanProgress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-deep overflow-hidden">
                <motion.div animate={{ width: `${scanProgress}%` }} transition={{ duration: 0.05 }} className="h-full bg-gradient-to-r from-primary to-[#E8C46A] rounded-full" />
              </div>
            </div>
            <div className="space-y-1.5">
              {dept.sinks.map((sink) => (
                <div key={sink.task} className="flex items-center gap-3 rounded-sm bg-deep border border-border px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-foreground">{sink.task}</p>
                  </div>
                  <span className="text-[11px] font-bold text-red-400">{sink.hrs}h/wk</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-red-950/20 border border-red-800/40 px-3 py-2.5 flex items-center gap-2 mt-2">
              <span className="text-[11px] font-semibold text-red-400">{totalHrs}h/wk wasted in {dept.label}</span>
            </div>
            <button
              onClick={() => setPhase("map")}
              className="mt-2 w-full rounded-lg bg-surface border border-border px-3 py-2 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors text-center"
            >
              View Opportunity Map
            </button>
          </motion.div>
        </AnimatePresence>
      )}

      {phase === "map" && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Top 5 Findings - Ranked by Impact</p>
          {WD_OPPORTUNITY_MAP.map((opp, i) => (
            <div key={opp.name} className="flex items-center gap-2 rounded-sm bg-deep border border-border px-3 py-2">
              <span className="text-[10px] font-bold text-primary w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-foreground leading-tight">{opp.name}</p>
                <p className="text-[10px] text-muted-foreground">{opp.dept} · {opp.effort} effort</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-[11px] font-bold text-primary">{opp.impact}</div>
                <div className="text-[9px] text-muted-foreground">score</div>
              </div>
            </div>
          ))}
          <button
            onClick={() => { setPhase("deploy"); setDeployed(false); setTimeout(() => setDeployed(true), 1800) }}
            className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-white px-3 py-2.5 text-[11px] font-semibold hover:bg-primary/90 transition-colors"
          >
            <Rocket className="h-3.5 w-3.5" /> Deploy Solutions
          </button>
        </motion.div>
      )}

      {phase === "deploy" && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-2">
          {["EOS Agent", "Process Automator", "Spend Challenger", "AI Copilot", "Report Generator"].map((sol, i) => (
            <motion.div
              key={sol}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.3, duration: 0.3 }}
              className="flex items-center gap-3 rounded-sm bg-card border border-border px-3 py-2.5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-foreground">{sol}</p>
              </div>
              {deployed ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
              ) : (
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </motion.div>
          ))}
          {deployed && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-green-950/20 border border-green-800/40 px-3 py-2.5 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
              <span className="text-[11px] font-semibold text-green-400">All solutions deployed - 40% efficiency gain in 90 days</span>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}
