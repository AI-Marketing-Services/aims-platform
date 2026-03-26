"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search } from "lucide-react"

const AUDIENCE_RESULTS = [
  { label: "Plumbers in Dallas, TX (3-10 staff)", count: "2,847", score: 94 },
  { label: "HVAC owners, owned 5+ yrs, no website", count: "1,203", score: 91 },
  { label: "Auto dealers, <$5M rev, Google Ads buyer", count: "4,102", score: 88 },
  { label: "Dentists w/ 200+ contacts, no CRM", count: "892", score: 85 },
]

const QUERIES = [
  "Small business owners without AI tools",
  "Local service businesses in Texas",
  "B2B SaaS with 10-50 employees",
]

export function AudienceDemo() {
  const [qIdx, setQIdx] = useState(0)
  const [typed, setTyped] = useState("")
  const [showResults, setShowResults] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setTyped("")
    setShowResults(false)
    const target = QUERIES[qIdx]
    let i = 0
    const interval = setInterval(() => {
      if (i < target.length) {
        setTyped(target.slice(0, i + 1))
        i++
      } else {
        clearInterval(interval)
        timerRef.current = setTimeout(() => {
          setShowResults(true)
          timerRef.current = setTimeout(() => {
            setQIdx((s) => (s + 1) % QUERIES.length)
          }, 2200)
        }, 400)
      }
    }, 35)
    return () => { clearInterval(interval); if (timerRef.current) clearTimeout(timerRef.current) }
  }, [qIdx])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Search className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-semibold text-foreground">Audience Intelligence Search</span>
      </div>
      <div className="rounded-sm border border-border bg-card px-3 py-2.5 flex items-center gap-2">
        <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-sm text-foreground flex-1">
          {typed}
          <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="inline-block w-0.5 h-3.5 bg-deep0 ml-0.5 align-middle" />
        </span>
      </div>
      <AnimatePresence>
        {showResults && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-1.5">
            {AUDIENCE_RESULTS.slice(0, 3).map((r) => (
              <div key={r.label} className="flex items-center gap-3 rounded-sm bg-deep border border-border px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground leading-tight">{r.label}</p>
                  <p className="text-[10px] text-muted-foreground">{r.count} matched</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs font-bold text-primary">{r.score}%</div>
                  <div className="text-[10px] text-muted-foreground">match</div>
                </div>
              </div>
            ))}
            <div className="rounded-xl bg-blue-950/30 border border-blue-800 px-3 py-2 text-center">
              <span className="text-xs font-semibold text-blue-400">9,044 total contacts identified · Export to CRM</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
