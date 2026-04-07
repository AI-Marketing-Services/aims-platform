"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const QUESTIONS = [
  {
    q: "Do I need technical experience?",
    a: "No. The first phase of the program is business fundamentals: forming your LLC, setting your pricing, building your sales process. AI tooling does not start until later in the program. The Collective is built for non-technical operators.",
  },
  {
    q: "Will the program get me clients?",
    a: "No, the program does not get you clients and we do not promise that. The program teaches you how to build the sales process, infrastructure, and offer that operators in the AIMS portfolio use to land clients. Whether you land clients depends entirely on the work you put in. We make no income or outcome claims.",
  },
  {
    q: "What if I still have my W-2 job?",
    a: "The program is designed so you can complete it while still employed. Most of the work is structured around evenings and weekends. Whether and when you transition out of your W-2 is entirely your decision and we make no claims about that.",
  },
  {
    q: "How is this different from free AI communities?",
    a: "Free communities and YouTube channels typically jump straight to tools. They teach you n8n, Make, and prompt packs. The AI Operator Collective is structured to teach business fundamentals first (LLC formation, pricing, sales pipeline) and only introduces AI tooling once those fundamentals are in place.",
  },
  {
    q: "Who runs the program?",
    a: "The program is operated by the team behind the AIMS portfolio and supported by a consortium of YPO operators. The mentor credentials shown on this page come from public profiles and internal records. Mentor availability and session formats are subject to scheduling.",
  },
  {
    q: "What does pricing look like?",
    a: "Pricing is not published on this page. The program is application-only. If there is mutual fit on the strategy call, pricing and structure are reviewed in full. There is no payment required to apply.",
  },
  {
    q: "Is there a guarantee?",
    a: "No. The Collective does not guarantee income, clients, engagements, revenue, or any specific outcome. Anyone offering a guaranteed outcome in this space is making a claim we are not willing to make. The program is structured to give you the best possible chance, but the work is on you.",
  },
  {
    q: "What if I am not in the US?",
    a: "Most of the curriculum applies globally, but the live sales coaching, community time zones, and US business formation guidance are US-focused for the founding cohort. International operators are welcome to apply.",
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
