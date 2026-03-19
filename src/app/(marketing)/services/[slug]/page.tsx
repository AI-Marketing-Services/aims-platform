import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { db } from "@/lib/db"
import { ServiceDemoSection, ServiceDemoWidget } from "@/components/marketing/ServiceDemoSection"
import { DEMO_SLUGS } from "@/components/marketing/service-demo-config"

type Params = { slug: string }

// Static fallback data for the 6 core services (used when DB row doesn't exist yet)
const STATIC_SERVICES: Record<string, {
  name: string
  pillar: string
  shortDesc: string
  longDesc: string
  features: string[]
}> = {
  "cold-outbound": {
    name: "Outbound Lead Campaigns",
    pillar: "SALES",
    shortDesc: "Multi-domain email infra, AI SDR reply handling, auto-enrichment, and deliverability monitoring.",
    longDesc: "We build and run your entire cold outbound engine — from ICP research and lead sourcing to AI-personalized copy, multi-step sequences, and hot-lead routing. Your team receives warm, qualified meetings. We handle everything else.",
    features: [
      "Multi-domain email infrastructure setup",
      "AI-powered lead sourcing & enrichment",
      "1:1 personalized email copy via GPT-4",
      "Multi-step sequences (D1, D3, D7, D14)",
      "Auto reply handling & meeting routing",
      "Weekly deliverability monitoring",
      "CRM integration & reporting dashboard",
      "Dedicated AIMS success manager",
    ],
  },
  "revops-pipeline": {
    name: "RevOps Pipeline",
    pillar: "OPERATIONS",
    shortDesc: "CRM architecture, lead routing, attribution, conversion dashboards, and rep coaching.",
    longDesc: "We architect your entire revenue operations layer — CRM setup, lead routing rules, attribution models, conversion tracking, and rep performance dashboards. Get full pipeline visibility in under 7 days.",
    features: [
      "CRM audit and full rebuild",
      "Lead routing and assignment rules",
      "Attribution and conversion tracking",
      "Pipeline stage definitions and playbooks",
      "Sales rep coaching dashboard",
      "Revenue forecasting model",
      "Slack-based deal alerts",
      "Bi-weekly RevOps review calls",
    ],
  },
  "voice-agents": {
    name: "AI Calling Agents",
    pillar: "SALES",
    shortDesc: "Inbound and outbound AI voice agents with multi-location routing, live transcripts, and CRM sync.",
    longDesc: "Deploy AI voice agents that handle inbound calls 24/7 and run outbound dial campaigns while you sleep. Calls are transcribed in real-time, leads are scored, and hot prospects are routed directly to your team.",
    features: [
      "Inbound AI receptionist — 24/7 coverage",
      "Outbound AI dialer campaigns",
      "Real-time call transcription",
      "Lead scoring and qualification",
      "CRM sync after every call",
      "Multi-location call routing",
      "Custom voice and script setup",
      "Call analytics dashboard",
    ],
  },
  "content-production": {
    name: "Content Production Pod",
    pillar: "MARKETING",
    shortDesc: "AI-powered content calendar, short-form video scripts, email copy, and LinkedIn ghostwriting.",
    longDesc: "Your dedicated AI content team produces 30+ high-quality assets per month — video scripts, LinkedIn posts, email sequences, and ad copy — all aligned to your brand voice and ICP.",
    features: [
      "Monthly content calendar and strategy",
      "30+ assets per month",
      "Short-form video scripts (TikTok, Reels, Shorts)",
      "LinkedIn ghostwriting and scheduling",
      "Email sequence copywriting",
      "Ad copy and creative briefs",
      "Brand voice guide and training",
      "Content performance reporting",
    ],
  },
  "lead-reactivation": {
    name: "Lead Reactivation",
    pillar: "SALES",
    shortDesc: "Turn dead CRM contacts into booked meetings using AI personalization and multi-channel sequences.",
    longDesc: "We mine your existing CRM for dead or cold leads and run personalized multi-channel reactivation sequences via email, SMS, and LinkedIn. Avg. 18% of dead leads convert to booked meetings within 30 days.",
    features: [
      "Full CRM dead-lead audit",
      "AI-personalized reactivation copy",
      "Multi-channel: email + SMS + LinkedIn",
      "Lead scoring and segmentation",
      "Hot lead routing to your team",
      "30-day reactivation sprint",
      "CRM updates and tagging",
      "Results report and ROI tracking",
    ],
  },
  "database-reactivation": {
    name: "Database Reactivation",
    pillar: "OPERATIONS",
    shortDesc: "Full CRM audit, deduplication, re-enrichment, and a scored outreach plan for your existing contacts.",
    longDesc: "We perform a complete CRM health audit — deduplication, bounce cleanup, re-enrichment with fresh firmographic and contact data, and a scored outreach prioritization plan. Avg. $24K recovered pipeline per client.",
    features: [
      "Complete CRM data audit",
      "Deduplication and record merging",
      "Bounce and invalid email cleanup",
      "Re-enrichment with fresh contact data",
      "Company firmographic enrichment",
      "Lead scoring model build",
      "Prioritized outreach playbook",
      "Clean CRM handoff with documentation",
    ],
  },
  "website-crm-chatbot": {
    name: "Website + CRM + Chat",
    pillar: "MARKETING",
    shortDesc: "Full-stack website rebuild, CRM integration, and AI chat widget that captures and qualifies leads 24/7.",
    longDesc: "We build a conversion-optimized website, connect it to your CRM, and deploy an AI chatbot that qualifies leads around the clock. Every visitor interaction is captured, scored, and routed to your pipeline automatically.",
    features: [
      "Conversion-optimized website build",
      "CRM integration and pipeline setup",
      "AI chat widget — 24/7 lead capture",
      "Lead qualification and scoring",
      "Automatic CRM sync from chat",
      "Mobile-first responsive design",
      "Analytics and conversion tracking",
      "30-day post-launch support",
    ],
  },
  "seo-aeo": {
    name: "SEO & AEO",
    pillar: "MARKETING",
    shortDesc: "Technical SEO, content clusters, and Answer Engine Optimization to rank in both search and AI results.",
    longDesc: "We combine traditional SEO with Answer Engine Optimization — structuring your content so it ranks in Google and gets cited by AI tools like ChatGPT and Perplexity. More visibility across every discovery channel.",
    features: [
      "Technical SEO audit and fixes",
      "Keyword research and content clusters",
      "On-page optimization",
      "Answer Engine Optimization (AEO)",
      "Schema markup and structured data",
      "Internal linking strategy",
      "Monthly rank tracking and reporting",
      "AI citation monitoring",
    ],
  },
  "finance-automation": {
    name: "Finance Automation",
    pillar: "FINANCE",
    shortDesc: "Automated invoicing, collections, expense categorization, and real-time financial dashboards.",
    longDesc: "We automate your entire back-office financial workflow — from invoice generation and payment reminders to expense categorization and real-time P&L dashboards. Reduce manual finance work by 80%.",
    features: [
      "Automated invoice generation",
      "Payment reminders and collections",
      "Expense categorization",
      "Real-time P&L dashboard",
      "Bank reconciliation automation",
      "Cash flow forecasting",
      "Tax preparation data export",
      "Dedicated finance ops manager",
    ],
  },
  "audience-targeting": {
    name: "Audience Targeting",
    pillar: "MARKETING",
    shortDesc: "Pixel-based audience building, lookalike modeling, and retargeting campaigns across paid channels.",
    longDesc: "We deploy tracking pixels, build high-intent audience segments, and run retargeting campaigns across Meta, Google, and LinkedIn. Your ads reach the right people at the right moment — lower CPL, higher ROAS.",
    features: [
      "Pixel deployment and configuration",
      "Custom audience segmentation",
      "Lookalike audience modeling",
      "Retargeting campaign setup",
      "Meta, Google, and LinkedIn coverage",
      "Bid strategy optimization",
      "Weekly performance reporting",
      "A/B creative testing",
    ],
  },
  "local-seo": {
    name: "Local SEO",
    pillar: "MARKETING",
    shortDesc: "Google Business Profile optimization, local citations, and review management for location-based businesses.",
    longDesc: "We dominate local search for your business — optimizing your Google Business Profile, building consistent citations, managing reviews, and creating location-specific content that ranks your business at the top of local results.",
    features: [
      "Google Business Profile optimization",
      "Local citation building and cleanup",
      "Review generation strategy",
      "Review response management",
      "Location-specific content",
      "Local keyword targeting",
      "Competitor local ranking analysis",
      "Monthly local visibility report",
    ],
  },
  "ai-automation": {
    name: "AI Automation",
    pillar: "OPERATIONS",
    shortDesc: "Custom AI workflows that eliminate repetitive tasks across sales, ops, marketing, and customer service.",
    longDesc: "We map your biggest time sinks and build custom AI automations — from lead research and data entry to customer onboarding and support triaging. Avg. 22 hours/week reclaimed per client in 30 days.",
    features: [
      "Workflow audit and bottleneck mapping",
      "Custom AI automation builds",
      "Sales process automation",
      "Operations workflow automation",
      "Customer service automation",
      "Zapier / Make / n8n integration",
      "Testing and QA before launch",
      "Monthly automation performance review",
    ],
  },
  "pixel-intelligence": {
    name: "Pixel Intelligence",
    pillar: "MARKETING",
    shortDesc: "Identity resolution and visitor deanonymization to turn anonymous website traffic into actionable leads.",
    longDesc: "We deploy advanced identity resolution pixels that reveal who's visiting your site — company name, contact info, and intent signals — turning anonymous traffic into a qualified prospect list for your sales team.",
    features: [
      "Identity resolution pixel deployment",
      "Visitor deanonymization",
      "Company and contact enrichment",
      "Intent signal scoring",
      "Daily prospect list delivery",
      "CRM auto-sync of identified visitors",
      "Suppression list management",
      "GDPR/CCPA compliant implementation",
    ],
  },
  "ghl-community-os": {
    name: "GHL Community OS",
    pillar: "OPERATIONS",
    shortDesc: "Done-for-you GoHighLevel snapshot with website, CRM, pipelines, AI voice agent, and onboarding automation.",
    longDesc: "We build and configure a complete GoHighLevel operating system for your community or multi-location business — custom branding, domain, pipelines, AI receptionist, outbound voice agent, and automated onboarding sequences. Full OS live in under a week.",
    features: [
      "White-labeled GHL subaccount setup",
      "Custom branding, domain, and pipeline configuration",
      "AI receptionist for inbound calls",
      "Outbound voice agent configured for your workflows",
      "Automated onboarding sequences for new members",
      "Lead nurture automations and follow-up triggers",
      "Team training and handoff documentation",
      "Ongoing support and snapshot updates",
    ],
  },
  "ai-reputation-engine": {
    name: "AI Reputation Engine",
    pillar: "MARKETING",
    shortDesc: "Automated review generation, sentiment routing, and Google profile optimization running on autopilot.",
    longDesc: "We deploy a fully automated review generation system — SMS-triggered requests post-transaction, sentiment routing to protect your reputation, and monthly competitor monitoring. Your Google profile stays optimized and your review count grows on autopilot.",
    features: [
      "SMS-triggered review request sequences",
      "Sentiment routing: positive → Google, negative → internal",
      "Google Business Profile optimization",
      "Competitor review monitoring and alerts",
      "Review response templates and automation",
      "Multi-location review management",
      "Monthly reputation report",
      "Negative review escalation workflow",
    ],
  },
  "vendor-ordering-portal": {
    name: "Vendor Ordering Portal",
    pillar: "OPERATIONS",
    shortDesc: "Custom B2B ordering portal with product catalog, pricing logic, Stripe payments, and automated fulfillment.",
    longDesc: "We build a branded B2B ordering portal with your product catalog, custom pricing logic, Stripe payment integration, and automated fulfillment notifications — eliminating email and phone orders completely.",
    features: [
      "Branded portal with your product catalog",
      "Custom pricing logic and minimum order rules",
      "Stripe payment integration",
      "Order management dashboard (Airtable or Notion)",
      "Automated email/SMS order confirmations",
      "Fulfillment status notifications",
      "Reorder history and account management",
      "Mobile-optimized for ordering on the go",
    ],
  },
  "ai-community-chatbot": {
    name: "AI Community Chatbot",
    pillar: "OPERATIONS",
    shortDesc: "AI assistant trained on your content, FAQs, SOPs, and product catalog — embedded on your site or community platform.",
    longDesc: "We build an AI chatbot trained on your entire knowledge base — documents, videos, webinars, FAQs, and SOPs — and embed it wherever your community lives. 80%+ of questions answered instantly, 24/7, with smart escalation to humans when needed.",
    features: [
      "Knowledge base ingestion (docs, video transcripts, FAQs)",
      "Custom AI assistant with your brand voice",
      "Website embed and community platform integration",
      "Slack and Discord channel bot",
      "Escalation routing when confidence is low",
      "Unanswered question reports for content gaps",
      "Monthly bot training updates",
      "Usage analytics and satisfaction tracking",
    ],
  },
  "sales-team-enablement": {
    name: "Sales Team AI Enablement",
    pillar: "SALES",
    shortDesc: "AI call scoring, live call assist, roleplay training, and performance dashboards for your sales team.",
    longDesc: "We deploy a complete AI-powered sales coaching infrastructure — call recording with AI scoring across 7 dimensions, live assist overlays surfacing responses in real time, roleplay simulation for training, and performance dashboards. New reps hit quota 40% faster.",
    features: [
      "Call recording and AI scoring (7 dimensions)",
      "Live call assist overlay with objection responses",
      "Roleplay simulation modules for onboarding",
      "Ongoing training library with scored examples",
      "Rep performance dashboard and leaderboards",
      "Coaching flags for manager review",
      "CRM integration for call logging",
      "Weekly performance digest to leadership",
    ],
  },
  "sms-compliance-setup": {
    name: "SMS & Outbound Compliance",
    pillar: "OPERATIONS",
    shortDesc: "A2P 10DLC registration, domain warmup, and sending infrastructure — fully compliant in 48 hours.",
    longDesc: "We handle your complete outbound compliance setup — A2P brand and campaign registration, domain acquisition and warmup, sending infrastructure configuration, and a deliverability baseline report. No more blocked sends or carrier filtering.",
    features: [
      "A2P brand and campaign registration",
      "Sending number provisioning and configuration",
      "Domain acquisition and warmup schedule",
      "3–5 domain setup for email deliverability",
      "Sending infrastructure audit",
      "Deliverability baseline report",
      "Compliance documentation",
      "Ongoing monitoring and alert setup",
    ],
  },
  "crm-migration": {
    name: "CRM Migration & Architecture",
    pillar: "OPERATIONS",
    shortDesc: "Full CRM audit, data migration, pipeline rebuild, and reporting dashboard — validated and live.",
    longDesc: "We perform a complete CRM migration — auditing and deduplicating your source data, re-enriching contacts, mapping fields and custom properties, rebuilding your pipeline stages, and delivering a live reporting dashboard. Clean data, rebuilt pipelines, zero manual work.",
    features: [
      "Source CRM audit and data deduplication",
      "Contact re-enrichment with fresh firmographic data",
      "Full migration with field mapping and custom properties",
      "Pipeline stage and deal structure rebuild",
      "Daily reporting dashboard setup",
      "Team training and workflow documentation",
      "Post-migration data validation",
      "30-day post-launch support",
    ],
  },
  "inbound-orchestration": {
    name: "Inbound Lead Orchestration",
    pillar: "SALES",
    shortDesc: "End-to-end inbound pipeline from capture to enrichment to booking — fully automated.",
    longDesc: "We automate your entire inbound lead flow — from form fill to enrichment to CRM routing in under 2 minutes. Every lead is scored, prioritized, and either auto-booked or routed to the right rep with full context. Zero manual triage.",
    features: [
      "Form → Clay enrichment → CRM routing in under 2 minutes",
      "Lead scoring model (firmographic + behavioral signals)",
      "Auto-book high-intent leads directly to your calendar",
      "Slack alerts for every qualified lead with full context",
      "Round-robin and territory-based rep assignment",
      "Multi-source capture (form, chat, ad, referral)",
      "SLA tracking and response-time reporting",
      "30-day post-launch optimization sprint",
    ],
  },
  "linkedin-outbound": {
    name: "LinkedIn Outbound System",
    pillar: "MARKETING",
    shortDesc: "Signal-based LinkedIn pipeline from ICP connection to booked meeting.",
    longDesc: "We build a complete LinkedIn outbound engine — optimizing your profile, running signal-based ICP connection sequences, and converting engaged connections into booked meetings. 50+ qualified connections per week flowing into your pipeline.",
    features: [
      "Profile optimization and positioning",
      "3 posts/week content strategy for authority building",
      "ICP connection sequencing with personalized openers",
      "Signal monitoring — triggers when prospects engage with content",
      "Tiered outreach routing based on engagement score",
      "Meeting link integration and follow-up sequences",
      "Weekly performance dashboard",
      "A/B testing on messaging and CTAs",
    ],
  },
  "ai-content-engine": {
    name: "AI Content Engine",
    pillar: "MARKETING",
    shortDesc: "High-volume content pipeline where AI handles research and drafting, humans handle final polish.",
    longDesc: "We build a scalable AI content pipeline that produces 4x more output with half the team time. AI handles research, briefs, and first drafts — your team reviews and publishes. Every piece is SEO-scored before it goes live.",
    features: [
      "Content calendar and keyword-mapped topic clusters",
      "AI drafting pipeline — full article drafts per brief",
      "Human review and distribution workflow (blog, LinkedIn, email)",
      "SEO scoring for every piece before publish",
      "AI answer engine optimization for ChatGPT/Perplexity",
      "Content repurposing into LinkedIn posts and email snippets",
      "Monthly performance report with traffic attribution",
      "Brand voice guide and style enforcement",
    ],
  },
  "ai-tool-tracker": {
    name: "AI Tool Tracker (Trackr)",
    pillar: "OPERATIONS",
    shortDesc: "Evaluate, track, and optimize every AI tool in your stack with automated research and scoring.",
    longDesc: "We deploy Trackr — our AI tool intelligence platform — to give you one source of truth for your entire AI stack. Every tool is scored across 7 dimensions, spend is tracked, and you get automated renewal alerts before any auto-renews hit.",
    features: [
      "Full AI stack audit — every tool scored across 7 dimensions",
      "Spend tracking dashboard with ROI per tool",
      "Automated research on any new tool in 30 minutes",
      "Renewal calendar with Slack alerts before auto-renews",
      "Competitor tool comparison and switch recommendations",
      "Integration health monitoring",
      "Monthly AI stack optimization report",
      "Team usage analytics and adoption tracking",
    ],
  },
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const staticSvc = STATIC_SERVICES[slug]
  if (!staticSvc) {
    try {
      const service = await db.serviceArm.findUnique({ where: { slug } })
      if (!service) return {}
      return { title: service.name, description: service.shortDesc }
    } catch {
      return {}
    }
  }
  return { title: staticSvc.name, description: staticSvc.shortDesc }
}

export default async function ServicePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params

  // Try DB first, fall back to static data
  let service: {
    name: string
    pillar: string
    shortDesc: string
    longDesc: string | null
    features: string[]
    useCases: { industry: string; result: string }[]
    tiers: { id: string; name: string; price: number; interval: string; slug: string; isPopular: boolean; features: string[] }[]
    pricingModel?: string
  } | null = null

  try {
    const dbService = await db.serviceArm.findUnique({
      where: { slug },
      include: { tiers: { orderBy: { sortOrder: "asc" } } },
    })
    if (dbService) {
      service = {
        name: dbService.name,
        pillar: dbService.pillar,
        shortDesc: dbService.shortDesc,
        longDesc: dbService.longDesc,
        features: Array.isArray(dbService.features)
          ? (dbService.features as unknown[]).filter((f): f is string => typeof f === "string")
          : [],
        useCases: Array.isArray(dbService.useCases)
          ? (dbService.useCases as unknown[]).filter(
              (u): u is { industry: string; result: string } =>
                typeof u === "object" && u !== null && "industry" in u && "result" in u &&
                typeof (u as Record<string, unknown>).industry === "string" &&
                typeof (u as Record<string, unknown>).result === "string"
            )
          : [],
        tiers: dbService.tiers.map((t) => ({
          id: t.id,
          name: t.name,
          price: t.price,
          interval: t.interval,
          slug: t.slug,
          isPopular: t.isPopular,
          features: Array.isArray(t.features)
            ? (t.features as unknown[]).filter((f): f is string => typeof f === "string")
            : [],
        })),
        pricingModel: dbService.pricingModel,
      }
    }
  } catch {
    // DB unavailable — use static data
  }

  // Fall back to static config
  if (!service) {
    const staticSvc = STATIC_SERVICES[slug]
    if (!staticSvc) notFound()
    service = {
      ...staticSvc,
      longDesc: staticSvc.longDesc,
      useCases: [],
      tiers: [],
    }
  }

  const pillarColors: Record<string, string> = {
    MARKETING: "bg-primary/10 text-primary border-primary/30",
    SALES: "bg-primary/10 text-primary border-primary/30",
    OPERATIONS: "bg-primary/10 text-primary border-primary/30",
    FINANCE: "bg-primary/10 text-primary border-primary/30",
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: service.name,
    description: service.shortDesc,
    brand: { "@type": "Brand", name: "AIMS" },
    url: `${appUrl}/services/${slug}`,
    offers: service.tiers.length > 0
      ? service.tiers.map((t) => ({
          "@type": "Offer",
          name: t.name,
          price: t.price / 100,
          priceCurrency: "USD",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: t.price / 100,
            priceCurrency: "USD",
            billingDuration: t.interval === "month" ? "P1M" : "P1Y",
          },
        }))
      : { "@type": "Offer", availability: "https://schema.org/InStock" },
  }

  const hasDemo = DEMO_SLUGS.includes(slug)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="min-h-screen bg-card">
      {/* Hero — two-column when demo exists, full-width otherwise */}
      <section className="border-b border-border bg-card py-20">
        <div className={`container mx-auto px-4 ${hasDemo ? "max-w-6xl" : "max-w-4xl"}`}>
          {hasDemo ? (
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              {/* Left: copy */}
              <div>
                <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-4 ${pillarColors[service.pillar] ?? "bg-deep text-muted-foreground border-border"}`}>
                  {service.pillar}
                </span>
                <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">{service.name}</h1>
                <p className="mt-4 text-xl text-muted-foreground">{service.longDesc ?? service.shortDesc}</p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href={`/get-started?service=${slug}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 font-semibold text-white hover:bg-primary/90 transition"
                  >
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/get-started"
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-3.5 font-semibold text-foreground hover:bg-surface transition"
                  >
                    Book a Call
                  </Link>
                </div>
              </div>
              {/* Right: live demo */}
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Live Demo — Interactive Preview
                </p>
                <ServiceDemoWidget slug={slug} />
              </div>
            </div>
          ) : (
            <>
              <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-4 ${pillarColors[service.pillar] ?? "bg-deep text-muted-foreground border-border"}`}>
                {service.pillar}
              </span>
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">{service.name}</h1>
              <p className="mt-4 text-xl text-muted-foreground max-w-2xl">{service.longDesc ?? service.shortDesc}</p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href={`/get-started?service=${slug}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 font-semibold text-white hover:bg-primary/90 transition"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/get-started"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-3.5 font-semibold text-foreground hover:bg-surface transition"
                >
                  Book a Call
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Standalone demo section only for slugs without an inline demo */}
      {!hasDemo && <ServiceDemoSection slug={slug} />}

      {/* Features */}
      {service.features.length > 0 && (
        <section className="py-20 bg-card">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="text-2xl font-bold text-foreground mb-8">What&rsquo;s Included</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {service.features.map((feature) => (
                <div key={feature} className="flex items-center gap-3 rounded-xl border border-border bg-deep p-4">
                  <Check className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm font-medium text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Use Cases */}
      {service.useCases.length > 0 && (
        <section className="py-20 bg-deep">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="text-2xl font-bold text-foreground mb-8">Results By Industry</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {service.useCases.map((uc) => (
                <div key={uc.industry} className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                  <div className="text-sm font-semibold text-muted-foreground mb-2">{uc.industry}</div>
                  <div className="text-lg font-bold text-primary">{uc.result}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing */}
      {service.tiers.length > 0 && (
        <section className="py-20 bg-card">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="text-2xl font-bold text-foreground mb-8">Pricing</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {service.tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`rounded-xl border-2 bg-card p-6 ${tier.isPopular ? "border-primary shadow-lg" : "border-border"}`}
                >
                  {tier.isPopular && (
                    <div className="mb-3">
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-lg font-bold text-foreground">{tier.name}</div>
                  <div className="mt-2 text-3xl font-black text-foreground">
                    ${(tier.price / 100).toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">/{tier.interval}</span>
                  </div>
                  {tier.features.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href={`/get-started?service=${slug}&tier=${tier.slug}`}
                    className={`mt-5 block rounded-lg py-2.5 text-center text-sm font-semibold transition ${tier.isPopular ? "bg-primary text-white hover:bg-primary/90" : "border border-border text-foreground hover:bg-surface"}`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Custom pricing fallback */}
      {service.tiers.length === 0 && (
        <section className="py-20 bg-deep">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
              <h2 className="text-2xl font-bold text-foreground mb-3">Custom Pricing</h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Pricing for {service.name} is tailored to your business size, goals, and scope. Book a call and we&rsquo;ll build your plan.
              </p>
              <Link
                href={`/get-started?service=${slug}`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 font-semibold text-white hover:bg-primary/90 transition"
              >
                Get a Custom Quote <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
          <p className="mt-3 text-muted-foreground">Book a strategy call and we&rsquo;ll build your custom plan.</p>
          <Link
            href="/get-started"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 font-semibold text-white hover:bg-primary/90 transition"
          >
            Book a Strategy Call <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
    </>
  )
}
