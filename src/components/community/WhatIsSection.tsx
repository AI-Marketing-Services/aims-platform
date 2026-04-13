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
    <section id="program" className="relative py-24 sm:py-32 border-t border-line">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.25] pb-2">
            Be honest with yourself.
          </h2>
          <p className="mt-6 text-lg text-cream/65">
            This program works for a specific kind of person. Check both columns.
          </p>
        </div>

        {/* Who it's for / Who it's not for */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-md border border-aims-gold/30 bg-aims-gold/5 p-6 sm:p-7">
            <p className="text-xs font-mono uppercase tracking-wider text-aims-gold mb-4">
              This Is You
            </p>
            <ul className="space-y-3">
              {FIT.map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm text-cream/85 leading-relaxed">
                  <Check className="w-4 h-4 text-aims-gold mt-0.5 flex-shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-line bg-surface/40 p-6 sm:p-7">
            <p className="text-xs font-mono uppercase tracking-wider text-cream/70 mb-4">
              This Isn&apos;t For You
            </p>
            <ul className="space-y-3">
              {NOT_FIT.map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm text-cream/75 leading-relaxed">
                  <X className="w-4 h-4 text-cream/60 mt-0.5 flex-shrink-0" />
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
