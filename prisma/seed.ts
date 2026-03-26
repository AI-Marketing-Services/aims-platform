import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

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
      asanaTaskTemplate: {
        name: "Onboard: {{client}} -- Website + CRM + Chatbot",
        notes: "Client: {{client}}\nEmail: {{email}}\nTier: {{tier}}\nAmount: {{amount}}/mo\nPortal: {{portalUrl}}\n\nSetup checklist:\n1. Deploy GHL snapshot for client industry\n2. Configure DNS\n3. Customize chatbot\n4. Onboarding call",
        subtasks: [
          "Deploy GHL snapshot for client industry",
          "Configure DNS",
          "Customize chatbot",
          "Onboarding call",
        ],
      },
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
      asanaTaskTemplate: {
        name: "Onboard: {{client}} -- Cold Outbound Engine",
        notes: "Client: {{client}}\nEmail: {{email}}\nTier: {{tier}}\nAmount: {{amount}}/mo\nPortal: {{portalUrl}}\n\nSetup checklist:\n1. Provision sender domains\n2. Configure warm-up sequences\n3. Build Clay enrichment tables\n4. Write campaign copy\n5. Launch first campaign",
        subtasks: [
          "Provision sender domains",
          "Configure warm-up sequences",
          "Build Clay enrichment tables",
          "Write campaign copy",
          "Launch first campaign",
        ],
      },
      setupSteps: [
        { title: "Provision sender domains", description: "Register and authenticate 3+ sending domains" },
        { title: "Configure warm-up sequences", description: "Set up automated sender warm-up over 14 days" },
        { title: "Build Clay enrichment tables", description: "Configure enrichment workflows for target audience" },
        { title: "Write campaign copy", description: "Draft and approve email sequences with client" },
        { title: "Launch first campaign", description: "Send test batch, review metrics, go live" },
      ],
      features: [
        { icon: "Server", title: "Owned Infrastructure", description: "Multi-domain sender stack, no agency dependency" },
        { icon: "Search", title: "Clay Enrichment", description: "Leads enriched with 50+ data points before sending" },
        { icon: "Bot", title: "AI SDR", description: "Automated reply handling with human escalation" },
        { icon: "BarChart", title: "Campaign Reporting", description: "Open, reply, and meeting rates in real-time" },
      ],
      tiers: [
        { name: "Standard", slug: "standard", price: 99700, interval: "month", sortOrder: 0, stripePriceId: "price_1TA2SBExwpuzI9Oqt5s7b8J3", features: ["Multi-domain sender stack", "Clay enrichment", "AI SDR reply handling", "Campaign reporting"] },
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
      asanaTaskTemplate: {
        name: "Onboard: {{client}} -- AI Voice Agent Platform",
        notes: "Client: {{client}}\nEmail: {{email}}\nTier: {{tier}}\nAmount: {{amount}}/mo\nPortal: {{portalUrl}}\n\nSetup checklist:\n1. Provision phone numbers\n2. Configure voice agent scripts\n3. Set up call routing rules\n4. CRM integration setup\n5. Test calls and go live",
        subtasks: [
          "Provision phone numbers",
          "Configure voice agent scripts",
          "Set up call routing rules",
          "CRM integration setup",
          "Test calls and go live",
        ],
      },
      setupSteps: [
        { title: "Provision phone numbers", description: "Acquire local/toll-free numbers for each location" },
        { title: "Configure voice agent scripts", description: "Build conversation flows for inbound and outbound" },
        { title: "Set up call routing rules", description: "Configure multi-location routing and escalation paths" },
        { title: "CRM integration setup", description: "Connect call data and transcripts to client CRM" },
        { title: "Test calls and go live", description: "Run test scenarios, review transcripts, activate" },
      ],
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
        { name: "Standard", slug: "standard", price: 79700, interval: "month", sortOrder: 0, stripePriceId: "price_1TA2SCExwpuzI9Oq1R8bydhC", features: ["Inbound & outbound agents", "Multi-location routing", "Full transcripts", "CRM integration"] },
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
      asanaTaskTemplate: {
        name: "Onboard: {{client}} -- SEO & AEO Automation",
        notes: "Client: {{client}}\nEmail: {{email}}\nTier: {{tier}}\nAmount: {{amount}}/mo\nPortal: {{portalUrl}}\n\nSetup checklist:\n1. Run initial SEO audit\n2. Implement technical fixes\n3. Configure AEO monitoring\n4. Set up content pipeline\n5. Deliver first monthly report",
        subtasks: [
          "Run initial SEO audit",
          "Implement technical fixes",
          "Configure AEO monitoring",
          "Set up content pipeline",
          "Deliver first monthly report",
        ],
      },
      setupSteps: [
        { title: "Run initial SEO audit", description: "Full technical and content audit of client website" },
        { title: "Implement technical fixes", description: "Fix critical SEO issues from audit findings" },
        { title: "Configure AEO monitoring", description: "Set up tracking for ChatGPT, Perplexity, AI Overview citations" },
        { title: "Set up content pipeline", description: "Create editorial calendar and content briefs" },
        { title: "Deliver first monthly report", description: "Baseline rankings, traffic, and AI citation report" },
      ],
      features: [
        { icon: "Search", title: "SEO Audit & Fixes", description: "Technical audit with prioritized fix implementation" },
        { icon: "Bot", title: "AEO Optimization", description: "Get cited by ChatGPT, Perplexity, and AI Overviews" },
        { icon: "FileText", title: "Content Pipeline", description: "AI-drafted, human-reviewed blog content monthly" },
        { icon: "BarChart3", title: "Monthly Reporting", description: "Rankings, traffic, and AI citation tracking" },
      ],
      tiers: [
        { name: "Standard", slug: "standard", price: 49700, interval: "month", sortOrder: 0, stripePriceId: "price_1TA2SDExwpuzI9OqwSf050IF", features: ["SEO audit & fixes", "AEO optimization", "Content pipeline", "Monthly reporting"] },
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
      asanaTaskTemplate: {
        name: "Onboard: {{client}} -- Audience Targeting & Segments",
        notes: "Client: {{client}}\nEmail: {{email}}\nTier: {{tier}}\nAmount: {{amount}}/mo\nPortal: {{portalUrl}}\n\nSetup checklist:\n1. Client ICP intake call\n2. Build custom audience segments\n3. Configure count builder filters\n4. Connect to outbound pipeline\n5. Deliver first audience report",
        subtasks: [
          "Client ICP intake call",
          "Build custom audience segments",
          "Configure count builder filters",
          "Connect to outbound pipeline",
          "Deliver first audience report",
        ],
      },
      setupSteps: [
        { title: "Client ICP intake call", description: "Define ideal customer profile and target verticals" },
        { title: "Build custom audience segments", description: "Create tailored segments based on ICP criteria" },
        { title: "Configure count builder filters", description: "Set up geo, intent, and seniority filters" },
        { title: "Connect to outbound pipeline", description: "Link audience segments to campaign infrastructure" },
        { title: "Deliver first audience report", description: "Present segment sizes, match rates, and recommendations" },
      ],
      features: [
        { icon: "Database", title: "20K+ Segments", description: "Prebuilt audience segments across every vertical" },
        { icon: "Search", title: "Semantic Search", description: "Find segments by keyword, job title, or intent signal" },
        { icon: "Filter", title: "Count Builder", description: "Live previews with geo, intent, seniority filters" },
        { icon: "Zap", title: "Campaign Integration", description: "One-click from audience to live outbound campaign" },
      ],
      tiers: [
        { name: "Standard", slug: "standard", price: 39700, interval: "month", sortOrder: 0, stripePriceId: "price_1TA2SEExwpuzI9Oqnjxw7qZb", features: ["20K+ segments", "Semantic search", "Count builder", "Campaign integration"] },
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
      asanaTaskTemplate: {
        name: "Onboard: {{client}} -- Pixel & Visitor Intelligence",
        notes: "Client: {{client}}\nEmail: {{email}}\nTier: {{tier}}\nAmount: {{amount}}/mo\nPortal: {{portalUrl}}\n\nSetup checklist:\n1. Install tracking pixel\n2. Configure visitor identification\n3. Set up intent triggers\n4. Connect to CRM\n5. Verify pixel health and match rates",
        subtasks: [
          "Install tracking pixel",
          "Configure visitor identification",
          "Set up intent triggers",
          "Connect to CRM",
          "Verify pixel health and match rates",
        ],
      },
      setupSteps: [
        { title: "Install tracking pixel", description: "Add pixel snippet to client website" },
        { title: "Configure visitor identification", description: "Set up contact enrichment pipeline" },
        { title: "Set up intent triggers", description: "Define intent score thresholds and auto-create rules" },
        { title: "Connect to CRM", description: "Sync identified visitors and leads to client CRM" },
        { title: "Verify pixel health and match rates", description: "Confirm pixel fires correctly and review match quality" },
      ],
      features: [
        { icon: "Eye", title: "Visitor Identification", description: "See who's on your site with contact details" },
        { icon: "UserCheck", title: "Auto-Enrichment", description: "Name, company, email, intent score per visitor" },
        { icon: "Zap", title: "Intent Triggers", description: "Auto-create leads when intent thresholds are hit" },
        { icon: "Activity", title: "Pixel Health", description: "Monitor pixel status and match rates in real-time" },
      ],
      tiers: [
        { name: "Standard", slug: "standard", price: 19700, interval: "month", sortOrder: 0, stripePriceId: "price_1TA2SFExwpuzI9OqD0L9gXpO", features: ["Visitor identification", "Auto-enrichment", "Intent triggers", "Pixel health monitoring"] },
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
      asanaTaskTemplate: {
        name: "Onboard: {{client}} -- P&L Finance Automation",
        notes: "Client: {{client}}\nEmail: {{email}}\nTier: {{tier}}\nAmount: {{amount}}/mo\nPortal: {{portalUrl}}\n\nSetup checklist:\n1. Connect QuickBooks integration\n2. Run initial P&L import\n3. Configure AI insight rules\n4. Set up rebate tracking\n5. Deliver first quarterly report",
        subtasks: [
          "Connect QuickBooks integration",
          "Run initial P&L import",
          "Configure AI insight rules",
          "Set up rebate tracking",
          "Deliver first quarterly report",
        ],
      },
      setupSteps: [
        { title: "Connect QuickBooks integration", description: "Authorize and sync QuickBooks data" },
        { title: "Run initial P&L import", description: "Pull historical P&L data for baseline analysis" },
        { title: "Configure AI insight rules", description: "Set up anomaly detection thresholds and trend alerts" },
        { title: "Set up rebate tracking", description: "Configure vendor rebate and expense monitoring" },
        { title: "Deliver first quarterly report", description: "Generate baseline report with AI-powered recommendations" },
      ],
      features: [
        { icon: "FileSpreadsheet", title: "Auto P&L Analysis", description: "QuickBooks data pulled and analyzed automatically" },
        { icon: "Brain", title: "AI Insights", description: "Plain-English analysis of trends, anomalies, and opportunities" },
        { icon: "Receipt", title: "Rebate Tracking", description: "Catch unclaimed rebates and vendor overspend" },
        { icon: "FileText", title: "Quarterly Reports", description: "PDF + dashboard with actionable recommendations" },
      ],
      tiers: [
        { name: "Standard", slug: "standard", price: 100000, interval: "month", sortOrder: 0, stripePriceId: "price_1TA2SHExwpuzI9OqQ0pmMiPi", features: ["Auto P&L analysis", "AI insights", "Rebate tracking", "Quarterly reports"] },
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
      asanaTaskTemplate: {
        name: "Onboard: {{client}} -- AI Tool Tracker",
        notes: "Client: {{client}}\nEmail: {{email}}\nTier: {{tier}}\nAmount: {{amount}}/mo\nPortal: {{portalUrl}}\n\nSetup checklist:\n1. Client tool stack intake\n2. Configure research dashboard\n3. Build vendor scorecards\n4. Set up weekly digest\n5. Deliver first evaluation report",
        subtasks: [
          "Client tool stack intake",
          "Configure research dashboard",
          "Build vendor scorecards",
          "Set up weekly digest",
          "Deliver first evaluation report",
        ],
      },
      setupSteps: [
        { title: "Client tool stack intake", description: "Inventory current AI tools and vendor contracts" },
        { title: "Configure research dashboard", description: "Set up category tracking and alert preferences" },
        { title: "Build vendor scorecards", description: "Create evaluation scorecards for current vendors" },
        { title: "Set up weekly digest", description: "Configure automated weekly tool intelligence digest" },
        { title: "Deliver first evaluation report", description: "Present vendor analysis with cost-saving recommendations" },
      ],
      tiers: [
        { name: "Standard", slug: "standard", price: 19700, interval: "month", sortOrder: 0, stripePriceId: "price_1TA2SIExwpuzI9OqSNZddatT", features: ["AI tool research", "Company scorecards", "Vendor evaluation", "Weekly digest"] },
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
      asanaTaskTemplate: {
        name: "Onboard: {{client}} -- Vending Placement Visualizer",
        notes: "Client: {{client}}\nEmail: {{email}}\nTier: {{tier}}\nAmount: {{amount}}/mo\nPortal: {{portalUrl}}\n\nSetup checklist:\n1. Collect vending machine specs and branding\n2. Configure AR templates\n3. Set up location library\n4. Client walkthrough and training",
        subtasks: [
          "Collect vending machine specs and branding",
          "Configure AR templates",
          "Set up location library",
          "Client walkthrough and training",
        ],
      },
      setupSteps: [
        { title: "Collect vending machine specs and branding", description: "Gather dimensions, wrap designs, and brand assets" },
        { title: "Configure AR templates", description: "Build AR mockup templates for client machine types" },
        { title: "Set up location library", description: "Create location presets for common placement scenarios" },
        { title: "Client walkthrough and training", description: "Demo tool and train client team on usage" },
      ],
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
      asanaTaskTemplate: {
        name: "Onboard: {{client}} -- Lead Reactivation",
        notes: "Client: {{client}}\nEmail: {{email}}\nTier: {{tier}}\nAmount: {{amount}}/mo\nPortal: {{portalUrl}}\n\nSetup checklist:\n1. CRM data export and cleanup\n2. Segment dead leads by recency and value\n3. Build reactivation sequences\n4. Launch first reactivation campaign\n5. Review results and optimize",
        subtasks: [
          "CRM data export and cleanup",
          "Segment dead leads by recency and value",
          "Build reactivation sequences",
          "Launch first reactivation campaign",
          "Review results and optimize",
        ],
      },
      setupSteps: [
        { title: "CRM data export and cleanup", description: "Extract and deduplicate dormant lead records" },
        { title: "Segment dead leads by recency and value", description: "Score and bucket leads by reactivation potential" },
        { title: "Build reactivation sequences", description: "Create multi-touch email and SMS sequences" },
        { title: "Launch first reactivation campaign", description: "Send initial batch and monitor engagement" },
        { title: "Review results and optimize", description: "Analyze response rates and refine sequences" },
      ],
      tiers: [
        { name: "Standard", slug: "standard", price: 99700, interval: "month", sortOrder: 0, stripePriceId: "price_1TA2SKExwpuzI9Oqv9ACP74W", features: ["Dead lead campaigns", "Multi-touch sequences", "AI-powered outreach", "Meeting booking"] },
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
      asanaTaskTemplate: {
        name: "Onboard: {{client}} -- Database Reactivation",
        notes: "Client: {{client}}\nEmail: {{email}}\nTier: {{tier}}\nAmount: {{amount}}/mo\nPortal: {{portalUrl}}\n\nSetup checklist:\n1. CRM audit and data quality assessment\n2. Deduplicate and clean records\n3. Implement lead scoring model\n4. Set up attribution tracking\n5. Build conversion dashboards",
        subtasks: [
          "CRM audit and data quality assessment",
          "Deduplicate and clean records",
          "Implement lead scoring model",
          "Set up attribution tracking",
          "Build conversion dashboards",
        ],
      },
      setupSteps: [
        { title: "CRM audit and data quality assessment", description: "Analyze current data hygiene and completeness" },
        { title: "Deduplicate and clean records", description: "Merge duplicates and standardize contact data" },
        { title: "Implement lead scoring model", description: "Build scoring rules based on engagement and fit" },
        { title: "Set up attribution tracking", description: "Configure source and channel attribution" },
        { title: "Build conversion dashboards", description: "Create dashboards showing funnel performance" },
      ],
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
      asanaTaskTemplate: {
        name: "Onboard: {{client}} -- Content Production Pod",
        notes: "Client: {{client}}\nEmail: {{email}}\nTier: {{tier}}\nAmount: {{amount}}/mo\nPortal: {{portalUrl}}\n\nSetup checklist:\n1. Brand voice and style guide intake\n2. Create editorial calendar\n3. Set up content approval workflow\n4. Produce first content batch\n5. Review and publish",
        subtasks: [
          "Brand voice and style guide intake",
          "Create editorial calendar",
          "Set up content approval workflow",
          "Produce first content batch",
          "Review and publish",
        ],
      },
      setupSteps: [
        { title: "Brand voice and style guide intake", description: "Collect brand guidelines, tone, and example content" },
        { title: "Create editorial calendar", description: "Plan content topics and publishing schedule" },
        { title: "Set up content approval workflow", description: "Configure review and approval process with client" },
        { title: "Produce first content batch", description: "Generate and review initial batch of content" },
        { title: "Review and publish", description: "Client review, revisions, and first publish" },
      ],
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
      asanaTaskTemplate: {
        name: "Onboard: {{client}} -- RevOps Pipeline",
        notes: "Client: {{client}}\nEmail: {{email}}\nTier: {{tier}}\nAmount: {{amount}}/mo\nPortal: {{portalUrl}}\n\nSetup checklist:\n1. Current CRM and process audit\n2. Design pipeline architecture\n3. Implement lead routing rules\n4. Set up attribution tracking\n5. Build revenue dashboards\n6. Team training session",
        subtasks: [
          "Current CRM and process audit",
          "Design pipeline architecture",
          "Implement lead routing rules",
          "Set up attribution tracking",
          "Build revenue dashboards",
          "Team training session",
        ],
      },
      setupSteps: [
        { title: "Current CRM and process audit", description: "Map existing sales processes and CRM usage" },
        { title: "Design pipeline architecture", description: "Define stages, fields, and automation rules" },
        { title: "Implement lead routing rules", description: "Configure territory and capacity-based routing" },
        { title: "Set up attribution tracking", description: "Implement multi-touch attribution model" },
        { title: "Build revenue dashboards", description: "Create real-time revenue and pipeline dashboards" },
        { title: "Team training session", description: "Train sales team on new pipeline and processes" },
      ],
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
      asanaTaskTemplate: {
        name: "Onboard: {{client}} -- Inbound Lead Orchestration",
        notes: "Client: {{client}}\nEmail: {{email}}\nTier: {{tier}}\nAmount: {{amount}}/mo\nPortal: {{portalUrl}}\n\nSetup checklist:\n1. Map inbound lead sources\n2. Configure lead scoring rules\n3. Set up routing and assignment\n4. Build nurture sequences\n5. Connect booking calendar\n6. Go-live and monitor",
        subtasks: [
          "Map inbound lead sources",
          "Configure lead scoring rules",
          "Set up routing and assignment",
          "Build nurture sequences",
          "Connect booking calendar",
          "Go-live and monitor",
        ],
      },
      setupSteps: [
        { title: "Map inbound lead sources", description: "Identify and connect all inbound lead channels" },
        { title: "Configure lead scoring rules", description: "Build scoring model based on behavior and firmographics" },
        { title: "Set up routing and assignment", description: "Configure geo and capacity-based lead routing" },
        { title: "Build nurture sequences", description: "Create automated email sequences for each lead stage" },
        { title: "Connect booking calendar", description: "Integrate calendar for qualified lead auto-booking" },
        { title: "Go-live and monitor", description: "Activate system and monitor routing accuracy" },
      ],
      features: [
        { icon: "Workflow", title: "Lead Routing", description: "Intelligent routing based on lead score and geography" },
        { icon: "Filter", title: "Lead Scoring", description: "AI-powered scoring based on behavior and firmographics" },
        { icon: "Mail", title: "Nurture Sequences", description: "Automated email sequences for every lead stage" },
        { icon: "Calendar", title: "Meeting Booking", description: "Auto-book qualified leads onto your calendar" },
      ],
      tiers: [
        { name: "Standard", slug: "standard", price: 69700, interval: "month", sortOrder: 0, stripePriceId: "price_1TA2SLExwpuzI9OqkOFHuU8q", features: ["Lead routing", "Lead scoring", "Nurture sequences", "Meeting booking"] },
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
      asanaTaskTemplate: {
        name: "Onboard: {{client}} -- LinkedIn Outbound System",
        notes: "Client: {{client}}\nEmail: {{email}}\nTier: {{tier}}\nAmount: {{amount}}/mo\nPortal: {{portalUrl}}\n\nSetup checklist:\n1. LinkedIn account audit and optimization\n2. Define target audience and filters\n3. Write messaging sequences\n4. Configure CRM sync\n5. Launch first campaign",
        subtasks: [
          "LinkedIn account audit and optimization",
          "Define target audience and filters",
          "Write messaging sequences",
          "Configure CRM sync",
          "Launch first campaign",
        ],
      },
      setupSteps: [
        { title: "LinkedIn account audit and optimization", description: "Review and optimize client LinkedIn profile" },
        { title: "Define target audience and filters", description: "Build target lists with industry, title, and geo filters" },
        { title: "Write messaging sequences", description: "Create personalized connection and follow-up messages" },
        { title: "Configure CRM sync", description: "Connect LinkedIn activity to client CRM" },
        { title: "Launch first campaign", description: "Start connection campaign and monitor acceptance rates" },
      ],
      features: [
        { icon: "Users", title: "Connection Automation", description: "Targeted connection requests at scale" },
        { icon: "MessageSquare", title: "Messaging Sequences", description: "Multi-step DM sequences with personalization" },
        { icon: "Database", title: "CRM Sync", description: "All LinkedIn activity synced to your CRM" },
        { icon: "BarChart", title: "Campaign Analytics", description: "Connection, reply, and meeting conversion rates" },
      ],
      tiers: [
        { name: "Standard", slug: "standard", price: 59700, interval: "month", sortOrder: 0, stripePriceId: "price_1TA2SMExwpuzI9Oqhkqaa8wk", features: ["Connection automation", "Messaging sequences", "CRM sync", "Campaign analytics"] },
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
      asanaTaskTemplate: {
        name: "Onboard: {{client}} -- AI Content Engine",
        notes: "Client: {{client}}\nEmail: {{email}}\nTier: {{tier}}\nAmount: {{amount}}/mo\nPortal: {{portalUrl}}\n\nSetup checklist:\n1. Brand voice and messaging intake\n2. SEO keyword research\n3. Create content calendar\n4. Generate first content batch\n5. Client review and publish",
        subtasks: [
          "Brand voice and messaging intake",
          "SEO keyword research",
          "Create content calendar",
          "Generate first content batch",
          "Client review and publish",
        ],
      },
      setupSteps: [
        { title: "Brand voice and messaging intake", description: "Document brand tone, messaging pillars, and examples" },
        { title: "SEO keyword research", description: "Identify target keywords and content gaps" },
        { title: "Create content calendar", description: "Plan topics, formats, and publishing cadence" },
        { title: "Generate first content batch", description: "AI-draft and human-review initial content set" },
        { title: "Client review and publish", description: "Final approval and first content publish" },
      ],
      features: [
        { icon: "FileText", title: "Blog Content", description: "SEO-optimized articles with AI drafting and human review" },
        { icon: "Share2", title: "Social Content", description: "Platform-optimized posts for all channels" },
        { icon: "Mail", title: "Email Copy", description: "Campaign emails, newsletters, and sequences" },
        { icon: "Image", title: "Ad Creatives", description: "Display and social ad copy with A/B variants" },
      ],
      tiers: [
        { name: "Standard", slug: "standard", price: 49700, interval: "month", sortOrder: 0, stripePriceId: "price_1TA2SNExwpuzI9Oq1cNP7A0u", features: ["Blog content", "Social content", "Email copy", "Ad creatives"] },
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
      asanaTaskTemplate: {
        name: "Onboard: {{client}} -- Social Media Management",
        notes: "Client: {{client}}\nEmail: {{email}}\nTier: {{tier}}\nAmount: {{amount}}/mo\nPortal: {{portalUrl}}\n\nSetup checklist:\n1. Social account access and audit\n2. Brand guidelines and content pillars\n3. Configure scheduling tool\n4. Create first week of content\n5. Launch and monitor engagement",
        subtasks: [
          "Social account access and audit",
          "Brand guidelines and content pillars",
          "Configure scheduling tool",
          "Create first week of content",
          "Launch and monitor engagement",
        ],
      },
      setupSteps: [
        { title: "Social account access and audit", description: "Get access to all social platforms and audit current state" },
        { title: "Brand guidelines and content pillars", description: "Define content themes and brand voice for social" },
        { title: "Configure scheduling tool", description: "Set up publishing schedule and platform connections" },
        { title: "Create first week of content", description: "Produce and approve initial content batch" },
        { title: "Launch and monitor engagement", description: "Publish content and track engagement metrics" },
      ],
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
      asanaTaskTemplate: {
        name: "Onboard: {{client}} -- Ad Creative Engine",
        notes: "Client: {{client}}\nEmail: {{email}}\nTier: {{tier}}\nAmount: {{amount}}/mo\nPortal: {{portalUrl}}\n\nSetup checklist:\n1. Brand asset collection\n2. Define ad platforms and formats\n3. Generate initial creative variants\n4. Set up A/B testing framework\n5. Launch first ad set",
        subtasks: [
          "Brand asset collection",
          "Define ad platforms and formats",
          "Generate initial creative variants",
          "Set up A/B testing framework",
          "Launch first ad set",
        ],
      },
      setupSteps: [
        { title: "Brand asset collection", description: "Collect logos, colors, imagery, and brand guidelines" },
        { title: "Define ad platforms and formats", description: "Identify target platforms and ad specifications" },
        { title: "Generate initial creative variants", description: "AI-generate multiple ad creative options" },
        { title: "Set up A/B testing framework", description: "Configure split testing and performance tracking" },
        { title: "Deploy approved creatives", description: "Deploy approved creatives and begin optimization" },
      ],
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

    console.log(`  > ${arm.name}`)
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

  // ============ DEMO USERS ============

  console.log("\n  Creating demo users...")
  const demoUsers = [
    { clerkId: "demo_client_active_1", email: "sarah@greenlawnpros.com", name: "Sarah Mitchell", company: "GreenLawn Pros", role: "CLIENT" as const, industry: "Landscaping", website: "https://greenlawnpros.com", phone: "(512) 555-0142", locationCount: 3 },
    { clerkId: "demo_client_active_2", email: "marcus@elitedentalgroup.com", name: "Marcus Chen", company: "Elite Dental Group", role: "CLIENT" as const, industry: "Dental", website: "https://elitedentalgroup.com", phone: "(415) 555-0198", locationCount: 5 },
    { clerkId: "demo_client_new", email: "jessica@brightsideinsurance.com", name: "Jessica Alvarez", company: "Brightside Insurance", role: "CLIENT" as const, industry: "Insurance", website: "https://brightsideinsurance.com", phone: "(305) 555-0267" },
    { clerkId: "demo_client_churned", email: "derek@suncoastroofing.com", name: "Derek Washington", company: "Suncoast Roofing", role: "CLIENT" as const, industry: "Roofing", website: "https://suncoastroofing.com", phone: "(813) 555-0334" },
    { clerkId: "demo_reseller_1", email: "natalie@growthpartners.co", name: "Natalie Torres", company: "Growth Partners Agency", role: "RESELLER" as const, industry: "Marketing Agency", website: "https://growthpartners.co", phone: "(646) 555-0411" },
    { clerkId: "demo_intern_1", email: "alex.rivera@university.edu", name: "Alex Rivera", role: "INTERN" as const, industry: "Student" },
    { clerkId: "demo_client_active_3", email: "rachel@precisionhvac.net", name: "Rachel Nguyen", company: "Precision HVAC Solutions", role: "CLIENT" as const, industry: "HVAC", website: "https://precisionhvac.net", phone: "(972) 555-0589", locationCount: 2 },
    { clerkId: "demo_client_prospect", email: "tom@capitalcitylaw.com", name: "Tom Brennan", company: "Capital City Law", role: "CLIENT" as const, industry: "Legal", website: "https://capitalcitylaw.com", phone: "(202) 555-0623" },
  ]

  const createdUsers: Record<string, string> = {}
  for (const u of demoUsers) {
    const existing = await prisma.user.findUnique({ where: { clerkId: u.clerkId } })
    if (existing) {
      createdUsers[u.clerkId] = existing.id
      continue
    }
    const created = await prisma.user.create({ data: u })
    createdUsers[u.clerkId] = created.id
  }
  console.log(`  ${Object.keys(createdUsers).length} users ready`)

  // Fetch services for linking
  const allServices = await prisma.serviceArm.findMany({ select: { id: true, slug: true, basePrice: true } })
  const svcBySlug = Object.fromEntries(allServices.map((s) => [s.slug, s]))

  // ============ DEMO DEALS ============

  console.log("  Creating demo deals...")
  const existingDeals = await prisma.deal.count()
  if (existingDeals > 0) {
    console.log(`  Deals already exist (${existingDeals}), skipping`)
  } else {
    const deals = [
      { contactName: "Sarah Mitchell", contactEmail: "sarah@greenlawnpros.com", company: "GreenLawn Pros", industry: "Landscaping", stage: "ACTIVE_CLIENT" as const, value: 14940, mrr: 1245, priority: "HIGH" as const, source: "referral", leadScore: 92, leadScoreTier: "hot", userId: createdUsers["demo_client_active_1"], createdAt: daysAgo(78) },
      { contactName: "Marcus Chen", contactEmail: "marcus@elitedentalgroup.com", company: "Elite Dental Group", industry: "Dental", stage: "ACTIVE_CLIENT" as const, value: 29880, mrr: 2490, priority: "HIGH" as const, source: "organic", leadScore: 88, leadScoreTier: "hot", userId: createdUsers["demo_client_active_2"], createdAt: daysAgo(65) },
      { contactName: "Jessica Alvarez", contactEmail: "jessica@brightsideinsurance.com", company: "Brightside Insurance", industry: "Insurance", stage: "NEW_LEAD" as const, value: 0, mrr: 0, priority: "MEDIUM" as const, source: "ai_readiness_quiz", leadScore: 67, leadScoreTier: "warm", userId: createdUsers["demo_client_new"], createdAt: daysAgo(3) },
      { contactName: "Derek Washington", contactEmail: "derek@suncoastroofing.com", company: "Suncoast Roofing", industry: "Roofing", stage: "CHURNED" as const, value: 2964, mrr: 0, priority: "LOW" as const, source: "cold_outbound", leadScore: 25, leadScoreTier: "cold", lostReason: "Budget constraints -- downsized operations", closedAt: daysAgo(12), userId: createdUsers["demo_client_churned"], createdAt: daysAgo(90) },
      { contactName: "Rachel Nguyen", contactEmail: "rachel@precisionhvac.net", company: "Precision HVAC Solutions", industry: "HVAC", stage: "ACTIVE_CLIENT" as const, value: 7164, mrr: 597, priority: "MEDIUM" as const, source: "partner_referral", leadScore: 81, leadScoreTier: "hot", userId: createdUsers["demo_client_active_3"], createdAt: daysAgo(45) },
      { contactName: "Tom Brennan", contactEmail: "tom@capitalcitylaw.com", company: "Capital City Law", industry: "Legal", stage: "DEMO_BOOKED" as const, value: 0, mrr: 0, priority: "HIGH" as const, source: "linkedin", leadScore: 74, leadScoreTier: "warm", userId: createdUsers["demo_client_prospect"], createdAt: daysAgo(8) },
      { contactName: "Priya Sharma", contactEmail: "priya@apexmedspa.com", company: "Apex Med Spa", industry: "Med Spa", stage: "QUALIFIED" as const, value: 0, mrr: 0, priority: "HIGH" as const, source: "roi_calculator", leadScore: 82, leadScoreTier: "hot", createdAt: daysAgo(5) },
      { contactName: "James Holloway", contactEmail: "james@tristateplumbing.com", company: "Tri-State Plumbing", industry: "Plumbing", stage: "PROPOSAL_SENT" as const, value: 0, mrr: 0, priority: "MEDIUM" as const, source: "cold_outbound", leadScore: 71, leadScoreTier: "warm", createdAt: daysAgo(14) },
      { contactName: "Linda Park", contactEmail: "linda@harmonyvet.com", company: "Harmony Veterinary Clinic", industry: "Veterinary", stage: "NEGOTIATION" as const, value: 0, mrr: 0, priority: "HIGH" as const, source: "website_audit", leadScore: 78, leadScoreTier: "warm", createdAt: daysAgo(11) },
      { contactName: "Carlos Mendez", contactEmail: "carlos@sunbeltfloors.com", company: "Sunbelt Flooring", industry: "Flooring", stage: "NEW_LEAD" as const, value: 0, mrr: 0, priority: "LOW" as const, source: "organic", leadScore: 34, leadScoreTier: "cold", createdAt: daysAgo(1) },
      { contactName: "Angela Foster", contactEmail: "angela@bayareachiro.com", company: "Bay Area Chiropractic", industry: "Chiropractic", stage: "LOST" as const, value: 0, mrr: 0, priority: "LOW" as const, source: "cold_outbound", leadScore: 21, leadScoreTier: "cold", lostReason: "Went with competitor -- already using GoHighLevel in-house", closedAt: daysAgo(20), createdAt: daysAgo(42) },
      { contactName: "Kevin Lam", contactEmail: "kevin@pacifictitle.com", company: "Pacific Title & Escrow", industry: "Real Estate", stage: "DEMO_BOOKED" as const, value: 0, mrr: 0, priority: "MEDIUM" as const, source: "referral", leadScore: 69, leadScoreTier: "warm", createdAt: daysAgo(6) },
      { contactName: "Michelle Torres", contactEmail: "michelle@eliteaesthetics.com", company: "Elite Aesthetics", industry: "Med Spa", stage: "UPSELL_OPPORTUNITY" as const, value: 5964, mrr: 497, priority: "MEDIUM" as const, source: "organic", leadScore: 85, leadScoreTier: "hot", createdAt: daysAgo(55) },
      { contactName: "David Kim", contactEmail: "david@summitauto.com", company: "Summit Auto Group", industry: "Automotive", stage: "NEW_LEAD" as const, value: 0, mrr: 0, priority: "MEDIUM" as const, source: "linkedin", leadScore: 55, leadScoreTier: "warm", createdAt: daysAgo(2) },
      { contactName: "Patricia Gomez", contactEmail: "patricia@cleansweepjanitorial.com", company: "CleanSweep Janitorial", industry: "Janitorial", stage: "NEW_LEAD" as const, value: 0, mrr: 0, priority: "LOW" as const, source: "google_ads", leadScore: 41, leadScoreTier: "warm", createdAt: daysAgo(0) },
      { contactName: "Brian O'Connell", contactEmail: "brian@oconnellcpa.com", company: "O'Connell CPA Group", industry: "Accounting", stage: "QUALIFIED" as const, value: 0, mrr: 0, priority: "MEDIUM" as const, source: "roi_calculator", leadScore: 73, leadScoreTier: "warm", createdAt: daysAgo(7) },
      { contactName: "Whitney Adams", contactEmail: "whitney@adamsrealty.com", company: "Adams Realty Partners", industry: "Real Estate", stage: "QUALIFIED" as const, value: 0, mrr: 0, priority: "HIGH" as const, source: "website_audit", leadScore: 79, leadScoreTier: "warm", createdAt: daysAgo(4) },
      { contactName: "Hector Ramirez", contactEmail: "hector@premierpest.com", company: "Premier Pest Control", industry: "Pest Control", stage: "PROPOSAL_SENT" as const, value: 0, mrr: 0, priority: "MEDIUM" as const, source: "referral", leadScore: 68, leadScoreTier: "warm", createdAt: daysAgo(18) },
      { contactName: "Nina Patel", contactEmail: "nina@zenithphysio.com", company: "Zenith Physiotherapy", industry: "Physical Therapy", stage: "AT_RISK" as const, value: 3564, mrr: 297, priority: "HIGH" as const, source: "organic", leadScore: 45, leadScoreTier: "warm", createdAt: daysAgo(95) },
    ]

    for (const d of deals) {
      await prisma.deal.create({ data: d })
    }
    console.log(`  Created ${deals.length} deals`)
  }

  // ============ DEAL SERVICE ARMS ============

  const dealList = await prisma.deal.findMany({ select: { id: true, contactEmail: true, stage: true } })
  const dealByEmail = Object.fromEntries(dealList.map((d) => [d.contactEmail, d]))

  const existingDealArms = await prisma.dealServiceArm.count()
  if (existingDealArms === 0) {
    console.log("  Linking services to deals...")
    const dealServices = [
      { email: "sarah@greenlawnpros.com", services: ["website-crm-chatbot", "cold-outbound", "seo-aeo"] },
      { email: "marcus@elitedentalgroup.com", services: ["website-crm-chatbot", "voice-agents", "audience-targeting", "ai-content-engine"] },
      { email: "rachel@precisionhvac.net", services: ["voice-agents"] },
      { email: "james@tristateplumbing.com", services: ["cold-outbound", "pixel-intelligence"] },
      { email: "linda@harmonyvet.com", services: ["website-crm-chatbot", "ai-content-engine"] },
      { email: "michelle@eliteaesthetics.com", services: ["website-crm-chatbot"] },
    ]

    for (const ds of dealServices) {
      const deal = dealByEmail[ds.email]
      if (!deal) continue
      for (const slug of ds.services) {
        const svc = svcBySlug[slug]
        if (!svc) continue
        await prisma.dealServiceArm.create({
          data: {
            dealId: deal.id,
            serviceArmId: svc.id,
            tier: "growth",
            monthlyPrice: svc.basePrice ?? 0,
            status: deal.stage === "ACTIVE_CLIENT" ? "active" : "pending",
            ...(deal.stage === "ACTIVE_CLIENT" ? { activatedAt: daysAgo(randomBetween(30, 60)) } : {}),
          },
        })
      }
    }
  }

  // ============ SUBSCRIPTIONS ============

  console.log("  Creating demo subscriptions...")
  const existingSubs = await prisma.subscription.count()
  if (existingSubs > 0) {
    console.log(`  Subscriptions already exist (${existingSubs}), skipping`)
  } else {
    const subs = [
      { userId: createdUsers["demo_client_active_1"], slug: "website-crm-chatbot", tier: "growth", amount: 497, status: "ACTIVE" as const, fulfillment: "ACTIVE_MANAGED" as const, daysAgoCreated: 75 },
      { userId: createdUsers["demo_client_active_1"], slug: "cold-outbound", tier: "growth", amount: 397, status: "ACTIVE" as const, fulfillment: "ACTIVE_MANAGED" as const, daysAgoCreated: 75 },
      { userId: createdUsers["demo_client_active_1"], slug: "seo-aeo", tier: "starter", amount: 351, status: "ACTIVE" as const, fulfillment: "IN_PROGRESS" as const, daysAgoCreated: 30 },
      { userId: createdUsers["demo_client_active_2"], slug: "website-crm-chatbot", tier: "enterprise", amount: 997, status: "ACTIVE" as const, fulfillment: "ACTIVE_MANAGED" as const, daysAgoCreated: 62 },
      { userId: createdUsers["demo_client_active_2"], slug: "voice-agents", tier: "growth", amount: 597, status: "ACTIVE" as const, fulfillment: "ACTIVE_MANAGED" as const, daysAgoCreated: 62 },
      { userId: createdUsers["demo_client_active_2"], slug: "audience-targeting", tier: "growth", amount: 497, status: "ACTIVE" as const, fulfillment: "IN_PROGRESS" as const, daysAgoCreated: 40 },
      { userId: createdUsers["demo_client_active_2"], slug: "ai-content-engine", tier: "starter", amount: 197, status: "ACTIVE" as const, fulfillment: "PENDING_SETUP" as const, daysAgoCreated: 10 },
      { userId: createdUsers["demo_client_active_3"], slug: "voice-agents", tier: "growth", amount: 597, status: "ACTIVE" as const, fulfillment: "ACTIVE_MANAGED" as const, daysAgoCreated: 42 },
      { userId: createdUsers["demo_client_churned"], slug: "cold-outbound", tier: "starter", amount: 247, status: "CANCELLED" as const, fulfillment: "COMPLETED" as const, daysAgoCreated: 85, cancelReason: "Budget constraints" },
      { userId: createdUsers["demo_client_active_1"], slug: "ai-content-engine", tier: "growth", amount: 397, status: "PAST_DUE" as const, fulfillment: "NEEDS_ATTENTION" as const, daysAgoCreated: 45 },
    ]

    for (const s of subs) {
      const svc = svcBySlug[s.slug]
      if (!svc || !s.userId) continue
      await prisma.subscription.create({
        data: {
          userId: s.userId,
          serviceArmId: svc.id,
          tier: s.tier,
          monthlyAmount: s.amount,
          status: s.status,
          fulfillmentStatus: s.fulfillment,
          currentPeriodStart: daysAgo(30),
          currentPeriodEnd: daysAgo(-1),
          createdAt: daysAgo(s.daysAgoCreated),
          ...("cancelReason" in s ? { cancelReason: s.cancelReason, cancelledAt: daysAgo(12) } : {}),
        },
      })
    }
    console.log(`  Created ${subs.length} subscriptions`)
  }

  // ============ FULFILLMENT TASKS ============

  console.log("  Creating fulfillment tasks...")
  const existingTasks = await prisma.fulfillmentTask.count()
  if (existingTasks > 0) {
    console.log(`  Tasks already exist (${existingTasks}), skipping`)
  } else {
    const subscriptions = await prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
      take: 6,
    })

    const taskTemplates = [
      { title: "Configure DNS records", priority: "high", dueOffset: 2, status: "done" },
      { title: "Build landing page wireframe", priority: "high", dueOffset: 5, status: "done" },
      { title: "Set up CRM pipelines in GHL", priority: "high", dueOffset: -2, status: "in_progress" },
      { title: "Configure AI chatbot training data", priority: "medium", dueOffset: -5, status: "todo" },
      { title: "Launch cold email sequence A", priority: "high", dueOffset: 1, status: "done" },
      { title: "Review and approve ad creatives", priority: "medium", dueOffset: -3, status: "todo" },
      { title: "Set up call tracking numbers", priority: "high", dueOffset: -1, status: "in_progress" },
      { title: "Import existing contact list", priority: "medium", dueOffset: 3, status: "done" },
      { title: "Configure voice agent greeting script", priority: "high", dueOffset: -4, status: "todo" },
      { title: "A/B test subject lines -- batch 2", priority: "low", dueOffset: -7, status: "todo" },
      { title: "Weekly performance report -- send to client", priority: "medium", dueOffset: 1, status: "todo" },
      { title: "Optimize SEO meta tags -- top 10 pages", priority: "medium", dueOffset: 0, status: "in_progress" },
      { title: "Set up Google Business Profile", priority: "high", dueOffset: 7, status: "done" },
      { title: "Review reputation monitoring alerts", priority: "low", dueOffset: -2, status: "todo" },
      { title: "Configure Stripe billing for client", priority: "high", dueOffset: 1, status: "done" },
      { title: "Deploy chatbot to production site", priority: "high", dueOffset: -6, status: "todo" },
      { title: "Record onboarding walkthrough video", priority: "medium", dueOffset: -8, status: "todo" },
      { title: "QA test voice agent call flow", priority: "high", dueOffset: -3, status: "in_progress" },
      { title: "Audience segment analysis report", priority: "medium", dueOffset: -5, status: "todo" },
      { title: "Client kickoff call -- follow-up notes", priority: "medium", dueOffset: 4, status: "done" },
      { title: "Set up pixel tracking script", priority: "high", dueOffset: -1, status: "in_progress" },
      { title: "Content calendar -- month 2 planning", priority: "low", dueOffset: -10, status: "todo" },
      { title: "Review Google Ads campaign performance", priority: "medium", dueOffset: 2, status: "todo" },
      { title: "Send NPS survey to active clients", priority: "low", dueOffset: -14, status: "todo" },
      { title: "Fix broken form on contact page", priority: "high", dueOffset: 0, status: "in_progress" },
    ]

    for (let i = 0; i < taskTemplates.length; i++) {
      const t = taskTemplates[i]
      const sub = subscriptions[i % subscriptions.length]
      if (!sub) continue
      await prisma.fulfillmentTask.create({
        data: {
          subscriptionId: sub.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: daysAgo(t.dueOffset),
          ...(t.status === "done" ? { completedAt: daysAgo(Math.max(0, t.dueOffset + 1)) } : {}),
        },
      })
    }
    console.log(`  Created ${taskTemplates.length} fulfillment tasks`)
  }

  // ============ LEAD MAGNET SUBMISSIONS ============

  console.log("  Creating lead magnet submissions...")
  const existingSubmissions = await prisma.leadMagnetSubmission.count()
  if (existingSubmissions > 0) {
    console.log(`  Submissions already exist (${existingSubmissions}), skipping`)
  } else {
    const submissions = [
      { type: "AI_READINESS_QUIZ" as const, email: "jessica@brightsideinsurance.com", name: "Jessica Alvarez", company: "Brightside Insurance", data: { industry: "Insurance", teamSize: "11-50", currentTools: ["email", "crm"], aiExperience: "beginner" }, results: { score: 42, readiness: "moderate", recommendations: ["ai-voice-agents", "cold-outbound"] }, score: 42, source: "google_ads", convertedToDeal: false, createdAt: daysAgo(3) },
      { type: "ROI_CALCULATOR" as const, email: "priya@apexmedspa.com", name: "Priya Sharma", company: "Apex Med Spa", data: { monthlyRevenue: 85000, leadCost: 45, closeRate: 0.22, industry: "Med Spa" }, results: { projectedROI: 340, monthlyGain: 12750, paybackWeeks: 3 }, score: 82, source: "organic", convertedToDeal: true, createdAt: daysAgo(6) },
      { type: "WEBSITE_AUDIT" as const, email: "tom@capitalcitylaw.com", name: "Tom Brennan", company: "Capital City Law", data: { url: "https://capitalcitylaw.com", industry: "Legal" }, results: { overallScore: 58, seoScore: 45, speedScore: 72, mobileScore: 61, issues: 14 }, score: 58, source: "linkedin", convertedToDeal: true, createdAt: daysAgo(9) },
      { type: "AI_READINESS_QUIZ" as const, email: "carlos@sunbeltfloors.com", name: "Carlos Mendez", company: "Sunbelt Flooring", data: { industry: "Flooring", teamSize: "1-10", currentTools: ["email"], aiExperience: "none" }, results: { score: 28, readiness: "early", recommendations: ["website-crm-chatbot"] }, score: 28, source: "organic", convertedToDeal: false, createdAt: daysAgo(1) },
      { type: "ROI_CALCULATOR" as const, email: "kevin@pacifictitle.com", name: "Kevin Lam", company: "Pacific Title & Escrow", data: { monthlyRevenue: 120000, leadCost: 65, closeRate: 0.18, industry: "Real Estate" }, results: { projectedROI: 280, monthlyGain: 16800, paybackWeeks: 4 }, score: 75, source: "referral", convertedToDeal: true, createdAt: daysAgo(7) },
      { type: "WEBSITE_AUDIT" as const, email: "info@midwestmanufacturing.com", name: "Robert Kline", company: "Midwest Manufacturing Co", data: { url: "https://midwestmfg.com", industry: "Manufacturing" }, results: { overallScore: 34, seoScore: 22, speedScore: 48, mobileScore: 31, issues: 27 }, score: 34, source: "cold_outbound", convertedToDeal: false, createdAt: daysAgo(15) },
      { type: "AI_READINESS_QUIZ" as const, email: "samantha@urbanfitgym.com", name: "Samantha Reed", company: "UrbanFit Gym", data: { industry: "Fitness", teamSize: "11-50", currentTools: ["crm", "social", "email"], aiExperience: "intermediate" }, results: { score: 71, readiness: "ready", recommendations: ["ai-content-engine", "audience-targeting"] }, score: 71, source: "instagram", convertedToDeal: false, createdAt: daysAgo(4) },
    ]

    for (const s of submissions) {
      await prisma.leadMagnetSubmission.create({ data: s })
    }
    console.log(`  Created ${submissions.length} lead magnet submissions`)
  }

  // ============ SUPPORT TICKETS ============

  console.log("  Creating support tickets...")
  const existingTickets = await prisma.supportTicket.count()
  if (existingTickets > 0) {
    console.log(`  Tickets already exist (${existingTickets}), skipping`)
  } else {
    const tickets = [
      { userId: createdUsers["demo_client_active_1"]!, subject: "Chatbot not responding on mobile", message: "Our AI chatbot widget is not loading on mobile Safari. It works fine on desktop Chrome. Can you investigate? This started about 2 days ago after a WordPress update.", status: "open", priority: "high", createdAt: daysAgo(2) },
      { userId: createdUsers["demo_client_active_2"]!, subject: "Request to add new location", message: "We are opening a 6th location in San Jose next month. Can we get the same setup as our other locations? Need the voice agent configured for the new number too.", status: "in_progress", priority: "normal", createdAt: daysAgo(5) },
      { userId: createdUsers["demo_client_active_3"]!, subject: "Monthly report questions", message: "I received the monthly performance report but I am not sure how to read the lead attribution section. Can someone walk me through it? Also, the call volume number seems lower than expected.", status: "open", priority: "normal", createdAt: daysAgo(1) },
      { userId: createdUsers["demo_client_active_1"]!, subject: "Update cold email sender domain", message: "We purchased a new sending domain (greenlawnservice.com) and need to switch our outbound campaigns to use it. The old domain warmup is complete.", status: "resolved", priority: "normal", resolvedAt: daysAgo(3), createdAt: daysAgo(8) },
      { userId: createdUsers["demo_client_active_2"]!, subject: "Billing question -- double charge", message: "I noticed two charges on our card this month for the AI Voice Agents subscription. One for $597 on the 1st and another for $597 on the 3rd. Can you look into this?", status: "resolved", priority: "high", resolvedAt: daysAgo(1), createdAt: daysAgo(4) },
    ]

    for (const t of tickets) {
      if (!t.userId) continue
      await prisma.supportTicket.create({ data: t })
    }
    console.log(`  Created ${tickets.length} support tickets`)
  }

  // ============ DEAL ACTIVITIES ============

  console.log("  Creating deal activities...")
  const existingActivities = await prisma.dealActivity.count()
  if (existingActivities > 0) {
    console.log(`  Activities already exist (${existingActivities}), skipping`)
  } else {
    const deals = await prisma.deal.findMany({ select: { id: true, contactEmail: true }, take: 15 })
    const dealMap = Object.fromEntries(deals.map((d) => [d.contactEmail, d.id]))

    type ActType = "EMAIL_SENT" | "CALL_MADE" | "DEMO_COMPLETED" | "STAGE_CHANGE" | "NOTE_ADDED" | "SUBSCRIPTION_CREATED" | "FORM_SUBMITTED" | "TASK_CREATED" | "PAYMENT_RECEIVED"
    const activities: { dealEmail: string; type: ActType; detail: string; daysAgoCreated: number }[] = [
      { dealEmail: "sarah@greenlawnpros.com", type: "FORM_SUBMITTED", detail: "Completed AI Readiness Quiz (score: 89)", daysAgoCreated: 80 },
      { dealEmail: "sarah@greenlawnpros.com", type: "STAGE_CHANGE", detail: "NEW_LEAD -> QUALIFIED", daysAgoCreated: 79 },
      { dealEmail: "sarah@greenlawnpros.com", type: "EMAIL_SENT", detail: "Sent introductory email with service overview", daysAgoCreated: 79 },
      { dealEmail: "sarah@greenlawnpros.com", type: "CALL_MADE", detail: "Discovery call -- 22 min. Interested in website + outbound", daysAgoCreated: 77 },
      { dealEmail: "sarah@greenlawnpros.com", type: "STAGE_CHANGE", detail: "QUALIFIED -> DEMO_BOOKED", daysAgoCreated: 77 },
      { dealEmail: "sarah@greenlawnpros.com", type: "DEMO_COMPLETED", detail: "Full platform demo -- showed chatbot and cold outbound tools", daysAgoCreated: 75 },
      { dealEmail: "sarah@greenlawnpros.com", type: "STAGE_CHANGE", detail: "DEMO_BOOKED -> PROPOSAL_SENT", daysAgoCreated: 74 },
      { dealEmail: "sarah@greenlawnpros.com", type: "EMAIL_SENT", detail: "Sent proposal -- 3-service bundle at $1,245/mo", daysAgoCreated: 74 },
      { dealEmail: "sarah@greenlawnpros.com", type: "STAGE_CHANGE", detail: "PROPOSAL_SENT -> ACTIVE_CLIENT", daysAgoCreated: 72 },
      { dealEmail: "sarah@greenlawnpros.com", type: "SUBSCRIPTION_CREATED", detail: "Website + CRM + Chatbot ($497/mo)", daysAgoCreated: 72 },
      { dealEmail: "sarah@greenlawnpros.com", type: "SUBSCRIPTION_CREATED", detail: "Cold Outbound Engine ($397/mo)", daysAgoCreated: 72 },
      { dealEmail: "sarah@greenlawnpros.com", type: "PAYMENT_RECEIVED", detail: "First payment received -- $1,245.00", daysAgoCreated: 72 },
      { dealEmail: "marcus@elitedentalgroup.com", type: "STAGE_CHANGE", detail: "NEW_LEAD -> ACTIVE_CLIENT (fast close)", daysAgoCreated: 65 },
      { dealEmail: "marcus@elitedentalgroup.com", type: "SUBSCRIPTION_CREATED", detail: "Enterprise bundle -- 4 services at $2,490/mo", daysAgoCreated: 64 },
      { dealEmail: "marcus@elitedentalgroup.com", type: "PAYMENT_RECEIVED", detail: "First payment received -- $2,490.00", daysAgoCreated: 64 },
      { dealEmail: "marcus@elitedentalgroup.com", type: "NOTE_ADDED", detail: "Client wants voice agent configured for all 5 locations with unique greetings", daysAgoCreated: 60 },
      { dealEmail: "marcus@elitedentalgroup.com", type: "TASK_CREATED", detail: "Set up 5 voice agent instances with location-specific routing", daysAgoCreated: 60 },
      { dealEmail: "jessica@brightsideinsurance.com", type: "FORM_SUBMITTED", detail: "Completed AI Readiness Quiz (score: 42)", daysAgoCreated: 3 },
      { dealEmail: "jessica@brightsideinsurance.com", type: "EMAIL_SENT", detail: "Auto-sent quiz results email with recommendations", daysAgoCreated: 3 },
      { dealEmail: "tom@capitalcitylaw.com", type: "FORM_SUBMITTED", detail: "Requested website audit", daysAgoCreated: 9 },
      { dealEmail: "tom@capitalcitylaw.com", type: "STAGE_CHANGE", detail: "NEW_LEAD -> QUALIFIED", daysAgoCreated: 8 },
      { dealEmail: "tom@capitalcitylaw.com", type: "CALL_MADE", detail: "Intro call -- 15 min. Tom wants to improve SEO and add chatbot", daysAgoCreated: 8 },
      { dealEmail: "tom@capitalcitylaw.com", type: "STAGE_CHANGE", detail: "QUALIFIED -> DEMO_BOOKED", daysAgoCreated: 7 },
      { dealEmail: "derek@suncoastroofing.com", type: "STAGE_CHANGE", detail: "ACTIVE_CLIENT -> AT_RISK", daysAgoCreated: 25 },
      { dealEmail: "derek@suncoastroofing.com", type: "CALL_MADE", detail: "Retention call -- Derek mentions budget issues", daysAgoCreated: 20 },
      { dealEmail: "derek@suncoastroofing.com", type: "STAGE_CHANGE", detail: "AT_RISK -> CHURNED", daysAgoCreated: 12 },
      { dealEmail: "derek@suncoastroofing.com", type: "NOTE_ADDED", detail: "Client churned due to budget -- downsized from 8 to 3 trucks. May revisit in Q4.", daysAgoCreated: 12 },
      { dealEmail: "priya@apexmedspa.com", type: "FORM_SUBMITTED", detail: "Completed ROI Calculator (projected 340% ROI)", daysAgoCreated: 6 },
      { dealEmail: "priya@apexmedspa.com", type: "STAGE_CHANGE", detail: "NEW_LEAD -> QUALIFIED", daysAgoCreated: 5 },
      { dealEmail: "priya@apexmedspa.com", type: "EMAIL_SENT", detail: "Sent personalized outreach based on ROI results", daysAgoCreated: 5 },
      { dealEmail: "james@tristateplumbing.com", type: "STAGE_CHANGE", detail: "QUALIFIED -> PROPOSAL_SENT", daysAgoCreated: 14 },
      { dealEmail: "james@tristateplumbing.com", type: "EMAIL_SENT", detail: "Sent proposal -- cold outbound + pixel at $694/mo", daysAgoCreated: 14 },
      { dealEmail: "james@tristateplumbing.com", type: "NOTE_ADDED", detail: "James wants to start with a 90-day pilot before committing annually", daysAgoCreated: 10 },
      { dealEmail: "linda@harmonyvet.com", type: "DEMO_COMPLETED", detail: "Demo completed -- showed website builder and content engine", daysAgoCreated: 13 },
      { dealEmail: "linda@harmonyvet.com", type: "STAGE_CHANGE", detail: "DEMO_BOOKED -> NEGOTIATION", daysAgoCreated: 11 },
      { dealEmail: "linda@harmonyvet.com", type: "NOTE_ADDED", detail: "Linda comparing us vs. Scorpion. Differentiator: AI chatbot + content engine bundle", daysAgoCreated: 11 },
    ]

    for (const a of activities) {
      const dealId = dealMap[a.dealEmail]
      if (!dealId) continue
      await prisma.dealActivity.create({
        data: {
          dealId,
          type: a.type,
          detail: a.detail,
          createdAt: daysAgo(a.daysAgoCreated),
        },
      })
    }
    console.log(`  Created ${activities.length} deal activities`)
  }

  // ============ NOTIFICATIONS ============

  console.log("  Creating notifications...")
  const existingNotifs = await prisma.notification.count()
  if (existingNotifs > 0) {
    console.log(`  Notifications already exist (${existingNotifs}), skipping`)
  } else {
    const notifications = [
      { type: "new_lead", title: "New Lead", message: "Jessica Alvarez from Brightside Insurance completed the AI Readiness Quiz", channel: "IN_APP" as const, read: false, sentAt: daysAgo(3) },
      { type: "new_lead", title: "New Lead", message: "Carlos Mendez from Sunbelt Flooring visited the marketplace", channel: "IN_APP" as const, read: false, sentAt: daysAgo(1) },
      { type: "deal_stage", title: "Deal Moved", message: "Tom Brennan (Capital City Law) moved to Demo Booked", channel: "IN_APP" as const, read: false, sentAt: daysAgo(7) },
      { type: "payment", title: "Payment Received", message: "GreenLawn Pros -- monthly payment of $1,245.00 processed", channel: "IN_APP" as const, read: true, sentAt: daysAgo(2) },
      { type: "payment", title: "Payment Received", message: "Elite Dental Group -- monthly payment of $2,490.00 processed", channel: "IN_APP" as const, read: true, sentAt: daysAgo(2) },
      { type: "churn_alert", title: "Client Churned", message: "Suncoast Roofing cancelled their subscription -- budget constraints", channel: "IN_APP" as const, read: true, sentAt: daysAgo(12) },
      { type: "task_overdue", title: "Overdue Task", message: "Weekly performance report for GreenLawn Pros is 1 day overdue", channel: "IN_APP" as const, read: false, sentAt: daysAgo(0) },
      { type: "support_ticket", title: "New Support Ticket", message: "Sarah Mitchell: Chatbot not responding on mobile (HIGH priority)", channel: "IN_APP" as const, read: false, sentAt: daysAgo(2) },
      { type: "deal_stage", title: "Deal Moved", message: "Priya Sharma (Apex Med Spa) qualified -- high ROI score", channel: "IN_APP" as const, read: false, sentAt: daysAgo(5) },
      { type: "payment_failed", title: "Payment Past Due", message: "GreenLawn Pros -- AI Content Engine subscription payment failed", channel: "IN_APP" as const, read: false, sentAt: daysAgo(1) },
      { type: "upsell", title: "Upsell Opportunity", message: "Elite Aesthetics showing interest in adding AI Voice Agents", channel: "IN_APP" as const, read: true, sentAt: daysAgo(8) },
      { type: "new_lead", title: "New Lead", message: "Priya Sharma from Apex Med Spa completed the ROI Calculator", channel: "IN_APP" as const, read: true, sentAt: daysAgo(6) },
    ]

    for (const n of notifications) {
      await prisma.notification.create({ data: n })
    }
    console.log(`  Created ${notifications.length} notifications`)
  }

  // ============ RESELLER REFERRAL ============

  console.log("  Creating reseller referral...")
  const existingReferrals = await prisma.referral.count()
  if (existingReferrals > 0) {
    console.log(`  Referrals already exist (${existingReferrals}), skipping`)
  } else {
    const resellerId = createdUsers["demo_reseller_1"]
    if (resellerId) {
      await prisma.referral.create({
        data: {
          referrerId: resellerId,
          code: "GROWTH25",
          tier: "RESELLER",
          clicks: 142,
          signups: 8,
          conversions: 3,
          totalEarned: 1867.50,
          pendingPayout: 425.00,
          landingPageSlug: "growth-partners",
        },
      })
      console.log("  Created reseller referral")
    }
  }

  // ============ INTERN PROFILE ============

  console.log("  Creating intern profile...")
  const existingInterns = await prisma.internProfile.count()
  if (existingInterns > 0) {
    console.log(`  Interns already exist (${existingInterns}), skipping`)
  } else {
    const internId = createdUsers["demo_intern_1"]
    if (internId) {
      await prisma.internProfile.create({
        data: {
          userId: internId,
          role: "BDR",
          status: "ACTIVE",
          cohort: "Spring 2026",
          tasksCompleted: 34,
          revenueAttributed: 2450.00,
          university: "University of Texas at Austin",
          linkedIn: "https://linkedin.com/in/alexrivera",
          startDate: daysAgo(60),
          endDate: daysAgo(-30),
        },
      })
      console.log("  Created intern profile")
    }
  }

  // ============ DEAL NOTES ============

  console.log("  Creating deal notes...")
  const existingNotes = await prisma.dealNote.count()
  if (existingNotes > 0) {
    console.log(`  Deal notes already exist (${existingNotes}), skipping`)
  } else {
    const dealsForNotes = await prisma.deal.findMany({ select: { id: true, contactEmail: true }, take: 20 })
    const notesDealMap = Object.fromEntries(dealsForNotes.map((d) => [d.contactEmail, d.id]))

    const dealNotes: { dealEmail: string; authorId: string; content: string; daysAgoCreated: number }[] = [
      { dealEmail: "sarah@greenlawnpros.com", authorId: "adam", content: "Sarah is our highest-value client right now. Runs 3 locations and is very responsive. Great candidate for a case study.", daysAgoCreated: 40 },
      { dealEmail: "sarah@greenlawnpros.com", authorId: "sabbir", content: "Chatbot training data updated with seasonal lawn care FAQ. Client reports 40% fewer phone calls during peak season.", daysAgoCreated: 15 },
      { dealEmail: "marcus@elitedentalgroup.com", authorId: "adam", content: "Marcus fast-tracked from lead to active client in 3 days. Enterprise package. Wants all 5 locations live within 2 weeks.", daysAgoCreated: 63 },
      { dealEmail: "marcus@elitedentalgroup.com", authorId: "ivan", content: "Voice agents configured for locations 1-4. Location 5 (San Jose) pending number provisioning. Each location has unique greeting and routing.", daysAgoCreated: 50 },
      { dealEmail: "tom@capitalcitylaw.com", authorId: "adam", content: "Tom saw the website audit results and is motivated to fix the SEO issues. Has a competitor who ranks #1 for 'capital city attorney'. Demo scheduled for Thursday.", daysAgoCreated: 7 },
      { dealEmail: "priya@apexmedspa.com", authorId: "marco", content: "Priya filled out ROI calculator showing 340% projected ROI. She runs Instagram ads but has no email or outbound strategy. Good fit for cold outbound + content engine.", daysAgoCreated: 5 },
      { dealEmail: "james@tristateplumbing.com", authorId: "adam", content: "James wants a 90-day pilot before annual commitment. Offered 15% discount on pilot period. He needs to see 10+ booked meetings to convert.", daysAgoCreated: 10 },
      { dealEmail: "linda@harmonyvet.com", authorId: "adam", content: "Linda is comparing us with Scorpion. Our differentiator is the AI chatbot + content engine bundle. She values the chatbot's ability to answer pet health FAQs 24/7.", daysAgoCreated: 11 },
      { dealEmail: "derek@suncoastroofing.com", authorId: "adam", content: "Derek mentioned they might come back in Q4 when they ramp back up. Adding to re-engagement list for September outreach.", daysAgoCreated: 12 },
      { dealEmail: "nina@zenithphysio.com", authorId: "adam", content: "Nina has been unresponsive to last 3 emails. Service usage dropped 70% in past 2 weeks. Scheduling a retention call.", daysAgoCreated: 3 },
      { dealEmail: "nina@zenithphysio.com", authorId: "sabbir", content: "Retention call completed. Nina says she is overwhelmed and not using the tools. Offered a 1:1 training session next week to re-engage.", daysAgoCreated: 1 },
      { dealEmail: "whitney@adamsrealty.com", authorId: "marco", content: "Whitney runs a 12-agent real estate team. Interested in lead routing and AI chatbot for property inquiries. High potential deal.", daysAgoCreated: 4 },
    ]

    let noteCount = 0
    for (const n of dealNotes) {
      const dealId = notesDealMap[n.dealEmail]
      if (!dealId) continue
      await prisma.dealNote.create({
        data: {
          dealId,
          authorId: n.authorId,
          content: n.content,
          createdAt: daysAgo(n.daysAgoCreated),
        },
      })
      noteCount++
    }
    console.log(`  Created ${noteCount} deal notes`)
  }

  // ============ ADDITIONAL SUPPORT TICKETS + REPLIES ============

  console.log("  Creating additional support tickets with replies...")
  const ticketCount = await prisma.supportTicket.count()
  if (ticketCount >= 8) {
    console.log(`  Sufficient tickets exist (${ticketCount}), skipping additional`)
  } else {
    const additionalTickets = [
      { userId: createdUsers["demo_client_active_3"]!, subject: "DNS not propagating after 48 hours", message: "We followed the DNS setup guide and pointed our nameservers 2 days ago but the site is still showing the old hosting page. We checked with our registrar and the records look correct. Can you check on your end?", status: "in_progress", priority: "high", assignedTo: "sabbir", createdAt: daysAgo(3) },
      { userId: createdUsers["demo_client_active_1"]!, subject: "Calendar not syncing with Google Calendar", message: "The booking calendar on our website is not syncing new appointments to our Google Calendar. Clients are booking but we do not see the events. This started after we changed our Google Workspace admin last week.", status: "open", priority: "high", createdAt: daysAgo(1) },
      { userId: createdUsers["demo_client_active_2"]!, subject: "Need help with automation setup", message: "I would like to set up an automation that sends a follow-up email 24 hours after a missed call. I see the automation builder but I am not sure how to connect the voice agent trigger. Can someone walk me through it?", status: "open", priority: "normal", createdAt: daysAgo(0) },
      { userId: createdUsers["demo_client_active_3"]!, subject: "Voice agent says wrong business hours", message: "Our voice agent is telling callers we close at 5pm but we updated our hours to 7pm two weeks ago. Where do I change this?", status: "resolved", priority: "normal", resolvedAt: daysAgo(5), resolutionNote: "Updated business hours in voice agent configuration. Confirmed correct hours are now being communicated to callers.", createdAt: daysAgo(9) },
      { userId: createdUsers["demo_client_active_1"]!, subject: "Can we add Spanish language to chatbot?", message: "A lot of our customers speak Spanish. Is there a way to add Spanish language support to the AI chatbot? If so, what would the additional cost be?", status: "resolved", priority: "normal", resolvedAt: daysAgo(7), resolutionNote: "Enabled multilingual support on the chatbot. Spanish language pack added at no extra cost on Growth tier and above.", createdAt: daysAgo(14) },
    ]

    const createdTickets: string[] = []
    for (const t of additionalTickets) {
      if (!t.userId) continue
      const ticket = await prisma.supportTicket.create({ data: t })
      createdTickets.push(ticket.id)
    }

    // Add replies to resolved tickets
    const allTickets = await prisma.supportTicket.findMany({
      where: { status: { in: ["resolved", "in_progress"] } },
      select: { id: true, userId: true, status: true, subject: true },
    })

    const ticketReplies: { ticketSubject: string; replies: { message: string; isAdmin: boolean; authorId: string; authorName: string; daysAgoCreated: number }[] }[] = [
      {
        ticketSubject: "Update cold email sender domain",
        replies: [
          { message: "Hi Sarah, I can help with that. I will need the DNS records for greenlawnservice.com. Can you share access to your domain registrar, or would you prefer to add the records yourself? I will send the required TXT and MX records.", isAdmin: true, authorId: "marco", authorName: "Marco", daysAgoCreated: 7 },
          { message: "Sure, here are the registrar credentials: we use Namecheap. I sent the login info to support@aims-platform.com. Please add the records directly.", isAdmin: false, authorId: createdUsers["demo_client_active_1"] ?? "unknown", authorName: "Sarah Mitchell", daysAgoCreated: 6 },
          { message: "All set! DNS records are configured and verified. The new domain is warming up now and will be ready for campaigns in about 14 days. I have queued the switch for your outbound campaigns.", isAdmin: true, authorId: "marco", authorName: "Marco", daysAgoCreated: 4 },
        ],
      },
      {
        ticketSubject: "Billing question -- double charge",
        replies: [
          { message: "Hi Marcus, I see the duplicate charge. This was caused by a Stripe retry after a temporary network timeout. I have submitted a refund for the second charge of $597. You should see it within 3-5 business days.", isAdmin: true, authorId: "adam", authorName: "Adam", daysAgoCreated: 3 },
          { message: "Thanks for the quick resolution. I see the refund pending on my card now.", isAdmin: false, authorId: createdUsers["demo_client_active_2"] ?? "unknown", authorName: "Marcus Chen", daysAgoCreated: 2 },
        ],
      },
      {
        ticketSubject: "DNS not propagating after 48 hours",
        replies: [
          { message: "Hi Rachel, I checked the DNS records and it looks like the A record is pointing to the old IP. The CNAME for www is correct but the root domain needs to be updated. Here are the correct records you need to set:\n\nA record: @ -> 76.76.21.21\nCNAME: www -> cname.vercel-dns.com\n\nCan you update the A record and let me know?", isAdmin: true, authorId: "sabbir", authorName: "Sabbir", daysAgoCreated: 2 },
        ],
      },
      {
        ticketSubject: "Voice agent says wrong business hours",
        replies: [
          { message: "Hi Rachel, the business hours are configured in the voice agent settings under your account. I have updated them to reflect 7pm closing time. The change takes effect immediately for all new calls.", isAdmin: true, authorId: "ivan", authorName: "Ivan", daysAgoCreated: 7 },
          { message: "Perfect, I just tested it and the agent now says the right hours. Thank you!", isAdmin: false, authorId: createdUsers["demo_client_active_3"] ?? "unknown", authorName: "Rachel Nguyen", daysAgoCreated: 6 },
        ],
      },
      {
        ticketSubject: "Can we add Spanish language to chatbot?",
        replies: [
          { message: "Great news -- multilingual support is included on your Growth tier. I have enabled Spanish language detection on your chatbot. It will automatically detect when a visitor is typing in Spanish and respond accordingly. No additional cost.", isAdmin: true, authorId: "sabbir", authorName: "Sabbir", daysAgoCreated: 12 },
          { message: "That is amazing! I just tested it in Spanish and it works perfectly. Our team is thrilled. Thank you!", isAdmin: false, authorId: createdUsers["demo_client_active_1"] ?? "unknown", authorName: "Sarah Mitchell", daysAgoCreated: 10 },
          { message: "Glad to hear it! Let us know if you want to add any other languages in the future. We support 40+ languages out of the box.", isAdmin: true, authorId: "sabbir", authorName: "Sabbir", daysAgoCreated: 9 },
        ],
      },
    ]

    for (const tr of ticketReplies) {
      const ticket = allTickets.find((t) => t.subject === tr.ticketSubject)
      if (!ticket) continue
      for (const reply of tr.replies) {
        await prisma.supportTicketReply.create({
          data: {
            ticketId: ticket.id,
            message: reply.message,
            isAdmin: reply.isAdmin,
            authorId: reply.authorId,
            authorName: reply.authorName,
            createdAt: daysAgo(reply.daysAgoCreated),
          },
        })
      }
    }
    console.log(`  Created ${additionalTickets.length} additional tickets + replies`)
  }

  // ============ CHAT SESSIONS ============

  console.log("  Creating chat sessions...")
  const existingSessions = await prisma.chatSession.count()
  if (existingSessions > 0) {
    console.log(`  Chat sessions already exist (${existingSessions}), skipping`)
  } else {
    const chatSessions = [
      // Intake sessions (with email captured)
      {
        email: "jessica@brightsideinsurance.com",
        source: "intake",
        messageCount: 5,
        messages: [
          { role: "assistant", content: "Welcome to AIMS! I am here to help you explore how AI can grow your business. What industry are you in?" },
          { role: "user", content: "I run an insurance agency in Miami. We have about 30 agents." },
          { role: "assistant", content: "Great! Insurance agencies benefit a lot from AI-powered lead generation and client communication. Are you currently using any CRM or marketing automation tools?" },
          { role: "user", content: "We use Salesforce but it feels clunky. We're losing leads because follow-up takes too long." },
          { role: "assistant", content: "That is a common pain point. Our Website + CRM + Chatbot service can automate lead capture and instant follow-up. Would you like to see a demo? I can also share our ROI calculator so you can see the projected impact for your agency." },
        ],
        createdAt: daysAgo(3),
      },
      {
        email: "david@summitauto.com",
        source: "intake",
        messageCount: 4,
        messages: [
          { role: "assistant", content: "Welcome to AIMS! Tell me about your business and what challenges you are facing." },
          { role: "user", content: "We're a car dealership group. 4 locations across Texas. We need help with recall outreach." },
          { role: "assistant", content: "Recall outreach is one of our specialties. Our AI Voice Agent can handle all recall campaigns across your locations, transcribing every call and logging results to your CRM. How are you handling recalls currently?" },
          { role: "user", content: "We have two people calling all day. It's expensive and they can't keep up." },
        ],
        createdAt: daysAgo(2),
      },
      {
        email: "patricia@cleansweepjanitorial.com",
        source: "intake",
        messageCount: 3,
        messages: [
          { role: "assistant", content: "Welcome to AIMS! How can I help you today?" },
          { role: "user", content: "I want a website for my janitorial company. Something professional with online booking." },
          { role: "assistant", content: "Our Website + CRM + Chatbot package includes a professional website with online booking, a CRM to manage your clients, and an AI chatbot that answers questions 24/7. The Starter plan begins at $97/month. Would you like to see some examples from similar businesses?" },
        ],
        createdAt: daysAgo(0),
      },
      {
        email: "brian@oconnellcpa.com",
        source: "intake",
        messageCount: 6,
        messages: [
          { role: "assistant", content: "Welcome to AIMS! What brings you here today?" },
          { role: "user", content: "I'm a CPA with a small firm. Tax season is over and I want to grow my advisory practice." },
          { role: "assistant", content: "Growing advisory revenue is a great goal. Many accounting firms use our cold outbound and content engine to attract new advisory clients. What does your current marketing look like?" },
          { role: "user", content: "Basically nothing. We get referrals but that's it. No website marketing." },
          { role: "assistant", content: "You are leaving a lot on the table. A website with SEO optimization plus targeted outbound to business owners who need advisory services could transform your pipeline. Our ROI calculator can estimate the impact based on your current numbers." },
          { role: "user", content: "That sounds interesting. Can I get a demo?" },
        ],
        createdAt: daysAgo(7),
      },
      // Onboarding sessions
      {
        email: "sarah@greenlawnpros.com",
        source: "onboarding",
        clerkUserId: "demo_client_active_1",
        messageCount: 5,
        messages: [
          { role: "assistant", content: "Welcome to your onboarding, Sarah! Let us get your GreenLawn Pros account set up. First, can you confirm your business address and the 3 location addresses?" },
          { role: "user", content: "Sure! Main office is 1205 Oak Street, Austin TX 78701. Second location is 890 Elm Drive, Round Rock TX 78664. Third is 445 Pine Ave, Cedar Park TX 78613." },
          { role: "assistant", content: "Got it. I have created your 3 location profiles. Next, I need your current domain registrar info so we can point your DNS to the new website. Who hosts your domain?" },
          { role: "user", content: "We use GoDaddy for greenlawnpros.com." },
          { role: "assistant", content: "I will send you a step-by-step DNS setup guide for GoDaddy. It takes about 5 minutes. Once the DNS propagates (usually 24-48 hours), your new site will be live. In the meantime, let us customize your AI chatbot. What are the top 5 questions your customers ask?" },
        ],
        createdAt: daysAgo(75),
      },
      {
        email: "marcus@elitedentalgroup.com",
        source: "onboarding",
        clerkUserId: "demo_client_active_2",
        messageCount: 4,
        messages: [
          { role: "assistant", content: "Welcome aboard, Marcus! Let us get Elite Dental Group fully configured. I see you have 5 locations. Let us start by mapping out the voice agent setup for each one." },
          { role: "user", content: "Each location has a different front desk number. I want the voice agent to answer after 3 rings if the front desk doesn't pick up." },
          { role: "assistant", content: "Perfect. We will set up call forwarding with a 3-ring threshold for each location. The AI will greet callers with a location-specific message. What should the greeting sound like?" },
          { role: "user", content: "Something like 'Thank you for calling Elite Dental [location name]. How can I help you today?' Keep it professional." },
        ],
        createdAt: daysAgo(62),
      },
      {
        email: "rachel@precisionhvac.net",
        source: "onboarding",
        clerkUserId: "demo_client_active_3",
        messageCount: 4,
        messages: [
          { role: "assistant", content: "Hi Rachel! Let us get your Precision HVAC voice agent configured. I see you have 2 locations. Do both locations share the same services and hours?" },
          { role: "user", content: "Yes, both do residential and commercial HVAC. Hours are 7am-7pm Monday through Saturday." },
          { role: "assistant", content: "Got it. I will configure the voice agent for both locations with those hours. For after-hours calls, should the AI take a message and schedule a callback, or route to an on-call technician?" },
          { role: "user", content: "Take a message and schedule callback. We don't do emergency service." },
        ],
        createdAt: daysAgo(42),
      },
      // Portal sessions
      {
        email: "sarah@greenlawnpros.com",
        source: "portal",
        clerkUserId: "demo_client_active_1",
        messageCount: 4,
        messages: [
          { role: "user", content: "How do I see the leads from the chatbot this week?" },
          { role: "assistant", content: "You can view all chatbot leads in your CRM pipeline under the 'New Leads' stage. Go to Portal > Pipeline and filter by source 'chatbot'. This week you have 12 new chatbot leads." },
          { role: "user", content: "Can I export them to a spreadsheet?" },
          { role: "assistant", content: "Yes! Click the 'Export' button in the top right of the pipeline view. You can export to CSV or Excel. The export includes contact name, email, phone, and the full chat transcript." },
        ],
        createdAt: daysAgo(5),
      },
      {
        email: "marcus@elitedentalgroup.com",
        source: "portal",
        clerkUserId: "demo_client_active_2",
        messageCount: 3,
        messages: [
          { role: "user", content: "What's my call volume across locations this month?" },
          { role: "assistant", content: "Here is your call summary for this month:\n- Downtown SF: 234 calls (89% answered by AI)\n- Oakland: 187 calls (92% answered by AI)\n- San Jose: 156 calls (91% answered by AI)\n- Walnut Creek: 98 calls (88% answered by AI)\n- Fremont: 112 calls (90% answered by AI)\n\nTotal: 787 calls, 90% AI-handled. 67 appointments booked." },
          { role: "user", content: "That's great. The Walnut Creek numbers seem low though. Can we look into that?" },
        ],
        createdAt: daysAgo(2),
      },
      {
        email: "rachel@precisionhvac.net",
        source: "portal",
        clerkUserId: "demo_client_active_3",
        messageCount: 5,
        messages: [
          { role: "user", content: "Our voice agent picked up a call from someone asking about duct cleaning but we don't offer that. Can we update the script?" },
          { role: "assistant", content: "Of course! I can update the voice agent to politely decline duct cleaning inquiries and suggest a referral partner if you have one. Would you like the agent to say something like 'We specialize in HVAC installation and repair. For duct cleaning, I can recommend...'?" },
          { role: "user", content: "Yes, refer them to CleanAir Pros at 972-555-0100." },
          { role: "assistant", content: "Done! I have updated the voice agent script to redirect duct cleaning inquiries to CleanAir Pros. The change is live immediately. I also added duct cleaning to the FAQ so the agent handles it smoothly." },
          { role: "user", content: "Thank you, that was fast!" },
        ],
        createdAt: daysAgo(8),
      },
      // Marketing sessions (public, no user)
      {
        source: "marketing",
        messageCount: 3,
        messages: [
          { role: "user", content: "What does AIMS do?" },
          { role: "assistant", content: "AIMS is an AI-powered marketing and sales platform. We help businesses grow with services like AI chatbots, cold outbound email, voice agents, SEO, and more. Each service is fully managed -- we handle the setup, optimization, and ongoing management so you can focus on running your business." },
          { role: "user", content: "How much does it cost?" },
        ],
        createdAt: daysAgo(4),
      },
      {
        source: "marketing",
        messageCount: 4,
        messages: [
          { role: "user", content: "Do you work with dental offices?" },
          { role: "assistant", content: "Yes! Dental practices are one of our strongest verticals. We have helped multi-location dental groups automate patient communication with AI voice agents, improve their online presence with SEO and websites, and fill their chairs with targeted outbound campaigns." },
          { role: "user", content: "What results do your dental clients see?" },
          { role: "assistant", content: "Our dental clients typically see a 40-60% reduction in missed calls, 25-35% increase in new patient bookings, and significant time savings for front desk staff. One of our clients, a 5-location dental group, increased monthly bookings by 67 appointments after implementing our voice agent across all locations." },
        ],
        createdAt: daysAgo(6),
      },
    ]

    for (const session of chatSessions) {
      await prisma.chatSession.create({
        data: {
          email: session.email ?? null,
          source: session.source,
          clerkUserId: session.clerkUserId ?? null,
          messages: session.messages,
          messageCount: session.messageCount,
          createdAt: session.createdAt,
        },
      })
    }
    console.log(`  Created ${chatSessions.length} chat sessions`)
  }

  // ============ PAGE VIEWS ============

  console.log("  Creating page views...")
  const existingPageViews = await prisma.pageView.count()
  if (existingPageViews > 0) {
    console.log(`  Page views already exist (${existingPageViews}), skipping`)
  } else {
    const pages = [
      { path: "/", weight: 25 },
      { path: "/marketplace", weight: 15 },
      { path: "/marketplace/website-crm-chatbot", weight: 8 },
      { path: "/marketplace/cold-outbound", weight: 6 },
      { path: "/marketplace/voice-agents", weight: 7 },
      { path: "/marketplace/seo-aeo", weight: 4 },
      { path: "/marketplace/audience-targeting", weight: 3 },
      { path: "/marketplace/finance-automation", weight: 2 },
      { path: "/quiz", weight: 8 },
      { path: "/calculator", weight: 6 },
      { path: "/audit", weight: 5 },
      { path: "/about", weight: 3 },
      { path: "/blog", weight: 4 },
      { path: "/contact", weight: 4 },
    ]

    const referrers = [null, null, null, "https://google.com", "https://google.com", "https://linkedin.com", "https://facebook.com", null]
    const utmSources = [null, null, null, "google", "linkedin", "facebook", null]
    const utmMediums = [null, null, null, "cpc", "organic", "social", null]
    const sessionIds = Array.from({ length: 40 }, (_, i) => `session_${String(i + 1).padStart(3, "0")}`)

    const pageViewData: { path: string; referrer: string | null; utmSource: string | null; utmMedium: string | null; sessionId: string; createdAt: Date }[] = []
    const totalWeight = pages.reduce((sum, p) => sum + p.weight, 0)

    for (let i = 0; i < 80; i++) {
      // Weighted random page selection
      let rand = Math.random() * totalWeight
      let selectedPage = pages[0]
      for (const page of pages) {
        rand -= page.weight
        if (rand <= 0) {
          selectedPage = page
          break
        }
      }

      const dayOffset = Math.floor(Math.random() * 30)
      const hourOffset = Math.floor(Math.random() * 14) + 8 // 8am - 10pm
      const date = daysAgo(dayOffset)
      date.setHours(hourOffset, Math.floor(Math.random() * 60), 0, 0)

      pageViewData.push({
        path: selectedPage.path,
        referrer: referrers[Math.floor(Math.random() * referrers.length)] ?? null,
        utmSource: utmSources[Math.floor(Math.random() * utmSources.length)] ?? null,
        utmMedium: utmMediums[Math.floor(Math.random() * utmMediums.length)] ?? null,
        sessionId: sessionIds[Math.floor(Math.random() * sessionIds.length)],
        createdAt: date,
      })
    }

    for (const pv of pageViewData) {
      await prisma.pageView.create({ data: pv })
    }
    console.log(`  Created ${pageViewData.length} page views`)
  }

  // ============ API COST LOGS ============

  console.log("  Creating API cost logs...")
  const existingCostLogs = await prisma.apiCostLog.count()
  if (existingCostLogs > 0) {
    console.log(`  API cost logs already exist (${existingCostLogs}), skipping`)
  } else {
    const apiEndpoints = [
      { endpoint: "chat", provider: "anthropic", model: "claude-sonnet-4-20250514", avgTokens: 1200, avgCost: 0.018 },
      { endpoint: "intake-chat", provider: "anthropic", model: "claude-sonnet-4-20250514", avgTokens: 1800, avgCost: 0.027 },
      { endpoint: "onboarding-chat", provider: "anthropic", model: "claude-sonnet-4-20250514", avgTokens: 2200, avgCost: 0.033 },
      { endpoint: "portal-chat", provider: "anthropic", model: "claude-sonnet-4-20250514", avgTokens: 1500, avgCost: 0.022 },
      { endpoint: "lead-scoring", provider: "anthropic", model: "claude-haiku-3-20250307", avgTokens: 800, avgCost: 0.004 },
      { endpoint: "content-generation", provider: "anthropic", model: "claude-sonnet-4-20250514", avgTokens: 3500, avgCost: 0.052 },
      { endpoint: "website-audit", provider: "google", model: "gemini-2.0-flash", avgTokens: 2000, avgCost: 0.008 },
      { endpoint: "seo-analysis", provider: "google", model: "gemini-2.0-flash", avgTokens: 2500, avgCost: 0.010 },
    ]

    const costLogData: { provider: string; model: string; endpoint: string; tokens: number; cost: number; serviceArm: string | null; createdAt: Date }[] = []

    for (let i = 0; i < 30; i++) {
      // 1-4 API calls per day, heavier on recent days
      const callsPerDay = randomBetween(1, 4)
      for (let j = 0; j < callsPerDay; j++) {
        const ep = apiEndpoints[Math.floor(Math.random() * apiEndpoints.length)]
        const tokenVariance = randomBetween(-300, 300)
        const tokens = Math.max(100, ep.avgTokens + tokenVariance)
        const costVariance = (Math.random() - 0.5) * 0.01
        const cost = Math.max(0.001, Number((ep.avgCost + costVariance).toFixed(4)))

        const date = daysAgo(i)
        date.setHours(randomBetween(8, 22), randomBetween(0, 59), 0, 0)

        let serviceArm: string | null = null
        if (ep.endpoint === "intake-chat") serviceArm = "website-crm-chatbot"
        if (ep.endpoint === "content-generation") serviceArm = "ai-content-engine"
        if (ep.endpoint === "website-audit") serviceArm = "seo-aeo"
        if (ep.endpoint === "seo-analysis") serviceArm = "seo-aeo"
        if (ep.endpoint === "lead-scoring") serviceArm = "cold-outbound"

        costLogData.push({
          provider: ep.provider,
          model: ep.model,
          endpoint: ep.endpoint,
          tokens,
          cost,
          serviceArm,
          createdAt: date,
        })
      }
    }

    for (const cl of costLogData) {
      await prisma.apiCostLog.create({ data: cl })
    }
    console.log(`  Created ${costLogData.length} API cost logs`)
  }

  // ============ ADDITIONAL DEAL ACTIVITIES (for new deals) ============

  console.log("  Creating activities for new deals...")
  const activityCount = await prisma.dealActivity.count()
  if (activityCount >= 40) {
    console.log(`  Sufficient activities exist (${activityCount}), skipping additional`)
  } else {
    const freshDeals = await prisma.deal.findMany({ select: { id: true, contactEmail: true }, take: 25 })
    const freshDealMap = Object.fromEntries(freshDeals.map((d) => [d.contactEmail, d.id]))

    type ActType2 = "EMAIL_SENT" | "CALL_MADE" | "STAGE_CHANGE" | "NOTE_ADDED" | "FORM_SUBMITTED"
    const newActivities: { dealEmail: string; type: ActType2; detail: string; daysAgoCreated: number }[] = [
      { dealEmail: "david@summitauto.com", type: "FORM_SUBMITTED", detail: "Chatbot intake conversation -- 4 locations, needs recall outreach", daysAgoCreated: 2 },
      { dealEmail: "david@summitauto.com", type: "EMAIL_SENT", detail: "Auto-sent follow-up email with voice agent case study", daysAgoCreated: 2 },
      { dealEmail: "patricia@cleansweepjanitorial.com", type: "FORM_SUBMITTED", detail: "Chatbot intake -- wants website with online booking", daysAgoCreated: 0 },
      { dealEmail: "brian@oconnellcpa.com", type: "FORM_SUBMITTED", detail: "Completed ROI Calculator (projected 280% ROI)", daysAgoCreated: 7 },
      { dealEmail: "brian@oconnellcpa.com", type: "STAGE_CHANGE", detail: "NEW_LEAD -> QUALIFIED", daysAgoCreated: 6 },
      { dealEmail: "brian@oconnellcpa.com", type: "EMAIL_SENT", detail: "Sent intro email with advisory practice growth playbook", daysAgoCreated: 6 },
      { dealEmail: "whitney@adamsrealty.com", type: "FORM_SUBMITTED", detail: "Completed Website Audit (score: 45/100)", daysAgoCreated: 5 },
      { dealEmail: "whitney@adamsrealty.com", type: "STAGE_CHANGE", detail: "NEW_LEAD -> QUALIFIED", daysAgoCreated: 4 },
      { dealEmail: "whitney@adamsrealty.com", type: "CALL_MADE", detail: "Discovery call -- 18 min. 12-agent team, needs lead routing and chatbot", daysAgoCreated: 4 },
      { dealEmail: "hector@premierpest.com", type: "STAGE_CHANGE", detail: "QUALIFIED -> PROPOSAL_SENT", daysAgoCreated: 18 },
      { dealEmail: "hector@premierpest.com", type: "EMAIL_SENT", detail: "Sent proposal -- website + cold outbound at $894/mo", daysAgoCreated: 18 },
      { dealEmail: "hector@premierpest.com", type: "NOTE_ADDED", detail: "Hector wants to include review management. Looking into adding that to the package.", daysAgoCreated: 15 },
      { dealEmail: "nina@zenithphysio.com", type: "STAGE_CHANGE", detail: "ACTIVE_CLIENT -> AT_RISK", daysAgoCreated: 7 },
      { dealEmail: "nina@zenithphysio.com", type: "EMAIL_SENT", detail: "Sent check-in email -- no response to last 3 communications", daysAgoCreated: 5 },
      { dealEmail: "nina@zenithphysio.com", type: "CALL_MADE", detail: "Retention call -- Nina says she is overwhelmed and not using tools", daysAgoCreated: 3 },
    ]

    let newActCount = 0
    for (const a of newActivities) {
      const dealId = freshDealMap[a.dealEmail]
      if (!dealId) continue
      await prisma.dealActivity.create({
        data: {
          dealId,
          type: a.type,
          detail: a.detail,
          createdAt: daysAgo(a.daysAgoCreated),
        },
      })
      newActCount++
    }
    console.log(`  Created ${newActCount} additional deal activities`)
  }

  console.log("\nSeed complete.")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error("Seed failed:", e)
    await prisma.$disconnect()
    process.exit(1)
  })
