"use client"

import { motion } from "framer-motion"
import { X, Check } from "lucide-react"
import { SectionHeader } from "./SectionHeader"

const OLD_AGENCY = [
  "Slow 90-day onboarding",
  "High retainer with no guarantee",
  "One-size-fits-all strategy",
  "Manually reviewed campaigns",
  "Lagging monthly reports",
  "No AI-powered personalization",
  "You own nothing when you leave",
]

const AIMS_PROS = [
  "Live in under 2 weeks",
  "Performance-tied pricing available",
  "ICP-specific strategy built for you",
  "AI-automated + human-reviewed",
  "Real-time dashboards & weekly calls",
  "Claude-powered personalization at scale",
  "You keep all assets, data & workflows",
]

const HUB_TOOLS = [
  { label: "HubSpot", angle: 0 },
  { label: "Instantly", angle: 51 },
  { label: "Clay", angle: 102 },
  { label: "Apollo", angle: 154 },
  { label: "Slack", angle: 205 },
  { label: "GHL", angle: 257 },
  { label: "Claude AI", angle: 308 },
]

export function WhyAIMS() {
  return (
    <section className="py-24 bg-secondary/20">
      <div className="container mx-auto max-w-6xl px-4">
        <SectionHeader
          badge="Why AIMS"
          heading="A Smarter Way To Grow Your Business"
          subheading="The old agency model is broken. AIMS is built for how modern B2B sales actually works."
        />

        {/* Comparison table */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Old agency */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-border bg-secondary/50 p-8"
          >
            <div className="mb-6 inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              The Old Agency Model
            </div>
            <ul className="space-y-3">
              {OLD_AGENCY.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <X className="h-4 w-4 shrink-0 text-red-400" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* AIMS */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border-2 border-[#DC2626] bg-white p-8 shadow-md"
          >
            <div className="mb-6 inline-block rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 border border-red-200">
              AIMS
            </div>
            <ul className="space-y-3">
              {AIMS_PROS.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <Check className="h-4 w-4 shrink-0 text-[#DC2626]" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Hub-and-spoke diagram */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20 text-center"
        >
          <p className="mb-8 text-sm font-medium text-muted-foreground uppercase tracking-wider">
            All your tools, orchestrated by AIMS
          </p>
          <div className="relative mx-auto h-64 w-64">
            {/* Center */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#DC2626] shadow-lg">
              <span className="text-lg font-black text-white">AIMS</span>
            </div>
            {/* Orbiting tools */}
            {HUB_TOOLS.map((tool) => {
              const rad = (tool.angle * Math.PI) / 180
              const r = 100
              const x = 50 + r * Math.cos(rad)
              const y = 50 + r * Math.sin(rad)
              return (
                <div
                  key={tool.label}
                  className="absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border border-border bg-white shadow-sm text-[10px] font-semibold text-foreground"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  {tool.label.split(" ")[0]}
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
