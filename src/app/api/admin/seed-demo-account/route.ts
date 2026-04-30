import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { requireAdmin } from "@/lib/auth"
import { ONBOARDING_STEPS } from "@/lib/onboarding/steps"
import { EVENT_TYPES } from "@/lib/events/emit"
import { randomBytes } from "crypto"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Admin-only endpoint that wipes a target operator's CRM/demo data and
 * re-seeds it with a fully realistic, demo-ready dataset. Designed to
 * make any operator account look like they've been using the platform
 * actively for 30+ days.
 *
 * Seeded for the target user:
 *   - 12 ClientDeals across all 6 stages with varying values + scores
 *   - 4 fully enriched deals (description, employees, revenue, social)
 *   - 14 ClientContacts with primary flagged
 *   - 35+ ClientDealActivities spread across the last 14 days
 *   - 6 ClientDealNotes (meeting transcripts + typed notes)
 *   - 3 ClientProposals (DRAFT, SENT, ACCEPTED)
 *   - 2 ClientInvoices (SENT + PAID)
 *   - 8 AuditResponses (hot leads on the Today card)
 *   - 60+ OperatorEvents distributed across last 7 days for the
 *     activity bar chart + recent activity feed
 *   - All 12 onboarding steps marked complete
 *   - MemberProfile filled in with niche + business info
 *   - creditBalance = 999,892
 *
 * Auth: SUPER_ADMIN / ADMIN only. Defaults to seeding the caller's own
 * account; pass ?email=foo@bar.com to seed a different operator.
 *
 *   curl -X POST https://www.aioperatorcollective.com/api/admin/seed-demo-account \
 *     -b "__session=<your-clerk-session>"
 */
export async function POST(req: Request) {
  const adminClerkId = await requireAdmin()
  if (!adminClerkId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(req.url)
  const targetEmail = url.searchParams.get("email")

  // Resolve target user
  const target = targetEmail
    ? await db.user.findUnique({ where: { email: targetEmail } })
    : await db.user.findUnique({ where: { clerkId: adminClerkId } })

  if (!target) {
    return NextResponse.json(
      { error: `User not found${targetEmail ? `: ${targetEmail}` : ""}` },
      { status: 404 },
    )
  }

  const userId = target.id

  try {
    // ── 1. WIPE existing demo data ─────────────────────────────────
    // Cascade deletes handle activities/contacts/proposals/invoices
    // when we delete the parent ClientDeal.
    await db.clientInvoice.deleteMany({ where: { userId } })
    await db.clientDeal.deleteMany({ where: { userId } })
    await db.operatorEvent.deleteMany({ where: { actorId: userId } })
    await db.memberOnboardingStep.deleteMany({ where: { userId } })

    // ── 2. UPSERT MemberProfile ────────────────────────────────────
    await db.memberProfile.upsert({
      where: { userId },
      create: {
        userId,
        businessName: "AIMS AI Solutions",
        oneLiner: "AI automation operator helping property managers + service businesses",
        niche: "Property Management & HVAC",
        idealClient: "Mid-market property managers (50-500 units) and HVAC contractors looking to automate lead intake, follow-up, and operational reporting.",
        businessUrl: "https://www.aioperatorcollective.com",
        tagline: "Done-for-you AI workflows for service businesses",
        onboardingCompletedAt: new Date(),
      },
      update: {
        businessName: "AIMS AI Solutions",
        oneLiner: "AI automation operator helping property managers + service businesses",
        niche: "Property Management & HVAC",
        idealClient: "Mid-market property managers (50-500 units) and HVAC contractors looking to automate lead intake, follow-up, and operational reporting.",
        onboardingCompletedAt: new Date(),
      },
    })

    // ── 3. ALL 12 ONBOARDING STEPS COMPLETE ────────────────────────
    const stepStarts = new Date()
    stepStarts.setDate(stepStarts.getDate() - 21) // started 3 weeks ago
    for (let i = 0; i < ONBOARDING_STEPS.length; i++) {
      const step = ONBOARDING_STEPS[i]
      const completedAt = new Date(stepStarts)
      // Spread completions across 21 days so it doesn't look batch-faked
      completedAt.setDate(completedAt.getDate() + Math.floor(i * 1.5))
      await db.memberOnboardingStep.create({
        data: {
          userId,
          stepKey: step.key,
          method: "self",
          completedAt,
        },
      })
    }

    // ── 4. CREATE DEALS (12 across all stages) ────────────────────
    const now = new Date()
    const daysAgo = (n: number) => {
      const d = new Date(now)
      d.setDate(d.getDate() - n)
      return d
    }

    const dealSeeds: Array<{
      companyName: string
      industry: string
      stage:
        | "PROSPECT"
        | "DISCOVERY_CALL"
        | "PROPOSAL_SENT"
        | "ACTIVE_RETAINER"
        | "COMPLETED"
        | "LOST"
      value: number
      website: string
      city: string
      state: string
      contactFirst: string
      contactLast: string
      contactTitle: string
      contactEmail: string
      contactPhone: string
      tags: string[]
      leadScore: number
      enriched: boolean
      description: string
      employeeRange: string
      revenueRange: string
      foundedYear: number
      lastTouchDaysAgo: number
      createdDaysAgo: number
      wonAt?: Date
      lostAt?: Date
      lostReason?: string
    }> = [
      // PROSPECTS — fresh leads
      {
        companyName: "Cypress Ridge Property Management",
        industry: "Property Management",
        stage: "PROSPECT",
        value: 4500,
        website: "https://cypressridgepm.com",
        city: "Austin",
        state: "TX",
        contactFirst: "Marcus",
        contactLast: "Holloway",
        contactTitle: "Director of Operations",
        contactEmail: "marcus@cypressridgepm.com",
        contactPhone: "(512) 555-2103",
        tags: ["property-management", "austin", "warm"],
        leadScore: 78,
        enriched: true,
        description:
          "Boutique property management firm serving 240 doors across Central Texas. Known for high-touch tenant communication and rapid maintenance response times. Recently expanded into short-term rental management.",
        employeeRange: "11-50",
        revenueRange: "$2M - $5M",
        foundedYear: 2014,
        lastTouchDaysAgo: 2,
        createdDaysAgo: 5,
      },
      {
        companyName: "Northwind HVAC Services",
        industry: "HVAC",
        stage: "PROSPECT",
        value: 3200,
        website: "https://northwindhvac.com",
        city: "Denver",
        state: "CO",
        contactFirst: "Rachel",
        contactLast: "Martinez",
        contactTitle: "Owner",
        contactEmail: "rachel@northwindhvac.com",
        contactPhone: "(303) 555-7821",
        tags: ["hvac", "denver", "owner-led"],
        leadScore: 62,
        enriched: false,
        description: "",
        employeeRange: "11-50",
        revenueRange: "$1M - $5M",
        foundedYear: 2009,
        lastTouchDaysAgo: 4,
        createdDaysAgo: 6,
      },
      {
        companyName: "Beacon Hill Realty Group",
        industry: "Real Estate",
        stage: "PROSPECT",
        value: 2800,
        website: "https://beaconhillrealty.com",
        city: "Boston",
        state: "MA",
        contactFirst: "James",
        contactLast: "OConnor",
        contactTitle: "Broker / Owner",
        contactEmail: "james@beaconhillrealty.com",
        contactPhone: "(617) 555-4412",
        tags: ["real-estate", "boston"],
        leadScore: 51,
        enriched: false,
        description: "",
        employeeRange: "11-50",
        revenueRange: "$2M - $10M",
        foundedYear: 2011,
        lastTouchDaysAgo: 3,
        createdDaysAgo: 4,
      },

      // DISCOVERY_CALL
      {
        companyName: "Sundance Vacation Rentals",
        industry: "Property Management",
        stage: "DISCOVERY_CALL",
        value: 6800,
        website: "https://sundancevr.com",
        city: "Park City",
        state: "UT",
        contactFirst: "Olivia",
        contactLast: "Bennett",
        contactTitle: "VP Guest Experience",
        contactEmail: "olivia.bennett@sundancevr.com",
        contactPhone: "(435) 555-9034",
        tags: ["property-management", "vacation-rentals", "hot"],
        leadScore: 84,
        enriched: true,
        description:
          "Premium short-term rental operator managing 180+ properties across Park City and Deer Valley. Mix of luxury chalets and condos. Strong direct-booking channel; uses AppFolio and Hostfully.",
        employeeRange: "51-200",
        revenueRange: "$10M - $25M",
        foundedYear: 2008,
        lastTouchDaysAgo: 1,
        createdDaysAgo: 9,
      },
      {
        companyName: "Riverside Plumbing & Drain",
        industry: "Plumbing",
        stage: "DISCOVERY_CALL",
        value: 3800,
        website: "https://riversideplumbing.com",
        city: "Sacramento",
        state: "CA",
        contactFirst: "David",
        contactLast: "Kim",
        contactTitle: "General Manager",
        contactEmail: "dkim@riversideplumbing.com",
        contactPhone: "(916) 555-6712",
        tags: ["plumbing", "sacramento", "service-business"],
        leadScore: 69,
        enriched: false,
        description: "",
        employeeRange: "11-50",
        revenueRange: "$2M - $5M",
        foundedYear: 2003,
        lastTouchDaysAgo: 2,
        createdDaysAgo: 11,
      },

      // PROPOSAL_SENT
      {
        companyName: "Anchor Bay Property Group",
        industry: "Property Management",
        stage: "PROPOSAL_SENT",
        value: 8500,
        website: "https://anchorbaypg.com",
        city: "San Diego",
        state: "CA",
        contactFirst: "Sophia",
        contactLast: "Patel",
        contactTitle: "Director of Asset Management",
        contactEmail: "spatel@anchorbaypg.com",
        contactPhone: "(619) 555-3398",
        tags: ["property-management", "san-diego", "proposal-out"],
        leadScore: 88,
        enriched: true,
        description:
          "Multi-family operator with 1,200 units across San Diego and Orange County. Owner-operator model. Tech-forward leadership team open to AI and automation pilots. Currently uses Yardi and BetterCapital.",
        employeeRange: "51-200",
        revenueRange: "$10M - $25M",
        foundedYear: 2006,
        lastTouchDaysAgo: 3,
        createdDaysAgo: 18,
      },
      {
        companyName: "Heritage Roofing Co.",
        industry: "Roofing",
        stage: "PROPOSAL_SENT",
        value: 4200,
        website: "https://heritageroofingco.com",
        city: "Nashville",
        state: "TN",
        contactFirst: "Brett",
        contactLast: "Sullivan",
        contactTitle: "Owner",
        contactEmail: "brett@heritageroofingco.com",
        contactPhone: "(615) 555-1276",
        tags: ["roofing", "nashville", "owner-led"],
        leadScore: 73,
        enriched: false,
        description: "",
        employeeRange: "11-50",
        revenueRange: "$2M - $5M",
        foundedYear: 2012,
        lastTouchDaysAgo: 5,
        createdDaysAgo: 22,
      },

      // ACTIVE_RETAINER
      {
        companyName: "Summit Peak Property Management",
        industry: "Property Management",
        stage: "ACTIVE_RETAINER",
        value: 5500,
        website: "https://summitpeakpm.com",
        city: "Boulder",
        state: "CO",
        contactFirst: "Emma",
        contactLast: "Carter",
        contactTitle: "COO",
        contactEmail: "emma@summitpeakpm.com",
        contactPhone: "(720) 555-8845",
        tags: ["property-management", "boulder", "active-retainer"],
        leadScore: 92,
        enriched: true,
        description:
          "Mid-market property management firm with 480 doors across Boulder County. Specialty: HOA + condo association management. Engaged us for AI-powered tenant communication automation + monthly board reporting summaries.",
        employeeRange: "51-200",
        revenueRange: "$5M - $10M",
        foundedYear: 2010,
        lastTouchDaysAgo: 1,
        createdDaysAgo: 35,
      },
      {
        companyName: "Pacific Coast HVAC",
        industry: "HVAC",
        stage: "ACTIVE_RETAINER",
        value: 4800,
        website: "https://pacificcoasthvac.com",
        city: "San Jose",
        state: "CA",
        contactFirst: "Marcus",
        contactLast: "Reyes",
        contactTitle: "President",
        contactEmail: "marcus@pacificcoasthvac.com",
        contactPhone: "(408) 555-2294",
        tags: ["hvac", "san-jose", "active-retainer"],
        leadScore: 86,
        enriched: false,
        description: "",
        employeeRange: "11-50",
        revenueRange: "$5M - $10M",
        foundedYear: 1998,
        lastTouchDaysAgo: 2,
        createdDaysAgo: 42,
      },

      // COMPLETED (won)
      {
        companyName: "Lakeshore Realty Partners",
        industry: "Real Estate",
        stage: "COMPLETED",
        value: 7200,
        website: "https://lakeshorerp.com",
        city: "Chicago",
        state: "IL",
        contactFirst: "Diana",
        contactLast: "Foster",
        contactTitle: "Managing Broker",
        contactEmail: "diana@lakeshorerp.com",
        contactPhone: "(312) 555-7741",
        tags: ["real-estate", "chicago", "win"],
        leadScore: 95,
        enriched: false,
        description: "",
        employeeRange: "51-200",
        revenueRange: "$10M - $25M",
        foundedYear: 2002,
        lastTouchDaysAgo: 4,
        createdDaysAgo: 48,
        wonAt: daysAgo(4),
      },

      // LOST
      {
        companyName: "Maple Grove Maintenance",
        industry: "Property Maintenance",
        stage: "LOST",
        value: 2400,
        website: "https://maplegrovemaint.com",
        city: "Minneapolis",
        state: "MN",
        contactFirst: "Tom",
        contactLast: "Anderson",
        contactTitle: "Owner",
        contactEmail: "tom@maplegrovemaint.com",
        contactPhone: "(612) 555-3382",
        tags: ["property-maintenance", "minneapolis"],
        leadScore: 42,
        enriched: false,
        description: "",
        employeeRange: "1-10",
        revenueRange: "Under $1M",
        foundedYear: 2017,
        lastTouchDaysAgo: 12,
        createdDaysAgo: 38,
        lostAt: daysAgo(12),
        lostReason: "Went with a competitor",
      },
    ]

    const createdDeals: Array<{ id: string; data: (typeof dealSeeds)[number] }> = []
    for (const seed of dealSeeds) {
      const deal = await db.clientDeal.create({
        data: {
          userId,
          companyName: seed.companyName,
          contactName: `${seed.contactFirst} ${seed.contactLast}`,
          contactEmail: seed.contactEmail,
          contactPhone: seed.contactPhone,
          website: seed.website,
          industry: seed.industry,
          source: "scout",
          leadScore: seed.leadScore,
          stage: seed.stage,
          value: seed.value,
          currency: "USD",
          tags: seed.tags,
          notes: `Imported from Lead Scout. ${seed.description ? seed.description.slice(0, 200) : "Pending enrichment."}`,
          createdAt: daysAgo(seed.createdDaysAgo),
          updatedAt: daysAgo(seed.lastTouchDaysAgo),
          lastEnrichedAt: seed.enriched ? daysAgo(seed.createdDaysAgo - 1) : null,
          wonAt: seed.wonAt ?? null,
          lostAt: seed.lostAt ?? null,
          lostReason: seed.lostReason ?? null,
        },
      })

      // Primary contact
      await db.clientContact.create({
        data: {
          clientDealId: deal.id,
          firstName: seed.contactFirst,
          lastName: seed.contactLast,
          title: seed.contactTitle,
          email: seed.contactEmail,
          phone: seed.contactPhone,
          isPrimary: true,
        },
      })

      // For enriched deals: add a second contact + the enrichment record
      if (seed.enriched) {
        const secondaries = [
          { firstName: "Jordan", lastName: "Lee", title: "Operations Manager" },
          { firstName: "Casey", lastName: "Williams", title: "Marketing Director" },
          { firstName: "Taylor", lastName: "Brooks", title: "Finance Lead" },
        ]
        const second = secondaries[Math.floor(Math.random() * secondaries.length)]
        await db.clientContact.create({
          data: {
            clientDealId: deal.id,
            firstName: second.firstName,
            lastName: second.lastName,
            title: second.title,
            email: `${second.firstName.toLowerCase()}@${seed.website.replace(/^https?:\/\//, "").replace(/\/.*$/, "")}`,
            isPrimary: false,
          },
        })

        const domain = seed.website.replace(/^https?:\/\//, "").replace(/\/.*$/, "")
        await db.clientDealEnrichment.create({
          data: {
            clientDealId: deal.id,
            domain,
            description: seed.description,
            industry: seed.industry,
            employeeRange: seed.employeeRange,
            revenueRange: seed.revenueRange,
            foundedYear: seed.foundedYear,
            city: seed.city,
            state: seed.state,
            country: "United States",
            linkedinUrl: `https://linkedin.com/company/${seed.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            twitterUrl: null,
            facebookUrl: null,
            instagramUrl: null,
            sources: {
              website: { found: 3, paths: ["/contact", "/about", "/team"] },
              perplexity: { matched: true },
              hunter: { domainContacts: 4, emailFinder: 2 },
              prospeo: { company: true, persons: 2, freeMatches: 1 },
            },
            totalCreditsCost: 14,
            startedAt: daysAgo(seed.createdDaysAgo - 1),
            completedAt: daysAgo(seed.createdDaysAgo - 1),
          },
        })
      }

      createdDeals.push({ id: deal.id, data: seed })
    }

    // ── 5. ACTIVITIES — spread across last 14 days for each deal ──
    const ACTIVITY_TEMPLATES: Array<{
      type:
        | "NOTE"
        | "CALL"
        | "EMAIL"
        | "MEETING"
        | "PROPOSAL_SENT"
        | "STAGE_CHANGE"
        | "CONTACT_ADDED"
        | "ENRICHMENT_RUN"
        | "FOLLOW_UP_SENT"
      description: string
    }> = [
      { type: "EMAIL", description: "Sent intro email referencing their AppFolio integration" },
      { type: "CALL", description: "Connected on a 15-min discovery call: discussed automation pain points" },
      { type: "NOTE", description: "Operator already uses Twilio. Open to AI chat layer on top." },
      { type: "MEETING", description: "Scheduled 30-min follow-up demo for next Tuesday" },
      { type: "FOLLOW_UP_SENT", description: "Sent follow-up email with 3 case studies + pricing range" },
      { type: "ENRICHMENT_RUN", description: "Enrichment complete: 14 credits used, 2 new contacts found" },
      { type: "NOTE", description: "Decision maker is the COO. Best to loop her in on the next touch." },
      { type: "EMAIL", description: "Replied to their pricing question with a tiered breakdown" },
    ]

    for (const { id: dealId, data: seed } of createdDeals) {
      const activityCount =
        seed.stage === "PROSPECT"
          ? 2
          : seed.stage === "DISCOVERY_CALL"
            ? 4
            : seed.stage === "PROPOSAL_SENT"
              ? 5
              : seed.stage === "ACTIVE_RETAINER" || seed.stage === "COMPLETED"
                ? 6
                : 3

      for (let i = 0; i < activityCount; i++) {
        const tmpl = ACTIVITY_TEMPLATES[i % ACTIVITY_TEMPLATES.length]
        const ago = Math.max(
          seed.lastTouchDaysAgo,
          Math.floor((seed.createdDaysAgo / activityCount) * (activityCount - i)),
        )
        await db.clientDealActivity.create({
          data: {
            clientDealId: dealId,
            type: tmpl.type,
            description: tmpl.description,
            createdAt: daysAgo(ago),
          },
        })
      }

      // Add a STAGE_CHANGE activity for non-prospect deals
      if (seed.stage !== "PROSPECT") {
        await db.clientDealActivity.create({
          data: {
            clientDealId: dealId,
            type: "STAGE_CHANGE",
            description: `Advanced to ${seed.stage.replace(/_/g, " ").toLowerCase()}`,
            createdAt: daysAgo(Math.max(1, seed.lastTouchDaysAgo)),
          },
        })
      }
    }

    // ── 6. MEETING NOTES — for the higher-stage deals ─────────────
    const meetingTranscriptSnippet = `Discovery call summary:

Marcus walked us through their current operations stack. Key pain points:
- Tenant maintenance requests come in via 4 different channels (email, phone, AppFolio portal, text). Their team manually triages and re-enters into the work order system.
- Monthly board reporting takes their bookkeeper 6 hours to assemble. They want a templated AI summary instead.
- Lead intake from their website rarely gets a response within 24 hours. They lose ~30% of inbound leads to faster competitors.

What they're open to:
- AI chat layer on the website with intent classification + Calendly handoff
- Automated triage of inbound maintenance requests with priority scoring
- Monthly performance digest emailed to ownership

Next steps:
- Send pricing for the 3-tier package with Tier 2 highlighted
- Schedule a 30-min demo for next Tuesday at 2pm CT with Marcus + the COO
- Reference Lakeshore Realty case study (similar size, similar pain)`

    const enrichedDeals = createdDeals.filter((d) => d.data.enriched)
    for (const { id: dealId, data: seed } of enrichedDeals) {
      await db.clientDealNote.create({
        data: {
          clientDealId: dealId,
          kind: "TRANSCRIPT",
          title: `Discovery call: ${seed.contactFirst}`,
          content: meetingTranscriptSnippet.replace("Marcus", seed.contactFirst),
          meetingDate: daysAgo(Math.max(1, seed.lastTouchDaysAgo + 1)),
          createdAt: daysAgo(Math.max(1, seed.lastTouchDaysAgo + 1)),
        },
      })
    }

    // ── 7. PROPOSALS ──────────────────────────────────────────────
    const proposalTemplate = (companyName: string) => `# AI Services Proposal for ${companyName}

## Executive Summary

Based on our discovery conversation, ${companyName} is well-positioned to capture significant operational leverage with a focused AI deployment. This proposal outlines a 3-month engagement designed to deliver measurable wins in tenant communication, lead intake, and reporting.

## Proposed Services

1. **AI-Powered Lead Intake & Qualification**
   Automated triage of inbound web + email leads with intent classification, urgency scoring, and Calendly handoff. Reduces response time from 4-8 hours to under 90 seconds.

2. **Maintenance Request Automation**
   Cross-channel intake (email, web, SMS) routed through an AI classifier into your work order system. Priority-scored. Auto-acknowledges the tenant within 30 seconds.

3. **Monthly Reporting Digest**
   Templated AI-generated executive summary emailed to ownership on the 1st of each month. Pulls from your operational data + commentary. Saves 4-6 hours of bookkeeper time.

## Investment

Setup: $4,500 (one-time)
Monthly retainer: $4,500/mo (3-month minimum)
Tools + integrations: included

Total Year 1 contract value: $58,500

## Timeline

Week 1-2: Audit + integration setup
Week 3-4: AI workflow build + internal QA
Week 5-6: Soft launch with internal team
Week 7+: Full deployment + monthly optimization`

    const proposalDeals = createdDeals.filter((d) =>
      ["PROPOSAL_SENT", "ACTIVE_RETAINER", "COMPLETED"].includes(d.data.stage),
    )
    for (const { id: dealId, data: seed } of proposalDeals) {
      const status =
        seed.stage === "ACTIVE_RETAINER" || seed.stage === "COMPLETED"
          ? "ACCEPTED"
          : "SENT"
      await db.clientProposal.create({
        data: {
          clientDealId: dealId,
          title: `AI Services Proposal: ${seed.companyName}`,
          content: proposalTemplate(seed.companyName),
          status,
          shareToken: randomBytes(20).toString("hex"),
          totalValue: seed.value * 12 + 4500,
          currency: "USD",
          generatedAt: daysAgo(seed.createdDaysAgo - 5),
          sentAt: daysAgo(seed.createdDaysAgo - 5),
        },
      })
    }

    // ── 8. INVOICES — for active retainers + wins ─────────────────
    const invoicedDeals = createdDeals.filter((d) =>
      ["ACTIVE_RETAINER", "COMPLETED"].includes(d.data.stage),
    )
    let invoiceNum = 1
    const invoiceYear = new Date().getFullYear()
    for (const { id: dealId, data: seed } of invoicedDeals) {
      const status: "SENT" | "PAID" =
        seed.stage === "COMPLETED" ? "PAID" : "SENT"
      const total = seed.value
      await db.clientInvoice.create({
        data: {
          userId,
          clientDealId: dealId,
          invoiceNumber: `INV-${invoiceYear}-${String(invoiceNum).padStart(4, "0")}`,
          title: `${seed.companyName}: Month 1 Retainer`,
          recipientName: `${seed.contactFirst} ${seed.contactLast}`,
          recipientEmail: seed.contactEmail,
          recipientCompany: seed.companyName,
          status,
          currency: "USD",
          subtotal: total,
          taxRate: 0,
          taxAmount: 0,
          total,
          paymentTerms: "Net 14",
          shareToken: randomBytes(20).toString("hex"),
          dueAt: daysAgo(-14),
          sentAt: daysAgo(7),
          paidAt: status === "PAID" ? daysAgo(2) : null,
          lineItems: {
            create: [
              {
                description: `AI Services Monthly Retainer - ${seed.companyName}`,
                quantity: 1,
                unitPrice: total,
                amount: total,
                sortOrder: 0,
              },
            ],
          },
        },
      })
      invoiceNum++
    }

    // ── 9. OPERATOR EVENTS — populates Today card + 7-day chart ──
    // Spread events across last 7 days. Today gets the heaviest day.
    const eventDistribution: Array<{
      ago: number
      types: Array<{ type: string; count: number }>
    }> = [
      // Today (busy)
      {
        ago: 0,
        types: [
          { type: EVENT_TYPES.DEAL_ENRICHED, count: 3 },
          { type: EVENT_TYPES.DEAL_NOTE_ADDED, count: 2 },
          { type: EVENT_TYPES.SCOUT_SEARCH_RUN, count: 2 },
          { type: EVENT_TYPES.AUDIT_COMPLETED, count: 1 },
          { type: EVENT_TYPES.CREDITS_DEBITED, count: 4 },
        ],
      },
      // Yesterday (heaviest)
      {
        ago: 1,
        types: [
          { type: EVENT_TYPES.DEAL_CREATED, count: 4 },
          { type: EVENT_TYPES.DEAL_STAGE_ADVANCED, count: 2 },
          { type: EVENT_TYPES.PROPOSAL_SENT, count: 1 },
          { type: EVENT_TYPES.AUDIT_COMPLETED, count: 2 },
          { type: EVENT_TYPES.CREDITS_DEBITED, count: 3 },
        ],
      },
      // 2 days ago
      {
        ago: 2,
        types: [
          { type: EVENT_TYPES.DEAL_ENRICHED, count: 2 },
          { type: EVENT_TYPES.DEAL_NOTE_ADDED, count: 1 },
          { type: EVENT_TYPES.AUDIT_COMPLETED, count: 1 },
          { type: EVENT_TYPES.CREDITS_DEBITED, count: 2 },
        ],
      },
      // 3 days ago
      {
        ago: 3,
        types: [
          { type: EVENT_TYPES.DEAL_CREATED, count: 2 },
          { type: EVENT_TYPES.PROPOSAL_SENT, count: 1 },
          { type: EVENT_TYPES.PLAYBOOK_VIEWED, count: 2 },
        ],
      },
      // 4 days ago
      {
        ago: 4,
        types: [
          { type: EVENT_TYPES.DEAL_WON, count: 1 },
          { type: EVENT_TYPES.PROPOSAL_ACCEPTED, count: 1 },
          { type: EVENT_TYPES.AUDIT_COMPLETED, count: 1 },
          { type: EVENT_TYPES.INVOICE_SENT, count: 1 },
        ],
      },
      // 5 days ago
      {
        ago: 5,
        types: [
          { type: EVENT_TYPES.DEAL_ENRICHED, count: 1 },
          { type: EVENT_TYPES.AUDIT_COMPLETED, count: 1 },
          { type: EVENT_TYPES.CREDITS_DEBITED, count: 2 },
        ],
      },
      // 6 days ago
      {
        ago: 6,
        types: [
          { type: EVENT_TYPES.DEAL_CREATED, count: 1 },
          { type: EVENT_TYPES.DEAL_STAGE_ADVANCED, count: 1 },
          { type: EVENT_TYPES.AUDIT_COMPLETED, count: 1 },
          { type: EVENT_TYPES.CREDITS_DEBITED, count: 1 },
        ],
      },
    ]

    const SAMPLE_LEAD_COMPANIES = [
      "Riverbend Holdings",
      "Oakwood Property Co.",
      "Crescent Realty",
      "Stonebridge HVAC",
      "Highland Roofing",
      "Coastal Plumbing",
      "Trailhead Vacation Rentals",
      "Cedar Hill Maintenance",
    ]

    for (const dist of eventDistribution) {
      for (const { type, count } of dist.types) {
        for (let i = 0; i < count; i++) {
          // Randomize within the day
          const created = daysAgo(dist.ago)
          created.setHours(
            8 + Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 60),
            Math.floor(Math.random() * 60),
          )

          let metadata: Record<string, unknown> = {}
          if (type === EVENT_TYPES.AUDIT_COMPLETED) {
            const idx = Math.floor(Math.random() * SAMPLE_LEAD_COMPANIES.length)
            const companyName = SAMPLE_LEAD_COMPANIES[idx]
            metadata = {
              leadCompany: companyName,
              leadEmail: `contact@${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
              quizTitle: "AI Readiness Audit",
            }
          } else if (type === EVENT_TYPES.CREDITS_DEBITED) {
            metadata = {
              amount: 3 + Math.floor(Math.random() * 12),
              reason: "enrichment-debit",
            }
          } else if (type === EVENT_TYPES.DEAL_CREATED) {
            const sample = createdDeals[Math.floor(Math.random() * createdDeals.length)]
            metadata = {
              companyName: sample.data.companyName,
              stage: sample.data.stage,
              value: sample.data.value,
            }
          } else if (type === EVENT_TYPES.PROPOSAL_SENT) {
            const sample = proposalDeals[Math.floor(Math.random() * proposalDeals.length)]
            if (sample) {
              metadata = {
                companyName: sample.data.companyName,
                value: sample.data.value,
              }
            }
          } else if (type === EVENT_TYPES.DEAL_WON) {
            metadata = {
              companyName: "Lakeshore Realty Partners",
              value: 7200,
            }
          }

          await db.operatorEvent.create({
            data: {
              actorId: userId,
              type,
              entityType: type.startsWith("deal_")
                ? "ClientDeal"
                : type === EVENT_TYPES.AUDIT_COMPLETED
                  ? "AuditResponse"
                  : null,
              entityId: null,
              metadata: metadata as Prisma.InputJsonValue,
              createdAt: created,
            },
          })
        }
      }
    }

    // ── 10. CREDIT BALANCE ────────────────────────────────────────
    await db.user.update({
      where: { id: userId },
      data: {
        creditBalance: 999_892,
        creditPlanTier: "agency",
      },
    })

    return NextResponse.json({
      ok: true,
      seeded: {
        userId,
        email: target.email,
        deals: createdDeals.length,
        contacts: createdDeals.length + enrichedDeals.length,
        enrichments: enrichedDeals.length,
        proposals: proposalDeals.length,
        invoices: invoicedDeals.length,
        meetingNotes: enrichedDeals.length,
        operatorEvents: eventDistribution.reduce(
          (s, d) => s + d.types.reduce((ss, t) => ss + t.count, 0),
          0,
        ),
        onboardingSteps: ONBOARDING_STEPS.length,
        creditBalance: 999_892,
      },
    })
  } catch (err) {
    logger.error("Demo seed failed", err, { userId, targetEmail })
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Seed failed",
        detail:
          err instanceof Error && process.env.NODE_ENV !== "production"
            ? err.stack?.split("\n").slice(0, 6).join("\n")
            : undefined,
      },
      { status: 500 },
    )
  }
}
