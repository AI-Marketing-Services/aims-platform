"use client"

import { motion } from "framer-motion"

const STEPS = [
  {
    num: "01",
    title: "Discovery & Diagnostic",
    desc: "We embed with your team for a deep operational audit. Our engineers map every department, identify time sinks, and build your AI opportunity map.",
    items: ["Operational audit", "Department mapping", "Time sink analysis", "AI opportunity map"],
  },
  {
    num: "02",
    title: "Deploy & Integrate",
    desc: "Forward-deployed engineers build and install custom AI solutions directly in your workflows. No handoffs, no documentation gaps.",
    items: ["Custom AI builds", "Workflow integration", "Direct embedding", "Zero handoff delivery"],
  },
  {
    num: "03",
    title: "Measure & Expand",
    desc: "We track efficiency gains, ROI, and expansion opportunities. Your team gets smarter every quarter.",
    items: ["Efficiency tracking", "ROI measurement", "Expansion scoping", "Quarterly reviews"],
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 bg-card">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-16 max-w-xl">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-4">
            How It Works
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            From diagnostic to deployed in 90 days
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            A proven three-phase process. Our forward-deployed engineers embed with your team to find, build, and ship production AI.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative rounded-2xl border border-border bg-background p-7 hover:border-primary/30 transition-colors"
            >
              {/* Step number */}
              <span className="text-[4rem] font-black leading-none text-muted-foreground/20 select-none">
                {step.num}
              </span>

              <h3 className="mt-1 text-lg font-bold text-foreground">{step.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>

              <ul className="mt-6 space-y-2.5">
                {step.items.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-foreground/80">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div className="absolute hidden md:block top-[4.5rem] left-full w-4 h-px bg-border z-10" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Timeline bar */}
        <div className="mt-10 flex items-center gap-0 overflow-hidden rounded-sm border border-border bg-card">
          {[
            { week: "Week 1–3", label: "Discovery & Diagnostic", color: "bg-[#E8C46A]" },
            { week: "Week 3–8", label: "Deploy & Integrate", color: "bg-primary" },
            { week: "Week 8+", label: "Measure & Expand", color: "bg-[#8B6914]" },
          ].map((phase, i) => (
            <div key={phase.label} className="flex-1 border-r border-border last:border-r-0 px-5 py-3.5">
              <div className={`mb-1.5 h-1 w-8 rounded-full ${phase.color}`} />
              <p className="text-xs font-semibold text-foreground">{phase.week}</p>
              <p className="text-xs text-muted-foreground">{phase.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
