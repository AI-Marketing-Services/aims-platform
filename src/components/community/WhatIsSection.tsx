import { Check, X } from "lucide-react"

const FIT = [
  "You were displaced (or you can see it coming) and you don't want another W-2",
  "You're a corporate leader with deep domain expertise but no playbook for starting a services business",
  "You see the AI opportunity but can't package your experience into a sellable offer",
  "You want structured support and accountability - not a course you'll abandon",
]

const NOT_FIT = [
  "You're looking for passive income or a get-rich-quick shortcut",
  "You want to watch videos and never implement",
  "You want a guarantee instead of doing the work",
]

export function WhatIsSection() {
  return (
    <section id="program" className="relative py-24 sm:py-32 border-t border-[#E3E3E3]">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl text-[#1A1A1A] leading-[1.25] pb-2">
            Be honest with yourself.
          </h2>
          <p className="mt-6 text-lg text-[#737373]">
            This program works for a specific kind of person. Check both columns.
          </p>
        </div>

        <div className="mt-12 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-md border border-crimson/20 bg-crimson/5 p-6 sm:p-7">
            <p className="text-xs font-mono uppercase tracking-wider text-crimson mb-4">
              This Is You
            </p>
            <ul className="space-y-3">
              {FIT.map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm text-[#383838] leading-relaxed">
                  <Check className="w-4 h-4 text-crimson mt-0.5 flex-shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-[#E3E3E3] bg-[#F5F5F5] p-6 sm:p-7">
            <p className="text-xs font-mono uppercase tracking-wider text-[#737373] mb-4">
              This Isn&apos;t For You
            </p>
            <ul className="space-y-3">
              {NOT_FIT.map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm text-[#737373] leading-relaxed">
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
