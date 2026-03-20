import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, TrendingUp, Clock, MapPin } from "lucide-react"

export const metadata: Metadata = {
  title: "Vending Operator AI Case Study - AIMS",
  description: "How a multi-route vending operator secured 47 new locations in 90 days using AIMS cold outbound and AI automation.",
}

export default function VendingpreneurCaseStudy() {
  return (
    <div className="min-h-screen bg-deep">
      <div className="max-w-3xl mx-auto px-4 py-16">

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/case-studies" className="hover:text-primary transition-colors">Case Studies</Link>
          <span>/</span>
          <span className="text-muted-foreground">Multi-Route Vending Operator</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {["Vending", "Cold Outbound", "Lead Generation", "Voice AI"].map((tag) => (
            <span key={tag} className="text-xs font-medium px-2 py-0.5 bg-deep text-muted-foreground rounded-full">{tag}</span>
          ))}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          47 New Locations in 90 Days - Without Hiring a Salesperson
        </h1>
        <p className="text-lg text-muted-foreground mb-10">
          How an owner-operator vending business scaled from manual prospecting to a fully automated location acquisition machine.
        </p>

        <div className="bg-card border border-border rounded-2xl p-6 mb-10 grid grid-cols-3 gap-4 text-center shadow-sm">
          {[
            { value: "47", label: "New locations secured" },
            { value: "90 days", label: "To results" },
            { value: "$284", label: "Cost per location" },
          ].map((m) => (
            <div key={m.label}>
              <div className="text-3xl font-black text-primary mb-1">{m.value}</div>
              <div className="text-xs text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">The Challenge</h2>
            <p className="text-muted-foreground leading-relaxed">
              A vending operator managing 240+ machines across three states was growing, but slowly. Every new location was the result of a personal relationship, a referral, or hours spent cold-calling property managers from a spreadsheet. The operator was the only salesperson - and between restocking routes, machine maintenance, and accounting, there was almost no time left to prospect.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              The bottleneck was clear: &quot;I know exactly where my machines should go. I just can&apos;t find the time to pitch all of them.&quot;
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">What AIMS Built</h2>
            <div className="space-y-3">
              {[
                "Cold email outbound system targeting 2,000+ property managers, facility directors, and office managers per month within the operator's target territories",
                "LinkedIn sequence running in parallel - personalized connection + follow-up based on company size and property type",
                "AI voice agent answering inbound calls 24/7, qualifying location leads, and scheduling site visits while the operator was on route",
                "CRM pipeline pre-built for vending - stages from 'Location Prospected' through 'Machine Installed' with automated follow-up at each stage",
                "Lead reactivation campaign reaching 180 cold contacts from the operator's existing spreadsheet - converting 22 of them into new conversations",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-muted-foreground text-sm">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">The Timeline</h2>
            <div className="space-y-3">
              {[
                { icon: Clock, time: "Week 1-2", desc: "Cold outbound sequences built, tested, and sending. CRM configured with vending-specific pipeline stages." },
                { icon: MapPin, time: "Week 3-4", desc: "First inbound calls coming through AI voice agent. Reactivation campaign launched to existing prospect list." },
                { icon: TrendingUp, time: "Day 90", desc: "47 new locations secured. Operator running 287 machines across 4 states with zero additional sales headcount." },
              ].map(({ icon: Icon, time, desc }) => (
                <div key={time} className="flex items-start gap-4 bg-card border border-border rounded-xl p-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{time}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">Results After 90 Days</h2>
            <div className="bg-green-900/15 border border-green-800 rounded-xl p-6 space-y-3">
              {[
                "47 new locations secured - 31 from cold outbound, 9 from voice agent inbound, 7 from reactivation",
                "Average cost per secured location: $284 (vs. $1,800+ when sourcing through broker networks)",
                "Time spent on prospecting: reduced from ~12 hours/week to ~1 hour/week (review + approval only)",
                "Machine count grew from 240 to 287 in 90 days without any new hires",
                "Pipeline: 140 active prospects still in nurture - projected 30+ additional locations in next 60 days",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-green-800 text-sm">{item}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-14 bg-primary rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Are you a vending operator?</h2>
          <p className="text-muted-foreground mb-6">
            We&apos;ve built this exact system for vending operators across the country. Book a call and we&apos;ll show you what it would look like for your territory.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 px-8 py-4 bg-card text-primary font-semibold rounded-xl hover:bg-primary/10 transition-colors"
          >
            Book Free Strategy Call
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link href="/case-studies" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Back to all case studies
          </Link>
        </div>
      </div>
    </div>
  )
}
