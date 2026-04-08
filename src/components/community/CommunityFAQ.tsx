"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const QUESTIONS = [
  {
    q: "What is the AI Operator Playbook Vault and what's in it?",
    a: "It's the collection of cold email sequences, discovery frameworks, pricing models, outreach scripts, and delivery playbooks the AIMS team uses internally. You get it as a single email the moment you submit the form — free, no strings. If you never apply to the cohort, the Vault is still yours to keep. We're building it out continuously, so you'll get updates as new plays get added.",
  },
  {
    q: "What actually happens after I submit the form?",
    a: "Three things: (1) the Playbook Vault email hits your inbox in under a minute — check spam if you don't see it, (2) additional chapters drip into your inbox over the following days so you can implement at your own pace, and (3) a real operator reviews your submission within 24 hours for cohort fit. No pitch calls, no hoops, no calendar tag — if you're a fit we'll email you directly.",
  },
  {
    q: "Who is this actually built for?",
    a: "Professionals with real career experience who want to build a business, not find another job. That includes W-2 folks who've been displaced or see it coming, corporate leaders with domain expertise but no playbook for starting a services company, and operators who can see the AI opportunity but can't figure out how to package their experience into a sellable offer. It is not built for people looking for passive income, a get-rich-quick outcome, or a course they won't implement.",
  },
  {
    q: "Do I need technical experience?",
    a: "No. The first four weeks are business fundamentals — LLC, pricing, pipeline, sales process. AI tooling does not start until Week 5. If you can write an email and run a calendar, you can do the technical portion too. The whole point is to meet you where you are.",
  },
  {
    q: "Will the program get me clients?",
    a: "No. We make no income or client guarantees. The program teaches the exact sales process, infrastructure, and offer that the AIMS portfolio uses to land clients — but whether you land any is entirely about the work you put in. Anyone promising you guaranteed clients is making a claim we are not willing to make.",
  },
  {
    q: "What if I still have my W-2 job?",
    a: "Most founding members will. The program is designed to run on evenings and weekends until your pipeline justifies the jump. When (or whether) you leave your W-2 is entirely your call.",
  },
  {
    q: "Who runs the program?",
    a: "It's operated by the team behind the AIMS portfolio, supported by a consortium of YPO operators who deploy these same systems inside their own companies. Mentor credentials are sourced from public profiles and internal records. Specific mentor availability varies by session.",
  },
  {
    q: "What does it cost to join?",
    a: "Pricing is shared over email with applicants who are a fit for the cohort. There is no payment required to apply, and no payment required to get the Playbook Vault. The Collective is annual-commitment only — we don't do monthly because monthly options produce churn before the curriculum has time to deliver.",
  },
  {
    q: "What if I'm not in the US?",
    a: "Most of the curriculum applies globally, but the live coaching, community time zones, and business formation are US-focused for the alpha cohort. International operators are welcome to apply — just know that the LLC/EIN piece will look different for you.",
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
