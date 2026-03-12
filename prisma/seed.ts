import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding AIMS database...")

  // ============ SERVICE ARMS ============

  const serviceArms = [
    {
      slug: "website-crm-chatbot",
      name: "Website + CRM + Chatbot",
      shortDesc: "GHL-powered website with built-in CRM pipeline and AI chatbot that converts visitors into booked meetings.",
      longDesc: "Deploy a complete marketing website with integrated CRM, booking calendar, and AI chatbot in days, not months. Built on GoHighLevel with industry-specific templates. Self-serve onboarding with guided DNS setup.",
      pillar: "MARKETING" as const,
      status: "ACTIVE" as const,
      pricingModel: "MONTHLY" as const,
      basePrice: 97,
      iconName: "Globe",
      demoType: "INTERACTIVE" as const,
      isFeatured: true,
      sortOrder: 1,
      defaultAssignee: "sabbir",
      estimatedSetupDays: 3,
      setupSteps: [
        { title: "Deploy GHL snapshot for client industry", description: "Select appropriate snapshot and spin up subaccount" },
        { title: "Configure DNS", description: "Guide client through DNS wizard or handle manually" },
        { title: "Customize chatbot", description: "Train chatbot on client business info from intake form" },
        { title: "Onboarding call", description: "Walk through CRM pipeline, booking calendar, and analytics" },
      ],
      features: [
        { icon: "Globe", title: "Custom Website", description: "Industry-optimized template deployed in minutes" },
        { icon: "MessageSquare", title: "AI Chatbot", description: "Trained on your business, captures leads 24/7" },
        { icon: "Kanban", title: "CRM Pipeline", description: "Track every lead from first touch to closed deal" },
        { icon: "Calendar", title: "Booking Calendar", description: "Prospects book directly on your calendar" },
        { icon: "Mail", title: "Email Automations", description: "Nurture sequences that run on autopilot" },
        { icon: "BarChart", title: "Analytics Dashboard", description: "See what's working at a glance" },
      ],
      tiers: [
        { name: "Starter", slug: "starter", price: 9700, interval: "month", sortOrder: 0, stripePriceId: "price_1T8B9IExwpuzI9OqNUo8zIIA", features: ["GHL website template", "Booking calendar", "Basic analytics", "Email support"] },
        { name: "Growth", slug: "growth", price: 19700, interval: "month", sortOrder: 1, stripePriceId: "price_1T8B9IExwpuzI9Oq6JYgM2t3", features: ["Everything in Starter", "AI Chatbot", "CRM pipeline", "Contact management", "Basic automations"] },
        { name: "Pro", slug: "pro", price: 29700, interval: "month", sortOrder: 2, isPopular: true, stripePriceId: "price_1T8B9JExwpuzI9OqYMPWhc8K", features: ["Everything in Growth", "Email automations", "Lead nurture sequences", "SMS follow-up", "Priority support"] },
        { name: "Elite", slug: "elite", price: 39700, interval: "month", sortOrder: 3, stripePriceId: "price_1T8B9JExwpuzI9OqfiasQeyd", features: ["Everything in Pro", "Voice agent integration", "Full workflow automation", "Dedicated account manager", "Custom integrations"] },
      ],
    },
    {
      slug: "cold-outbound",
      name: "Cold Outbound Engine",
      shortDesc: "Multi-domain email infrastructure with AI-powered enrichment, automated sending, and SDR reply handling.",
      longDesc: "Fully managed cold email campaigns built on owned infrastructure. We handle domain provisioning, sender warm-up, Clay-based enrichment, campaign copywriting, and AI SDR reply handling. You show up to meetings.",
      pillar: "SALES" as const,
      status: "ACTIVE" as const,
      pricingModel: "CUSTOM" as const,
      iconName: "Send",
      demoType: "ANIMATED_FLOW" as const,
      isFeatured: true,
      sortOrder: 2,
      defaultAssignee: "marco",
      estimatedSetupDays: 7,
      features: [
        { icon: "Server", title: "Owned Infrastructure", description: "Multi-domain sender stack, no agency dependency" },
        { icon: "Search", title: "Clay Enrichment", description: "Leads enriched with 50+ data points before sending" },
        { icon: "Bot", title: "AI SDR", description: "Automated reply handling with human escalation" },
        { icon: "BarChart", title: "Campaign Reporting", description: "Open, reply, and meeting rates in real-time" },
      ],
      tiers: [
        { name: "Standard", slug: "standard", price: 99700, interval: "month", sortOrder: 0, stripePriceId: "price_1T9xVlA5fjeDwxZxiTWxMCs1", features: ["Multi-domain sender stack", "Clay enrichment", "AI SDR reply handling", "Campaign reporting"] },
      ],
    },
    {
      slug: "voice-agents",
      name: "AI Voice Agent Platform",
      shortDesc: "Inbound and outbound AI calling agents that qualify leads, book appointments, and handle recalls across locations.",
      longDesc: "Replace manual call operations with AI voice agents that handle inbound qualification, outbound recall campaigns, and multi-location routing. Every call transcribed and logged to your CRM.",
      pillar: "SALES" as const,
      status: "ACTIVE" as const,
      pricingModel: "CUSTOM" as const,
      iconName: "Phone",
      demoType: "VOICE_PLAYER" as const,
      isFeatured: true,
      sortOrder: 3,
      defaultAssignee: "ivan",
      features: [
        { icon: "PhoneIncoming", title: "Inbound Handling", description: "Callbacks in under 60 seconds, 24/7 coverage" },
        { icon: "PhoneOutgoing", title: "Outbound Campaigns", description: "Recall outreach, lead reactivation at scale" },
        { icon: "MapPin", title: "Multi-Location Routing", description: "Route calls by location for dealerships and chains" },
        { icon: "FileText", title: "Full Transcripts", description: "Every call transcribed and searchable in CRM" },
      ],
      useCases: [
        { industry: "Car Dealerships", pain: "Two employees calling all day for recalls across 20 locations", result: "Single voice agent handles 100% of recall outreach" },
        { industry: "HVAC / Home Services", pain: "Missing after-hours calls and losing leads", result: "AI answers and books within 60 seconds, any hour" },
        { industry: "Medical Offices", pain: "Front desk overwhelmed with scheduling calls", result: "AI handles scheduling, rescheduling, and confirmations" },
      ],
      tiers: [
        { name: "Standard", slug: "standard", price: 79700, interval: "month", sortOrder: 0, stripePriceId: "price_1T9xVmA5fjeDwxZxScUEiApF", features: ["Inbound & outbound agents", "Multi-location routing", "Full transcripts", "CRM integration"] },
      ],
    },
    {
      slug: "seo-aeo",
      name: "SEO & AEO Automation",
      shortDesc: "Search engine and AI answer engine optimization with automated content, technical fixes, and monthly reporting.",
      longDesc: "Full SEO service plus Answer Engine Optimization targeting ChatGPT, Perplexity, and Google AI Overviews. Automated audits, content briefs, article generation, and structured data implementation.",
      pillar: "MARKETING" as const,
      status: "ACTIVE" as const,
      pricingModel: "MONTHLY" as const,
      iconName: "Search",
      sortOrder: 4,
      defaultAssignee: "cody",
      features: [
        { icon: "Search", title: "SEO Audit & Fixes", description: "Technical audit with prioritized fix implementation" },
        { icon: "Bot", title: "AEO Optimization", description: "Get cited by ChatGPT, Perplexity, and AI Overviews" },
        { icon: "FileText", title: "Content Pipeline", description: "AI-drafted, human-reviewed blog content monthly" },
        { icon: "BarChart3", title: "Monthly Reporting", description: "Rankings, traffic, and AI citation tracking" },
      ],
      tiers: [
        { name: "Standard", slug: "standard", price: 49700, interval: "month", sortOrder: 0, stripePriceId: "price_1T9xVnA5fjeDwxZxKIQyLkzY", features: ["SEO audit & fixes", "AEO optimization", "Content pipeline", "Monthly reporting"] },
      ],
    },
    {
      slug: "audience-targeting",
      name: "Audience Targeting & Segments",
      shortDesc: "20,000+ prebuilt audience segments with semantic search, count builder, and direct pipeline to outbound campaigns.",
      pillar: "SALES" as const,
      status: "ACTIVE" as const,
      pricingModel: "MONTHLY" as const,
      iconName: "Target",
      demoType: "LIVE_TOOL" as const,
      sortOrder: 5,
      defaultAssignee: "saad",
      features: [
        { icon: "Database", title: "20K+ Segments", description: "Prebuilt audience segments across every vertical" },
        { icon: "Search", title: "Semantic Search", description: "Find segments by keyword, job title, or intent signal" },
        { icon: "Filter", title: "Count Builder", description: "Live previews with geo, intent, seniority filters" },
        { icon: "Zap", title: "Campaign Integration", description: "One-click from audience to live outbound campaign" },
      ],
      tiers: [
        { name: "Standard", slug: "standard", price: 39700, interval: "month", sortOrder: 0, stripePriceId: "price_1T9xVnA5fjeDwxZxK1VQZFGj", features: ["20K+ segments", "Semantic search", "Count builder", "Campaign integration"] },
      ],
    },
    {
      slug: "pixel-intelligence",
      name: "Pixel & Visitor Intelligence",
      shortDesc: "Website pixel with real-time visitor identification, contact enrichment, and intent-triggered outbound.",
      pillar: "SALES" as const,
      status: "BETA" as const,
      pricingModel: "MONTHLY" as const,
      iconName: "Eye",
      sortOrder: 6,
      defaultAssignee: "kumar",
      features: [
        { icon: "Eye", title: "Visitor Identification", description: "See who's on your site with contact details" },
        { icon: "UserCheck", title: "Auto-Enrichment", description: "Name, company, email, intent score per visitor" },
        { icon: "Zap", title: "Intent Triggers", description: "Auto-create leads when intent thresholds are hit" },
        { icon: "Activity", title: "Pixel Health", description: "Monitor pixel status and match rates in real-time" },
      ],
      tiers: [
        { name: "Standard", slug: "standard", price: 19700, interval: "month", sortOrder: 0, stripePriceId: "price_1T9xVoA5fjeDwxZxbZArzTL8", features: ["Visitor identification", "Auto-enrichment", "Intent triggers", "Pixel health monitoring"] },
      ],
    },
    {
      slug: "finance-automation",
      name: "P&L Finance Automation",
      shortDesc: "QuickBooks-integrated quarterly P&L analysis with AI-generated insights, rebate tracking, and expense flags.",
      pillar: "FINANCE" as const,
      status: "ACTIVE" as const,
      pricingModel: "MONTHLY" as const,
      basePrice: 1000,
      iconName: "DollarSign",
      demoType: "BEFORE_AFTER" as const,
      sortOrder: 7,
      defaultAssignee: "adam",
      features: [
        { icon: "FileSpreadsheet", title: "Auto P&L Analysis", description: "QuickBooks data pulled and analyzed automatically" },
        { icon: "Brain", title: "AI Insights", description: "Plain-English analysis of trends, anomalies, and opportunities" },
        { icon: "Receipt", title: "Rebate Tracking", description: "Catch unclaimed rebates and vendor overspend" },
        { icon: "FileText", title: "Quarterly Reports", description: "PDF + dashboard with actionable recommendations" },
      ],
      tiers: [
        { name: "Standard", slug: "standard", price: 100000, interval: "month", sortOrder: 0, stripePriceId: "price_1T9xVrA5fjeDwxZxYyZbIL7L", features: ["Auto P&L analysis", "AI insights", "Rebate tracking", "Quarterly reports"] },
      ],
    },
    {
      slug: "ai-tool-tracker",
      name: "AI Tool Tracker",
      shortDesc: "AI-powered tool research platform with company scorecards, vendor evaluation, and weekly digest.",
      pillar: "OPERATIONS" as const,
      status: "ACTIVE" as const,
      pricingModel: "MONTHLY" as const,
      iconName: "Cpu",
      demoType: "INTERACTIVE" as const,
      sortOrder: 8,
      defaultAssignee: "adam",
      tiers: [
        { name: "Standard", slug: "standard", price: 19700, interval: "month", sortOrder: 0, stripePriceId: "price_1T9xVrA5fjeDwxZx1QQhid1w", features: ["AI tool research", "Company scorecards", "Vendor evaluation", "Weekly digest"] },
      ],
    },
    {
      slug: "vending-placement-visualizer",
      name: "Vending Placement Visualizer",
      shortDesc: "AR mockup tool for visualizing vending machine placements at prospective locations.",
      pillar: "MARKETING" as const,
      status: "ACTIVE" as const,
      pricingModel: "MONTHLY" as const,
      iconName: "Camera",
      demoType: "INTERACTIVE" as const,
      sortOrder: 9,
    },
    {
      slug: "lead-reactivation",
      name: "Lead Reactivation",
      shortDesc: "AI-powered campaigns that turn dead CRM leads into booked meetings through multi-touch sequences.",
      pillar: "SALES" as const,
      status: "ACTIVE" as const,
      pricingModel: "CUSTOM" as const,
      iconName: "RefreshCw",
      sortOrder: 10,
      isFeatured: true,
      tiers: [
        { name: "Standard", slug: "standard", price: 99700, interval: "month", sortOrder: 0, stripePriceId: "price_1T9xVpA5fjeDwxZxH1teqyRt", features: ["Dead lead campaigns", "Multi-touch sequences", "AI-powered outreach", "Meeting booking"] },
      ],
    },
    {
      slug: "database-reactivation",
      name: "Database Reactivation",
      shortDesc: "CRM cleanup, lead scoring, attribution tracking, and dashboards showing where leads convert and drop off.",
      pillar: "OPERATIONS" as const,
      status: "ACTIVE" as const,
      pricingModel: "CUSTOM" as const,
      iconName: "Database",
      sortOrder: 11,
    },
    {
      slug: "content-production",
      name: "Content Production Pod",
      shortDesc: "AI-generated content with human review. Blog posts, social content, email copy, and ad creatives.",
      pillar: "MARKETING" as const,
      status: "ACTIVE" as const,
      pricingModel: "MONTHLY" as const,
      iconName: "PenTool",
      sortOrder: 12,
      defaultAssignee: "ailyn",
    },
    {
      slug: "revops-pipeline",
      name: "RevOps Pipeline",
      shortDesc: "CRM implementation, lead routing, attribution tracking, and revenue dashboards.",
      pillar: "OPERATIONS" as const,
      status: "ACTIVE" as const,
      pricingModel: "CUSTOM" as const,
      iconName: "GitBranch",
      sortOrder: 13,
      defaultAssignee: "maureen",
    },
    {
      slug: "inbound-orchestration",
      name: "Inbound Lead Orchestration",
      shortDesc: "Automated inbound lead routing, scoring, and nurture sequences that convert website visitors into qualified meetings.",
      pillar: "MARKETING" as const,
      status: "ACTIVE" as const,
      pricingModel: "MONTHLY" as const,
      iconName: "Workflow",
      sortOrder: 16,
      defaultAssignee: "marco",
      features: [
        { icon: "Workflow", title: "Lead Routing", description: "Intelligent routing based on lead score and geography" },
        { icon: "Filter", title: "Lead Scoring", description: "AI-powered scoring based on behavior and firmographics" },
        { icon: "Mail", title: "Nurture Sequences", description: "Automated email sequences for every lead stage" },
        { icon: "Calendar", title: "Meeting Booking", description: "Auto-book qualified leads onto your calendar" },
      ],
      tiers: [
        { name: "Standard", slug: "standard", price: 69700, interval: "month", sortOrder: 0, stripePriceId: "price_1T9xVoA5fjeDwxZxfzmmtd9n", features: ["Lead routing", "Lead scoring", "Nurture sequences", "Meeting booking"] },
      ],
    },
    {
      slug: "linkedin-outbound",
      name: "LinkedIn Outbound System",
      shortDesc: "Automated LinkedIn prospecting with connection requests, messaging sequences, and CRM sync.",
      pillar: "SALES" as const,
      status: "ACTIVE" as const,
      pricingModel: "MONTHLY" as const,
      iconName: "Linkedin",
      sortOrder: 17,
      defaultAssignee: "marco",
      features: [
        { icon: "Users", title: "Connection Automation", description: "Targeted connection requests at scale" },
        { icon: "MessageSquare", title: "Messaging Sequences", description: "Multi-step DM sequences with personalization" },
        { icon: "Database", title: "CRM Sync", description: "All LinkedIn activity synced to your CRM" },
        { icon: "BarChart", title: "Campaign Analytics", description: "Connection, reply, and meeting conversion rates" },
      ],
      tiers: [
        { name: "Standard", slug: "standard", price: 59700, interval: "month", sortOrder: 0, stripePriceId: "price_1T9xVpA5fjeDwxZx89o8KwJm", features: ["Connection automation", "Messaging sequences", "CRM sync", "Campaign analytics"] },
      ],
    },
    {
      slug: "ai-content-engine",
      name: "AI Content Engine",
      shortDesc: "AI-generated blog posts, social content, email copy, and ad creatives with human review and brand alignment.",
      pillar: "MARKETING" as const,
      status: "ACTIVE" as const,
      pricingModel: "MONTHLY" as const,
      iconName: "PenTool",
      sortOrder: 18,
      defaultAssignee: "ailyn",
      features: [
        { icon: "FileText", title: "Blog Content", description: "SEO-optimized articles with AI drafting and human review" },
        { icon: "Share2", title: "Social Content", description: "Platform-optimized posts for all channels" },
        { icon: "Mail", title: "Email Copy", description: "Campaign emails, newsletters, and sequences" },
        { icon: "Image", title: "Ad Creatives", description: "Display and social ad copy with A/B variants" },
      ],
      tiers: [
        { name: "Standard", slug: "standard", price: 49700, interval: "month", sortOrder: 0, stripePriceId: "price_1T9xVqA5fjeDwxZx5ZlWICbE", features: ["Blog content", "Social content", "Email copy", "Ad creatives"] },
      ],
    },
    {
      slug: "social-media-management",
      name: "Social Media Management",
      shortDesc: "AI-generated social content with scheduling, engagement tracking, and multi-platform distribution.",
      pillar: "MARKETING" as const,
      status: "COMING_SOON" as const,
      pricingModel: "MONTHLY" as const,
      iconName: "Share2",
      sortOrder: 14,
    },
    {
      slug: "ad-creatives",
      name: "Ad Creative Engine",
      shortDesc: "AI-generated ad creatives with A/B testing, performance tracking, and platform-specific optimization.",
      pillar: "MARKETING" as const,
      status: "COMING_SOON" as const,
      pricingModel: "MONTHLY" as const,
      iconName: "Image",
      sortOrder: 15,
    },
  ]

  for (const arm of serviceArms) {
    const { tiers, ...armData } = arm
    const created = await prisma.serviceArm.upsert({
      where: { slug: arm.slug },
      update: armData,
      create: armData,
    })

    if (tiers) {
      for (const tier of tiers) {
        await prisma.serviceTier.upsert({
          where: {
            serviceArmId_slug: {
              serviceArmId: created.id,
              slug: tier.slug,
            },
          },
          update: { ...tier, serviceArmId: created.id },
          create: { ...tier, serviceArmId: created.id },
        })
      }
    }

    console.log(`  ✓ ${arm.name}`)
  }

  // ============ SAMPLE VENDOR TRACKER ============

  const vendors = [
    { vendorName: "Attention AI", monthlyCost: 200, category: "call-intelligence", replacementName: "Internal call analysis", replacementStatus: "in_progress", projectedSavings: 200 },
    { vendorName: "Asana", monthlyCost: 150, category: "project-management", replacementName: "TaskSpace", replacementStatus: "ready", projectedSavings: 150, actualSavings: 150 },
    { vendorName: "External Cold Email Agency", monthlyCost: 3000, category: "outbound", replacementName: "Cold Outbound Engine", replacementStatus: "in_progress", projectedSavings: 2500 },
    { vendorName: "SEO Agency", monthlyCost: 2000, category: "seo", replacementName: "SEO/AEO Arm", replacementStatus: "in_progress", projectedSavings: 1500 },
    { vendorName: "CRM Vendor", monthlyCost: 500, category: "crm", replacementName: "AIMS CRM", replacementStatus: "in_progress", projectedSavings: 500 },
  ]

  for (const vendor of vendors) {
    await prisma.vendorTracker.create({
      data: vendor,
    }).catch(() => {
      // skip duplicates on re-seed
    })
  }

  console.log("\n✅ Seed complete!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
