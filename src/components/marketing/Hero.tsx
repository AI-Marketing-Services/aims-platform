"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, TrendingUp, Users, Zap, CheckCircle, Circle } from "lucide-react"

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const PIPELINE_STAGES = [
  { label: "New Lead", count: 142, color: "#6366F1", pct: 100 },
  { label: "Qualified", count: 89, color: "#2563EB", pct: 63 },
  { label: "Demo Booked", count: 54, color: "#16A34A", pct: 38 },
  { label: "Proposal", count: 31, color: "#EA580C", pct: 22 },
  { label: "Closed Won", count: 18, color: "#DC2626", pct: 13 },
]

const RECENT_LEADS = [
  { company: "Apex Auto Group", service: "AI Calling Agent", status: "booked", ago: "4m ago" },
  { company: "TrueNorth Capital", service: "Outbound Campaigns", status: "qualified", ago: "11m ago" },
  { company: "Meridian Health", service: "RevOps Pipeline", status: "new", ago: "23m ago" },
]

const STATUS_CONFIG = {
  booked: { label: "Meeting Booked", dot: "bg-green-500" },
  qualified: { label: "Qualified", dot: "bg-blue-500" },
  new: { label: "New Lead", dot: "bg-gray-400" },
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#FAFAFA] pt-28 pb-16 md:pt-36 md:pb-24">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-[-120px] -translate-x-1/2 h-[560px] w-[560px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(220,38,38,0.07) 0%, transparent 65%)" }}
      />

      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial="initial"
          animate="animate"
          className="flex flex-col items-center text-center"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className="mb-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-200/80 bg-white px-4 py-1.5 text-sm font-medium text-red-700 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              AI-Managed Growth Infrastructure
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="max-w-4xl text-[2.75rem] font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-[4rem]"
          >
            The operating system
            <br />
            for{" "}
            <span
              style={{
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundImage: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)",
                backgroundClip: "text",
              }}
            >
              AI-powered growth
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-xl text-lg text-gray-500 leading-relaxed"
          >
            AIMS builds and runs your outbound engine, AI calling systems, and pipeline operations
            — so your team closes deals, not chases them.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-red-100 transition hover:bg-[#B91C1C] hover:shadow-lg hover:shadow-red-100"
            >
              Book a Strategy Call
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-7 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
            >
              Browse Services
            </Link>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-4 text-xs text-gray-400">
            No retainer lock-in &middot; Results in 30 days or your money back
          </motion.p>

          {/* Dashboard preview card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 w-full max-w-3xl"
          >
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-100/80">
              {/* Card header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <span className="text-xs font-medium text-gray-400">AIMS Pipeline — Live View</span>
                <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              </div>

              <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                {/* Pipeline funnel */}
                <div className="p-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Pipeline Stages
                  </p>
                  <div className="space-y-2.5">
                    {PIPELINE_STAGES.map((stage) => (
                      <div key={stage.label} className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-xs text-gray-500">{stage.label}</span>
                        <div className="flex-1 overflow-hidden rounded-full bg-gray-100 h-1.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stage.pct}%` }}
                            transition={{ duration: 0.8, delay: 0.6 + PIPELINE_STAGES.indexOf(stage) * 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                        </div>
                        <span className="w-8 shrink-0 text-right text-xs font-semibold text-gray-700">
                          {stage.count}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* MRR chip */}
                  <div className="mt-5 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <span className="text-xs text-gray-500">Pipeline Value</span>
                    <span className="text-sm font-bold text-gray-900">$284,000</span>
                  </div>
                </div>

                {/* Recent leads */}
                <div className="p-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Recent Leads
                  </p>
                  <div className="space-y-3">
                    {RECENT_LEADS.map((lead) => {
                      const config = STATUS_CONFIG[lead.status as keyof typeof STATUS_CONFIG]
                      return (
                        <div
                          key={lead.company}
                          className="flex items-start justify-between rounded-xl bg-gray-50 px-3.5 py-3"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{lead.company}</p>
                            <p className="mt-0.5 text-xs text-gray-400">{lead.service}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                              <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                              {config.label}
                            </span>
                            <span className="text-[10px] text-gray-400">{lead.ago}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center justify-center gap-8 sm:gap-12"
          >
            {[
              { icon: TrendingUp, value: "3.2x", label: "Avg. pipeline increase" },
              { icon: Users, value: "500+", label: "Clients served" },
              { icon: Zap, value: "14 days", label: "Time to first meeting" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-red-50">
                  <Icon className="h-4 w-4 text-[#DC2626]" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
