"use client"

import { motion } from "framer-motion"
import { X, Check } from "lucide-react"

const OLD_AGENCY = [
  "Slow 90-day onboarding",
  "High retainer with no guarantees",
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
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-6xl px-4">

        {/* Header */}
        <div className="mb-14 max-w-xl">
          <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
            Why AIMS
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            The old agency model is broken
          </h2>
          <p className="mt-3 text-base text-gray-500">
            AIMS is built for how modern B2B sales actually works — fast, data-driven, and AI-powered from day one.
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
            className="rounded-2xl border border-gray-200 bg-gray-50 p-8"
          >
            <div className="mb-6">
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-500">
                Traditional Agency
              </span>
            </div>
            <ul className="space-y-3.5">
              {OLD_AGENCY.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200">
                    <X className="h-3 w-3 text-gray-400" />
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
            className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm"
          >
            <div className="mb-6">
              <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                AIMS
              </span>
            </div>
            <ul className="space-y-3.5">
              {AIMS_PROS.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium text-gray-900">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-50">
                    <Check className="h-3 w-3 text-[#DC2626]" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Tool stack grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 rounded-2xl border border-gray-200 bg-[#FAFAFA] p-8"
        >
          <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
            Your full tech stack, orchestrated by AIMS
          </p>
          <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-12">
            {TOOLS.map((tool) => (
              <div
                key={tool.domain}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm group-hover:shadow-md transition-shadow">
                  <img
                    src={`https://logo.clearbit.com/${tool.domain}?size=48`}
                    alt={tool.name}
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain grayscale group-hover:grayscale-0 transition-all"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 text-center leading-tight">{tool.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  )
}
