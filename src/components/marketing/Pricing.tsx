"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { SectionHeader } from "./SectionHeader"

const TIERS = [
  {
    name: "Starter",
    monthlyPrice: 97,
    annualPrice: 82,
    description: "Perfect for single-location businesses getting started with AI-powered marketing.",
    features: [
      "GHL website template",
      "Booking calendar",
      "Basic analytics dashboard",
      "Email support",
      "1 user seat",
    ],
    cta: "Get Started",
    popular: false,
    color: "border-border",
  },
  {
    name: "Growth",
    monthlyPrice: 197,
    annualPrice: 167,
    description: "For growing teams that need CRM, AI chatbot, and pipeline management.",
    features: [
      "Everything in Starter",
      "AI Chatbot on your website",
      "CRM pipeline management",
      "Contact management (5,000 contacts)",
      "3 user seats",
    ],
    cta: "Get Started",
    popular: false,
    color: "border-border",
  },
  {
    name: "Pro",
    monthlyPrice: 297,
    annualPrice: 252,
    description: "Full automation suite for businesses serious about filling their pipeline.",
    features: [
      "Everything in Growth",
      "Email automations & sequences",
      "Lead nurture workflows",
      "SMS follow-up campaigns",
      "10 user seats",
      "Priority support",
    ],
    cta: "Get Started",
    popular: true,
    color: "border-[#DC2626]",
  },
  {
    name: "Elite",
    monthlyPrice: 397,
    annualPrice: 337,
    description: "Maximum automation with voice agent integration and full workflow orchestration.",
    features: [
      "Everything in Pro",
      "Voice agent integration",
      "Full workflow automation",
      "Custom reporting dashboards",
      "Unlimited user seats",
      "Dedicated success manager",
    ],
    cta: "Get Started",
    popular: false,
    color: "border-border",
  },
]

export function Pricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <section className="py-24 bg-secondary/20" id="pricing">
      <div className="container mx-auto max-w-6xl px-4">
        <SectionHeader
          badge="Pricing"
          heading="Simple, Transparent Pricing"
          subheading="Start with what you need. Upgrade as you grow. No long-term contracts."
        />

        {/* Toggle */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card p-1 shadow-sm">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                !annual ? "bg-[#DC2626] text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                annual ? "bg-[#DC2626] text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
              <span className="ml-1.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                Save 15%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`relative flex flex-col rounded-2xl border-2 bg-card p-6 shadow-sm ${tier.color} ${
                tier.popular ? "shadow-lg" : ""
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-[#DC2626] px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">
                    ${annual ? tier.annualPrice : tier.monthlyPrice}
                  </span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{tier.description}</p>
              </div>

              <ul className="mt-6 flex-1 space-y-2.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={`/get-started?tier=${tier.name.toLowerCase()}`}
                className={`mt-8 block rounded-lg py-3 text-center text-sm font-semibold transition ${
                  tier.popular
                    ? "bg-[#DC2626] text-white hover:bg-[#B91C1C]"
                    : "border border-border text-foreground hover:bg-secondary"
                }`}
              >
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          All plans include a 14-day free trial. No credit card required to start.
        </p>
      </div>
    </section>
  )
}
