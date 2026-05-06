import { Check, X } from "lucide-react"

const FIT = [
  "You are in a W2 role and can see AI changing the shape of work.",
  "You are technically curious, but not trying to become an AI engineer.",
  "You have seen enough business mess to know tools alone will not fix it.",
  "You want to turn your corporate experience into practical operator judgment.",
  "You want help finding the right businesses to approach, not just learning tools.",
  "You are willing to practice prospecting, discovery, diagnosis, workflow thinking, and client-ready communication.",
  "You want structure, discussion, and real reps.",
]

const NOT_FIT = [
  "You want passive income.",
  "You want someone to guarantee clients, income, placement, or access.",
  "You want to copy prompts without understanding the business problem underneath.",
  "You want to build complicated automations before you understand the workflow.",
  "You are looking for a fixed-duration shortcut instead of an ongoing apprenticeship.",
  "You need every detail to be perfectly certain before you start practicing.",
]

export function WhatIsSection() {
  return (
    <section
      id="who-its-for"
      className="relative py-24 sm:py-32 border-t border-[#E3E3E3] texture-light dot-grid-light"
    >
      <div className="relative z-10 mx-auto max-w-[1280px] px-6">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#1A1A1A] leading-[1.15] tracking-tight text-balance pb-2">
            This is probably{" "}
            <span className="text-crimson italic">for you</span> if…
          </h2>
        </div>

        <div className="mt-12 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-md border border-crimson/20 bg-crimson/5 p-6 sm:p-7">
            <p className="text-xs font-mono uppercase tracking-wider text-crimson mb-4">
              This is probably for you
            </p>
            <ul className="space-y-3">
              {FIT.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-3 text-sm text-[#383838] leading-relaxed"
                >
                  <Check className="w-4 h-4 text-crimson mt-0.5 flex-shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-[#E3E3E3] bg-[#F5F5F5] p-6 sm:p-7">
            <p className="text-xs font-mono uppercase tracking-wider text-[#737373] mb-4">
              This is probably not for you
            </p>
            <ul className="space-y-3">
              {NOT_FIT.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-3 text-sm text-[#737373] leading-relaxed"
                >
                  <X className="w-4 h-4 text-[#737373]/60 mt-0.5 flex-shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
