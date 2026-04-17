"use client"

import { motion } from "framer-motion"
import { X, Check } from "lucide-react"
import { ToolLogo } from "@/components/shared/ToolLogo"

const OLD_AGENCY = [
  "6-month discovery phases before any work begins",
  "Expensive retainers for PowerPoint decks",
  "Junior analysts do the work, partners sell",
  "No implementation - recommendations only",
  "Cookie-cutter frameworks applied to every client",
  "Knowledge walks out the door when the project ends",
  "Siloed teams - strategy never talks to engineering",
  "Success measured in hours billed, not outcomes delivered",
]

const AIMS_PROS = [
  "Engineers embedded in your operations from week one",
  "Custom-scoped engagements tied to measurable outcomes",
  "Senior engineers build and deploy - no handoffs",
  "Production AI shipped into your workflows",
  "Every engagement scoped to your org's specific needs",
  "Full knowledge transfer - your team owns everything",
  "One team owns diagnostic, build, and optimization",
  "Success measured in efficiency gains and deployed systems",
]

const TOOLS = [
  { name: "HubSpot", domain: "hubspot.com" },
  { name: "Salesforce", domain: "salesforce.com" },
  { name: "Instantly", domain: "instantly.ai" },
  { name: "Clay", domain: "clay.com" },
  { name: "Apollo", domain: "apollo.io" },
  { name: "Slack", domain: "slack.com" },
  { name: "Notion", domain: "notion.so" },
  { name: "OpenAI", domain: "openai.com" },
  { name: "LinkedIn", domain: "linkedin.com" },
  { name: "Google Ads", domain: "google.com" },
  { name: "Calendly", domain: "calendly.com" },
  { name: "Airtable", domain: "airtable.com" },
]

export function WhyAIMS() {
  return (
    <section className="py-24 bg-card">
      <div className="mx-auto max-w-6xl px-4">

        {/* Header */}
        <div className="mb-14 max-w-xl">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-4">
            Why AIMS
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Traditional consulting ships decks. We ship production AI.
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            The forward-deployed model: engineers embedded in your operations from day one. Custom AI solutions deployed in 90 days. Outcomes measured in real time.
          </p>
        </div>

        {/* Comparison table */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Old agency */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-border bg-muted p-8"
          >
            <div className="mb-6">
              <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
                Traditional Consulting
              </span>
            </div>
            <ul className="space-y-3.5">
              {OLD_AGENCY.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                    <X className="h-3 w-3 text-muted-foreground" />
                  </span>
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
            className="rounded-2xl border border-primary/20 bg-card p-8 shadow-sm"
          >
            <div className="mb-6">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                AIMS Forward-Deployed Model
              </span>
            </div>
            <ul className="space-y-3.5">
              {AIMS_PROS.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Tool stack ticker */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 rounded-2xl border border-border bg-background py-8"
        >
          <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Your full tech stack, orchestrated by AIMS
          </p>
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-[#F5F5F5] to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-[#F5F5F5] to-transparent" />
            <div className="flex animate-ticker whitespace-nowrap items-end pb-1">
              {[...TOOLS, ...TOOLS].map((tool, i) => (
                <div key={i} className="mx-6 inline-flex flex-col items-center gap-2 flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-border bg-card shadow-sm">
                    <ToolLogo domain={tool.domain} name={tool.name} size={28} />
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight whitespace-nowrap">{tool.name}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
