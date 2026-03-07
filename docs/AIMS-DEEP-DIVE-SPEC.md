# AIMS Platform — UI Implementation Deep Dive

---

## Homepage Sections (in order)

### 1. Navbar
- Fixed top, `bg-white/90 backdrop-blur-md border-b` on scroll (transparent when at top)
- Logo: Zap icon + "AIMS" wordmark
- Links: Services, Why AIMS?, Pricing, Marketplace, FAQ
- Desktop right: Sign in (gray text) + "Get started" crimson button
- Mobile: AnimatePresence animated drawer with same links

### 2. Hero
- Subtle dot-grid background (opacity 0.03)
- Radial crimson glow (rgba 0.07) from top center
- Badge pill: pulse dot + "AI-Managed Growth Infrastructure"
- H1: "The operating system for AI-powered growth" — "AI-powered growth" has crimson gradient text
- Sub: "AIMS builds and runs your outbound engine, AI calling systems, and pipeline operations"
- CTAs: "Book a Strategy Call" (crimson, shadow-red-100) + "Browse Services" (white, border)
- Below CTAs: floating dashboard preview card — pipeline funnel bars (animated) + recent leads feed
- Stats row: 3.2x pipeline, 500+ clients, 14 days to first meeting

### 3. Logo Ticker
- Infinite CSS scroll animation (30s)
- 12 logos: HubSpot, Salesforce, Instantly, Slack, Apollo, Notion, OpenAI, LinkedIn, Google Ads, Shopify, Calendly, Airtable
- Fade edges with gradient overlays
- Label: "Integrated with the tools your team already uses"

### 4. Services Grid
- 1 large featured card (Outbound Campaigns) full width
- 5 normal cards in 3-col grid
- Each card: pillar color pill, Clearbit tool logos, title, description, outcome callout box, tags, arrow icon
- Large card also has "Get this service" CTA

### 5. How It Works
- 3 steps: Strategy & ICP Dive / Build & Launch / Optimize & Scale
- Big muted step number (text-gray-100), dot checklist, hover border
- Phase timeline bar at bottom (Week 1-2, 2-3, 4+) with colored dots

### 6. Benefits
- 2-column split layout
- Left: badge + heading + 4 metric cards (3.2x, $284, 14d, 500+) in 2x2 grid
- Right: 6 benefit rows with CheckCircle2 icons

### 7. Why AIMS
- Side-by-side comparison: "Traditional Agency" (gray, X marks) vs "AIMS" (white, red border, checkmarks)
- Tool stack grid: 12 Clearbit logos with grayscale → color on hover

### 8. Integrations
- Left: badge, heading, description
- Right: stacked integration cards with logos
- CTA: "Get Started Now"

### 9. Pricing
- Monthly/Annual toggle
- 4 tiers: Starter ($97), Growth ($197), Pro ($297, highlighted), Elite ($397)
- Each tier: price, features list, CTA button
- "Most popular" badge on Pro

### 10. FAQ
- shadcn Accordion
- 7 questions covering results timeline, industries, tools, setup vs management, AI agents, SEO, pricing

### 11. Final CTA
- Full-width crimson (#DC2626) background
- "Ready to fill your pipeline?" + "Book a Strategy Call" white button
- "No credit card required · Cancel anytime"

### 12. Footer
- 4 columns: Company, Services, Resources, Connect
- AIMS logo + tagline left
- Social links: Twitter/X, LinkedIn
- Copyright line

---

## Marketplace Page

### URL: /marketplace
### Filters (URL-synced with searchParams):
- Pillar: All | Marketing | Sales | Operations | Finance
- Status: All | Active | Beta | Coming Soon
- Sort: Most Popular | Newest | Price: Low to High | Price: High to Low
- Search: text input, filters by name and description

### Grid Layout
- 3-col on desktop, 2-col tablet, 1-col mobile
- Each card uses ProductCard component
- Cards for COMING_SOON: slightly desaturated, "Coming Soon" overlay badge, CTA disabled

### ProductCard Structure
- Pillar pill badge (colored)
- Service icon (Lucide)
- Name (bold)
- Short description (2 lines max)
- Tool logos row (Clearbit, max 4)
- Price or "Custom" or "Coming Soon"
- "Get Demo" + "Get Started" buttons

---

## Individual Service Pages (/services/[slug])

Dynamic server component — fetches ServiceArm by slug.

### Sections:
1. **Hero**: pillar badge, name, value prop, price/tier selector, "Get Started" CTA, "See Demo" scroll link
2. **Pain Section**: problem framing copy (from `useCases` JSON)
3. **Interactive Demo**: renders based on `demoType` field
   - INTERACTIVE → embedded React component
   - VOICE_PLAYER → audio player widget
   - LIVE_TOOL → live search/calc
   - VIDEO → video embed
   - ANIMATED_FLOW → animated sequence diagram
   - BEFORE_AFTER → comparison slider
4. **Feature Breakdown**: 3-col grid from `features` JSON array
5. **Use Case Spotlights**: 3 industry examples from `useCases` JSON
6. **Pricing Table**: tiers from `ServiceTier` records
7. **FAQ**: from `faq` JSON array on ServiceArm
8. **Also Consider**: 3 complementary services (same pillar, different slug)

---

## Checkout Flow (/get-started)

### Step 1: Select Service + Tier
- Query: `?service=[slug]&tier=[slug]`
- If pre-populated, show selected service with tier highlighted
- Toggle between tiers to see price change
- "What's included" expandable checklist

### Step 2: Business Info
- Company name, website, industry (dropdown), locations count, primary goal (dropdown)
- "How did you hear about us?" (dropdown)

### Step 3: Create Account
- Clerk `<SignUp />` embedded component
- If already signed in, skip to Step 4

### Step 4: Payment
- Calls POST /api/subscriptions with serviceArmSlug + tier
- Redirects to Stripe Checkout URL
- On success: /portal/dashboard?checkout=success
- On cancel: /services/[slug]?checkout=cancelled

---

## Lead Magnets

### AI Readiness Quiz (/tools/ai-readiness-quiz)
- 7 questions, 4 options each
- Questions cover: outbound process, lead follow-up, content creation, CRM usage, analytics, customer support, financial reporting
- Score 0-100 based on answers
- Email gate before results
- Results: score ring (SVG animated), category (Laggard/Early Adopter/Ready/Leader), 3 product recommendations
- Submits to POST /api/lead-magnets/submit with type: AI_READINESS_QUIZ

### ROI Calculator (/tools/roi-calculator)
- 4 sliders: leads/month, close rate %, avg deal value, monthly ad spend
- Real-time calculation:
  - Current revenue = leads × close_rate × avg_deal
  - With AIMS: leads × 2.8 × (close_rate + 0.4) × avg_deal
  - Monthly uplift = difference
- Email gate to see full breakdown
- Submits with type: ROI_CALCULATOR

### Website Audit (/tools/website-audit)
- URL input
- Mock 6-step stream: Checking DNS → Scanning pages → Testing speed → Checking SEO → Analyzing conversion → Generating report
- Score rings for SEO, Speed, Conversion, AI Readiness
- Mock issues with "AIMS Fix" callouts
- Email gate for full report
- (Future: real Firecrawl + Claude backend via POST /api/ai/audit)

### Segment Explorer (/tools/segment-explorer)
- Search input for keyword/business type
- Returns mock segment results
- First 3 free, email gate for more

### Stack Configurator (/tools/stack-configurator)
- 4-step wizard: business type → challenge → locations → budget
- Output: 2-3 recommended AIMS products with total monthly price

---

## Client Portal

### Dashboard (/portal/dashboard)
- Dark mode bg-[#0D0F14]
- Welcome header: "Welcome back, [name]"
- Active subscriptions grid: service name, tier badge, fulfillment status, next billing
- Quick metrics if applicable
- Recent activity feed
- Upsell prompt: "Based on your current plan..."
- Quick actions: View billing, Contact support, Browse marketplace

### Service Detail (/portal/services/[serviceId])
- Header: service name + tier + status badge + monthly price
- Fulfillment tasks stepper: green check (DONE), blue spinner (IN_PROGRESS), red warning (overdue)
- "Upgrade Tier" button if higher tiers exist
- "Cancel Service" with confirmation dialog
- "Contact Support" link

### Billing (/portal/billing)
- Active subscriptions with amounts
- Payment method on file (card last 4 + expiry)
- Invoice history table (downloadable links)
- "Manage Billing" → Stripe Customer Portal redirect

---

## Admin CRM

### Kanban (/admin/crm)
- 6 columns: NEW_LEAD, QUALIFIED, DEMO_BOOKED, PROPOSAL_SENT, ACTIVE_CLIENT, AT_RISK
- CHURNED and LOST hidden behind "Show all stages" toggle
- @dnd-kit drag-and-drop
- On drag: optimistic update → PATCH /api/deals/[dealId] → revert on error + toast
- Deal card: contact name, company, value, days in stage, service arm tags
- Stale card highlight (orange tint) if >5 days in stage
- Click card → /admin/crm/[dealId]

### Deal Detail (/admin/crm/[dealId])
Two-column layout (60% / 40%):

**LEFT:**
- Contact name (xl bold), company, DealStageBadge, formatCurrency(value)
- Contact info card: email (mailto), phone, website (link), industry, locationCount
- Service arms list: each DealServiceArm with name, tier, price, status
- Stage selector dropdown → PATCH on change
- Priority selector dropdown → PATCH on change
- Assigned to field → PATCH on change

**RIGHT:**
- Activity timeline (reverse chrono)
- Add note form: textarea + "Add Note" button → POST creates DealNote + DealActivity(NOTE_ADDED)
- Attribution card: source, sourceDetail, channelTag, UTM params

### Revenue (/admin/revenue)
- 4 MetricCards: MRR, New MRR (this month), Churn, Net New MRR
- Recharts AreaChart: 12-month MRR trend
- Recharts BarChart: MRR by service arm
- Table: top 10 clients by MRR

---

## Intern OS

### EOD Report Format (must match exactly)
Section 1: "What did you complete today?"
- Dynamic list, 3+ items, specific: "Built X for Y", "Deployed Z"

Section 2: "What's your priority for tomorrow?"
- Dynamic list, 3-5 items

Section 3: "Any blockers?"
- Dynamic list, can be empty

Section 4: "Hours worked today"
- Number, step 0.5

On submit:
- POST /api/intern/eod
- Creates EODReport in DB
- Posts to #aimseod Slack channel: "[Name] EOD" with completed list

### Task Board (/intern/tasks)
- 5 columns: TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED
- @dnd-kit drag-and-drop
- Card: title, priority badge (URGENT=red, HIGH=orange, MEDIUM=blue, LOW=gray), due date (red if overdue), linked product pill
- Click → detail modal: description, status dropdown, actual hours, linked deal/product
