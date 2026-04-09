# PRODUCTIZED SERVICES CATALOG — AIMS Platform

> **Date**: 2026-04-08
> **Purpose**: Classify every marketplace offering by how productized it is and whether it can be sold to ANY business without requiring access to their existing tool stack.
> **Source**: `prisma/seed.ts`, `src/app/(marketing)/services/[slug]/page.tsx`, `src/app/(marketing)/marketplace/MarketplaceClient.tsx`

---

## Classification System

| Bucket | Meaning |
|--------|---------|
| **A** | Fully productized + tool-agnostic — same SKU for every client, we own fulfillment end-to-end, zero dependency on client's existing tools or logins |
| **B** | Productized but requires vendor/tool provisioning — repeatable SKU, but has a setup tax (3rd-party account creation, domain warm-up, credential handoff) |
| **C** | Tool-dependent / integration-heavy — only works if the client already has a specific tool we must plug into (CRM, ad accounts, etc.) |
| **D** | Custom / quote-only — no fixed deliverable, scope is bespoke per client |

---

## Full Inventory

| Slug | Name | Pillar | Price | Bucket | Why | What we ship |
|------|------|--------|-------|--------|-----|--------------|
| `website-crm-chatbot` | Website + CRM + Chatbot | MARKETING | $97–$997/mo | **A** | GHL snapshot deployed on our infra with chatbot, CRM pipeline, DNS. Turnkey — client just consumes output. | Pre-built GHL site, CRM pipeline, AI chatbot trained on biz info, booking calendar, analytics |
| `seo-aeo` | SEO & AEO Automation | MARKETING | $497/mo | **A** | Audit + ongoing fixes + content pipeline + AEO monitoring all run on our systems. No client credentials needed. | Technical SEO fixes, content clusters, AEO (ChatGPT/Perplexity targeting), monthly rank reports |
| `ai-tool-tracker` | AI Tool Tracker | OPERATIONS | $197/mo | **A** | SaaS-like research platform we own. We research tools, build scorecards, deliver via dashboard. | Tool research platform, company scorecards, vendor matrix, weekly digest, renewal alerts |
| `vending-placement-visualizer` | Vending Placement Visualizer | MARKETING | Custom | **A** | Standalone AR tool we build and host. Client uploads specs, we render mockups. | AR mockup templates, location library, brand integration, mobile preview |
| `ai-content-engine` | AI Content Engine | MARKETING | $497/mo | **A** | AI content factory on our systems. We generate blogs, social, email, ads with brand alignment. | SEO blog drafts, multi-platform social content, email copy, ad creatives, content calendar |
| `cold-outbound` | Cold Outbound Engine | SALES | Custom | **B** | Requires we provision 3+ sender domains, configure Clay enrichment, run warm-up (7-14 days setup). | Multi-domain sender stack, Clay enrichment tables, AI SDR replies, campaign mgmt |
| `voice-agents` | AI Voice Agent Platform | SALES | Custom | **B** | Requires Twilio/GHL provisioning, phone number acquisition, routing config. | Inbound/outbound agents, multi-location routing, transcription, CRM sync |
| `content-production` | Content Production Pod | MARKETING | Custom | **B** | Productized monthly delivery but requires brand voice intake + approval loop. | AI blog posts, social calendar, email copy, ad creatives, editorial workflow |
| `audience-targeting` | Audience Targeting & Segments | SALES | $397/mo | **C** | Needs client's Meta/LinkedIn ad accounts to execute campaigns. | 20K+ segments, semantic search, count builder, campaign integration |
| `pixel-intelligence` | Pixel & Visitor Intelligence | SALES | $197/mo | **C** | Needs client website + CRM for pixel deployment and lead sync. | Visitor ID pixel, enrichment pipeline, intent triggers, CRM sync |
| `finance-automation` | P&L Finance Automation | FINANCE | $1,000/mo | **C** | Needs QuickBooks access — we analyze their books, not ours. | QuickBooks sync, automated P&L, AI insights, rebate tracking |
| `lead-reactivation` | Lead Reactivation | SALES | $997/mo | **C** | Needs CRM export of dead leads. Sequences run through their stack. | CRM audit, reactivation sequences (email/SMS/LI), scoring, meeting booking |
| `database-reactivation` | Database Reactivation | OPERATIONS | Custom | **C** | Full CRM audit + dedupe + enrichment — scope depends on their data. | CRM audit, dedupe, enrichment, scoring model, attribution dashboards |
| `revops-pipeline` | RevOps Pipeline | OPERATIONS | Custom | **C** | Pipeline rebuild in client's CRM (HubSpot/Salesforce). | CRM implementation, routing rules, attribution, revenue dashboards, training |
| `inbound-orchestration` | Inbound Lead Orchestration | MARKETING | $697/mo | **C** | Needs client website forms, CRM, booking calendar. | Form-to-CRM automation, scoring, routing, nurture sequences, SLA tracking |
| `linkedin-outbound` | LinkedIn Outbound System | SALES | $597/mo | **C** | Needs LinkedIn account access. Depends on their profile + network. | Profile optimization, connection automation, DM sequences, CRM sync |
| `social-media-management` | Social Media Management | MARKETING | $397/mo | **C** | Needs logins to Facebook/IG/TikTok/LinkedIn. | Content creation, scheduling, engagement, multi-platform distribution |
| `ad-creatives` | Ad Creative Engine | MARKETING | $297/mo | **C** | Requires client ad account access (Meta/Google/LinkedIn). | AI ad variants, A/B framework, platform optimization, performance tracking |

---

## "Sell to anyone tomorrow" — Bucket A

These are the five SKUs Adam can put on a homepage and take money for without a discovery call:

1. **Website + CRM + Chatbot** — $97–$997/mo
2. **SEO & AEO Automation** — $497/mo
3. **AI Tool Tracker** — $197/mo
4. **Vending Placement Visualizer** — custom
5. **AI Content Engine** — $497/mo

**Revenue shelf at list price:** $1,288/mo floor per client if they take all five (excluding Vending Visualizer, which is niche).

---

## "Has a setup tax" — Bucket B

Repeatable SKUs, but each has a known vendor dependency that must be named up front in the offer:

- **Cold Outbound Engine** — setup tax: 3+ sender domains, Clay account, 7-14 day warm-up
- **Voice Agents** — setup tax: Twilio or GHL phone provisioning, routing config
- **Content Production Pod** — setup tax: brand voice intake + approval workflow

---

## "Needs a sales conversation" — Bucket C+D

All of these require client tool access and should be sold via discovery, not self-checkout:

- Audience Targeting (Meta/LinkedIn ads)
- Pixel Intelligence (their website + CRM)
- Finance Automation (QuickBooks)
- Lead Reactivation (their CRM)
- Database Reactivation (their CRM)
- RevOps Pipeline (HubSpot/Salesforce)
- Inbound Orchestration (their forms + CRM + calendar)
- LinkedIn Outbound (their LinkedIn)
- Social Media Management (their social accounts)
- Ad Creative Engine (their ad accounts)

---

## Gaps — Productized SKUs That Should Exist But Don't

Opportunities to expand the "sell to anyone tomorrow" shelf:

1. **Standalone short-form video production** — Script-to-edit TikTok/Reels/Shorts delivered monthly. We own production; client just uses them.
2. **Email nurture sequences as a service** — 30-day automated sequences delivered via our email infra (no dependency on their CRM).
3. **Landing page–only SKU** — Lightweight "5-page conversion site hosted on our domain" without the CRM/chatbot bundle.
4. **Reputation / Review Management** — Automated GBP optimization + review monitoring. Named in some copy but not in the seeded catalog.
5. **Competitor Intelligence Monitoring** — Daily automated competitor tracking (pricing changes, content, ads). Mentioned in static services but not seeded.
6. **Webinar Hosting + Automation** — Recurring webinar funnels, registration pages, automated replay sequences.
7. **AI Chatbot — Standalone** — The chatbot from website-crm-chatbot sold separately as an embeddable widget for clients who already have a site.

Each of these would slot into Bucket A (fully productized) and would roughly double the size of the self-serve catalog.

---

## Recommendation

For the **public marketplace storefront** (currently hardcodes only 3 services), load **only Bucket A + Bucket B** from the DB. Bucket C/D stays discovery-only via `/get-started`. This gives the self-serve path a clean 5–8 SKU shelf and keeps the custom work off the price-exposed UI.
