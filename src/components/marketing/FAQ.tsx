"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus } from "lucide-react"
import { SectionHeader } from "./SectionHeader"

const FAQS = [
  {
    q: "How long until I start seeing results?",
    a: "Our forward-deployed engineers begin the operational diagnostic in week one. Most clients see their first deployed AI solutions within 60 days, with measurable efficiency gains tracked from day one of deployment.",
  },
  {
    q: "What industries do you work with?",
    a: "We specialize in B2B businesses across professional services, SaaS, multi-location operators (vending, healthcare, auto), and enterprise teams. Our engineers have deep vertical expertise and understand where the biggest operational bottlenecks hide in each industry.",
  },
  {
    q: "Do I need to use specific tools to work with you?",
    a: "No. AIMS is tool-agnostic. Our engineers embed into your existing tech stack and workflows — whether that is HubSpot, Salesforce, custom internal tools, or a greenfield environment. We build on what you already have.",
  },
  {
    q: "What does the embedded engineering model look like?",
    a: "Our engineers work directly alongside your team — attending standups, accessing your systems, and building solutions in your environment. Think of it as adding senior AI engineers to your org without the hiring overhead. We handle diagnostic, build, deployment, and ongoing optimization.",
  },
  {
    q: "How do AI solutions integrate with our existing team?",
    a: "Every solution is designed to augment your people, not replace them. Our engineers build AI that fits into the tools and workflows your team already uses. Full knowledge transfer is built into every engagement so your team can operate and extend the systems independently.",
  },
  {
    q: "What does an engagement typically include?",
    a: "Each engagement is custom-scoped, but typically includes: an operational diagnostic across all departments, an AI opportunity map prioritized by ROI, custom-built AI solutions deployed into your workflows, and ongoing measurement and optimization.",
  },
  {
    q: "How is pricing structured?",
    a: "Engagements are custom-scoped based on your company size, operational complexity, and the number of departments involved. We provide a detailed scope and investment proposal after the initial discovery call — no generic pricing tiers.",
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

        <div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {FAQS.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <span className="pr-4 font-medium text-foreground">{faq.q}</span>
                <span className="shrink-0 text-primary">
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
