"use client"

import { motion } from "framer-motion"
import { Shield, DollarSign, Zap, Briefcase, BarChart2, Clock } from "lucide-react"
import { SectionHeader } from "./SectionHeader"

const BENEFITS = [
  {
    icon: Shield,
    title: "Battle-Tested Systems",
    desc: "Proven playbooks refined across 500+ clients and millions in pipeline generated.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: DollarSign,
    title: "Lower Cost Per Lead",
    desc: "AI infrastructure slashes CAC vs traditional agencies — same output, fraction of the cost.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: Zap,
    title: "AI-Powered Scale",
    desc: "Scale from 100 to 10,000 outreach touches per day without adding headcount.",
    color: "bg-yellow-50 text-yellow-600",
  },
  {
    icon: Briefcase,
    title: "Full Service Execution",
    desc: "We handle everything end-to-end — strategy, build, launch, reporting, optimization.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: BarChart2,
    title: "Industry Intelligence",
    desc: "Deep expertise in your vertical means faster ramp times and higher reply rates.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: Clock,
    title: "Speed to Lead",
    desc: "AI agents respond to inbound leads in seconds — before your competitor even wakes up.",
    color: "bg-red-50 text-red-600",
  },
]

export function Benefits() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto max-w-6xl px-4">
        <SectionHeader
          badge="Benefits"
          heading="Benefits That Truly Matter To Our Clients"
          subheading="Proven infrastructure. AI-powered execution. Results you can measure."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="flex gap-4 rounded-xl border border-border bg-white p-6 shadow-sm card-hover"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${benefit.color}`}>
                <benefit.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
