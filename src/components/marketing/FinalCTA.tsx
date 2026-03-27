"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function FinalCTA() {
  return (
    <section className="border-t border-border bg-deep py-24">
      <div className="container mx-auto max-w-3xl px-4 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-primary mb-6">
          Stop guessing. Start building.
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-foreground">
          Find out exactly where<br />AI <em className="text-primary italic">hits hardest.</em>
        </h2>
        <p className="mt-6 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Ten minutes with our intake agent gives us enough signal to map your highest-ROI AI opportunities before a single engineer walks through the door.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => window.dispatchEvent(new Event("open-intake-chat"))}
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-lg transition hover:bg-primary/80"
          >
            Speak with Intake Agent <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 rounded-sm border border-border px-8 py-3.5 text-xs font-medium uppercase tracking-wider text-foreground transition hover:border-foreground"
          >
            Book a Consultation
          </Link>
        </div>
        <p className="mt-8 text-xs text-muted-foreground/60">
          No commitment required. Conversations are confidential.
        </p>
      </div>
    </section>
  )
}
