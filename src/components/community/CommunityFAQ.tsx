"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const QUESTIONS = [
  {
    q: "Do I need a tech background?",
    a: "No. You need domain expertise and a willingness to work. AI tools are taught in week 5 - after you have a business to deploy them in. The sequencing is intentional.",
  },
  {
    q: "What if I'm still in my W-2?",
    a: "Most members start while still employed. The program is designed so you can build your pipeline and get your first client before you make the leap.",
  },
  {
    q: "Will this get me clients?",
    a: "The program gives you the exact system AIMS operators use. Your results depend entirely on the work you put in. We make no income claims.",
  },
  {
    q: "What does it cost?",
    a: "Pricing is shared over email with applicants who are offered a cohort seat. No payment to apply - ever. No surprise pitch calls.",
  },
  {
    q: "What do I get for free right now?",
    a: "The AI Operator Playbook Vault - cold email sequences, discovery frameworks, pricing models, and outreach scripts - delivered to your inbox the moment you apply. Yours to keep regardless of whether you join.",
  },
]

export function CommunityFAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="relative py-24 sm:py-32 border-t border-[#E3E3E3]">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl text-[#1A1A1A] leading-[1.25] pb-2">
            Nothing to hide.
          </h2>
        </div>

        <div className="mt-14 space-y-3">
          {QUESTIONS.map((item, i) => {
            const isOpen = open === i
            return (
              <div
                key={i}
                className={cn(
                  "rounded-md border overflow-hidden transition-all",
                  isOpen ? "border-crimson/30 bg-crimson/5" : "border-[#E3E3E3] bg-[#F5F5F5] hover:border-[#ccc]"
                )}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-playfair text-lg sm:text-xl text-[#1A1A1A]">{item.q}</span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-crimson flex-shrink-0 transition-transform",
                      isOpen ? "rotate-180" : ""
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-[#737373] leading-relaxed text-sm sm:text-base">
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
