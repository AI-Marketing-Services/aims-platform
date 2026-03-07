"use client"

import { motion } from "framer-motion"

const STEPS = [
  {
    num: "01",
    title: "Strategy & ICP Dive",
    desc: "We audit your current pipeline, define your Ideal Customer Profile, identify gaps, and design a campaign roadmap scoped to your specific revenue target.",
    items: ["Pipeline audit", "ICP definition", "Channel selection", "Campaign roadmap"],
  },
  {
    num: "02",
    title: "Build & Launch",
    desc: "We configure warmed email domains, write personalized sequences, deploy AI calling agents, and connect your CRM — all live within two weeks of kickoff.",
    items: ["Domain warmup", "Sequence writing", "AI agent setup", "CRM integration"],
  },
  {
    num: "03",
    title: "Optimize & Scale",
    desc: "Weekly performance reviews, A/B testing, and continuous iteration. We cut what underperforms and scale what drives qualified pipeline — every single week.",
    items: ["Weekly reporting", "A/B testing", "CAC reduction", "Scale winners"],
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 bg-card">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-16 max-w-xl">
          <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            How It Works
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            From kickoff to calendar-full in 30 days
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            A proven three-phase process built to generate qualified meetings fast — not six months from now.
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
              className="relative rounded-2xl border border-border bg-background p-7 hover:border-gray-300 transition-colors"
            >
              {/* Step number */}
              <span className="text-[4rem] font-black leading-none text-gray-300 select-none">
                {step.num}
              </span>

              <h3 className="mt-1 text-lg font-bold text-foreground">{step.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>

              <ul className="mt-6 space-y-2.5">
                {step.items.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-foreground/80">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-50">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div className="absolute hidden md:block top-[4.5rem] left-full w-4 h-px bg-gray-200 z-10" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Timeline bar */}
        <div className="mt-10 flex items-center gap-0 overflow-hidden rounded-xl border border-border bg-card">
          {[
            { week: "Week 1–2", label: "Strategy & Setup", color: "bg-[#FCA5A5]" },
            { week: "Week 2–3", label: "Build & Launch", color: "bg-[#DC2626]" },
            { week: "Week 4+", label: "Optimize & Scale", color: "bg-[#991B1B]" },
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
