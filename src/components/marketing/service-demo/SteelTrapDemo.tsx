"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, AlertTriangle, Target } from "lucide-react"

const TRAP_STAGES = ["First Contact", "Qualified", "Demo", "Proposal", "Close"]
const TRAP_TIMESTAMPS = ["Mar 3 9:14a", "Mar 5 2:31p", "Mar 9 11:00a", "Mar 12 3:45p", "Mar 15 10:22a"]
const TRAP_TOUCHES = [1, 3, 4, 5, 7]
const LOSS_REASONS = [
  { reason: "Pricing objection", pct: 67, reco: "Recommend messaging review - value prop not landing" },
  { reason: "No decision-maker access", pct: 18, reco: "Route to BTC closer for multi-thread strategy" },
  { reason: "Went dark after demo", pct: 11, reco: "Enforce 7x rule - avg. only 3.2 touches before cold" },
]

export function SteelTrapDemo() {
  const [stage, setStage] = useState(0)
  const [showLoss, setShowLoss] = useState(false)
  useEffect(() => {
    const t = setInterval(() => {
      setStage((s) => {
        if (s < TRAP_STAGES.length - 1) return s + 1
        setShowLoss(true)
        return s
      })
    }, 1400)
    return () => clearInterval(t)
  }, [])

  const touchCount = TRAP_TOUCHES[stage]
  const sevenXPct = Math.round((touchCount / 7) * 100)

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {TRAP_STAGES.map((s, i) => (
          <motion.div
            key={i}
            animate={{ backgroundColor: i <= stage ? "#2563EB" : "#FFFFFF", color: i <= stage ? "#fff" : "#6B7280" }}
            transition={{ duration: 0.3 }}
            className="flex-1 rounded-lg px-1 py-2 text-center"
          >
            <span className="text-[10px] font-semibold leading-none block">{s}</span>
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="rounded-sm border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-950/40 flex items-center justify-center">
                <Shield className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Apex Corp - $12,400</p>
                <p className="text-xs text-muted-foreground">{TRAP_TIMESTAMPS[stage]}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-400">Touch {touchCount}/7</span>
          </div>
          <div className="flex gap-1">
            {TRAP_STAGES.map((_, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: i <= stage ? "#2563EB" : "rgba(255,255,255,0.07)" }} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-sm bg-deep border border-border px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="h-3 w-3 text-blue-400" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">7x Rule</span>
          </div>
          <div className="h-1.5 rounded-full bg-card overflow-hidden">
            <motion.div
              animate={{ width: `${sevenXPct}%` }}
              transition={{ duration: 0.4 }}
              className="h-full rounded-full"
              style={{ backgroundColor: sevenXPct >= 100 ? "#16A34A" : sevenXPct >= 57 ? "#981B1B" : "#EF4444" }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{touchCount}/7 contacts made</p>
        </div>
        <div className="rounded-sm bg-deep border border-border px-3 py-2.5 text-center">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">90-Day Forecast</p>
          <p className="text-lg font-extrabold text-foreground">87%</p>
          <p className="text-[10px] text-green-400 font-medium">Accuracy</p>
        </div>
      </div>

      <AnimatePresence>
        {showLoss && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3 w-3 text-orange-400" />
              <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wide">AI Loss Pattern Detection</span>
            </div>
            {LOSS_REASONS.map((l) => (
              <div key={l.reason} className="rounded-sm bg-card border border-border px-3 py-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-foreground">{l.reason}</span>
                  <span className="text-xs font-bold text-orange-400">{l.pct}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">{l.reco}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
