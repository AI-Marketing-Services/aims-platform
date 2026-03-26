"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { DollarSign, TrendingUp } from "lucide-react"

const MOIC_CHANNELS = [
  { name: "Referral", moic: 8.4, color: "#16A34A" },
  { name: "Cold Email", moic: 5.1, color: "#2563EB" },
  { name: "Google Ads", moic: 3.2, color: "#EA580C" },
  { name: "LinkedIn", moic: 1.8, color: "#9333EA" },
]

const MONEY_TABS = ["C.O.M.", "MOIC", "Recovery"] as const

export function MoneyPageDemo() {
  const [tab, setTab] = useState(0)
  const [comValue, setComValue] = useState(0)
  const [hoursFreed, setHoursFreed] = useState(0)
  const [spendCut, setSpendCut] = useState(0)
  const [revRecovered, setRevRecovered] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTab((s) => (s + 1) % MONEY_TABS.length), 3600)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setComValue(0); setHoursFreed(0); setSpendCut(0); setRevRecovered(0)
    let frame = 0
    const t = setInterval(() => {
      frame++
      const progress = Math.min(frame / 50, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      if (tab === 0) setComValue(Math.floor(ease * 127))
      if (tab === 2) {
        setHoursFreed(Math.floor(ease * 340))
        setSpendCut(Math.floor(ease * 18400))
        setRevRecovered(Math.floor(ease * 142000))
      }
      if (progress >= 1) clearInterval(t)
    }, 25)
    return () => clearInterval(t)
  }, [tab])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <DollarSign className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Money Page</span>
        <span className="ml-auto text-[10px] text-muted-foreground">Q1 2026</span>
      </div>
      <div className="flex gap-1">
        {MONEY_TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className="flex-1 rounded-lg px-1 py-2 text-center transition-all text-[11px] font-semibold" style={{ backgroundColor: tab === i ? "#C4972A" : "#141923", color: tab === i ? "white" : "#9CA3AF" }}>
            {t}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {tab === 0 && (
          <motion.div key="com" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="space-y-2">
            <div className="rounded-sm border border-border bg-card p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Cost of Media (SG&A / Net New Leads)</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-extrabold text-foreground tabular-nums">${comValue}</span>
                <span className="text-sm text-muted-foreground mb-1">per lead</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-deep border border-border px-2 py-1.5">
                  <p className="text-xs font-bold text-foreground">$84,200</p>
                  <p className="text-[10px] text-muted-foreground">Total SG&A</p>
                </div>
                <div className="rounded-lg bg-deep border border-border px-2 py-1.5">
                  <p className="text-xs font-bold text-foreground">663</p>
                  <p className="text-[10px] text-muted-foreground">Net New Leads</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-primary">18% lower C.O.M. than industry avg.</span>
            </div>
          </motion.div>
        )}
        {tab === 1 && (
          <motion.div key="moic" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">MOIC by Channel - Return on Invested Capital</p>
            {MOIC_CHANNELS.map((ch, i) => (
              <div key={ch.name} className="flex items-center gap-2 rounded-sm bg-card border border-border px-3 py-2">
                <span className="text-[11px] text-muted-foreground w-16 flex-shrink-0">{ch.name}</span>
                <div className="flex-1 h-4 bg-deep rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(ch.moic / 10) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.12, ease: "easeOut" }} className="h-full rounded-full" style={{ backgroundColor: ch.color }} />
                </div>
                <span className="text-xs font-bold text-foreground w-10 text-right tabular-nums">{ch.moic}x</span>
              </div>
            ))}
            <div className="rounded-xl bg-green-900/15 border border-green-800 px-3 py-2 text-center">
              <span className="text-[11px] font-semibold text-green-400">Referral + Cold Email = 78% of closed revenue</span>
            </div>
          </motion.div>
        )}
        {tab === 2 && (
          <motion.div key="recovery" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">AI Recovery Metric - This Quarter</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-blue-950/30 border border-blue-800 p-2.5 text-center">
                <p className="text-lg font-extrabold text-blue-400 tabular-nums">{hoursFreed}</p>
                <p className="text-[10px] text-blue-400 font-medium">Hours freed</p>
              </div>
              <div className="rounded-xl bg-green-900/15 border border-green-800 p-2.5 text-center">
                <p className="text-lg font-extrabold text-green-400 tabular-nums">${(spendCut / 1000).toFixed(1)}K</p>
                <p className="text-[10px] text-green-400 font-medium">Spend cut</p>
              </div>
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-2.5 text-center">
                <p className="text-lg font-extrabold text-primary tabular-nums">${(revRecovered / 1000).toFixed(0)}K</p>
                <p className="text-[10px] text-primary font-medium">Recovered</p>
              </div>
            </div>
            <div className="rounded-sm border border-border bg-card p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">AI Impact Score</span>
                <span className="text-xs font-bold text-foreground">92 / 100</span>
              </div>
              <div className="h-2 rounded-full bg-deep overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: "92%" }} transition={{ duration: 1, ease: "easeOut" }} className="h-full bg-gradient-to-r from-primary to-[#E8C46A] rounded-full" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
