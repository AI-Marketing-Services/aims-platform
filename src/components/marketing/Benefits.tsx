"use client"

import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

const METRICS = [
  { value: "40%", label: "Average operational efficiency gain" },
  { value: "90d", label: "Average time from diagnostic to deployed AI" },
  { value: "3", label: "Flagship engagements, custom-scoped to your org" },
  { value: "12+", label: "Industries with forward-deployed experience" },
]

const BENEFITS = [
  {
    title: "Engineers embedded in your operations",
    desc: "Our forward-deployed engineers sit inside your workflows, not in a separate office. They see what your team sees and build solutions that actually fit.",
  },
  {
    title: "Production AI, not PowerPoint decks",
    desc: "We ship working AI systems into your operations, not strategy documents that collect dust. Every engagement ends with deployed, measurable technology.",
  },
  {
    title: "90-day deployment, not 12-month timelines",
    desc: "From diagnostic to production AI in 90 days. No drawn-out discovery phases or scope creep. We move at operator speed.",
  },
  {
    title: "End-to-end ownership, zero handoffs",
    desc: "The same engineers who diagnose the problem build and deploy the solution. No documentation gaps, no lost context between teams.",
  },
  {
    title: "Industry-specific operational intelligence",
    desc: "Deep vertical expertise across B2B services, SaaS, multi-location operators, and enterprise. We know where the time sinks hide in your industry.",
  },
  {
    title: "AI that works alongside your existing team",
    desc: "We augment your people, not replace them. Our solutions integrate into the tools and workflows your team already uses daily.",
  },
  {
    title: "Measurable efficiency gains from day one",
    desc: "Every engagement is instrumented to track hours saved, costs reduced, and throughput gained. You see the ROI in real time.",
  },
  {
    title: "Custom-scoped to your organization",
    desc: "No cookie-cutter packages. Every engagement is scoped to your company size, tech stack, and operational complexity.",
  },
  {
    title: "Continuous optimization, not one-time projects",
    desc: "Our engineers stay embedded to measure results, iterate on solutions, and identify the next highest-value AI opportunities.",
  },
  {
    title: "Full knowledge transfer built in",
    desc: "Your team learns to operate and extend every system we build. We leave your organization smarter, not dependent.",
  },
  {
    title: "Cross-department AI opportunity mapping",
    desc: "We audit every department - sales, ops, finance, marketing - to find the biggest time sinks and highest-ROI automation targets.",
  },
  {
    title: "Enterprise-grade security and compliance",
    desc: "Every deployment follows your security policies. Data stays in your infrastructure. No third-party black boxes.",
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
              Operational efficiency
              <br />
              through AI transformation
            </h2>
            <p className="mt-4 text-base text-muted-foreground max-w-sm">
              Forward-deployed engineers that embed in your operations. Results measured in hours saved, costs reduced, and systems deployed, not slide decks delivered.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {METRICS.map((m, i) => (
                <motion.div
                  key={m.value}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="rounded-sm border border-border bg-card p-5 shadow-sm"
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

            {/* Ticker track - translateY(-33.333%) for seamless loop */}
            <div className="animate-ticker-vertical flex flex-col gap-4 will-change-transform">
              {track.map((benefit, i) => (
                <div
                  key={i}
                  className="flex gap-4 rounded-sm border border-border bg-card px-5 py-4 shadow-sm flex-shrink-0"
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
