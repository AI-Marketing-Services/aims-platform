"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Check, ShoppingCart } from "lucide-react"
import { SectionHeader } from "./SectionHeader"
import { useCart } from "@/components/shared/CartContext"

const TIERS = [
  {
    name: "Starter",
    tierId: "starter",
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
    tierId: "growth",
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
    tierId: "pro",
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
    color: "border-primary",
  },
  {
    name: "Elite",
    tierId: "elite",
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
  const { addItem, items } = useCart()

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
                !annual ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                annual ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
              <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
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
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
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
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              {(() => {
                const inCart = items.some((i) => i.tierId === tier.tierId)
                const price = annual ? tier.annualPrice : tier.monthlyPrice
                return (
                  <button
                    onClick={() => addItem({
                      serviceId: `s1-${tier.tierId}`,
                      slug: "website-crm-chatbot",
                      name: "Website + CRM + Chatbot Bundle",
                      tierId: tier.tierId,
                      tierName: tier.name,
                      priceMonthly: price * 100,
                    })}
                    className={`mt-8 w-full flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition ${
                      inCart
                        ? "bg-green-950/30 text-green-400 border border-green-800"
                        : tier.popular
                        ? "bg-primary text-white hover:bg-primary/80"
                        : "border border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    {inCart ? <><Check className="w-3.5 h-3.5" /> Added to Cart</> : <><ShoppingCart className="w-3.5 h-3.5" /> {tier.cta}</>}
                  </button>
                )
              })()}
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          All plans include a 14-day free trial. No credit card required to start.
        </p>

        {/* Enterprise row */}
        <div className="mt-6 rounded-2xl border border-border bg-deep px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground">Need a custom solution?</p>
            <p className="text-sm text-muted-foreground">Multi-location, white-label, or full RevOps build — let&apos;s scope it together.</p>
          </div>
          <Link
            href="/get-started?ref=pricing-enterprise"
            className="shrink-0 rounded-sm bg-primary text-white px-6 py-2.5 text-sm font-semibold hover:bg-primary/80 transition"
          >
            Book a Consultation →
          </Link>
        </div>

        {/* Cross-sell */}
        <div className="mt-16">
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-6">
            Most clients bundle their website with these services
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: "Cold Outbound Engine", desc: "Fill your new website with qualified leads", href: "/get-started?service=cold-outbound", badge: "Custom pricing" },
              { name: "AI Voice Agent Platform", desc: "Handle inbound calls 24/7 while you sleep", href: "/get-started?service=voice-agents", badge: "Custom pricing" },
              { name: "SEO & AEO Automation", desc: "Rank on Google and get cited by AI search", href: "/marketplace#seo-aeo", badge: "From $497/mo" },
            ].map((item) => (
              <div key={item.name} className="rounded-sm border border-border bg-card p-5 flex flex-col gap-3">
                <div>
                  <p className="font-semibold text-foreground text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs text-muted-foreground">{item.badge}</span>
                  <Link href={item.href} className="text-xs font-semibold text-primary hover:underline">
                    Learn more →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
