"use client"

import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

const METRICS = [
  { value: "3.2x", label: "Average pipeline increase within 90 days" },
  { value: "$284", label: "Average cost per qualified meeting" },
  { value: "14d", label: "Average days to first booked meeting" },
  { value: "500+", label: "Companies served across 12 industries" },
]

const BENEFITS = [
  {
    title: "Battle-tested systems, not experiments",
    desc: "Every playbook is proven across hundreds of clients. You're buying execution certainty, not agency trial-and-error.",
  },
  {
    title: "AI infrastructure at a fraction of the cost",
    desc: "We run AI SDRs, voice agents, and automated sequences at scale — with lower CAC than any traditional agency can offer.",
  },
  {
    title: "Speed to pipeline that agencies can't match",
    desc: "Warmed domains, live sequences, and deployed AI agents within two weeks of kickoff. No 3-month ramp period.",
  },
  {
    title: "End-to-end ownership, zero handoffs",
    desc: "Strategy, build, copy, launch, optimization — one team handles everything with weekly transparent reporting.",
  },
  {
    title: "Industry-specific intelligence baked in",
    desc: "Deep vertical expertise means faster ramp times, higher reply rates, and sequences that actually convert in your market.",
  },
  {
    title: "AI agents respond before your competitor wakes up",
    desc: "Inbound leads are engaged in seconds — not hours. Automated qualification and routing that never sleeps.",
  },
  {
    title: "Zero-ramp cold outreach infrastructure",
    desc: "Pre-warmed domains, validated contact lists, and copy that lands in primary inboxes — not spam folders.",
  },
  {
    title: "Revenue attribution on every campaign",
    desc: "Closed-loop reporting shows exactly which sequences, channels, and messages drove pipeline and closed deals.",
  },
  {
    title: "Multi-channel orchestration from one team",
    desc: "Email, LinkedIn, calling, and retargeting — synchronized sequences that follow your prospect across every channel.",
  },
  {
    title: "Predictable meeting flow, every week",
    desc: "No feast-or-famine cycles. Consistent qualified meetings booked automatically so your closers stay busy.",
  },
  {
    title: "Reactivate pipeline you left on the table",
    desc: "AI-powered re-engagement sequences resurrect cold leads with personalized context — often 3–5x ROI from your existing database.",
  },
  {
    title: "Built for your market, not the last client's",
    desc: "Every ICP, sequence, and agent is configured specifically for your industry, offer, and competitive landscape.",
  },
]

export function Benefits() {
  // Triple the list so the loop is seamless at any viewport height
  const track = [...BENEFITS, ...BENEFITS, ...BENEFITS]

  return (
    <section className="py-24 bg-background">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24 lg:items-center">

          {/* Left: metrics */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-6">
              Why AIMS Works
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Our clients add
              <br />
              $700K–$1M to their pipeline
            </h2>
            <p className="mt-4 text-base text-muted-foreground max-w-sm">
              Proven infrastructure, AI-powered execution. Results measured in qualified meetings and closed revenue — not impressions.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {METRICS.map((m, i) => (
                <motion.div
                  key={m.value}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="text-3xl font-extrabold text-foreground">{m.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground leading-snug">{m.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: vertical auto-scrolling benefit ticker */}
          <div className="relative h-[480px] overflow-hidden">
            {/* Fade top/bottom edges */}
            <div className="pointer-events-none absolute top-0 left-0 right-0 z-10 h-16 bg-gradient-to-b from-background to-transparent" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-16 bg-gradient-to-t from-background to-transparent" />

            {/* Ticker track — translateY(-33.333%) for seamless loop */}
            <div className="animate-ticker-vertical flex flex-col gap-4 will-change-transform">
              {track.map((benefit, i) => (
                <div
                  key={i}
                  className="flex gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-sm flex-shrink-0"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{benefit.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
