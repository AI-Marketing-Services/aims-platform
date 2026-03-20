import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CheckCircle2, Star } from "lucide-react"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ partnerSlug: string }>
  searchParams: Promise<{ ref?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { partnerSlug } = await params
  const referral = await db.referral.findFirst({
    where: { landingPageSlug: partnerSlug },
    include: { referrer: { select: { name: true, company: true } } },
  })

  if (!referral) return { title: "AIMS - AI Services" }

  const partnerName = referral.referrer.company ?? referral.referrer.name ?? "a Partner"
  return {
    title: `AIMS AI Services - Referred by ${partnerName}`,
    description: `${partnerName} recommends AIMS for AI-powered marketing, sales, and operations automation.`,
  }
}

const BENEFITS = [
  "AI-powered outbound that books meetings while you sleep",
  "Website + CRM + chatbot live in under a week",
  "Voice agents handling calls 24/7 - no headcount needed",
  "Full-stack automation built and managed by experts",
]

export default async function PartnerLandingPage({ params, searchParams }: Props) {
  const { partnerSlug } = await params
  const { ref } = await searchParams
  const referral = await db.referral.findFirst({
    where: {
      OR: [
        { landingPageSlug: partnerSlug },
        { code: partnerSlug },
      ],
    },
    include: {
      referrer: { select: { name: true, company: true, avatarUrl: true } },
    },
  })

  if (!referral) notFound()

  // Set referral cookie server-side
  const cookieStore = await cookies()
  cookieStore.set("aims_ref", referral.code, {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
    httpOnly: false,
    sameSite: "lax",
  })

  // Track click
  await db.referral.update({
    where: { code: referral.code },
    data: { clicks: { increment: 1 } },
  }).catch(() => null)

  const partnerName = referral.referrer.company ?? referral.referrer.name ?? "Our Partner"
  const refCode = ref ?? referral.code

  return (
    <div className="min-h-screen bg-deep">
      {/* Partner header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          {referral.referrer.avatarUrl && (
            <Image src={referral.referrer.avatarUrl} alt="" width={32} height={32} className="h-8 w-8 rounded-full" />
          )}
          <p className="text-sm text-muted-foreground">
            You were referred by <span className="font-semibold text-foreground">{partnerName}</span>
          </p>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 border border-primary/20 mb-6">
          <Star className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-medium text-primary">Partner Referral - Priority Onboarding</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-6">
          AI Services That Run Your
          <br />
          <span className="text-primary">Sales & Marketing</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          {partnerName} uses AIMS to automate lead gen, outbound, and customer follow-up - now you can too.
          As a referred partner, you get priority setup and onboarding support.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/get-started?ref=${refCode}`}
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-8 py-4 text-lg font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href={`/marketplace?ref=${refCode}`}
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-border bg-card px-8 py-4 text-lg font-semibold text-foreground hover:bg-surface transition-colors"
          >
            Browse Services
          </Link>
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <div key={b} className="flex items-start gap-3 bg-card border border-border rounded-2xl p-5">
              <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-foreground">{b}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Social proof */}
      <div className="bg-card border-t border-border py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm uppercase tracking-wider font-semibold mb-8">What clients achieve</p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { stat: "3.2×", label: "Average pipeline increase in 90 days" },
              { stat: "14 days", label: "From kickoff to first leads in your CRM" },
              { stat: "$284", label: "Average cost per booked meeting" },
            ].map(({ stat, label }) => (
              <div key={stat} className="text-center">
                <p className="text-3xl font-bold text-primary font-mono mb-2">{stat}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Ready to see what AIMS can do for you?
        </h2>
        <p className="text-muted-foreground mb-8">
          Referred clients get expedited setup and a dedicated onboarding call.
        </p>
        <Link
          href={`/get-started?ref=${refCode}`}
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-8 py-4 text-base font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          Book Your Free Strategy Call
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
