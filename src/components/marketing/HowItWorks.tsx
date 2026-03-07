"use client"

import { motion } from "framer-motion"
import { Search, Rocket, TrendingUp } from "lucide-react"
import { SectionHeader } from "./SectionHeader"

const STEPS = [
  {
    num: "01",
    icon: Search,
    title: "Strategy & ICP Dive",
    desc: "We audit your current pipeline, define your Ideal Customer Profile, and identify the highest-ROI campaigns for your business.",
    items: ["Pipeline audit", "ICP definition", "Campaign roadmap"],
  },
  {
    num: "02",
    icon: Rocket,
    title: "Build & Launch",
    desc: "We spin up warmed email domains, write personalized sequences, configure voice agents, and connect your CRM — all in under 2 weeks.",
    items: ["Domain warmup", "Sequence writing", "AI agent setup", "CRM integration"],
  },
  {
    num: "03",
    icon: TrendingUp,
    title: "Optimize & Scale",
    desc: "Weekly reporting, A/B testing, and continuous optimization. We scale what's working and cut what isn't — driving down CAC every month.",
    items: ["Weekly reporting", "A/B testing", "CAC reduction", "Scale winners"],
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 bg-secondary/20">
      <div className="container mx-auto max-w-6xl px-4">
        <SectionHeader
          badge="How It Works"
          heading="Get Booked Meetings In 3 Simple Steps"
          subheading="From kickoff to calendar-filling pipeline in 30 days or less."
        />

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative rounded-2xl border border-border bg-white p-8 shadow-sm"
            >
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="absolute hidden md:block top-12 left-full w-8 h-px bg-border z-10" />
              )}

              {/* Step number */}
              <div className="mb-4 text-5xl font-black text-red-100 leading-none">{step.num}</div>

              {/* Icon */}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-[#DC2626]">
                <step.icon className="h-6 w-6" />
              </div>

              <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>

              {/* Checklist */}
              <ul className="mt-5 space-y-2">
                {step.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
