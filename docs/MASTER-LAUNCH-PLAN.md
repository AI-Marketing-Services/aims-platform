# Master Launch Plan — AOC / AIMS Platform

**Goal:** ship a launch-ready platform on Monday with (a) every existing tool entitlement-gated and revenue-tracked end-to-end, (b) a comprehensive a-la-carte upsell catalog so members can buy individual tools beyond their plan, and (c) a CFO/CEO master analytics layer that tracks every dollar in, every dollar out, every user, every campaign, every API call.

> **Audit verdict (pre-build):** all 21 entitlement-gated features are functionally built (Deal Assistant has a "launcher" page that punts into per-deal AI — not a shell, just thin). What's missing is **revenue/analytics depth** and **a-la-carte upsell catalog**.

---

## Part 1 — A-la-carte Upsell Catalog (NEW)

These ride **on top of** the existing `Free / Pro / Operator` tiers. Members can buy any combination as monthly add-ons. Each grants one or more new entitlement keys, each gets a real Product/Stripe price, each gets a marketplace card and a real surface (or a "configure & request" intake for human-fulfilled ones at launch).

| # | Slug | Display Name | Type | Price | Entitlement key | Status at launch |
|---|---|---|---|---|---|---|
| 1 | `addon-voice-agent` | AI Voice Receptionist | recurring | $199/mo | `addon_voice_agent` | Configure UI + intake (DFY fulfillment) |
| 2 | `addon-chatbot-premium` | Branded Site Chatbot | recurring | $79/mo | `addon_chatbot_premium` | Configure UI + embed snippet |
| 3 | `addon-inbox-warmup` | Cold Email Inbox Warmup | recurring | $59/mo | `addon_inbox_warmup` | Status dashboard + dual-vendor proxy |
| 4 | `addon-sms-pack` | Outbound SMS Pack | recurring | $59/mo | `addon_sms_pack` | Configure UI + Twilio handoff (DFY at launch) |
| 5 | `addon-whitelabel-mobile` | Whitelabel Mobile App | recurring | $199/mo | `addon_mobile_app` | Configure UI + intake (DFY) |
| 6 | `addon-call-coach` | AI Sales Call Coach | recurring | $79/mo | `addon_call_coach` | Real — extends Discovery Recorder |
| 7 | `addon-team-seat` | Team Seat | recurring | $25/mo per seat | `addon_team_seats` | Real — invite + role surface |
| 8 | `addon-api-webhooks` | Public API + Webhooks | recurring | $29/mo | `addon_api_webhooks` | Real — token + webhook routes |
| 9 | `addon-sending-domain` | Dedicated Sending Domain | recurring | $19/mo | `addon_sending_domain` | Real — Resend domain provisioning |
| 10 | `addon-knowledge-pro` | Knowledge Base Pro | recurring | $49/mo | `addon_knowledge_pro` | Real — Deal Assistant RAG |
| 11 | `addon-ugc-avatar` | AI UGC / Avatar Studio | recurring | $99/mo | `addon_ugc_avatar` | Configure UI + intake (HeyGen fulfilled) |
| 12 | `addon-mighty-sync` | Mighty Networks Sync | recurring | $29/mo | `addon_mighty_sync` | Real — already partially exists |
| 13 | `addon-slack-alerts` | Slack / Teams Alerts | recurring | $19/mo | `addon_slack_alerts` | Real — webhook config |
| 14 | `addon-reporting-pro` | Scheduled Reports + BI Export | recurring | $19/mo | `addon_reporting_pro` | Real — cron + CSV email |
| 15 | `addon-dfy-setup` | Concierge Setup | one-time | $499 | `addon_dfy_setup` | Intake — services team fulfills |

**Naming convention:** every add-on entitlement key starts with `addon_` so the marketplace UI can filter at-a-glance and the admin can grant/revoke without touching plan keys.

**Storefront:** rendered on `/portal/marketplace` under a new "Add-ons" tab below the plan picker. Each card shows price, what it unlocks, and a single CTA → checkout.

---

## Part 2 — Master CFO / CEO Analytics Layer

The platform already tracks plenty (Subscription, Purchase, ApiCostLog, UsageEvent, PageView, UtmLink, OperatorEvent, CommissionEvent, EmailQueueItem). What it doesn't yet track is **the chain that connects them into a P&L view**.

### 2.1 New schema

| Model | Why |
|---|---|
| `PurchaseInvoice` | Per-period revenue history. Each `invoice.paid` writes one row. Powers historical MRR, churn-month revenue, LTV. |
| `CampaignSpend` | Manual or connector-fed ad/marketing spend keyed by `utmSource/utmCampaign`. Powers CAC + ROAS. |
| `EmailEvent` | Resend webhook → `delivered/opened/clicked/bounced/complained/unsubscribed`. Powers send → conversion chain. |
| `Refund` | First-class refund record. Powers refund-rate by product + churn-reason aggregation. |
| `PromoRedemption` | Captures `total_details.amount_discount` from Stripe. Powers promo-effectiveness reporting. |

### 2.2 New User columns

- `firstUtmSource`, `firstUtmMedium`, `firstUtmCampaign`, `firstUtmContent`, `firstUtmTerm`, `firstReferrer`, `firstLandingPath` (stamped on user create from cookie + headers)
- `signupSource` (computed from above, e.g. `paid-search` / `email-drip` / `referral` / `organic`)

### 2.3 Standardizations

- **`ApiCostLog.clientId` MUST be the user's database id** for any AI call originating from a user-context endpoint. Audit and fix:
  - `src/app/api/ai/audit/route.ts`
  - `src/app/api/ai/chat/route.ts`
  - `src/app/api/ai/intake-chat/route.ts`
  - `src/app/api/ai/portal-chat/route.ts`
  - `src/app/api/ai/onboarding-chat/route.ts`
  - `src/app/api/ai/lead-scout.ts`
  - `src/app/api/cron/process-sequences/*`
- **Subscription.cancelReason / Purchase.churnReason** — capture from Stripe metadata + portal cancel flow.
- **`Subscription.dunningAttempts` (Int) + `lastDunningAt` (DateTime)** — increment on `invoice.payment_failed`, smart-cancel after N=3.

### 2.4 New admin pages

- **`/admin/cfo`** — single-screen P&L view. MRR / ARR by plan. Net-new vs expansion vs churned MRR. ARR by add-on category. Gross margin per service (revenue − API cost − Stripe fees − refund). LTV. CAC by channel. Burn vs revenue. Refund rate. Cohort retention by signup month.
- **`/admin/campaigns`** — per-UTM-campaign: spend → click → signup → paid → revenue → ROAS. Pulls from `PageView`, `User.firstUtm*`, `Purchase`, `CampaignSpend`.
- **`/admin/funnels`** — page-view path → signup conversion. Top 20 landing paths and their downstream paid-conversion rate. From `PageView` + `User.firstLandingPath`.
- **`/admin/email-performance`** — campaign send → delivered → opened → clicked → signup → paid. From `EmailEvent` + `EmailQueueItem` + `User`.

### 2.5 Stripe gaps to close

- Add `subscription_data.trial_period_days` support to `/api/checkout/[slug]`.
- Fix one-time charge refund silent-skip in `src/lib/stripe/handlers/handle-product-purchase.ts:401`.
- Capture `total_discount_amounts` from `invoice.paid` and `total_details.amount_discount` from `checkout.session.completed` into `PromoRedemption`.
- Write `PurchaseInvoice` row on every `invoice.paid`.
- Implement dunning state machine.
- Consolidate `setup-stripe-products.ts` into `setup-plans.ts`.

---

## Part 3 — Build Phases

| Phase | Scope | Ships |
|---|---|---|
| 1 — Foundation | Schema + Stripe gap fixes + instrumentation | Mon AM |
| 2 — Analytics | `/admin/cfo`, `/admin/campaigns`, `/admin/funnels`, `/admin/email-performance` | Mon AM |
| 3 — A-la-carte | 15 new Products, marketplace UI, scaffolded surfaces | Mon AM |
| 4 — Polish | Deal Assistant standalone, promo + trial UI, Mighty Sync upgrade | Mon AM |

Each phase ends with `npm run typecheck && npm run build && git push`.

---

## Out-of-scope for this build (deferred)

- Full Voice Agent, Chatbot, SMS Pack, Whitelabel Mobile, UGC Avatar — these are **configure UI + DFY intake** at launch. Real builds happen after we see who actually buys.
- Real-time co-editing for email templates (already mitigated with optimistic concurrency).
- Demo videos.

---

_Last updated: 2026-05-08_
