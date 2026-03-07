"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

const INTEGRATIONS = [
  { name: "HubSpot", category: "CRM", src: "/integrations/hubspot-svgrepo-com.svg" },
  { name: "Salesforce", category: "CRM", src: "/integrations/salesforce.svg" },
  { name: "Instantly", category: "Outbound", src: "/integrations/instantly.webp" },
  { name: "Slack", category: "Comms", src: "/integrations/slack.svg" },
  { name: "Apollo", category: "Prospecting", src: "/integrations/apollo.svg" },
  { name: "Notion", category: "Productivity", src: "/integrations/notion.svg" },
  { name: "OpenAI", category: "AI", src: "/integrations/openai-svgrepo-com.svg" },
  { name: "Google Drive", category: "Storage", src: "/integrations/google-drive-svgrepo-com.svg" },
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

          {/* Right: integration cards with real logos */}
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
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
              >
                <div className="relative w-8 h-8 flex-shrink-0">
                  <Image
                    src={integration.src}
                    alt={integration.name}
                    fill
                    className="object-contain"
                    sizes="32px"
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{integration.name}</div>
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
