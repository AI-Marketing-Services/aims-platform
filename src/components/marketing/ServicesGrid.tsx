"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, Phone, RotateCcw, FileText, Database, BarChart2 } from "lucide-react"
import { SectionHeader } from "./SectionHeader"

const SERVICES = [
  {
    icon: Mail,
    name: "Outbound Lead Campaigns",
    slug: "cold-outbound",
    desc: "Multi-domain email infrastructure with AI SDR reply handling and auto-enrichment.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: BarChart2,
    name: "RevOps Pipeline",
    slug: "revops-pipeline",
    desc: "CRM cleanup, lead routing, attribution tracking, and conversion dashboards.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Phone,
    name: "AI Calling Agents",
    slug: "voice-agents",
    desc: "Inbound and outbound AI calling with multi-location routing and live transcripts.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: FileText,
    name: "Content Production Pod",
    slug: "content-production",
    desc: "AI-powered content creation with human review and multi-channel distribution.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: RotateCcw,
    name: "Lead Reactivation",
    slug: "lead-reactivation",
    desc: "AI-powered campaigns that turn dead CRM leads into booked meetings in 14 days.",
    color: "bg-red-50 text-red-600",
  },
  {
    icon: Database,
    name: "Database Reactivation",
    slug: "database-reactivation",
    desc: "Clean, route, and re-engage your full contact database with personalized sequences.",
    color: "bg-cyan-50 text-cyan-600",
  },
]

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

export function ServicesGrid() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto max-w-6xl px-4">
        <SectionHeader
          badge="Core Services"
          heading="Every Way We Put Leads On Your Calendar"
          subheading="Outbound. Inbound. Reactivation. AI-powered and human-optimized."
        />

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.slug}
              variants={cardVariants}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Link
                href={`/services/${service.slug}`}
                className="group flex flex-col h-full rounded-xl border border-border bg-white p-6 shadow-sm card-hover"
              >
                {/* Illustration area */}
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${service.color}`}>
                  <service.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground group-hover:text-[#DC2626] transition-colors">
                  {service.name}
                </h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
                  {service.desc}
                </p>
                <div className="mt-4 text-sm font-medium text-[#DC2626] flex items-center gap-1">
                  Learn more <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-12 text-center">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-6 py-3 text-sm font-semibold text-foreground shadow-sm hover:bg-secondary transition"
          >
            View all services →
          </Link>
        </div>
      </div>
    </section>
  )
}
