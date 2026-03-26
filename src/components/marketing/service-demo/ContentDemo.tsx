"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"

const CONTENT_VARIANTS = [
  "\"We doubled Apex Corp's pipeline in 30 days.\"",
  "\"The AI SDR that never sleeps - 47 meetings/mo.\"",
  "\"Your competitors are already using AIMS.\"",
  "\"From 0 to 200 qualified leads in 6 weeks.\"",
]

export function ContentDemo() {
  const [idx, setIdx] = useState(0)
  const [typed, setTyped] = useState("")
  useEffect(() => {
    setTyped("")
    const target = CONTENT_VARIANTS[idx]
    let i = 0
    const t = setInterval(() => {
      if (i < target.length) { setTyped(target.slice(0, i + 1)); i++ }
      else { clearInterval(t); setTimeout(() => setIdx((s) => (s + 1) % CONTENT_VARIANTS.length), 1200) }
    }, 28)
    return () => clearInterval(t)
  }, [idx])
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
        <Image src="/integrations/openai-svgrepo-com.svg" alt="AI" width={16} height={16} />
        AI Content Generator
        <motion.div animate={{ opacity: [1,0,1] }} transition={{ repeat: Infinity, duration: 0.9 }} className="h-2 w-2 rounded-full bg-green-400 ml-auto" />
      </div>
      <div className="min-h-[64px] rounded-sm border border-border bg-card p-4">
        <p className="text-base font-semibold text-foreground leading-snug">
          {typed}
          <motion.span animate={{ opacity: [1,0,1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="inline-block w-0.5 h-4 bg-foreground ml-0.5 align-middle" />
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["4.8/5", "Hook Score"], ["94%", "Open Rate"], ["2.1x", "CTR Lift"]].map(([val, lbl]) => (
          <div key={lbl} className="rounded-sm bg-deep border border-border px-3 py-2.5 text-center">
            <p className="text-base font-bold text-foreground">{val}</p>
            <p className="text-xs text-muted-foreground">{lbl}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
