"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const QUESTIONS = [
  {
    q: "Do I need technical experience?",
    a: "No. The first month is business fundamentals: forming your LLC, setting your pricing, building your sales process. You won't touch a workflow tool until Week 5. The whole point is to give non-technical operators the business chops AI bros never bother to teach.",
  },
  {
    q: "How long until I can take on paying clients?",
    a: "Most cohort operators land their first paying engagement inside 90 days. We back the timeline with a guarantee: if you do the work and don't land a client in 90 days, we coach you free until you do.",
  },
  {
    q: "What if I still have my W-2 job?",
    a: "Most operators start the program while still employed. The curriculum is built for nights and weekends. Many transition to the operator business full-time around month 4 to 6 once they have a few retainers locked in.",
  },
  {
    q: "How is this different from free AI communities?",
    a: "Free communities and YouTube channels jump straight to tools. They teach you n8n, Make, and prompt packs. None of them teach you how to actually run a business: how to price, how to sell, how to close, how to deliver, how to retain. That gap is why most AI side hustles never make a dollar. We fix that.",
  },
  {
    q: "Who are the mentors?",
    a: "Operators running real businesses, not influencers. The consortium includes YPO members with $100M+ in combined exits across vending, healthcare, beverage, transportation, gaming, finance, and hospitality. They deploy the same AI systems inside their portfolio that you'll learn to build.",
  },
  {
    q: "What does pricing look like?",
    a: "We don't publish pricing on this page. Apply and we'll walk you through the program structure on a strategy call. The program is application-only because it's designed for operators ready to put in real work, not buy a course and ghost.",
  },
  {
    q: "What if I'm not in the US?",
    a: "Most of the curriculum applies globally, but the live sales coaching, client pipeline, and business formation guidance are US-focused for the founding cohort. International operators are welcome to apply for the next cohort as we expand.",
  },
]

export function CommunityFAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="relative py-24 sm:py-32 border-t border-line">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.25] pb-2">
            Frequently Asked{" "}
            <span className="block text-aims-gold italic">Questions</span>
          </h2>
        </div>

        <div className="mt-14 space-y-3">
          {QUESTIONS.map((item, i) => {
            const isOpen = open === i
            return (
              <div
                key={i}
                className={cn(
                  "rounded-md border bg-surface/40 overflow-hidden transition-all",
                  isOpen ? "border-aims-gold/40" : "border-line hover:border-line-hover"
                )}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-lg sm:text-xl text-cream">{item.q}</span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-aims-gold flex-shrink-0 transition-transform",
                      isOpen ? "rotate-180" : ""
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-cream/65 leading-relaxed text-sm sm:text-base">
                    {item.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
