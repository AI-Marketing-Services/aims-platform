"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { RefreshCw } from "lucide-react"

export function ReactivationDemo() {
  const [count, setCount] = useState(0)
  const [replied, setReplied] = useState(0)
  const TARGET = 652
  const REPLY_TARGET = 117
  useEffect(() => {
    setCount(0); setReplied(0)
    let frame = 0
    const t = setInterval(() => {
      frame++
      const progress = Math.min(frame / 60, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(ease * TARGET))
      setReplied(Math.floor(ease * REPLY_TARGET))
      if (progress >= 1) clearInterval(t)
    }, 30)
    return () => clearInterval(t)
  }, [])
  const pct = Math.round((REPLY_TARGET / 2783) * 100)
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <RefreshCw className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Dead CRM contacts scanned</span>
      </div>
      <div className="rounded-sm border border-border bg-card p-4">
        <div className="flex items-end gap-2">
          <span className="text-3xl font-extrabold text-foreground tabular-nums">{count.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground mb-1">/ 2,783 contacts</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-deep overflow-hidden">
          <motion.div
            animate={{ width: `${(count / 2783) * 100}%` }}
            transition={{ duration: 0.05 }}
            className="h-full bg-gradient-to-r from-primary to-[#E8C46A] rounded-full"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-green-900/15 border border-green-800 p-3">
          <p className="text-2xl font-extrabold text-green-400 tabular-nums">{replied}</p>
          <p className="text-xs text-green-400 font-medium">Replied positively</p>
        </div>
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-3">
          <p className="text-2xl font-extrabold text-primary">{pct}%</p>
          <p className="text-xs text-primary font-medium">Reactivation rate</p>
        </div>
      </div>
    </div>
  )
}
