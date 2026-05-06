"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const QUESTIONS = [
  {
    q: "Do I need a technical background?",
    a: "No. AIOC is not built for AI engineers. It is built for smart, operator-minded people who want to understand how AI can solve real business problems. Technical curiosity helps. Business judgment matters more.",
  },
  {
    q: "Can I do this while I am still in my W2?",
    a: "Yes. Many people will be building capability while still employed. In fact, that can be an advantage. Your day-to-day work gives you a place to start noticing processes, handoffs, repeated questions, and small operational fires differently. Depending on your role and autonomy, your current job may become a useful testing ground for the operator lens.",
  },
  {
    q: "Is this an AI agency course?",
    a: "Not in the usual internet sense. AIOC is not built around \"copy this offer, send this script, get clients.\" The focus is the full operator motion: market selection, prospecting, discovery, diagnosis, workflow mapping, ROI thinking, practical AI-enabled solutioning, and credible business conversations.",
  },
  {
    q: "Will this get me clients?",
    a: "No one can honestly guarantee that. AIOC is designed to help you build the judgment, language, prospecting rhythm, workflow thinking, and practical reps that support credible client conversations. The traits matter: curiosity, high agency, systems thinking, and clear communication. Those are the muscles good operators build here. Outcomes depend on your effort and execution.",
  },
  {
    q: "What does it cost?",
    a: "The first cost is time. Plan on roughly one to two hours per day if you want to build real momentum. Not all of that is sitting in lessons. Some of it is noticing better problems, building your prospect list, practicing discovery, mapping workflows, and sharpening your operator judgment.\n\nThe other cost is staying passive while the work around you changes. Watching more AI content will not make you more credible by itself. At some point, you need reps.\n\nApplicants who are a fit will receive current pricing, terms, and cohort details before making any enrollment decision.",
  },
  {
    q: "Is AIOC a fixed-duration program?",
    a: "No. AIOC is built more like an operator development track than a one-and-done course.\n\nThe first phase gives you structure: the operator lens, discovery reps, scoping practice, business setup, and delivery standards.\n\nBut the bigger goal is not a certificate. The goal is to help develop operators with the judgment, communication, and follow-through required for higher-trust work over time.\n\nThat future path is earned and still being built. AIOC does not guarantee clients, placement, subcontractor work, or access to AIMS projects. But the goal is to help you build toward the level of operator judgment we would trust in higher-stakes work.",
  },
  {
    q: "What happens after I apply?",
    a: "We review your application, then qualified applicants are invited to a call with someone from our team.\n\nThat call is not a pressure pitch. It is a mutual fit conversation about your current situation, what you are trying to build, and whether AIOC is a strategic next room for you.\n\nWe are not trying to build a giant community with thousands of members. We are looking for the right people to invest time in: curious, high-agency operators who want to build real capability and take the work seriously.",
  },
]

export function CommunityFAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section
      id="faq"
      className="relative py-24 sm:py-32 border-t border-[#E3E3E3] texture-light dot-grid-light"
    >
      <div className="relative z-10 mx-auto max-w-3xl px-6">
        <div className="text-center">
          <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#1A1A1A] leading-[1.15] tracking-tight text-balance pb-2">
            Frequently asked.
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
                  isOpen
                    ? "border-crimson/30 bg-crimson/5"
                    : "border-[#E3E3E3] bg-[#F5F5F5] hover:border-[#ccc]",
                )}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-playfair text-lg sm:text-xl text-[#1A1A1A]">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-crimson flex-shrink-0 transition-transform",
                      isOpen ? "rotate-180" : "",
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-[#737373] leading-relaxed text-sm sm:text-base whitespace-pre-line">
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
