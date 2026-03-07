import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "About AIMS — AI Managing Services",
  description: "AIMS is a division of Modern Amenities Group, building AI-powered business infrastructure for B2B companies.",
}

const TEAM = [
  { name: "Adam Wolfe", role: "Head of AI & Innovation", bio: "Building AI infrastructure for B2B businesses since 2021." },
  { name: "Sabbir", role: "GHL & Website Lead", bio: "Expert in GoHighLevel deployments and conversion-optimized websites." },
  { name: "Cody", role: "SEO & Content Lead", bio: "Drives organic growth through technical SEO and AI-optimized content." },
  { name: "Marco", role: "Cold Outbound Lead", bio: "Builds and manages multi-domain cold email infrastructure at scale." },
  { name: "Ivan", role: "Voice AI Lead", bio: "Deploys and trains AI voice agents for inbound and outbound calling." },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="py-20 border-b border-border bg-white">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <span className="inline-block rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-700 mb-4">
            About AIMS
          </span>
          <h1 className="text-5xl font-bold tracking-tight">
            We Build The Systems.<br />You Close The Deals.
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
            AIMS (AI Managing Services) is a division of Modern Amenities Group. We build and operate
            AI-powered marketing and sales infrastructure for B2B businesses that want to grow without
            adding headcount.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold">Our Mission</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                The best companies are built on systems, not hustle. Our mission is to give every B2B
                business access to the same AI-powered infrastructure that Fortune 500 companies spend
                millions building in-house — at a fraction of the cost.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                We don&rsquo;t just consult. We build, deploy, and run the systems for you. Your job is to
                show up to the meetings we book.
              </p>
            </div>
            <div className="rounded-2xl bg-[#DC2626] p-8 text-white">
              <div className="text-5xl font-black mb-2">$100K+</div>
              <div className="text-red-100">MRR target by end of 2025</div>
              <div className="mt-6 text-5xl font-black mb-2">500+</div>
              <div className="text-red-100">Businesses served</div>
              <div className="mt-6 text-5xl font-black mb-2">15</div>
              <div className="text-red-100">AI service products</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-3xl font-bold text-center mb-12">The Team</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((member) => (
              <div key={member.name} className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-lg font-bold text-[#DC2626]">
                  {member.name.charAt(0)}
                </div>
                <h3 className="font-semibold text-foreground">{member.name}</h3>
                <div className="text-sm text-[#DC2626] font-medium">{member.role}</div>
                <p className="mt-2 text-sm text-muted-foreground">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#DC2626]">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Work With Us</h2>
          <p className="mt-3 text-red-100">Book a strategy call to see how AIMS can grow your pipeline.</p>
          <Link
            href="/get-started"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3.5 font-semibold text-[#DC2626] hover:bg-red-50 transition"
          >
            Book a Strategy Call <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
