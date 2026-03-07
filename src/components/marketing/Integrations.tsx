"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { SectionHeader } from "./SectionHeader"

const INTEGRATIONS = [
  { name: "Notion", category: "Productivity" },
  { name: "Google Drive", category: "Storage" },
  { name: "Instantly.ai", category: "Outbound" },
  { name: "ChatGPT", category: "AI" },
  { name: "HubSpot", category: "CRM" },
  { name: "Slack", category: "Comms" },
  { name: "Clay", category: "Enrichment" },
  { name: "Apollo.io", category: "Prospecting" },
]

export function Integrations() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-2 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-700 mb-4">
              Integrations
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Seamless Integrations
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              AIMS deploys directly into your existing stack. No ripping and replacing — we connect
              to the tools your team already uses and make them work together automatically.
            </p>
            <ul className="mt-6 space-y-3">
              {["Works with your existing CRM", "API-first architecture", "Zapier & Make compatible", "No IT setup required"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/get-started"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-6 py-3 text-sm font-semibold text-white hover:bg-[#B91C1C] transition"
            >
              Get Started Now <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Right: stacked integration cards */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 gap-3"
          >
            {INTEGRATIONS.map((integration, i) => (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-sm card-hover"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-foreground">
                  {integration.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{integration.name}</div>
                  <div className="text-xs text-muted-foreground">{integration.category}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
