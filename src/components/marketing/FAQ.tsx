"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus } from "lucide-react"
import { SectionHeader } from "./SectionHeader"

const FAQS = [
  {
    q: "How long until I start seeing results?",
    a: "Most clients see their first booked meetings within 14 days of launch. Full pipeline impact is typically visible within 30-60 days as sequences warm up and AI agents learn your ICP.",
  },
  {
    q: "What industries do you work with?",
    a: "We specialize in B2B businesses across professional services, SaaS, multi-location operators (vending, healthcare, auto), and enterprise sales teams. Our AI is trained on industry-specific data for each vertical.",
  },
  {
    q: "Do I need to go high-level or use specific tools to work with you?",
    a: "No. AIMS is tool-agnostic and integrates with your existing CRM, email, and communication stack. We can deploy on GoHighLevel, HubSpot, Salesforce, or build a clean stack from scratch.",
  },
  {
    q: "What's included in setup vs. ongoing management?",
    a: "Setup includes ICP research, domain warmup, sequence writing, CRM configuration, and AI agent training. Ongoing includes weekly reporting, A/B testing, reply handling, list building, and continuous optimization.",
  },
  {
    q: "How do AI agents handle complex questions?",
    a: "Our AI agents are trained on your specific business, services, and FAQs. Complex questions that require human judgment are escalated to your team instantly via Slack notification, with full conversation context.",
  },
  {
    q: "What does SEO/AEO include monthly?",
    a: "Monthly SEO/AEO includes: content calendar execution (4-8 pieces), technical SEO audits, local citation management, answer engine optimization for ChatGPT/Perplexity/Gemini, and a detailed performance report.",
  },
  {
    q: "How is pricing structured?",
    a: "Core GHL packages start at $97-$397/mo. Outbound campaigns, voice agents, and custom services are priced based on volume and complexity. We offer a 14-day trial and month-to-month contracts on all plans.",
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="py-24 bg-background" id="faq">
      <div className="container mx-auto max-w-3xl px-4">
        <SectionHeader
          badge="FAQ's"
          heading="Common Questions With Clear Answers"
        />

        <div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          {FAQS.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <span className="pr-4 font-medium text-foreground">{faq.q}</span>
                <span className="shrink-0 text-[#DC2626]">
                  {open === i ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
