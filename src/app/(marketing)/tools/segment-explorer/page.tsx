"use client"

import { useState, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Users, TrendingUp, ArrowRight, Lock, Filter, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import segments from "@/data/segments.json"

type Segment = {
  id: string
  name: string
  category: string
  keywords: string[]
  estimatedCount: number
  intentScore: number
  classification: string
  seniority: string
}

const ALL_SENIORITIES = ["All", "C-Suite", "VP", "Director+", "Manager", "Owner", "Individual Contributor"]
const INTENT_FILTERS = [
  { label: "All", min: 0 },
  { label: "High (75+)", min: 75 },
  { label: "Very High (85+)", min: 85 },
]

const VISIBLE_FREE = 5

function intentColor(score: number) {
  if (score >= 85) return "text-green-400 bg-green-900/15"
  if (score >= 70) return "text-yellow-400 bg-yellow-900/15"
  return "text-orange-400 bg-orange-900/15"
}

export default function SegmentExplorerPage() {
  const [query, setQuery] = useState("")
  const [classification, setClassification] = useState<"All" | "B2B" | "B2C">("All")
  const [seniority, setSeniority] = useState("All")
  const [intentMin, setIntentMin] = useState(0)
  const [unlocked, setUnlocked] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedQuery, setDebouncedQuery] = useState("")

  function handleSearch(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(val), 200)
  }

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase()
    return (segments as Segment[])
      .filter((s) => {
        if (classification !== "All" && s.classification !== classification) return false
        if (seniority !== "All" && s.seniority !== seniority) return false
        if (s.intentScore < intentMin) return false
        if (!q) return true
        return (
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.keywords.some((k) => k.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => b.intentScore - a.intentScore)
  }, [debouncedQuery, classification, seniority, intentMin])

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch("/api/lead-magnets/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SEGMENT_EXPLORER",
          email,
          name,
          data: { segmentsViewed: filtered.length, topSegment: filtered[0]?.name },
        }),
      })
    } catch {}
    setSubmitting(false)
    setUnlocked(true)
  }

  const visible = unlocked ? filtered : filtered.slice(0, VISIBLE_FREE)
  const locked = !unlocked && filtered.length > VISIBLE_FREE

  return (
    <div className="min-h-screen bg-deep">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-6">
            <Target className="w-3.5 h-3.5" />
            Free Audience Intelligence Tool
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Explore 100+ B2B Audience Segments
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse pre-built audience segments with intent scores and estimated reach. Find your ideal buyers and see exactly how AIMS would target them.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-6 space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search segments, industries, roles..."
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors",
                showFilters
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:bg-surface"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-3 pt-1">
                  {/* Classification */}
                  <div className="flex items-center gap-1 bg-deep rounded-lg p-1">
                    {(["All", "B2B", "B2C"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setClassification(c)}
                        className={cn(
                          "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                          classification === c
                            ? "bg-card shadow text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  {/* Seniority */}
                  <select
                    value={seniority}
                    onChange={(e) => setSeniority(e.target.value)}
                    className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {ALL_SENIORITIES.map((s) => (
                      <option key={s} value={s}>{s === "All" ? "All Seniority" : s}</option>
                    ))}
                  </select>

                  {/* Intent */}
                  <select
                    value={intentMin}
                    onChange={(e) => setIntentMin(Number(e.target.value))}
                    className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {INTENT_FILTERS.map((f) => (
                      <option key={f.label} value={f.min}>{f.label === "All" ? "All Intent" : f.label}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span> segments found
            {!unlocked && filtered.length > VISIBLE_FREE && (
              <span> — showing {VISIBLE_FREE} of {filtered.length}</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">Sorted by intent score</p>
        </div>

        {/* Segment Cards */}
        <div className="space-y-3 relative">
          {filtered.length === 0 && (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No segments match your filters</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
            </div>
          )}

          {visible.map((seg, idx) => (
            <motion.div
              key={seg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-card border border-border rounded-xl p-5 hover:border-border hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-foreground">{seg.name}</h3>
                    <span className="text-xs px-2 py-0.5 bg-deep text-muted-foreground rounded-full">
                      {seg.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-900/15 text-blue-400 rounded-full">
                      {seg.classification}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-purple-900/15 text-purple-400 rounded-full">
                      {seg.seniority}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      {seg.estimatedCount.toLocaleString()} contacts
                    </div>
                    <div className={cn("flex items-center gap-1.5 text-sm px-2 py-0.5 rounded-full font-medium", intentColor(seg.intentScore))}>
                      <TrendingUp className="w-3.5 h-3.5" />
                      Intent: {seg.intentScore}/100
                    </div>
                  </div>
                  {/* Intent bar */}
                  <div className="mt-3 h-1.5 bg-deep rounded-full max-w-xs">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${seg.intentScore}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.03 }}
                      className={cn(
                        "h-1.5 rounded-full",
                        seg.intentScore >= 85 ? "bg-green-400" : seg.intentScore >= 70 ? "bg-yellow-500" : "bg-orange-400"
                      )}
                    />
                  </div>
                </div>
                {unlocked && (
                  <a
                    href="/get-started"
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Build Campaign
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}

          {/* Lock overlay */}
          {locked && (
            <div className="relative">
              {/* Blurred preview cards */}
              {filtered.slice(VISIBLE_FREE, VISIBLE_FREE + 3).map((seg) => (
                <div key={seg.id} className="bg-card border border-border rounded-xl p-5 mb-3 select-none pointer-events-none" style={{ filter: "blur(4px)", opacity: 0.5 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-5 bg-surface rounded w-48" />
                    <div className="h-5 bg-deep rounded w-20" />
                  </div>
                  <div className="h-4 bg-deep rounded w-32 mt-2" />
                </div>
              ))}

              {/* Gate overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card border border-border rounded-2xl p-8 shadow-xl max-w-md w-full mx-4"
                >
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      Unlock All {filtered.length} Segments
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Enter your details to see the full list plus estimated reach and intent scores for every segment.
                    </p>
                  </div>
                  <form onSubmit={handleUnlock} className="space-y-3">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground/50"
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Work email"
                      className="w-full px-4 py-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground/50"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {submitting ? "Unlocking..." : <>Unlock All Segments <ArrowRight className="w-4 h-4" /></>}
                    </button>
                    <p className="text-xs text-center text-muted-foreground">No spam. Unsubscribe anytime.</p>
                  </form>
                </motion.div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        {unlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 bg-primary rounded-2xl p-8 text-center text-white"
          >
            <h3 className="text-2xl font-bold mb-3">Ready to target one of these segments?</h3>
            <p className="text-muted-foreground mb-6">
              AIMS builds custom AI outbound systems that reach your exact audience — qualified leads delivered to your calendar.
            </p>
            <a
              href="/get-started"
              className="inline-flex items-center gap-2 px-8 py-4 bg-card text-primary font-semibold rounded-xl hover:bg-primary/10 transition-colors"
            >
              Build My Campaign
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        )}
      </div>
    </div>
  )
}
