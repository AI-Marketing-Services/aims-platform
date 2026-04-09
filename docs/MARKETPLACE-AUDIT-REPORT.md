# MARKETPLACE AUDIT REPORT — Partner-Attributed AI Operator Marketplace

> **Date**: 2026-04-06
> **Auditor**: Claude Code (Opus 4.6)
> **Scope**: Full codebase audit of AIMS Platform — referral/attribution infrastructure, marketplace, payments, and gap analysis against Dub.co-powered target architecture.

---

## STEP 1: Existing Referral / Affiliate / Partner Infrastructure

### 1.1 Reseller Portal (`src/app/(reseller)/`)

| File | Purpose | Tracking | Data Tables | Integrations |
|------|---------|----------|-------------|--------------|
| `layout.tsx` (91 lines) | Root layout with Clerk auth guard + sidebar nav (Dashboard, Clients, Commissions, Resources). Redirects unauthenticated users to `/sign-in`. | Server-side Clerk `auth()` | None directly | Clerk `auth()`, `UserButton` |
| `reseller/dashboard/page.tsx` (102 lines) | Shows referral stats: clicks, signups, conversions, earnings, conversion rate. Displays referral link with copy button. | Server-side DB query by `clerkId` → `referrerId` | `User`, `Referral` (code, clicks, conversions, totalEarned, pendingPayout, landingPageSlug) | Clerk, Prisma |
| `reseller/commissions/page.tsx` (129 lines) | Commission tier info (RESELLER=25%, COMMUNITY_PARTNER=15%, AFFILIATE=10%), earnings summary, payout schedule (15th monthly, $50 min), Stripe Connect status. | Server-side DB query | `User`, `Referral` (tier, stripeConnectId, conversions), `Commission` (amount, percentage, sourceAmount, status, paidAt, approvedAt) | Clerk, Prisma, Stripe Connect (status check only) |
| `reseller/commissions/ResellerCommissionsClient.tsx` (96 lines) | Client-side commission history table with status badges (PENDING=amber, APPROVED=blue, PAID=green, REJECTED=red). | None — receives props from server | Commission data via props | Lucide icons |
| `reseller/clients/page.tsx` (102 lines) | Displays all referred clients with active subscriptions and per-client MRR. | Server-side DB query via `referralReceived.referrerId` | `User`, `Referral`, `Subscription` (monthlyAmount, status=ACTIVE), `ServiceArm` (name) | Clerk, Prisma |
| `reseller/resources/page.tsx` (148 lines) | Partner resource hub: 4 referral link variants, sales materials (PDFs), training videos, material request form. | Referral links use `?ref={code}` query params | `User`, `Referral` (code, landingPageSlug) | Clerk, Prisma, CopyButton component |
| `reseller/dashboard/loading.tsx` (2 lines) | DashboardSkeleton | — | — | — |
| `reseller/commissions/loading.tsx` (2 lines) | TableSkeleton | — | — | — |
| `reseller/clients/loading.tsx` (2 lines) | TableSkeleton | — | — | — |
| `reseller/resources/loading.tsx` (2 lines) | CardGridSkeleton | — | — | — |
| `reseller/error.tsx` (20 lines) | Error boundary with back link to `/reseller/dashboard` | — | — | ErrorBoundary component |

**Total: 11 files, 787 lines**

**Key findings:**
- No role check at layout level — only checks `userId` exists, not `role === RESELLER`
- Commission rates hardcoded in UI text, not pulled from config
- Stripe Connect is placeholder — shows "team will send you onboarding link" message
- No actual payout execution code exists

---

### 1.2 Referral API Routes (`src/app/api/referrals/`)

| File | Method | Purpose | Auth | Tracking | Data Operations |
|------|--------|---------|------|----------|-----------------|
| `validate/route.ts` (33 lines) | GET | Validates referral code, returns partner info (name, company, tier, slug) | None | Query param `?code=` | READ: `Referral` by code with referrer User |
| `track/route.ts` (46 lines) | POST | Increments click/signup/conversion counters | None (public, rate-limited) | POST body `{ code, event }` | WRITE: `Referral.clicks` / `signups` / `conversions` increment |
| `claim/route.ts` (92 lines) | POST | Links authenticated user as `referredId` on Referral record. **Critical for commission tracking.** | Clerk auth required | POST body `{ code }` | READ: User by clerkId, Referral by code. WRITE: `Referral.referredId`, increment signups. Self-referral prevention. |

---

### 1.3 Partner Landing Pages (`src/app/(marketing)/for/`)

| File | Purpose | Tracking | Data Operations |
|------|---------|----------|-----------------|
| `[partnerSlug]/page.tsx` (170 lines) | Dynamic partner-branded landing page. Shows partner name/avatar, benefits, stats (3.2x pipeline, 14 days, $284 CPM), CTAs with ref code. | **DUAL tracking**: (1) Sets `aims_ref` cookie (30-day, httpOnly=false, sameSite=lax). (2) Appends `?ref={code}` to CTA links. Server-side click increment. | READ: Referral by `landingPageSlug` OR `code`. WRITE: `Referral.clicks` increment. Cookie: `aims_ref={code}` |
| `page.tsx` (6 lines) | Root `/for` redirect to `/get-started` | — | — |

---

### 1.4 Client Referral Page (`src/app/(portal)/portal/referrals/`)

| File | Purpose | Tracking | Data Operations |
|------|---------|----------|-----------------|
| `page.tsx` (250 lines) | User-facing affiliate dashboard. Shows stats (clicks, signups, conversions, earned, pending). Referral link with copy/share (Email, LinkedIn, X). Commission history (last 10). Earning projections. Reseller upgrade CTA. **Auto-creates referral record if none exists** with code `AIMS-{userId.slice(-8).toUpperCase()}`. | Server-side DB query | READ/WRITE: User, Referral (auto-create), Commission (last 10). Referral link format: `{APP_URL}?ref={code}`. Commission rate shown: 20% |

---

### 1.5 Referral Claim Handler Component

| File | Purpose | Tracking | Integration |
|------|---------|----------|-------------|
| `src/components/portal/ReferralClaimHandler.tsx` (42 lines) | Client-side component mounted in portal layout. On mount, reads `aims_ref` cookie, clears it, calls `POST /api/referrals/claim`. Silent failure (best-effort). | Cookie-based (`aims_ref`) | Mounted in `src/app/(portal)/layout.tsx` (line 76) |

---

### 1.6 Sign-Up Referral Capture

| File | Purpose | Tracking |
|------|---------|----------|
| `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` (33 lines) | Reads `ref` from URL searchParams, falls back to `aims_ref` cookie. Passes to Clerk `<SignUp>` via `unsafeMetadata: { referralCode }`. | URL param + cookie fallback |

---

### 1.7 Clerk Webhook — Referral Linking

| File | Purpose | Data Operations |
|------|---------|-----------------|
| `src/app/api/webhooks/clerk/route.ts` (lines 71-100) | On `user.created`, reads `unsafe_metadata.referralCode`. Finds Referral by code, links as `referredId`, increments signups. Self-referral prevention. | READ: Referral by code. WRITE: `Referral.referredId`, increment signups |

---

### 1.8 Stripe Webhook — Commission Generation

| File | Purpose | Data Operations |
|------|---------|-----------------|
| `src/lib/stripe/handlers/handle-invoice.ts` (lines 39-95) | On `invoice.paid` with `billing_reason === "subscription_create"` (first invoice only): looks up subscription → finds referral by `referredId` → calculates commission (AFFILIATE=10%, COMMUNITY_PARTNER=15%, RESELLER=25%, default=20%) → creates Commission record (status=PENDING). | READ: Subscription by stripeSubId, Referral by referredId. WRITE: Commission (amount, percentage, sourceAmount, stripePaymentId). Increment `Referral.conversions`. |

---

### 1.9 Admin Commission Management

| File | Purpose | Data Operations |
|------|---------|-----------------|
| `src/app/api/admin/commissions/route.ts` — GET (lines 18-75) | List all commissions with pagination, filtering, summary (totalPending, totalApproved, totalPaid). Admin auth required. | READ: Commission with Referral + referrer User |
| `src/app/api/admin/commissions/route.ts` — PATCH (lines 77-160) | State machine: PENDING→APPROVED/REJECTED, APPROVED→PAID/REJECTED. Transaction: updates Commission status + Referral totals. Records approvedAt/approvedBy/paidAt. | WRITE: Commission.status, Referral.pendingPayout (increment/decrement), Referral.totalEarned (increment) |
| `src/app/api/reseller/commissions/route.ts` (47 lines) | Reseller-scoped commission list with summary. Requires RESELLER/ADMIN/SUPER_ADMIN role. | READ: Referral by referrerId, Commission records |

**CRITICAL GAP**: No admin UI page exists for commission management. The API is fully functional but there is no `/admin/commissions` or `/admin/referrals` page in `AdminSidebar.tsx`.

---

### 1.10 Prisma Schema — Referral/Commission Models

#### Referral Model (schema.prisma lines 414-442)
```prisma
model Referral {
  id              String       @id @default(cuid())
  referrerId      String
  referrer        User         @relation("referrer", fields: [referrerId], references: [id])
  referredId      String?      @unique
  referred        User?        @relation("referred", fields: [referredId], references: [id])
  code            String       @unique
  tier            ReferralTier @default(AFFILIATE)
  clicks          Int          @default(0)
  signups         Int          @default(0)
  conversions     Int          @default(0)
  totalEarned     Float        @default(0)
  pendingPayout   Float        @default(0)
  stripeConnectId String?
  landingPageSlug String?
  customBranding  Json?
  commissions     Commission[]
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  @@index([code])
  @@index([referrerId])
}
```

**Design limitation**: `referredId` is `@unique` — each referral record can only track ONE referred user. This is a 1:1 model, not 1:many. Partners cannot track multiple referred users through a single referral code under the current schema.

#### Commission Model (schema.prisma lines 633-662)
```prisma
model Commission {
  id              String           @id @default(cuid())
  referralId      String
  referral        Referral         @relation(...)
  userId          String
  amount          Float
  percentage      Float
  sourceAmount    Float
  status          CommissionStatus @default(PENDING)
  stripePaymentId String?
  paidAt          DateTime?
  approvedAt      DateTime?
  approvedBy      String?
  notes           String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  @@unique([referralId, stripePaymentId])
  @@index([referralId])
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}
```

#### Enums
```prisma
enum ReferralTier { AFFILIATE, COMMUNITY_PARTNER, RESELLER }
enum CommissionStatus { PENDING, APPROVED, PAID, REJECTED }
```

---

### 1.11 Attribution Fields Across Models

| Model | Attribution Fields |
|-------|-------------------|
| `Deal` | `source`, `sourceDetail`, `channelTag`, `utmSource`, `utmMedium`, `utmCampaign` |
| `LeadMagnetSubmission` | `source`, `utmSource`, `utmMedium`, `utmCampaign` |
| `PageView` | `path`, `referrer`, `utmSource`, `utmMedium`, `utmCampaign`, `userAgent`, `ip`, `sessionId`, `userId` |
| `User` | `heardAbout` |
| `ChatSession` | `source`, `email`, `clerkUserId` |
| `Referral` | `code`, `clicks`, `signups`, `conversions`, `totalEarned`, `landingPageSlug` |

---

### 1.12 Complete Referral Tracking Flow (Current State)

```
1. CLICK
   Partner shares link → /for/{slug}?ref={CODE}
   → Server: Referral.clicks++
   → Cookie: aims_ref={CODE} (30 days)

2. SIGNUP
   User visits /sign-up?ref={CODE} (or has aims_ref cookie)
   → Clerk SignUp with unsafeMetadata.referralCode
   → Clerk webhook user.created fires
   → Links Referral.referredId = newUser.id
   → Referral.signups++

3. PORTAL ENTRY (failsafe)
   User logs into /portal
   → ReferralClaimHandler reads aims_ref cookie
   → POST /api/referrals/claim → links referredId
   → Clears cookie

4. FIRST PAYMENT
   User subscribes → Stripe invoice.paid
   → handle-invoice checks billing_reason=subscription_create
   → Finds Referral by referredId
   → Commission created (PENDING): amount = sourceAmount * tierRate
   → Referral.conversions++

5. PAYOUT (manual)
   Admin calls PATCH /api/admin/commissions
   → PENDING → APPROVED → PAID
   → Referral.totalEarned updated
   → No actual money transfer (Stripe Connect not implemented)
```

---

## STEP 2: Existing Marketplace Infrastructure

### 2.1 Seeded Service Arms (20 total in seed.ts)

| # | Slug | Name | Pillar | Status | Base Price | Has Stripe Price IDs | Has Tiers |
|---|------|------|--------|--------|-----------|---------------------|-----------|
| 1 | website-crm-chatbot | Website + CRM + Chatbot | MARKETING | ACTIVE | $97/mo | Yes (4 tiers) | Starter, Growth, Pro, Elite |
| 2 | cold-outbound | Cold Outbound Engine | SALES | ACTIVE | Custom | Yes (1 tier) | Standard |
| 3 | voice-agents | AI Voice Agent Platform | SALES | ACTIVE | Custom | Yes (1 tier) | Standard |
| 4 | seo-aeo | SEO & AEO Automation | MARKETING | ACTIVE | $497/mo | Yes (1 tier) | Standard |
| 5 | audience-targeting | Audience Targeting & Segments | SALES | ACTIVE | $397/mo | Yes (1 tier) | Standard |
| 6 | pixel-intelligence | Pixel & Visitor Intelligence | SALES | BETA | $197/mo | Yes (1 tier) | Standard |
| 7 | finance-automation | P&L Finance Automation | FINANCE | ACTIVE | $1000/mo | Yes (1 tier) | Standard |
| 8 | ai-tool-tracker | AI Tool Tracker | OPERATIONS | ACTIVE | $197/mo | Yes (1 tier) | Standard |
| 9 | vending-placement-visualizer | Vending Placement Visualizer | MARKETING | ACTIVE | Custom | No | None |
| 10 | lead-reactivation | Lead Reactivation | SALES | ACTIVE | Custom | Yes (1 tier) | Standard |
| 11 | database-reactivation | Database Reactivation | OPERATIONS | ACTIVE | Custom | No | None |
| 12 | content-production | Content Production Pod | MARKETING | ACTIVE | Custom | No | None |
| 13 | revops-pipeline | RevOps Pipeline | OPERATIONS | ACTIVE | Custom | No | None |
| 14 | inbound-orchestration | Inbound Orchestration Engine | MARKETING | ACTIVE | $697/mo | Yes (1 tier) | Standard |
| 15 | linkedin-outbound | LinkedIn Outbound Engine | SALES | ACTIVE | $597/mo | Yes (1 tier) | Standard |
| 16 | ai-content-engine | AI Content Engine | MARKETING | ACTIVE | $497/mo | Yes (1 tier) | Standard |
| 17 | social-media-management | Social Media Management | MARKETING | COMING_SOON | $397/mo | No | None |
| 18 | ad-creatives | Ad Creative Engine | MARKETING | COMING_SOON | $297/mo | No | None |
| 19 | (not seeded) | GHL Community OS | — | — | — | — | — |
| 20 | (not seeded) | AI Reputation Engine | — | — | — | — | — |

**12 of 18 seeded services have Stripe price IDs** (can accept self-serve payment). 6 are custom/quote-only.

---

### 2.2 Marketplace UI

| Component | Location | Data Source | Capabilities |
|-----------|----------|-------------|-------------|
| **Portal Marketplace** | `src/app/(portal)/portal/marketplace/PortalMarketplaceClient.tsx` | Database (`db.serviceArm`) | Filter by pillar, search, view tiers, checkout to Stripe, shows "Powered by" tool logos (58 tool mappings in TOOL_MAP), stack summary with total MRR, Framer Motion stagger animations |
| **Public Marketplace** | `src/app/(marketing)/marketplace/MarketplaceClient.tsx` | **Hardcoded** (3 services only: Wild Ducks, Money Page, Steel Trap) | Filter by pillar, search, service cards with deliverables/outcomes, CTA to `/get-started` |
| **Service Pages** | `src/app/(marketing)/services/[slug]/page.tsx` | Hybrid: DB first, fallback to hardcoded STATIC_SERVICES (25+ services) | Hero, features, use cases, pricing tiers (if in DB), FAQ, related services, JSON-LD schema |
| **Tool Logos** | `src/components/shared/ToolLogo.tsx` | Hardcoded domain → favicon lookup | Displays integration logos via Google favicon API |

---

### 2.3 Checkout Flow

**Current state**: No 4-step wizard. Two separate paths:

1. **Portal Checkout** (authenticated users):
   - Portal Marketplace → "Add to Plan" → `POST /api/portal/checkout` → Stripe Checkout session → redirect
   - Validates: service ACTIVE/BETA, tier has `stripePriceId`, no existing subscription
   - Metadata: `userId`, `serviceArmSlug`, `tier`
   - Success URL: `/portal/dashboard?checkout=success&service={slug}`

2. **Get-Started Flow** (unauthenticated/new users):
   - `/get-started` → 3-step form (select services → business info → review/submit)
   - Submits to `/api/intake` → creates Deal → shows Cal.com booking widget
   - 6 hardcoded services to select from
   - Does NOT create Stripe checkout session — routes to calendar booking
   - Does NOT capture referral code from URL params

**Cart Checkout** (multi-service):
   - Wire protocol exists in `handle-checkout-completed.ts` (reads `slugs`, `tierIds`, `amounts` from CSV metadata)
   - No cart UI exists in the frontend — no add-to-cart, no cart drawer, no multi-item checkout page

---

### 2.4 Free Tools (`/tools/*`)

| Tool | Type | Has Results Page | Lead Scoring |
|------|------|-----------------|-------------|
| AI Readiness Quiz | 7-question multiple choice | Yes (`/results/[submissionId]`) | < 40 → hot (80), 40-70 → warm (55), > 70 → cold (35) |
| ROI Calculator | 4 sliders | Yes | Always warm (65) |
| Website Audit | URL input → AI scan | Yes | < 40 → hot (75) |
| Segment Explorer | Search ICP segments | No | N/A |
| Stack Configurator | 4-step wizard | No | N/A |
| Business Credit Score | 10-question quiz | Yes | < 40 → hot (85), < 60 → hot (65), < 80 → warm (50), 80+ → cold (35) |
| Executive Ops Audit | 6-phase deep assessment | Yes | All hot (92/78/55 by score) |

All submit to `POST /api/lead-magnets/submit` → creates Deal + sends email + syncs to Close CRM.

---

### 2.5 GHL Snapshot Integration

**No automated snapshot deployment exists.** GHL (GoHighLevel) is listed in TOOL_MAP as an integration logo, and "GHL Community OS" appears in the static services list, but:
- No GHL API calls anywhere in the codebase
- No snapshot deployment automation
- No subaccount provisioning
- Fulfillment is manual via Asana tasks

---

## STEP 3: Existing Payment Infrastructure

### 3.1 Stripe Webhook Events Handled

| Event | Handler File | Automations |
|-------|-------------|-------------|
| `checkout.session.completed` | `handle-checkout-completed.ts` | Cart-based: parse CSV metadata → create Subscription per item → create Asana tasks → create fulfillment tasks → update Deal → send welcome email → post-purchase email sequence |
| `customer.subscription.created` | `handle-subscription-lifecycle.ts` | Legacy single-service: create Subscription → Asana task → fulfillment tasks → update Deal → welcome email |
| `customer.subscription.updated` | `handle-subscription-lifecycle.ts` | Map Stripe status → DB status (active→ACTIVE, past_due→PAST_DUE, canceled→CANCELLED, etc.) |
| `customer.subscription.deleted` | `handle-subscription-lifecycle.ts` | Set CANCELLED → update Deal stage to CHURNED → send cancellation email |
| `invoice.paid` | `handle-invoice.ts` | Renewal email (if subscription_cycle). **Commission creation** (if subscription_create + user has referral). |
| `invoice.payment_failed` | `handle-invoice.ts` | Set subscription PAST_DUE → send payment failure email with retry date |

### 3.2 Stripe Functions (`src/lib/stripe/index.ts`)

| Function | Purpose |
|----------|---------|
| `getOrCreateStripeCustomer()` | Upsert Stripe customer, store `stripeCustomerId` on User |
| `createCheckoutSession()` | Subscription-mode checkout with priceId, metadata, promo codes allowed |
| `createOneTimeCheckout()` | Payment-mode checkout with inline price_data |
| `cancelSubscription()` | `cancel_at_period_end: true` |
| `resumeSubscription()` | `cancel_at_period_end: false` |
| `getCustomerPortalUrl()` | Stripe Billing Portal session |

### 3.3 Subscription Lifecycle

| Stage | Trigger | DB Updates |
|-------|---------|-----------|
| Created | Stripe checkout completed | Subscription record (ACTIVE or PENDING_SETUP), FulfillmentTask records, Deal → ACTIVE_CLIENT |
| Updated | Stripe status change | Subscription.status mapped from Stripe status |
| Past Due | invoice.payment_failed | Subscription → PAST_DUE, email sent |
| Cancelled | subscription.deleted | Subscription → CANCELLED, Deal → CHURNED, email sent |
| Resumed | Admin action | `cancel_at_period_end: false` |

### 3.4 RevenueCat Integration

**None.** Zero references to RevenueCat in the entire codebase. All subscription management is native Stripe.

### 3.5 Stripe Connect (Payouts)

**Placeholder only.** Current state:
- `Referral.stripeConnectId` field exists in schema (nullable)
- UI in `/reseller/commissions` mentions Stripe Connect but says "our team will send you a Stripe Connect onboarding link"
- No Connect account creation code
- No Connect onboarding link generation
- No transfer/payout execution code
- No Connect webhook handling
- Payout process is fully manual: admin changes commission status to PAID via API

### 3.6 Payment Link Generation

- `createCheckoutSession()` generates Stripe Checkout URLs dynamically
- No static Stripe Payment Links used
- No payment link storage in DB

---

## STEP 4: Gap Analysis

| # | Capability | Target State | Current State | Gap | Effort | Recommendation |
|---|-----------|-------------|---------------|-----|--------|----------------|
| 1 | Partner referral link generation | Dub.co server-side referral links with automatic tracking | Custom `?ref={code}` query params + `aims_ref` cookie (30-day, non-httpOnly). Links generated in portal/reseller UI. | Dub.co replaces link generation entirely. Current links are cookie-based and vulnerable to ITP/browser blocking. | **LOW** — Swap link generation to Dub.co API | **REPLACE** with Dub.co. Keep code field in Prisma for backwards compat but generate links via Dub. |
| 2 | Click tracking (server-side) | Dub.co server-side click tracking (no cookies) | Server-side increment on `/for/[slug]` page visit + rate-limited `POST /api/referrals/track` endpoint. | Dub.co handles click tracking natively. Current system works but is bypassable (direct link visits without going through `/for/`). | **LOW** — Remove custom tracking, use Dub.co events API | **REPLACE** with Dub.co. Remove `/api/referrals/track` for click events. |
| 3 | Lead attribution (partner → lead) | Dub.co `dub_id` parameter passed server-side, attributed automatically | Cookie-based (`aims_ref`) + Clerk `unsafeMetadata.referralCode`. Dual path: sign-up captures ref, portal login claims ref. `Referral.referredId` is **1:1** (one referral = one referred user). | **CRITICAL**: Current schema only supports 1 referred user per referral code. Dub.co supports 1:many natively. Schema needs refactoring. Also, `GetStartedClient` does NOT capture referral codes. | **MEDIUM** — Schema migration + form updates | **REPLACE** attribution with Dub.co. Refactor Referral model to support many referred users or offload entirely to Dub.co. |
| 4 | Purchase/conversion attribution | Stripe `invoice.paid` → find referral by `referredId` → create commission | Works but depends on referral claim chain completing. If claim fails silently, commission is never created. No retry mechanism. | Dub.co conversion tracking via `dub.track.sale()` is more reliable. Need webhook to report sales to Dub.co. | **MEDIUM** — Add Dub.co sale event to Stripe webhook | **INTEGRATE** Dub.co alongside Stripe webhook. Keep Commission model for internal records. |
| 5 | Commission calculation | Dub.co automated commission calculation with flexible reward rules | Hardcoded tier rates in `handle-invoice.ts` (10%, 15%, 25%, default 20%). Only on first invoice. No recurring commissions. | Dub.co handles commission rules. Current code only triggers on `subscription_create` billing reason — no support for recurring commissions, bounties, or pay-per-lead. | **LOW** — Configure in Dub.co dashboard | **REPLACE** commission calc with Dub.co rules. Keep Commission model for audit trail / internal reporting. |
| 6 | Automated payouts | Dub.co 1-click global payouts | **Not implemented.** Commission status is manually toggled via admin API. No Stripe Connect account creation, no transfer execution, no automated payout schedule. | Complete gap. Dub.co handles this entirely. | **ZERO** — Dub.co provides this out of box | **BUY** via Dub.co. Remove manual payout UI/messaging. |
| 7 | Tax compliance (W-9/1099) | Dub.co W-9 collection + 1099 generation | **Not implemented.** No tax forms, no EIN collection, no 1099 reporting. | Complete gap. Legal risk if operating without this at scale. | **ZERO** — Dub.co provides this | **BUY** via Dub.co. |
| 8 | Partner dashboard (embedded) | Dub.co embeddable referral dashboard inside portal (no separate login) | Custom-built reseller portal (`/reseller/*`) with dashboard, clients, commissions, resources pages. Separate from client portal. | Dub.co provides embeddable React component. Can replace or augment existing reseller dashboard. Current portal is functional but basic. | **LOW** — Embed Dub.co widget in existing portal layout | **HYBRID**: Embed Dub.co dashboard widget in `/portal/referrals` and `/reseller/dashboard`. Keep custom pages for resources and client details. |
| 9 | Marketplace product catalog | Browsable, filterable marketplace with all products + coaching + GHL snapshots + tools | Portal marketplace is database-driven and functional. Public marketplace hardcodes only 3 services. 20 services seeded, 12 with Stripe prices. | Public marketplace needs to be dynamic. Need to add new product types (GHL snapshots, coaching products, community access). Current schema supports services only, not generic products. | **MEDIUM** — Extend ServiceArm or add Product model | **BUILD**: Extend marketplace to include new product types. Make public marketplace dynamic. |
| 10 | Checkout flow (product → payment → fulfillment) | Multi-product cart → Stripe checkout → automated fulfillment | Cart wire protocol exists but no cart UI. Portal checkout works for single services. Get-started flow routes to calendar, not payment. Asana fulfillment tasks auto-created. | Need cart UI component. Need unified checkout flow that handles subscriptions + one-time purchases + GHL snapshot provisioning. | **HIGH** — Cart UI + checkout orchestration | **BUILD**: Add cart state management, cart drawer, multi-product checkout page. |
| 11 | GHL snapshot purchase-to-deploy | Automated: purchase → GHL API → provision subaccount → assign snapshot → client access | **Not implemented.** GHL is mentioned as integration but zero API code exists. Fulfillment is 100% manual via Asana tasks. | Complete gap. Needs GHL API integration, snapshot template management, subaccount provisioning workflow. | **HIGH** — GHL API integration | **BUILD** (Phase 2). Start with manual Asana-triggered fulfillment, automate later. |
| 12 | Subscription management | RevenueCat or Stripe native | Pure Stripe native. Full lifecycle (create, update, cancel, resume, past_due). Billing portal via Stripe Customer Portal. No RevenueCat. | RevenueCat adds value for mobile/cross-platform. For web-only SaaS, Stripe native is sufficient. | **LOW** if staying web-only | **KEEP** Stripe native unless adding mobile apps. RevenueCat unnecessary for current architecture. |
| 13 | Revenue reporting by partner | Per-partner revenue, commission, and conversion reporting | Basic stats in reseller dashboard (clicks, signups, conversions, totalEarned). No time-series charts, no per-product breakdown, no cohort analysis. | Dub.co analytics dashboard covers partner-level reporting. Internal admin needs enhanced views. | **LOW** — Dub.co provides partner-level analytics | **HYBRID**: Dub.co for partner-facing analytics, build admin revenue-by-partner view internally. |
| 14 | Fraud detection on referrals | Automated fraud detection (self-referrals, click farms, duplicate accounts) | Basic self-referral prevention in `/api/referrals/claim`. Rate limiting on `/api/referrals/track`. No IP-based dedup, no velocity checks, no duplicate account detection. | Dub.co has built-in fraud prevention (server-side tracking, fingerprinting). Current system is vulnerable to cookie manipulation. | **ZERO** — Dub.co provides this | **BUY** via Dub.co. Remove custom fraud checks. |
| 15 | Cookie-based → server-side tracking | Server-side tracking (no cookie dependency) | **Cookie-based**: `aims_ref` cookie (non-httpOnly, 30-day). Vulnerable to ITP (Safari 7-day limit), ad blockers, cross-device loss. Server-side click increment exists but attribution still depends on cookie for signup linking. | Dub.co uses server-side `dub_id` parameter — no cookies required. Complete upgrade path. | **LOW** — Dub.co replaces cookie tracking | **REPLACE** entirely with Dub.co server-side tracking. Remove `aims_ref` cookie logic. |

---

## STEP 5: Dub.co Integration Assessment

### 5.1 Files to be REPLACED by Dub.co

| File | Current Purpose | Replacement |
|------|----------------|-------------|
| `src/app/api/referrals/track/route.ts` | Click/signup/conversion increment | Dub.co handles all event tracking |
| `src/app/api/referrals/validate/route.ts` | Validate referral code | Dub.co link validation via API |
| `src/app/(marketing)/for/[partnerSlug]/page.tsx` | Partner landing page with cookie setting + click tracking | Dub.co redirect links handle tracking; page can stay but remove cookie + click increment logic |
| Commission calculation logic in `src/lib/stripe/handlers/handle-invoice.ts` (lines 39-95) | First-invoice commission creation | Dub.co automated commission calculation |
| Payout info UI in `src/app/(reseller)/reseller/commissions/page.tsx` (lines 98-126) | Manual payout instructions | Dub.co automated payouts |

### 5.2 Files that STAY and Integrate WITH Dub.co

| File | Current Purpose | Integration Change |
|------|----------------|-------------------|
| `src/app/api/webhooks/stripe/route.ts` | Stripe event routing | **Add**: Call `dub.track.sale()` on `checkout.session.completed` and `invoice.paid` to report conversions to Dub.co |
| `src/lib/stripe/handlers/handle-checkout-completed.ts` | Cart checkout processing | **Add**: After subscription creation, report sale event to Dub.co API with referral attribution |
| `src/lib/stripe/handlers/handle-subscription-lifecycle.ts` | Subscription lifecycle | **Add**: Report subscription creation to Dub.co on legacy flow |
| `src/app/api/referrals/claim/route.ts` | Link user to referral | **Keep** for backwards compat during migration. Eventually deprecate when Dub.co handles attribution. |
| `prisma/schema.prisma` — Referral model | Store referral data | **Keep** but add `dubPartnerId` field. Offload tracking metrics to Dub.co but keep local records for internal reporting. |
| `prisma/schema.prisma` — Commission model | Store commission records | **Keep** for audit trail. Sync commission events from Dub.co webhook. |
| `src/app/(portal)/portal/referrals/page.tsx` | User referral dashboard | **Modify**: Embed Dub.co referral widget alongside or replacing custom stats |
| `src/app/(reseller)/reseller/dashboard/page.tsx` | Reseller stats | **Modify**: Replace stats cards with Dub.co embedded dashboard |
| `src/app/(reseller)/reseller/clients/page.tsx` | Referred clients list | **Keep**: Dub.co doesn't provide client-level subscription detail |
| `src/app/(reseller)/reseller/resources/page.tsx` | Partner resources | **Modify**: Update referral link generation to use Dub.co links instead of `?ref=` params |
| `src/components/portal/ReferralClaimHandler.tsx` | Cookie-based claim | **Remove** — Dub.co server-side tracking eliminates need for cookie claiming |
| `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` | Capture ref on signup | **Modify**: Read `dub_id` from URL instead of `ref` param. Pass to Clerk metadata. |
| `src/app/api/webhooks/clerk/route.ts` | Link referral on user creation | **Modify**: Use Dub.co customer API instead of internal referral linking |
| `src/app/(admin)/admin/` — AdminSidebar.tsx | Admin navigation | **Add**: Link to `/admin/partners` page for partner management |

### 5.3 NEW Files/Routes Needed for Dub.co Integration

| File to Create | Purpose |
|----------------|---------|
| `src/lib/dub.ts` | Dub.co SDK client initialization (`new Dub({ token: process.env.DUB_API_KEY })`) |
| `src/app/api/webhooks/dub/route.ts` | Webhook handler for Dub.co events (sale completed, payout processed, partner joined) — syncs data back to local DB |
| `src/app/api/partners/register/route.ts` | Register new partner in Dub.co program via API (called when user requests partner access) |
| `src/app/api/partners/links/route.ts` | Generate Dub.co referral links for partners |
| `src/app/(portal)/portal/referrals/DubPartnerWidget.tsx` | Client component embedding Dub.co referral dashboard (iframe or React SDK) |
| `src/app/(reseller)/reseller/dashboard/DubDashboardEmbed.tsx` | Embedded Dub.co analytics dashboard for resellers |
| `src/app/(admin)/admin/partners/page.tsx` | Admin partner management page — view all partners, tiers, earnings, approve/reject |
| `src/app/(admin)/admin/partners/PartnersClient.tsx` | Client component for admin partner management |

### 5.4 Where Does the Dub.co Embedded Dashboard Go?

Two locations:

1. **`/portal/referrals`** — For standard users (AFFILIATE tier). Embed Dub.co referral widget showing their link, clicks, conversions, and earnings. Replaces the current custom stats cards.

2. **`/reseller/dashboard`** — For partner users (RESELLER/COMMUNITY_PARTNER tier). Embed full Dub.co partner analytics dashboard. Replaces the current custom dashboard with richer analytics.

Both locations already exist with appropriate layout and auth guards.

### 5.5 Stripe Webhook Changes for Dub.co Conversion Reporting

**File**: `src/lib/stripe/handlers/handle-checkout-completed.ts`

**Add after subscription creation** (after line ~104):
```typescript
// Report sale to Dub.co for attribution
try {
  const dubClient = getDubClient()
  await dubClient.track.sale({
    customerId: userId,
    amount: monthlyAmount * 100, // cents
    currency: 'usd',
    metadata: {
      serviceArm: serviceArm.slug,
      tier: tierSlug,
      subscriptionId: subscription.id,
    },
  })
} catch (err) {
  console.error('[dub] Failed to report sale:', err)
  // Non-blocking — don't fail subscription creation
}
```

**File**: `src/lib/stripe/handlers/handle-invoice.ts`

**Modify commission creation** (lines 42-95):
- Keep existing commission creation for internal audit trail
- Add Dub.co sale tracking call alongside (or replace entirely if offloading commission calc to Dub.co)

### 5.6 Schema Changes Needed

**Add to Referral model:**
```prisma
model Referral {
  // ... existing fields ...
  dubPartnerId    String?   // Dub.co partner ID
  dubProgramId    String?   // Dub.co program ID
}
```

**Optionally add new model for multi-user referral tracking** (if not fully offloading to Dub.co):
```prisma
model ReferralAttribution {
  id          String   @id @default(cuid())
  referralId  String
  referral    Referral @relation(...)
  userId      String
  user        User     @relation(...)
  dubClickId  String?  // Dub.co click ID for correlation
  createdAt   DateTime @default(now())
  @@unique([referralId, userId])
}
```

If fully offloading attribution to Dub.co, this model is unnecessary — Dub.co handles the 1:many relationship.

---

## STEP 6: Risk Flags

### 6.1 Dead Code in Referral System

| Code | Status | Issue |
|------|--------|-------|
| `Referral.customBranding` (Json?) | **Dead** | Schema field exists, never read or written anywhere in code |
| `POST /api/referrals/track` `conversion` event | **Dead** | Endpoint supports `conversion` event type but it's never called — conversions are tracked via Stripe webhook, not this endpoint |
| `src/app/(reseller)/reseller/resources/page.tsx` — PDF download links | **Dead** | Links point to `/resources/aims-partner-deck.txt`, `/resources/aims-case-studies.txt`, etc. — these files likely don't exist. Cold Email Templates links to same file as Partner Deck. |
| Admin commission API (`/api/admin/commissions`) | **Orphaned** | Fully functional API with no admin UI page. No link in AdminSidebar. |

### 6.2 Hardcoded Values That Would Break with Dub.co

| Location | Hardcoded Value | Risk |
|----------|----------------|------|
| `reseller/dashboard/page.tsx` line 36 | `https://aimseos.com` fallback URL for referral links | Dub.co generates its own short links — this pattern becomes invalid |
| `reseller/resources/page.tsx` lines 29-32, 49-62 | 4 referral link templates with `?ref={code}` suffix | Must be replaced with Dub.co-generated links |
| `portal/referrals/page.tsx` line ~73 | Referral link format `{APP_URL}?ref={code}` | Must use Dub.co links instead |
| `handle-invoice.ts` lines 68-75 | Commission rates: AFFILIATE=10%, COMMUNITY_PARTNER=15%, RESELLER=25% | If Dub.co manages commission rules, these become stale/conflicting |
| `reseller/commissions/page.tsx` lines 57-73 | Commission tier display (25%, 15%, 10%) | Must reflect Dub.co-configured rates, not hardcoded values |

### 6.3 Auth/Permissions Gaps

| Gap | Location | Risk |
|-----|----------|------|
| **No role check on reseller layout** | `src/app/(reseller)/layout.tsx` | Only checks `userId` exists, not `role === RESELLER`. Any authenticated user can access `/reseller/*` pages. Pages will show empty data but shouldn't be accessible. |
| **Public referral tracking endpoint** | `src/app/api/referrals/track/route.ts` | Rate-limited but no auth. Malicious actor could inflate click/signup/conversion counts by calling with valid codes. |
| **Portal referral auto-creation** | `src/app/(portal)/portal/referrals/page.tsx` line 28 | Any logged-in user gets a referral code auto-created on first visit. No approval step. Could lead to unintended referral participants. |
| **No admin UI for commissions** | AdminSidebar has no link | Commissions can only be managed via direct API calls. Risk of commissions accumulating without review. |

### 6.4 Data Migration Concerns

| Data | Volume | Migration Path |
|------|--------|---------------|
| Referral records | Likely <50 (early stage) | Export referral codes + partner info → create partners in Dub.co via API. Map `referrerId` → `dubPartnerId`. |
| Commission records | Likely <20 | Keep in local DB for historical records. No migration needed — Dub.co starts fresh for future commissions. |
| Referral codes | Active codes need to work during transition | Create matching Dub.co links for each existing code. Set up redirects from old `?ref=` format to Dub.co links. |
| Cookie-based claims | `aims_ref` cookies in user browsers | Dual support during transition: check `aims_ref` cookie AND `dub_id` parameter. Phase out cookie path after 30 days (cookie expiry). |

### 6.5 Cookie vs Server-Side Tracking Conflicts

| Conflict | Detail |
|----------|--------|
| **Dual attribution** | During transition, a user could have both an `aims_ref` cookie AND a Dub.co `dub_id`. Need clear priority: Dub.co `dub_id` wins if both present. |
| **Safari ITP** | Current `aims_ref` cookie is non-httpOnly with 30-day maxAge. Safari ITP limits 3rd-party cookies to 7 days. Partners promoting on Safari see broken attribution. Dub.co's server-side tracking fixes this. |
| **ReferralClaimHandler timing** | Component fires on portal mount, reading cookie. If Dub.co attribution arrives via `dub_id` URL param at the same time, both could attempt to claim the user. Need to prioritize Dub.co path. |
| **Clerk unsafeMetadata** | Sign-up currently passes `referralCode` via Clerk metadata. With Dub.co, attribution happens server-side — Clerk metadata becomes redundant but needs graceful deprecation. |

---

## Recommended Execution Order

### Phase 0: Prep (Day 1)
1. **Install Dub.co SDK**: `npm install dub` — add to package.json
2. **Add env vars**: `DUB_API_KEY`, `DUB_WORKSPACE_ID`, `DUB_PROGRAM_ID`, `DUB_WEBHOOK_SECRET`
3. **Create `src/lib/dub.ts`**: Initialize Dub client with lazy singleton pattern (matching existing Stripe/Resend pattern)
4. **Fix auth gap**: Add role check to `src/app/(reseller)/layout.tsx` — require `RESELLER`, `ADMIN`, or `SUPER_ADMIN`

### Phase 1: Dub.co Partner Registration (Day 2-3)
5. **Create partner registration API** (`src/app/api/partners/register/route.ts`): Accept user → create Dub.co partner → store `dubPartnerId` on Referral
6. **Add `dubPartnerId` to Prisma schema**: Migration adding nullable field to Referral model
7. **Create Dub.co webhook handler** (`src/app/api/webhooks/dub/route.ts`): Handle partner events, sale events, payout events
8. **Migrate existing referral records**: Script to create Dub.co partners for each existing Referral with a referrer

### Phase 2: Link Generation Swap (Day 3-4)
9. **Update `/portal/referrals`**: Replace `{APP_URL}?ref={code}` with Dub.co link generation API call
10. **Update `/reseller/resources`**: Replace 4 hardcoded link templates with Dub.co-generated links
11. **Update `/reseller/dashboard`**: Replace stats cards with Dub.co embedded analytics
12. **Update `/for/[partnerSlug]`**: Remove cookie setting + click increment. Keep partner branding page but let Dub.co handle tracking.

### Phase 3: Attribution Cutover (Day 4-5)
13. **Update sign-up page**: Read `dub_id` from URL (Dub.co passes this) instead of `ref` param
14. **Update Clerk webhook**: On `user.created`, call Dub.co customer API instead of internal referral linking
15. **Remove `ReferralClaimHandler`**: Server-side tracking eliminates need for client-side cookie claiming
16. **Add Dub.co sale tracking to Stripe webhooks**: In `handle-checkout-completed.ts` and `handle-invoice.ts`, call `dub.track.sale()` after successful subscription creation

### Phase 4: Commission & Payout Offload (Day 5-6)
17. **Configure Dub.co commission rules**: Set up reward tiers (10%, 15%, 25%) matching existing structure
18. **Modify `handle-invoice.ts`**: Keep creating local Commission record for audit trail but mark it as `source: "dub"` instead of calculating internally
19. **Sync Dub.co payout events**: Webhook handler updates Commission status to PAID when Dub.co processes payout
20. **Remove manual payout messaging**: Update `/reseller/commissions` to show Dub.co payout status instead of "contact team" messaging

### Phase 5: Admin UI + Cleanup (Day 6-7)
21. **Create `/admin/partners` page**: Admin view of all partners, Dub.co analytics embed, partner approval workflow
22. **Add "Partners" to AdminSidebar**: Navigation link in CRM section
23. **Deprecate dead code**: Remove `Referral.customBranding` from schema, remove orphaned `/api/referrals/track` conversion event handling
24. **Clean up cookie logic**: Remove `aims_ref` cookie references from partner landing page, sign-up, and claim handler
25. **Update seed data**: Add Dub.co partner IDs to demo referral records

### Phase 6: Marketplace Expansion (Week 2+)
26. **Make public marketplace dynamic**: Replace hardcoded 3-service list with DB-driven grid
27. **Add new product types**: GHL snapshots, coaching products, community access to ServiceArm or new Product model
28. **Build cart UI**: Cart drawer + multi-product checkout page using existing cart wire protocol
29. **GHL API integration**: Snapshot deployment automation (manual Asana → API-driven)

---

## Summary

The AIMS platform has a **surprisingly complete referral/commission system** — the full lifecycle from click tracking through commission calculation to manual payout is implemented. The main gaps are:

1. **Attribution model is 1:1** (one code = one user) — fundamentally limited
2. **Cookie-based tracking** is vulnerable to browser restrictions
3. **No automated payouts** — Stripe Connect is placeholder only
4. **No tax compliance** — legal risk at scale
5. **No admin UI** for commission management despite full API
6. **No cart UI** despite cart checkout protocol being wired

Dub.co at $90/mo **replaces** ~500 lines of custom attribution/commission/payout code with a production-grade solution and **adds** capabilities that would take weeks to build (server-side tracking, automated payouts, W-9/1099, fraud detection).

The marketplace storefront needs the most **BUILD** work: dynamic public catalog, cart UI, new product types, and eventually GHL automation.
