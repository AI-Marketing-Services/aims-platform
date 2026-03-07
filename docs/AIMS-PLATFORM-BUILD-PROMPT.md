# AIMS Platform — Architecture Reference

> **Project**: aimseos.com — Full-stack AI services marketplace, CRM, and client portal
> **Owner**: Adam Wolfe — Head of AI & Innovation, Modern Amenities Group
> **Stack**: Next.js 16 (App Router), TypeScript strict, Tailwind CSS v3, shadcn/ui, Clerk, Prisma + Neon, Stripe, Resend, Framer Motion, Recharts

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router) | Server components default, `"use client"` only when needed |
| Language | TypeScript strict | No `any`. Use Prisma-generated types throughout. |
| Styling | Tailwind CSS v3 + shadcn/ui | CSS variable tokens — bg-card, border-border, text-foreground |
| Auth | Clerk | Roles via `sessionClaims.metadata.role`. createRouteMatcher in middleware. |
| Database | Neon (PostgreSQL) + Prisma ORM | Neon HTTP adapter (`@prisma/adapter-neon`) for Vercel serverless |
| Payments | Stripe | Subscriptions + one-time. Stripe Connect for reseller payouts. |
| Email | Resend | Transactional + triggered sequences. Domain: aimseos.com |
| Cache | Upstash Redis | Rate limiting, session caching |
| AI | Claude API (Sonnet for analysis, Haiku for routing) | Cost logged to ApiCostLog table |
| Scraping | Firecrawl API | Website audit tool, onboarding site analysis |
| Hosting | Vercel | Edge functions, cron jobs (check-churn, send-digests, verify-pixels) |
| Analytics | Vercel Analytics | PageView model tracks UTM attribution |
| Icons | Lucide React | Consistent with shadcn |
| Charts | Recharts | AreaChart (MRR), BarChart (costs), PieChart (breakdown) |
| Animation | Framer Motion | fade-up on scroll, stagger grids, hero pipeline card |
| Forms | React Hook Form + Zod | All inputs validated |

---

## Design System

### Colors
```css
--primary: #DC2626          /* AIMS Crimson — all CTAs, active states */
--primary-hover: #B91C1C
--background: #FAFAFA       /* Marketing pages */
--background-dark: #0D0F14  /* Portal + Admin */
--pillar-marketing: #16A34A /* Green */
--pillar-sales: #2563EB     /* Blue */
--pillar-operations: #EA580C /* Orange */
--pillar-finance: #9333EA   /* Purple */
--border: #E5E7EB
--radius: 12px
```

### Typography
- Geist Sans + Geist Mono via `next/font/google`
- Headings: `font-extrabold tracking-tight`
- Body: `text-base leading-relaxed`
- Mono stats: `font-mono font-bold`

### Card Pattern
```
rounded-2xl border border-border bg-card shadow-sm
hover: translateY(-2px) + shadow intensification (.card-hover class)
```

### Section Header Pattern
```tsx
<SectionHeader badge="Core Services" heading="Every way we fill your pipeline" subheading="..." />
```

---

## Route Map

### (marketing) — Public, no auth
```
/                          Homepage (12 sections)
/marketplace               Full service grid with pillar filters
/services/[slug]           Individual service arm page (dynamic)
/industries/[vertical]     vendingpreneurs, car-dealerships, small-business, hotels, enterprise
/tools/ai-readiness-quiz   Lead magnet — 7-question quiz with scoring
/tools/roi-calculator      Lead magnet — sliders, real-time ROI calc
/tools/website-audit       Lead magnet — Firecrawl + Claude scan
/tools/segment-explorer    Lead magnet — search segment database
/tools/stack-configurator  Lead magnet — wizard → product recommendation
/partners/reseller         Partner program overview
/partners/affiliate        Affiliate program overview
/for/[partnerSlug]         Dynamic partner landing page (referral cookie)
/case-studies/[slug]       Case study pages
/careers/[role]            AI Builder, BDR, PM career pages
/pricing                   Full pricing table
/about                     Product-led about page (no team section)
/get-started               Strategy call booking / onboarding wizard
/why-aims                  Comparison page
/blog/[slug]               MDX blog
```

### (auth)
```
/sign-in/[[...sign-in]]    Clerk hosted sign-in
/sign-up/[[...sign-up]]    Clerk hosted sign-up
```

### (portal) — Requires auth, role: CLIENT
```
/portal/dashboard          Welcome, active services, metrics, upsell
/portal/services           Grid of active subscriptions
/portal/services/[id]      Fulfillment progress, tier upgrade, cancel
/portal/marketplace        In-portal upsell marketplace (dark mode)
/portal/billing            Invoices, payment methods, Stripe portal
/portal/campaigns          Outbound campaign reporting (if active)
/portal/pixel              Pixel dashboard (if active)
/portal/referrals          Referral tracking and earnings
/portal/support            Support tickets
/portal/settings           Account info, notifications, danger zone
```

### (admin) — Requires auth, role: ADMIN or SUPER_ADMIN
```
/admin/dashboard           MRR, deals, pipeline overview
/admin/crm                 Kanban pipeline (drag-and-drop)
/admin/crm/[dealId]        Deal detail — 2-col, activity timeline
/admin/clients             All clients table
/admin/revenue             MRR charts, waterfall, margin table
/admin/api-costs           API spend by provider/arm/client
/admin/intern-ops          Intern performance overview
/admin/vendor-savings      Vendor replacement tracker
/admin/products            Manage service arms
/admin/products/[armId]    Edit service arm
/admin/referrals           Affiliate/referral management
/admin/lead-magnets        Submission analytics
/admin/settings            Platform settings
```

### (intern) — Requires auth, role: INTERN
```
/intern/dashboard          Welcome, tasks, EOD quick action
/intern/tasks              Kanban task board (drag-and-drop)
/intern/sprints            Sprint goals and progress
/intern/eod-report         EOD submission form (Adam's format)
/intern/portfolio          Portfolio builder
```

### (reseller) — Requires auth, role: RESELLER
```
/reseller/dashboard        Clicks, signups, conversions, earnings
/reseller/clients          Clients signed up via their link
/reseller/commissions      Commission events, payout requests
/reseller/resources        Sales deck, one-pagers, email templates
```

### API Routes
```
POST /api/webhooks/stripe          subscription lifecycle, invoice events
POST /api/webhooks/clerk           user sync to DB
GET  /api/deals                    list with filters (ADMIN only)
POST /api/deals                    create deal + Slack notify
GET  /api/deals/[dealId]           full deal with all relations
PATCH /api/deals/[dealId]          stage/field update + activity log
DELETE /api/deals/[dealId]         soft delete
GET  /api/services                 public service arm list
POST /api/subscriptions            create Stripe checkout session (auth)
POST /api/lead-magnets/submit      create submission + deal + send email
GET  /api/admin/metrics            MRR, pipeline stats, API costs
GET  /api/referrals                current user's referral record
POST /api/referrals/track          increment click count (no auth)
POST /api/intern/tasks             create intern task
PATCH /api/intern/tasks/[id]       update task status/hours
POST /api/intern/eod               submit EOD report + Slack notify
GET  /api/cron/check-churn         flag AT_RISK, send Slack alert
GET  /api/cron/send-digests        weekly MRR digest to admin
```

---

## All 15 Service Arms

| # | Slug | Name | Pillar | Status | Pricing | Assignee |
|---|------|------|--------|--------|---------|----------|
| 1 | website-crm-chatbot | Website + CRM + Chatbot | MARKETING | ACTIVE | $97-397/mo | Sabbir |
| 2 | cold-outbound | Cold Outbound Engine | SALES | ACTIVE | CUSTOM | Marco |
| 3 | voice-agents | AI Voice Agent Platform | SALES | ACTIVE | CUSTOM | Ivan |
| 4 | seo-aeo | SEO & AEO Automation | MARKETING | ACTIVE | MONTHLY | Cody |
| 5 | audience-targeting | Audience Targeting & Segments | SALES | ACTIVE | MONTHLY | Saad |
| 6 | pixel-intelligence | Pixel & Visitor Intelligence | SALES | BETA | MONTHLY | Kumar |
| 7 | finance-automation | P&L Finance Automation | FINANCE | ACTIVE | $1000/quarter | Adam |
| 8 | ai-tool-tracker | AI Tool Tracker | OPERATIONS | ACTIVE | MONTHLY | Adam |
| 9 | vending-placement-visualizer | Vending Placement Visualizer | MARKETING | ACTIVE | MONTHLY | — |
| 10 | lead-reactivation | Lead Reactivation | SALES | ACTIVE | CUSTOM | — |
| 11 | database-reactivation | Database Reactivation | OPERATIONS | ACTIVE | CUSTOM | — |
| 12 | content-production | Content Production Pod | MARKETING | ACTIVE | MONTHLY | Ailyn |
| 13 | revops-pipeline | RevOps Pipeline | OPERATIONS | ACTIVE | CUSTOM | Maureen |
| 14 | social-media-management | Social Media Management | MARKETING | COMING_SOON | MONTHLY | — |
| 15 | ad-creatives | Ad Creative Engine | MARKETING | COMING_SOON | MONTHLY | — |

### Fulfillment Assignment Map
- **Sabbir** → website-crm-chatbot (GHL snapshot deployment)
- **Cody** → seo-aeo (SEO/AEO builds)
- **Marco** → cold-outbound (email infrastructure, Clay, Instantly)
- **Ivan** → voice-agents (Bland.ai voice agent setup)
- **Ailyn** → content-production (content calendar, scripts)
- **Maureen** → revops-pipeline (CRM architecture, HubSpot/Salesforce)
- **Kumar** → pixel-intelligence (pixel setup, N8N automations)
- **Saad** → audience-targeting (list building, segments)
- **Adam** → finance-automation, ai-tool-tracker, oversight

### Website + CRM + Chatbot Tiers
| Tier | Price | Key Features |
|------|-------|-------------|
| Starter | $97/mo | Website, chatbot, basic CRM, 1 calendar |
| Growth | $197/mo | + email automations, 3 pipelines, reporting |
| Pro | $297/mo | + AI follow-up, multi-location, SMS, API access (**most popular**) |
| Elite | $397/mo | + white-label, unlimited locations, priority support |

---

## Fulfillment Automation Chain

```
Stripe checkout.session.completed
  → POST /api/webhooks/stripe
    → handleSubscriptionCreated()
      → db.subscription.create()
      → db.fulfillmentTask.createMany() (from serviceArm.setupSteps)
      → db.deal.update({ stage: ACTIVE_CLIENT })
      → sendWelcomeEmail() via Resend
      → notifyNewPurchase() via Slack
      → (future) GHL subaccount provisioned via API
      → (future) sendFulfillmentAssignment() to assignee email
```

---

## Implementation Phases

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Marketing frontend (12 homepage sections, marketplace, service pages, tools) | COMPLETE |
| 2 | DB schema + API routes + Stripe webhooks | COMPLETE |
| 3 | Client portal (dashboard, services, billing, support, referrals) | MOSTLY COMPLETE |
| 4 | Admin CRM (kanban, deal detail, revenue, API costs, vendor savings) | PARTIAL |
| 5 | Intern OS (dashboard, tasks, EOD, sprints) | IN PROGRESS |
| 6 | Reseller portal | IN PROGRESS |
| 7 | Industry pages, partner pages, blog | NOT STARTED |
| 8 | GHL provisioning API, Bland.ai integration, Firecrawl audit backend | NOT STARTED |
| 9 | Stripe Connect for reseller payouts | NOT STARTED |

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://...neon.tech/neondb?sslmode=require (for migrations)

# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/portal/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/portal/dashboard

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Scraping
FIRECRAWL_API_KEY=fc-...

# Email
RESEND_API_KEY=re_...

# Cache
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Cron
CRON_SECRET=...

# App
NEXT_PUBLIC_APP_URL=https://aimseos.com
```

---

## Key Coding Patterns

1. **DB queries**: Always use `lib/db/queries.ts` helpers, never raw `db.*` in page files
2. **Auth guard**: `const { userId } = await auth()` at top of every protected server component
3. **Role check**: `const role = (sessionClaims?.metadata as { role?: string })?.role`
4. **Stripe**: `createCheckoutSession()` from `lib/stripe` — never instantiate stripe directly in routes
5. **Email**: Lazy `getResend()` function — never top-level Resend instantiation
6. **Error handling**: `try/catch` in all API routes, return `{ error: string }` with status codes
7. **Validation**: Zod schema on every POST/PATCH body before DB write
8. **Activity log**: Every deal stage change must create a `DealActivity` record
