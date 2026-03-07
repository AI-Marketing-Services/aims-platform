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
]

export function Benefits() {
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
            <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
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

          {/* Right: benefit list */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-5"
          >
            {BENEFITS.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                className="flex gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-sm"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#DC2626]" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{benefit.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{benefit.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  )
}
