"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

const SERVICES = [
  {
    name: "Outbound Lead Campaigns",
    slug: "cold-outbound",
    desc: "Multi-domain email infrastructure, AI SDR reply handling, auto-enrichment, and deliverability monitoring — all managed end-to-end.",
    tags: ["Email Sequences", "AI SDR", "Lead Enrichment"],
    outcome: "Avg. 47 qualified meetings / mo",
    pillar: "Sales",
    pillarColor: "#2563EB",
    tools: ["instantly.ai", "clay.com", "apollo.io"],
    size: "large",
  },
  {
    name: "AI Calling Agents",
    slug: "voice-agents",
    desc: "Inbound and outbound AI voice agents with multi-location routing, live transcripts, and CRM sync.",
    tags: ["Voice AI", "Inbound", "Outbound"],
    outcome: "2.4x pickup-to-meeting rate",
    pillar: "Sales",
    pillarColor: "#2563EB",
    tools: ["bland.ai", "twilio.com"],
    size: "normal",
  },
  {
    name: "Lead Reactivation",
    slug: "lead-reactivation",
    desc: "Turn dead CRM contacts into booked meetings using AI personalization and multi-channel reactivation sequences.",
    tags: ["Reactivation", "AI Copy", "Multi-Channel"],
    outcome: "14-day avg. time to first meeting",
    pillar: "Marketing",
    pillarColor: "#16A34A",
    tools: ["hubspot.com", "instantly.ai"],
    size: "normal",
  },
  {
    name: "RevOps Pipeline",
    slug: "revops-pipeline",
    desc: "CRM architecture, lead routing, attribution tracking, conversion dashboards, and rep coaching — built for revenue teams.",
    tags: ["CRM Build", "Routing", "Attribution"],
    outcome: "Full pipeline visibility in 7 days",
    pillar: "Operations",
    pillarColor: "#EA580C",
    tools: ["salesforce.com", "hubspot.com", "notion.so"],
    size: "normal",
  },
  {
    name: "Content Production Pod",
    slug: "content-production",
    desc: "Weekly content calendar execution: LinkedIn posts, newsletters, short-form video scripts, and SEO articles — AI-written, human-edited.",
    tags: ["LinkedIn", "Newsletter", "SEO"],
    outcome: "20+ assets per month delivered",
    pillar: "Marketing",
    pillarColor: "#16A34A",
    tools: ["notion.so", "slack.com"],
    size: "normal",
  },
  {
    name: "Paid Ads Management",
    slug: "paid-ads",
    desc: "Google, Meta, and LinkedIn ad management with weekly optimization, creative testing, and ROI dashboards.",
    tags: ["Google Ads", "Meta", "LinkedIn"],
    outcome: "Avg. 4.1x ROAS across accounts",
    pillar: "Marketing",
    pillarColor: "#16A34A",
    tools: ["google.com", "facebook.com", "linkedin.com"],
    size: "normal",
  },
]

function ToolLogo({ domain }: { domain: string }) {
  return (
    <img
      src={`https://logo.clearbit.com/${domain}?size=48`}
      alt={domain}
      width={20}
      height={20}
      className="h-5 w-5 rounded object-contain grayscale opacity-50 group-hover:opacity-80 transition-opacity"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none"
      }}
    />
  )
}

export function ServicesGrid() {
  const large = SERVICES.filter((s) => s.size === "large")
  const normal = SERVICES.filter((s) => s.size === "normal")

  return (
    <section className="py-24 bg-background">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-14">
          <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Core Services
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Every way we fill your pipeline
          </h2>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Outbound. Inbound. Reactivation. Content. Paid. All AI-powered, all fully managed.
          </p>
        </div>

        {/* Large card */}
        {large.map((service, i) => (
          <motion.div
            key={service.slug}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <Link
              href={`/services/${service.slug}`}
              className="group flex flex-col sm:flex-row items-start justify-between gap-6 rounded-2xl border border-border bg-card p-7 shadow-sm hover:border-gray-300 hover:shadow-md transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: service.pillarColor }}
                  >
                    {service.pillar}
                  </span>
                  {service.tools.map((t) => (
                    <ToolLogo key={t} domain={t} />
                  ))}
                </div>
                <h3 className="text-xl font-bold text-foreground group-hover:text-[#DC2626] transition-colors">
                  {service.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xl">{service.desc}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {service.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end justify-between self-stretch gap-4 min-w-[180px]">
                <div className="rounded-xl border border-border bg-muted px-4 py-3 text-right">
                  <p className="text-xs text-muted-foreground mb-0.5">Client outcome</p>
                  <p className="text-sm font-bold text-foreground">{service.outcome}</p>
                </div>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-[#DC2626] group-hover:gap-2.5 transition-all">
                  Get this service
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}

        {/* Normal cards grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {normal.map((service, i) => (
            <motion.div
              key={service.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
            >
              <Link
                href={`/services/${service.slug}`}
                className="group flex flex-col h-full rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-gray-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: service.pillarColor }}
                  >
                    {service.pillar}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {service.tools.map((t) => (
                      <ToolLogo key={t} domain={t} />
                    ))}
                  </div>
                </div>

                <h3 className="text-base font-bold text-foreground group-hover:text-[#DC2626] transition-colors">
                  {service.name}
                </h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">{service.desc}</p>

                <div className="mt-4 rounded-lg bg-muted px-3.5 py-2.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground/80">Outcome: </span>
                  {service.outcome}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {service.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-[#DC2626] transition-colors" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View all */}
        <div className="mt-10 text-center">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground/80 shadow-sm hover:border-gray-300 hover:bg-muted transition"
          >
            View all 12 services
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
