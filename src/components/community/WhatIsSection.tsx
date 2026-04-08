import { Check, X } from "lucide-react"

const FIT = [
  "You were displaced (or you can see it coming) and you don't want another W-2",
  "You're a corporate leader with deep domain expertise but no playbook for starting a services business",
  "You see the AI opportunity but can't package your experience into a sellable offer",
  "You want structured support and accountability — not a course you'll abandon",
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
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-aims-gold mb-4">
            What This Actually Is
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.25] pb-2">
            A Business-In-A-Box for{" "}
            <span className="block text-aims-gold italic">AI Services Operators</span>
          </h2>
        </div>

        <div className="mt-12 space-y-6 text-cream/75 text-lg leading-relaxed max-w-3xl mx-auto">
          <p>
            The AI Operator Collective is an{" "}
            <span className="text-aims-gold font-semibold">operator-led training and accountability program</span>{" "}
            for professionals building an AI services business. It is run by the team
            operating the AIMS portfolio and supported by a consortium of YPO members who
            deploy these same systems inside their own companies.
          </p>

          <p>
            Every other community jumps straight to n8n, prompt packs, and tool tutorials. If
            you already know how to run a business, that works. If you don&apos;t, you end up
            with{" "}
            <span className="text-aims-gold font-semibold">
              a folder of automations and zero clients.
            </span>{" "}
            So we sequence it the opposite way: <span className="text-cream font-semibold">LLC, pricing,
            pipeline, and sales process first.</span> AI tooling starts in Week 5 — because tools
            without a business are just expensive hobbies.
          </p>
        </div>

        {/* Who it's for / Who it's not for */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-md border border-aims-gold/30 bg-aims-gold/5 p-6 sm:p-7">
            <p className="text-xs font-mono uppercase tracking-wider text-aims-gold mb-4">
              Built For You If
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
              Not A Fit If
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

        <p className="mt-10 text-center text-sm text-cream/70 italic max-w-2xl mx-auto">
          The Collective makes no income claims and does not promise client outcomes. Results
          depend entirely on the work you put in. See disclosures at the bottom of this page.
        </p>
      </div>
    </section>
  )
}
