"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const CRM_TABS = [
  {
    label: "Website",
    content: () => (
      <div className="space-y-3">
        <div className="rounded-sm border border-border bg-deep overflow-hidden">
          <div className="h-2.5 w-full bg-primary flex items-center gap-1 px-2">
            {[1,2,3].map(d => <div key={d} className="h-1.5 w-1.5 rounded-full bg-card/50" />)}
          </div>
          <div className="p-3 space-y-2">
            <div className="h-4 w-1/2 rounded bg-surface" />
            <div className="h-3 w-3/4 rounded bg-surface" />
            <div className="h-3 w-2/3 rounded bg-surface" />
            <div className="mt-3 h-7 w-28 rounded-sm bg-primary" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">GHL-powered site - live in 3 days</p>
      </div>
    ),
  },
  {
    label: "Pipeline",
    content: () => (
      <div className="space-y-2">
        {[
          { name: "Apex Corp", stage: "Qualified", val: "$8,400", color: "#16A34A" },
          { name: "Vertex Inc", stage: "Demo Booked", val: "$5,200", color: "#2563EB" },
          { name: "Prism LLC", stage: "Proposal", val: "$12,000", color: "#EA580C" },
        ].map((d) => (
          <div key={d.name} className="flex items-center gap-3 rounded-sm bg-card border border-border px-3 py-2.5">
            <div className="h-7 w-7 rounded-full bg-deep flex items-center justify-center text-xs font-bold text-muted-foreground">{d.name[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">{d.name}</p>
              <p className="text-xs text-muted-foreground">{d.stage}</p>
            </div>
            <span className="text-xs font-bold" style={{ color: d.color }}>{d.val}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    label: "Chatbot",
    content: () => (
      <div className="space-y-2">
        {[
          { role: "bot", text: "Hi! What brings you to our site today?" },
          { role: "user", text: "Looking for pricing on the growth plan." },
          { role: "bot", text: "Great choice! Growth is $197/mo. Want me to book a 15-min call?" },
          { role: "user", text: "Sure, Thursday works." },
        ].map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[78%] rounded-xl px-3 py-2 text-xs leading-snug ${m.role === "bot" ? "bg-blue-950/30 text-blue-300" : "bg-primary text-white"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    label: "Analytics",
    content: () => (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[["1,240", "Visitors"], ["68", "Leads"], ["5.5%", "CVR"]].map(([v, l]) => (
            <div key={l} className="rounded-sm bg-deep border border-border px-2 py-2.5 text-center">
              <p className="text-sm font-bold text-foreground">{v}</p>
              <p className="text-[10px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-1 h-16">
          {[30, 45, 28, 60, 52, 70, 65].map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-primary opacity-70" style={{ height: `${h}%` }} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">Leads captured last 7 days</p>
      </div>
    ),
  },
]

export function WebsiteCRMDemo() {
  const [tab, setTab] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTab((s) => (s + 1) % CRM_TABS.length), 3200)
    return () => clearInterval(t)
  }, [])
  const TabContent = CRM_TABS[tab].content
  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {CRM_TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className="flex-1 rounded-lg px-1 py-2 text-center transition-all text-[11px] font-semibold"
            style={{ backgroundColor: tab === i ? "#981B1B" : "#FFFFFF", color: tab === i ? "white" : "#9CA3AF" }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          <TabContent />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
