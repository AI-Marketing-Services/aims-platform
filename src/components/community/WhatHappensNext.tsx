import { Inbox, Mail, ClipboardCheck, Rocket } from "lucide-react"

const STEPS = [
  {
    icon: Inbox,
    when: "In the next 60 seconds",
    title: "The Playbook Vault hits your inbox",
    body: "Check your inbox (and spam). You'll get the AI Operator Playbook Vault — cold email sequences, discovery frameworks, pricing models, and the exact plays AIMS operators run. Use it whether or not you join the cohort.",
  },
  {
    icon: ClipboardCheck,
    when: "Within 24 hours",
    title: "We review your background",
    body: "The Collective is application-only. A real operator (not a VA) reads your submission and checks for fit: your domain, your timeline, your willingness to do the work. No phone tag, no pitch call.",
  },
  {
    icon: Mail,
    when: "Over the following days",
    title: "The full playbook arrives in chapters",
    body: "We drip the rest of the Operator Vault straight into your inbox — chapter by chapter. No calls to book, no hoops to jump through. Read at your own pace and implement what fits.",
  },
  {
    icon: Rocket,
    when: "If there's fit, cohort day one",
    title: "Your business starts getting built",
    body: "LLC, EIN, banking, offer definition, and pricing — all handled as a service inside Week 1. By Week 4 you have a live pipeline. By Week 5 you're deploying AI. You're in motion from the first day.",
  },
]

export function WhatHappensNext() {
  return (
    <section
      id="what-happens-next"
      className="relative py-24 sm:py-32 border-t border-line bg-gradient-to-b from-deep to-ink"
    >
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-aims-gold mb-4">
            What Happens After You Sign Up
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-cream leading-[1.25] pb-2">
            No Guessing.{" "}
            <span className="block text-aims-gold italic">You Know Exactly What Comes Next.</span>
          </h2>
          <p className="mt-6 text-lg text-cream/65">
            Most landing pages go dark the second you hit submit. Here&apos;s the full
            sequence from the moment you drop your email.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-4">
          {STEPS.map((step, idx) => {
            const Icon = step.icon
            return (
              <div
                key={step.title}
                className="relative rounded-md border border-line bg-surface/60 p-6 sm:p-7 hover:border-aims-gold/40 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-sm bg-aims-gold/10 border border-aims-gold/30">
                    <Icon className="w-5 h-5 text-aims-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-aims-gold mb-1">
                      Step 0{idx + 1} · {step.when}
                    </p>
                    <h3 className="font-serif text-xl text-cream mb-2 leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm text-cream/60 leading-relaxed">{step.body}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
