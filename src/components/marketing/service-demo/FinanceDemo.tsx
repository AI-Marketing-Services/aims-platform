"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, BarChart2 } from "lucide-react"

const PL_ROWS = [
  { label: "Revenue", before: "$87,342", after: "$87,342", changed: false },
  { label: "COGS", before: "manually keyed", after: "$31,420 (36%)", changed: true },
  { label: "Gross Profit", before: "???", after: "$55,922", changed: true },
  { label: "Payroll", before: "3 spreadsheets", after: "$22,100", changed: true },
  { label: "SaaS / Tools", before: "unknown", after: "$4,810", changed: true },
  { label: "Net Profit", before: "???", after: "$28,012 (32%)", changed: true },
]

export function FinanceDemo() {
  const [showAfter, setShowAfter] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setShowAfter((s) => !s), 2400)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <BarChart2 className="h-4 w-4 text-purple-600" />
        <span className="text-sm font-semibold text-foreground">P&L Automation</span>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setShowAfter(false)} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition ${!showAfter ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>Raw</button>
          <button onClick={() => setShowAfter(true)} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition ${showAfter ? "bg-green-950/30 text-green-400" : "text-muted-foreground"}`}>AIMS Clean</button>
        </div>
      </div>
      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-2 border-b border-border bg-deep px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          <span>Line Item</span>
          <span className="text-right">{showAfter ? "Cleaned" : "Your data"}</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={showAfter ? "after" : "before"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {PL_ROWS.map((row) => (
              <div key={row.label} className="grid grid-cols-2 px-3 py-2 border-b border-border/50 last:border-0">
                <span className="text-xs text-muted-foreground font-medium">{row.label}</span>
                <span className={`text-xs text-right font-semibold ${showAfter ? (row.changed ? "text-green-400" : "text-foreground") : "text-primary"}`}>
                  {showAfter ? row.after : row.before}
                </span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
      {showAfter && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-green-900/15 border border-green-800 px-3 py-2.5 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-green-400">Clean P&L ready - auto-synced from QuickBooks</span>
        </motion.div>
      )}
    </div>
  )
}
