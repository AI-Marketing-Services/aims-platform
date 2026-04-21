"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Check, Loader2, Plus, X } from "lucide-react"

type Topic = { label: string; query: string }

const PRESETS: Topic[] = [
  { label: "Claude SDK releases", query: "Anthropic Claude SDK release agent" },
  { label: "AI startup funding", query: "AI startup series seed funding round" },
  { label: "LLM benchmarks", query: "LLM benchmark eval leaderboard" },
  { label: "AI regulation", query: "AI regulation EU US executive order policy" },
  { label: "New AI products", query: "new AI product launch ProductHunt" },
  { label: "OpenAI news", query: "OpenAI release announcement product" },
]

const MAX_TOPICS = 5

export default function DailySignalClient() {
  const router = useRouter()
  const [step, setStep] = useState<"topics" | "email">("topics")
  const [topics, setTopics] = useState<Topic[]>([])
  const [customLabel, setCustomLabel] = useState("")
  const [customQuery, setCustomQuery] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedSet = useMemo(() => new Set(topics.map((t) => t.label)), [topics])
  const atLimit = topics.length >= MAX_TOPICS

  function togglePreset(p: Topic) {
    if (selectedSet.has(p.label)) {
      setTopics((cur) => cur.filter((t) => t.label !== p.label))
    } else if (!atLimit) {
      setTopics((cur) => [...cur, p])
    }
  }

  function addCustom(e: React.FormEvent) {
    e.preventDefault()
    const label = customLabel.trim()
    const query = customQuery.trim() || label
    if (!label || selectedSet.has(label) || atLimit) return
    setTopics((cur) => [...cur, { label, query }])
    setCustomLabel("")
    setCustomQuery("")
  }

  function removeTopic(label: string) {
    setTopics((cur) => cur.filter((t) => t.label !== label))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim() || topics.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/lead-magnets/daily-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          topics,
          source: new URLSearchParams(window.location.search).get("utm_source") ?? undefined,
          utmSource: new URLSearchParams(window.location.search).get("utm_source") ?? undefined,
          utmMedium: new URLSearchParams(window.location.search).get("utm_medium") ?? undefined,
          utmCampaign: new URLSearchParams(window.location.search).get("utm_campaign") ?? undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again in a moment.")
        setSubmitting(false)
        return
      }
      router.push(`/tools/daily-signal/confirmed?topics=${encodeURIComponent(topics.length.toString())}`)
    } catch {
      setError("Network error. Try again.")
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[620px] px-6 py-16">
        <header className="mb-12">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50 mb-2">
            FREE TOOL &middot; DAILY DIGEST
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground leading-tight mb-4">
            Daily Signal.
          </h1>
          <p className="text-foreground/70 text-lg leading-relaxed">
            One glance, one minute, every morning. The most important AI news per topic you care about —
            pulled by a council of models, distilled to a headline and a sentence.
          </p>
        </header>

        <AnimatePresence mode="wait">
          {step === "topics" && (
            <motion.section
              key="topics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-primary mb-3">
                  Step 1 &middot; Pick your topics ({topics.length}/{MAX_TOPICS})
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => {
                    const active = selectedSet.has(p.label)
                    const disabled = !active && atLimit
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => togglePreset(p)}
                        disabled={disabled}
                        className={`px-4 py-2 rounded-[2px] border text-sm font-mono transition ${
                          active
                            ? "bg-primary/10 border-primary text-primary"
                            : "border-border/50 text-foreground/70 hover:border-primary/60 hover:text-foreground disabled:opacity-30 disabled:hover:border-border/50"
                        }`}
                      >
                        {active && <Check className="inline h-3 w-3 mr-1.5 -mt-0.5" />}
                        {p.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {topics.some((t) => !PRESETS.find((p) => p.label === t.label)) && (
                <ul className="space-y-2">
                  {topics
                    .filter((t) => !PRESETS.find((p) => p.label === t.label))
                    .map((t) => (
                      <li
                        key={t.label}
                        className="flex items-center gap-3 py-2 border-b border-border/30"
                      >
                        <div className="h-2 w-2 rounded-full shrink-0 bg-primary" />
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-[11px] uppercase tracking-wider text-primary">
                            {t.label}
                          </div>
                          <div className="text-xs text-foreground/50 truncate">{t.query}</div>
                        </div>
                        <button
                          onClick={() => removeTopic(t.label)}
                          className="text-foreground/40 hover:text-foreground transition"
                          aria-label="Remove"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                </ul>
              )}

              {!atLimit && (
                <form onSubmit={addCustom} className="space-y-2 pt-4 border-t border-border/30">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-foreground/50 mb-2">
                    Or add your own
                  </div>
                  <input
                    type="text"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder="Topic label (e.g. Fusion energy breakthroughs)"
                    maxLength={60}
                    className="w-full bg-transparent border-b border-border/40 focus:border-primary outline-none py-2 text-sm font-mono placeholder:text-foreground/30"
                  />
                  <input
                    type="text"
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    placeholder="Search hint (optional, e.g. nuclear fusion reactor milestone)"
                    maxLength={200}
                    className="w-full bg-transparent border-b border-border/40 focus:border-primary outline-none py-2 text-sm placeholder:text-foreground/30"
                  />
                  <button
                    type="submit"
                    disabled={!customLabel.trim()}
                    className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary hover:opacity-80 disabled:opacity-40 pt-2"
                  >
                    <Plus className="h-3 w-3" />
                    add topic
                  </button>
                </form>
              )}

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  disabled={topics.length === 0}
                  className="inline-flex items-center gap-2 bg-primary text-background px-6 py-3 rounded-[2px] font-mono text-xs uppercase tracking-wider hover:bg-primary/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next: email
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.section>
          )}

          {step === "email" && (
            <motion.section
              key="email"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-primary mb-3">
                  Step 2 &middot; Where to send it
                </div>
                <p className="text-foreground/70 text-sm">
                  Delivered every morning at 6am ET. One email. Unsubscribe in one click.
                </p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-foreground/50 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full bg-transparent border-b border-border/50 focus:border-primary outline-none py-2 text-base placeholder:text-foreground/30"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-foreground/50 mb-1.5">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="What to call you"
                    className="w-full bg-transparent border-b border-border/50 focus:border-primary outline-none py-2 text-base placeholder:text-foreground/30"
                  />
                </div>

                <div className="pt-4 border-t border-border/30">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-foreground/50 mb-3">
                    Your topics ({topics.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {topics.map((t) => (
                      <span
                        key={t.label}
                        className="px-3 py-1 rounded-[2px] border border-primary/40 text-primary text-xs font-mono"
                      >
                        {t.label}
                      </span>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="text-xs text-red-400 font-mono">{error}</div>
                )}

                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep("topics")}
                    className="text-xs font-mono uppercase tracking-wider text-foreground/60 hover:text-foreground"
                  >
                    &larr; back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !email.trim()}
                    className="inline-flex items-center gap-2 bg-primary text-background px-6 py-3 rounded-[2px] font-mono text-xs uppercase tracking-wider hover:bg-primary/90 transition disabled:opacity-40"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Start the digest
                  </button>
                </div>
              </form>
            </motion.section>
          )}
        </AnimatePresence>

        <footer className="mt-16 pt-6 border-t border-border/30 font-mono text-[10px] text-foreground/40 flex items-center justify-between">
          <span>Free. No spam. Unsubscribe anytime.</span>
          <Link href="/tools" className="text-primary hover:underline">
            all tools &rarr;
          </Link>
        </footer>
      </div>
    </div>
  )
}
