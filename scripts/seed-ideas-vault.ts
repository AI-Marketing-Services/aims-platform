/**
 * Seeds the private Ideas Vault with concept entries for Adam to review.
 *
 * Run: tsx scripts/seed-ideas-vault.ts
 *
 * Safe to re-run — it upserts by (ownerId + title) so seeds don't duplicate.
 * Only targets users with role=SUPER_ADMIN. In prod that should be Adam only.
 */

import { db } from "../src/lib/db"

type SeedIdea = {
  title: string
  body: string
  tags: string[]
  status: "INBOX" | "ACTIVE" | "SHIPPED" | "PARKED"
}

// ─── Concept ideation entries ────────────────────────────────────────────────
//
// Each entry captures a lead magnet, product, or strategic bet mapped to the
// marketplace + whitelabel + affiliate business model. Adam reviews, promotes,
// or parks from the admin vault.

const IDEAS: SeedIdea[] = [
  {
    title: "Daily Signal — shipped (public lead magnet live at /tools/daily-signal)",
    status: "SHIPPED",
    tags: ["lead-magnet", "signal", "shipped"],
    body: `**What shipped**
Public Notion-style AI news digest. Email + topics upfront → SignalSubscriber row → fires an immediate digest + daily at 6am ET.

**Engine**
- autoresearch: Tavily + Claude Haiku propose-queries loop (3 iter, 45s cap)
- llm-council: Sonnet + 2x Haiku peer-review → Opus chairman synthesizes
- Budget: ~$0.15/topic/day with Opus chairman

**Funnel**
- /tools/daily-signal → /api/lead-magnets/daily-signal → Deal + Close + SignalSubscriber + immediate digest
- Unsub: /signal/unsubscribe?token=…
- Manage: /signal/manage/[token]

**Next bets to consider**
- Add a "share this digest" watermark + UTM to every link → every open becomes a potential new subscriber (viral coefficient >1 if summaries are good).
- Public web archive at /signal/today (today's digest) for SEO long-tail on every topic headline we produce.
- Sponsor slot in email: one tasteful ad per digest sold by topic category.`,
  },
  {
    title: "Weekly Trending AI Tools digest (Signal v2)",
    status: "INBOX",
    tags: ["lead-magnet", "signal", "content"],
    body: `**Concept**
Same autoresearch + council engine as Daily Signal, but weekly and scoped to "AI tools that launched this week." 5 stories, not 1.

**Why it wins**
- Cheaper to run (1 cron/week vs daily) with similar perceived value.
- SEO + backlink goldmine: every tool launch wants to be covered → site owners link back.
- Natural upsell into AOC community (weekly roundup becomes community content).

**Build cost**
~80% code reuse from Signal. New /tools/weekly-trending-tools page, new cron (Mon 9am ET), topic-less TrendingSubscriber model.

**Marketplace tie-in**
Every tool in the digest is a potential reseller candidate — publish their product in our marketplace with an affiliate link tracked by Dub.co. Dual revenue: free content + referral commission.`,
  },
  {
    title: "AI Prompt Library (40-prompt PDF lead magnet)",
    status: "INBOX",
    tags: ["lead-magnet", "content", "low-effort"],
    body: `**Concept**
Static library of 40 proven prompts across Sales / Marketing / Ops / Recruiting / Finance / Support / Product / Engineering. Public preview of 5, the full set gated by email.

**Why it wins**
- Zero AI cost at request time — pure content.
- Highest shareability of any magnet type (prompts are screenshot-able, Twitter-native).
- Strongest top-of-funnel for W-2 workers who don't know they need AIMS yet.

**Build cost**
Lowest of any magnet. Content is the work, not code.

**Marketplace tie-in**
Prompts tagged by use case → each tag is an upsell surface to our corresponding product (e.g. sales prompts → AI SDR wrapper; support prompts → chatbot embed). Resellers can whitelabel the library + tack on a 1:1 consulting upsell.`,
  },
  {
    title: "AI Stack Budget Planner (interactive tool)",
    status: "INBOX",
    tags: ["lead-magnet", "tool", "product-match"],
    body: `**Concept**
5-input form → headcount, primary use cases, current AI spend, technical level, budget ceiling. Claude-Sonnet-generated stack recommendation from a curated catalog of ~50 real tools (OpenAI, Anthropic, Cursor, n8n, Clay, Attio, Perplexity, etc.).

**Why it wins**
- Complements the existing ROI Calculator — captures decision-stage leads who know they need AI but don't know what to buy.
- Output is immediately shareable ("here's my stack + monthly cost").
- High intent signal → warm→hot tier scoring.

**Build cost**
Medium. The curated tool catalog is the work (prices change, needs quarterly refresh).

**Marketplace tie-in**
Every tool in the output gets an affiliate link. If we also publish our own wrappers in the same output ("or try AIMS' Sales Agent — $97/mo instead of $400/mo Clay + Apollo") we upsell into ours while appearing neutral. Resellers whitelabel the planner with their own catalog = reseller lock-in.`,
  },
  {
    title: "AI Competitor Scan",
    status: "INBOX",
    tags: ["lead-magnet", "tool", "b2b"],
    body: `**Concept**
Drop a competitor URL → Firecrawl scrapes site + pricing → Claude returns "AI tools they appear to use, AI gaps they have, how you can beat them with AIMS products."

**Why it wins**
- Enterprise-grade positioning (same pattern as Crunchbase / Owler).
- Trigger is emotional: curiosity about competitors.
- Output names AIMS products → self-selling for high-ticket asks.

**Build cost**
Medium. Reuses the Firecrawl+Claude pipeline from /tools/website-audit. Swap prompt + results template.

**Marketplace tie-in**
The "here's what they're missing → AIMS can sell it to you" output is literally a sales script. Output doubles as a reseller pitch deck ("run this on any prospect before your sales call").`,
  },
  {
    title: "Marketplace v1 — listings + Dub.co affiliate tracking",
    status: "ACTIVE",
    tags: ["marketplace", "strategy", "dub"],
    body: `**The big bet**
AOC/AIMS becomes a marketplace of AI solutions + wrappers Adam builds, which resellers sell for commission. Every product shipped gets a marketplace listing, a Dub.co short link, and an affiliate program.

**Pieces already in place**
- Reseller portal (app/(reseller)/) exists
- Dub.co integrated (env has DUB_API_KEY, DUB_PROGRAM_ID)
- Close CRM partitioned to AOC business line

**Pieces missing**
- Public marketplace UI (/marketplace or /products)
- Whitelabel product → reseller flow (one-click clone with reseller branding)
- Commission payout reporting (Dub has click/conversion tracking; need $ payouts UI)
- Reseller-facing Product Listing CMS so they pick which products to push

**MVP scope**
1. Admin-only /admin/marketplace-listings CRUD
2. Public /marketplace index with filters (category, price, use case)
3. Every listing has a "Get for your business" CTA (direct purchase) and "Sell this for us" CTA (reseller signup + Dub link generation)
4. Reseller portal shows their Dub links + aggregate clicks + conversions + $ owed

**First 5 products to list** (in priority order)
1. Custom AI wrapper builds (service, $5k+)
2. GHL snapshots — niche-specific (product, $297-497)
3. Chatbot custom script embeds (product, $197-297/mo)
4. Pixel offer / tracking setup (service, $497)
5. AI SDR wrapper (SaaS, $97-297/mo)`,
  },
  {
    title: "GHL Snapshot Library — productized offering",
    status: "INBOX",
    tags: ["product", "marketplace", "low-ticket"],
    body: `**Concept**
Pre-built GoHighLevel snapshots for specific verticals: vending, HVAC, roofing, auto detailing, dental, law firms. Each snapshot includes: funnel pages, automations, email/SMS templates, custom dashboards.

**Why it wins**
- $497-997 one-time price point = easy yes for operators
- Instant deployment value (vs weeks of build)
- Reseller-native: every reseller in AOC can deploy to their clients without ever touching code

**Build cost**
High upfront (building 5-10 snapshots), near-zero delivery cost after.

**Funnel position**
Upsell after Signal / Prompt Library / Stack Budget magnets.

**Affiliate angle**
GHL has a native affiliate program. If our snapshot onboards a new GHL account, we collect BOTH the snapshot fee AND the GHL monthly affiliate commission (~30% recurring). Stacked revenue.`,
  },
  {
    title: "Chatbot Custom Script Embed — productized SaaS",
    status: "INBOX",
    tags: ["product", "marketplace", "saas"],
    body: `**Concept**
Hosted chatbot that embeds into any site via a one-line <script> tag. Customers: SMB owners who want a "smart widget" without building anything. Knowledge base fed from their website scrape (Firecrawl → vector store).

**Why it wins**
- Monthly recurring ($97-297 depending on traffic)
- Setup is 90% automated (URL → scrape → train → live)
- Every install gives the customer a reason to come back to AIMS (they see our brand in the admin)

**Build cost**
Medium. Reuse Firecrawl + Anthropic infra. New: widget hosting, conversation storage, per-domain API key.

**Marketplace tie-in**
Perfect whitelabel candidate. Resellers brand the widget with their logo, resell at $197-497/mo, take 50%. We bank the other 50% + keep the churn signal.

**Upsell path**
Chatbot → SDR wrapper → Custom AI build → Enterprise contract. Natural ladder.`,
  },
  {
    title: "Pixel Offer — audit + setup service ($497 one-time)",
    status: "INBOX",
    tags: ["product", "service", "low-ticket"],
    body: `**Concept**
Install + configure Meta Pixel, Google Ads pixel, TikTok Pixel, LinkedIn Insights tag across a client's site + funnels. Includes conversion event mapping, server-side setup, audience priming.

**Why it wins**
- Universal pain — every business running paid ads should have this done right, almost none do
- One-time $497 = easy low-ticket entry point
- Creates recurring opportunity: once pixels fire, we can pitch "now let's run the ads"

**Build cost**
Low. This is a service, not software. Fulfillment SOP + a delivery checklist.

**Marketplace position**
Upsell immediately after any lead magnet that involves a URL submission (Website Audit, AI Competitor Scan). "We audited your site — here's what else is missing. Fix everything for $497."

**Reseller hook**
Resellers with marketing agencies already sell this — bundle into their deliverable for a flat $300 to us, they charge $997+ to their client.`,
  },
  {
    title: "Custom AI Wrapper Build — $5k+ flagship service",
    status: "INBOX",
    tags: ["product", "service", "high-ticket"],
    body: `**Concept**
Build a custom AI product wrapper for a client's specific use case in 10-14 days. Claude + n8n + their data + their branding + deploy to Vercel. Delivered as a working app under their domain.

**Why it wins**
- High-ticket top of our ladder ($5k-25k depending on scope)
- Anchors the pricing for everything below it
- Each build produces an IP asset we could whitelabel in the marketplace afterward (with client permission)

**Build cost**
Labor. This is our core service arm. Already have the muscle memory from AIMS builds.

**Funnel**
Every big lead magnet output should mention "or we'll build you a custom version of this" as a CTA. Especially AI Opportunity Audit, Competitor Scan, Stack Budget — these all naturally lead to "...so just have us build it."

**Marketplace tie-in**
After delivery, if the client allows, productize the wrapper → sell to 100 other similar businesses for $297/mo. Single build = recurring revenue stream + reseller fuel.`,
  },
  {
    title: "RevenueCat integration — subscription affiliate attribution",
    status: "INBOX",
    tags: ["strategy", "revenue", "infra"],
    body: `**Why**
Dub.co tracks clicks → conversions for one-time sales beautifully. But for subscription products (chatbot embed, SDR wrapper, any SaaS), we need MRR-level attribution: who referred the customer, and what % of their LTV goes back?

**RevenueCat fits because**
- Native affiliate / partner tracking on subscription events
- Handles churn attribution (refund clawback for reseller commissions)
- Works across Stripe, iOS, Android if we ever build mobile

**MVP scope**
- Wire RevenueCat for Stripe events first
- Extend our reseller dashboard to show LTV + $/month from their tree
- Automatic commission clawback on refunds

**Risk / open question**
Cost of RevenueCat at scale. Free tier covers <$2.5k MRR but that's peanuts. Need to model at what MRR it costs more than building attribution in-house vs. using RC.`,
  },
  {
    title: "Reseller Funnel — whitelabel click-to-deploy flow",
    status: "INBOX",
    tags: ["reseller", "marketplace", "strategy"],
    body: `**Concept**
Any reseller in AOC can click "Sell this" on any marketplace product and instantly get:
1. A branded landing page (their logo + our product)
2. A unique Dub.co link (conversion-tracked)
3. A pre-built email sequence they can edit or send as-is
4. A pre-built Close CRM pipeline for their deals

**Why it wins**
- Resellers are 10x more likely to sell if setup is 30 seconds vs 3 hours
- Every reseller becomes a distribution channel overnight
- Natural lock-in: their clients are in OUR stack, touching AIMS-branded products underneath

**Build cost**
Medium-high. Need: templated landing pages, dynamic branding layer, cloneable Close pipelines. Probably 2 weeks.

**Pricing model**
Free for resellers to use. We take 30-50% of every sale. They keep 50-70% and have zero fulfillment burden.`,
  },
  {
    title: "Lead Magnet Funnel Matrix — which magnet feeds which product",
    status: "INBOX",
    tags: ["strategy", "funnel", "mapping"],
    body: `Mapping lead magnets → natural product match → first upsell → high-ticket upsell. Helps the email sequences target the right offer per magnet.

| Magnet                | Immediate offer           | First upsell              | High-ticket          |
|-----------------------|---------------------------|---------------------------|----------------------|
| Daily Signal          | AOC community ($47/mo)    | Stack Budget tool         | Custom AI build      |
| AI Readiness Quiz     | AI Readiness Course ($97) | Chatbot embed             | Custom AI build      |
| ROI Calculator        | Pixel offer ($497)        | SDR wrapper               | Custom AI build      |
| Website Audit         | Website fix pkg ($297)    | Chatbot embed             | Custom AI build      |
| AI Playbook (W-2)     | AOC community ($47/mo)    | Operator Vault ($297)     | Reseller invite      |
| Exec Ops Audit        | Ops audit deep-dive ($497)| GHL snapshot              | Custom AI build      |
| Business Credit Score | Credit repair partner     | GHL snapshot              | Funding consult      |
| AI Opportunity Audit  | Pixel offer ($497)        | Chatbot embed             | Custom AI build      |
| Weekly Trending (new) | AOC community ($47/mo)    | Tool affiliate link       | Marketplace listing  |
| AI Prompt Library     | AOC community ($47/mo)    | SDR wrapper               | Operator Vault       |
| Stack Budget (new)    | Product recs → affiliate  | Pixel offer               | Custom AI build      |
| Competitor Scan (new) | "Beat them" build $5k     | Chatbot embed             | Custom AI build      |

**Action item**
Each post-magnet email sequence should hard-target the "Immediate offer" column with a delayed "First upsell" hook. The "High-ticket" stays for the last email in each sequence.`,
  },
  {
    title: "Community tier ladder — $0 → $47 → $297 → $997 → reseller",
    status: "INBOX",
    tags: ["strategy", "pricing", "community"],
    body: `**Proposed tier ladder** (low-ticket up to reseller)

- **$0 / Free subscriber**: Any lead-magnet email (Signal, Prompt Library, etc.). In nurture sequence.
- **$47/mo / AOC Community**: Mighty Networks community, monthly group calls, library of prompts + snapshots.
- **$297/mo / Operator Pro**: Community + private weekly office hours + early access to new products + 20% reseller rev share on referrals.
- **$997/mo / Operator Vault**: Pro + Adam's monthly 1:1 coaching + custom build credits ($500/mo rollover) + 35% reseller rev share.
- **Reseller tier**: Separate ladder. Application-based. Free to join. 50-70% commission on everything they sell.

**Why this works**
- Each tier upgrade is 5-6x the previous — legitimate pricing jumps
- Reseller is parallel, not top-of-ladder — someone can be in $47 AOC AND a $0 reseller simultaneously
- Custom build credits at $997 tier give Adam a reason to sell upgrades vs. one-off builds

**Open question**
Do we run this on Stripe (one-off + subscription) or use Mighty Networks' native billing? Mighty charges 3% cut but handles community access automatically.`,
  },

  // ─── VENDTOOLS → AIMS PARITY (the SaaS-in-a-box playbook) ─────────────────

  {
    title: "🎯 THE MASTER OFFER — OperatorOS (AIMS equivalent of VendTools)",
    status: "ACTIVE",
    tags: ["strategy", "offer", "saas", "flagship"],
    body: `**The thesis**
VendTools turned "vending operator" into a one-click business because everything the operator needs to find leads, pitch, close, deliver, and scale lives in a single SaaS. We do the same for AI operators — call it **OperatorOS** (working name) — and make it the product AOC members get on day 1.

**What makes it different**
Every module is DUAL-PURPOSE:
1. The operator USES it to run their agency (CRM, outreach, delivery)
2. The operator RESELLS each module to their own clients as a whitelabeled SaaS (chatbot, voice agent, website, newsletter)
3. Adam gets a cut of every resale via Dub.co attribution + RevenueCat subscription share

**The offer**
"One SaaS to find AI clients, pitch them, close them, deliver the product, and get paid — without writing code or hiring anyone. Whitelabel every product you resell. Keep up to 70% commission."

**Entry price**: $997 one-time onboarding + $297/mo Operator Pro subscription. Upsell to $997/mo Vault tier at month 3 once they've closed their first deal.

**Why this wins**
- Collapses 10 SaaS subscriptions into one ($20k/yr saved per operator)
- Removes the hardest problem (building the product) — we ship them pre-built AI products to resell
- Builds-in attribution from day 1 (no scraping Stripe for commissions later)
- Creates a moat: once an operator has 10 clients on OperatorOS, switching costs are prohibitive

**The modules** (mapped from VendTools, each is its own Idea entry below)
CRM → Dashboard, Analytics, Leads, Scout
SALES → Voice, Chat Agent, Contracts
MARKETING → Website, Newsletter, Flyers, Mockups, Brand Kit
HIRING → AI Hire (subcontractor marketplace)
TOOLS → Routes, Calculator, Library, Import`,
  },

  {
    title: "AI Scout — map-based AI prospect discovery",
    status: "INBOX",
    tags: ["product", "operatoros", "module", "resellable"],
    body: `**VendTools module:** Leads → Scout (the map view on the attached screenshot)

**Concept**
Drop a zip code + industry (e.g. "Austin, TX" + "law firms"). AI Scout:
1. Pulls local business data via Google Places API
2. Scrapes each site with Firecrawl
3. Claude analyzes: "does this business have AI? What gaps? Priority score 1-10."
4. Enriches with contact info (Clay/Apollo/PeopleDataLabs)
5. Outputs a prioritized hit list with personalized AI-gap pitch for each

**Why it wins for operators**
This is THE killer feature of VendTools — operators said it paid for the platform in week 1. For AI, the equivalent: "show me the 50 local businesses that need AI most, with the pitch pre-written."

**Why it wins for Adam**
Every search = API cost passed through (credit pack model: 100 credits for $29). Operator expectations are high-usage → high margin recurring.

**Resale angle**
Operators' own clients can run Scout to find THEIR customers (retailers, etc.) — cheaper than Clay. White-label under operator's brand for $97/mo.

**Build cost**
Medium. Reuse existing Firecrawl + Claude infra. New: Google Places integration, credit wallet, CRM-style hit list UI. 2-3 weeks.

**First version scope**
- Search by zip + industry vertical
- Top 20 results per search
- Claude 1-sentence "AI gap" for each
- Export to CSV or add to CRM in one click`,
  },

  {
    title: "AI Voice SDR — cold-call agent as both tool and product",
    status: "INBOX",
    tags: ["product", "operatoros", "module", "resellable", "voice"],
    body: `**VendTools module:** Voice

**Concept**
AI voice agent that calls a list of leads, qualifies them, and books meetings on the operator's calendar. Powered by Retell / Vapi / ElevenLabs (pick based on cost + quality tests).

**Use case A — operator-facing**
Operator uploads 100 leads from Scout → AI Voice calls all 100 → books 5 meetings → operator runs those 5 pitches. Converts top-of-funnel grunt work into passive lead gen.

**Use case B — productized resale**
Operator's own clients buy it as "AI Receptionist" or "AI SDR for my restaurant/dental office/gym" — $297-497/mo. Operator whitelabels under their brand.

**Pricing to operator**
Included in OperatorOS Pro tier (with cap: 500 minutes/mo). Overage = $0.15/min. Resale to operators' clients: Adam gets 30% of MRR.

**Why it wins**
Voice is the highest-willingness-to-pay AI product right now. Zapier/Twilio/Retell all have APIs but stitching them is annoying — we do it once for everyone.

**Build cost**
High. Voice infra is legitimately complex (prompt tuning, interruption handling, webhook ingestion, call recording). 4-6 weeks for v1.

**Moat**
Every call recorded → every transcript feeds a training loop for the operator's own voice agent. After 3 months an operator's agent is personally tuned → highest switching cost of any module.`,
  },

  {
    title: "AI Chat Agent — embeddable chatbot + inbound qualifier",
    status: "INBOX",
    tags: ["product", "operatoros", "module", "resellable"],
    body: `**VendTools module:** Chat Agent

**Concept**
Chatbot that embeds on any site via one <script> tag. Trained on the client's website content (Firecrawl → vector store). Qualifies inbound, books meetings, answers FAQs.

**Dual use**
- Operator runs it on their OWN landing page to qualify inbound AI-services leads
- Operator sells it to their clients at $97-297/mo as a standalone SaaS

**Resale margin**
Operator pays $29/mo per instance (infra cost + small margin to Adam), charges client $197/mo → keeps $168/mo recurring per client. 10 clients = $1.7k/mo passive.

**Why it wins**
Already a known category (Intercom, Drift) but for 10x less money and 10x faster setup. "URL in, widget out, live in 90 seconds."

**Build cost**
Medium. Largely known territory. New: multi-tenant widget hosting, per-domain API keys, conversation log dashboard, handoff-to-human flow.

**Integration hooks**
- Auto-capture to CRM (OperatorOS + resold-instance CRM in operator's dashboard)
- Knowledge base = client's own site content + any docs they upload
- Custom instructions per domain (tone, forbidden topics, booking rules)`,
  },

  {
    title: "AI Contract Studio — MSA/NDA/SOW + e-sign",
    status: "INBOX",
    tags: ["product", "operatoros", "module"],
    body: `**VendTools module:** Contracts

**Concept**
Prompt-based contract generator. Operator types "I'm building an AI chatbot for a law firm, $5k, monthly support $500, 12 months" → gets a polished MSA + SOW + optional NDA → inline e-sign → stored in their dashboard.

**Why it wins for operators**
Closing speed is the #1 killer of AI-service deals. Operators lose deals because they can't send a contract same-day. This removes the friction entirely.

**Legal backing**
We pay once for a lawyer-reviewed template library (MSA, SOW, NDA, DPA, amendment). Claude fills in the variables. Edge cases route to a flagged "needs human review" state but 80% auto-generate.

**Build cost**
Low-medium. Template library + Claude filling + DocuSign (or free alternative like BoxyHQ) for e-sign. 2 weeks.

**Upsell angle**
"AI Contract Review" for operators' own clients — $99 flat to review an incoming contract and flag issues. High margin, pure AI, viral gift-card feeling ("saved me $2k in legal").

**Inside OperatorOS tier**
Unlimited contract generation in Pro. E-sign count: 20/mo Pro, unlimited Vault.`,
  },

  {
    title: "AI Website Builder — operator gets a landing page in 5 minutes",
    status: "INBOX",
    tags: ["product", "operatoros", "module", "resellable"],
    body: `**VendTools module:** Website (editor + questionnaire)

**Concept**
Operator answers 5 questions → AI generates their full agency landing page (hero, services, portfolio, about, contact) at \`{their-slug}.aioperatorcollective.com\`. Optionally custom domain.

**Dual use**
- Operator gets a launch-day landing page without hiring a dev
- Operator can build landing pages for their OWN CLIENTS (resold at $47/mo = $564/yr recurring per client)

**Why it wins**
Zero-to-online in 5 minutes. Every operator becomes launch-ready on day 1 of OperatorOS — removes the #1 excuse ("I don't have a website yet").

**Tech**
Next.js subdomain routing (already have this pattern in VendTools). Content stored as JSON. Published pages SSR'd from Neon.

**Moat**
Every operator site becomes a backlink to aioperatorcollective.com → SEO compounds as operator count grows.

**Build cost**
Medium-high. Editor UX + deploy pipeline is the work. 3-4 weeks.

**Hook into funnel**
Every operator landing page has a "Powered by AIMS" footer linking back to /tools/daily-signal. Even inactive operators drive free leads.`,
  },

  {
    title: "AI Newsletter Studio — whitelabel Signal for operators",
    status: "INBOX",
    tags: ["product", "operatoros", "module", "resellable", "signal"],
    body: `**VendTools module:** Newsletter

**Concept**
The Daily Signal engine (autoresearch + council) exposed as a multi-tenant product. Operators pick their niche (e.g. "AI news for dentists") → AI generates a weekly newsletter → operator sends to their client list under their own brand.

**Why it wins**
Content is the #1 way agencies stay top-of-mind, but 95% can't produce it consistently. This is a done-for-you content engine that reinforces the operator's authority.

**Resale**
Operator's clients can ALSO subscribe to "their" newsletter at $19/mo each. Operator becomes a publisher — recurring audience + recurring revenue.

**Tech reuse**
90% already built (Signal engine). New: multi-tenant delivery, per-tenant branding, per-tenant subscriber list.

**Build cost**
Medium. 2-3 weeks. Pure content platform, no hard AI research on top of existing engine.

**Pricing**
Included in OperatorOS Pro with 500 subscriber cap. Overage / higher tier: $0.01 per send. Vault tier: unlimited.`,
  },

  {
    title: "AI Brand Kit Generator — logo, colors, fonts from a prompt",
    status: "INBOX",
    tags: ["product", "operatoros", "module"],
    body: `**VendTools module:** Brand Kit

**Concept**
Prompt: "Modern, serious, gold + deep navy, for an AI consulting agency" → output: 4 logo options (SVG), palette, font pairings, business card mockup, pitch deck template. All delivered in a branded ZIP.

**Why it wins**
Every new operator stalls on branding. This removes it as an excuse and gets them to "launch-ready" on day 1.

**Tech**
DALL-E 3 or Ideogram for logos (better text), Claude for color/font/voice guidelines, Puppeteer for mockup generation.

**Build cost**
Low-medium. 1-2 weeks. Well-understood category (Looka, Canva) — we just integrate it into the OperatorOS flow.

**Upsell angle**
"Upgrade my brand kit" → paid human review by a designer $197 flat. We partner with one freelancer, take 40%.`,
  },

  {
    title: "AI Hire — subcontractor marketplace inside the community",
    status: "INBOX",
    tags: ["product", "operatoros", "module", "marketplace"],
    body: `**VendTools module:** VendHire

**Concept**
Operators post jobs (e.g. "need someone to build an n8n workflow for $500"). Other operators / interns bid. Completed job → Adam takes a 10-15% platform fee.

**Why it wins**
- Solves the "I got a client but can't deliver" problem — #2 reason operators fail
- Keeps every dollar inside the AOC ecosystem
- Creates a second earning path for junior operators (interns) who can't sell yet but can build

**Parallel to the intern pool**
Intern OS (already have the role/routes) becomes the "starter gig pool" inside AI Hire. Interns earn their first paid work through here.

**Build cost**
Medium. Job board + bidding + Stripe Connect for payouts + dispute resolution. 3-4 weeks.

**Revenue model**
15% platform fee on every job. For operators processing $10k/mo in subcontract work, Adam makes $1.5k/mo per top operator.`,
  },

  {
    title: "AI Routes — territory planner for field sales operators",
    status: "INBOX",
    tags: ["product", "operatoros", "module"],
    body: `**VendTools module:** Routes

**Concept**
Operator has 50 prospects in their Scout list → AI Routes plans the optimal in-person visit sequence (like a route-optimization for door-to-door). Integrates with Google Maps API.

**Why it wins for AI-specific use case**
Most AI-services founders DON'T do in-person sales — but the ones that do (local agency model) crush. Gives them an edge: 50 high-intent prospects visited in 2 days vs 2 weeks.

**Bundle value**
Operator uses Scout → Routes → Contracts → Chat Agent in one day. That's a complete field-sales workflow none of our competitors offer.

**Build cost**
Low-medium. Routing algo is a solved problem (Mapbox Optimization API or Google Routes API). Wrap it in a nice UI. 1-2 weeks.

**Lower priority**
Probably Phase 3 after core SaaS is shipped. Field sales is a subset of operators, not the majority.`,
  },

  {
    title: "AI Calculator Suite — pricing, ROI, commission, payback",
    status: "INBOX",
    tags: ["product", "operatoros", "module", "tool"],
    body: `**VendTools module:** Calculator

**Concept**
A suite of calculators operators + their clients use to justify + price AI engagements. Each calculator is ALSO a standalone lead magnet on the marketing site.

**Included calcs**
1. "What should I charge for this AI service?" (operator pricing)
2. "What's this AI engagement worth to the client?" (ROI pitch)
3. "What's my commission if I resell this?" (operator revshare)
4. "When do I break even?" (payback period)
5. "What's my monthly AI spend budget?" (client-side)

**Why it wins**
Every calc output is a screenshot-able pitch artifact. Operators paste it into sales calls. Doubles as content for their own marketing.

**Build cost**
Low. Most are just formulas + good UX. 1 week for the suite.

**Lead magnet crossover**
Each calc lives at /tools/{calc-slug} as a public lead magnet, gated by email for the PDF export.`,
  },

  {
    title: "AI Prompt + Playbook Library — the knowledge core",
    status: "INBOX",
    tags: ["product", "operatoros", "module", "content"],
    body: `**VendTools module:** Library

**Concept**
Searchable library of 200+ assets operators use daily:
- 40+ proven prompts (Sales / Marketing / Ops / Recruiting / Finance / Support / Product / Engineering)
- 20+ n8n workflow templates (operator imports into their own n8n)
- 15+ GHL snapshots
- 30+ cold email templates (industry-specific)
- 10+ pitch deck templates
- 5+ MSA/SOW templates (same as Contract Studio)

**Why it wins**
Stops the "I don't know what to send / say / build" paralysis. Everything is one-click usable.

**Build cost**
Content-heavy but code-light. The code is a CMS — 1 week. The content is Adam's ongoing job (or outsourced).

**Upsell angle**
"Pro library" (vs free preview library) is the single biggest reason to upgrade from Lite to Pro tier.`,
  },

  {
    title: "AI Pipeline CRM — Close-lite built into OperatorOS",
    status: "INBOX",
    tags: ["product", "operatoros", "module"],
    body: `**VendTools module:** Dashboard + Analytics + Leads

**Concept**
A simplified CRM for the AI operator's own pipeline (NOT their clients' CRM — that's a separate product). Kanban stages, pipeline value, activity log, tasks, reminders. Imports from Scout directly.

**Why not just use Close?**
Operators at <$5k MRR can't justify Close's $99/seat. We give them 80% of Close for free inside OperatorOS. When they outgrow it, they upgrade to Close (via our affiliate link → Adam gets kickback).

**Build cost**
Medium. Kanban + activity log is well-understood. 2-3 weeks. Reuse existing Deal model from AIMS platform with small tweaks.

**Exit path**
"Export to Close" button at higher tiers → Adam's Close affiliate link → recurring commission from Close on every referral.`,
  },

  // ─── PRODUCTS FOR RESALE TO OPERATORS' CLIENTS (not in OperatorOS core) ───

  {
    title: "AI SEO Auto-Fix — productized SEO as a service",
    status: "INBOX",
    tags: ["product", "marketplace", "resellable", "seo"],
    body: `**Concept**
Client submits URL → Firecrawl scrapes → Claude audits SEO → auto-generates fixes (meta descriptions, alt tags, header hierarchy, internal links, schema markup). Operator reviews + 1-click deploys via WordPress / Webflow / Shopify API.

**Why it wins**
SEO is a slow money-printer and agencies milk it for $1-5k/mo. AI makes the delivery 90% cheaper — but the perceived value (and price) stays the same.

**Pricing tiers**
- $297/mo basic (monthly audits + fixes)
- $997/mo pro (weekly + rank tracking + backlink suggestions)
- $2,997/mo enterprise (multi-site + competitor teardowns)

**Operator economics**
Operator pays Adam $97/mo per active client instance. Charges client $497/mo. Nets $400/mo per client × 10 clients = $4k/mo passive.

**Build cost**
High. SEO space is competitive, quality bar is high. 6-8 weeks. But defensible moat once built.`,
  },

  {
    title: "AI Review Responder — 5-star monitoring + auto-reply",
    status: "INBOX",
    tags: ["product", "marketplace", "resellable"],
    body: `**Concept**
Monitors Google / Yelp / Facebook reviews for a client's business. Claude drafts a personalized response to each new review. Operator (or client) approves with one tap. Also triggers post-job review request emails to drive new review volume.

**Why it wins**
Every local business owner struggles with this. It's the #1 "I know I should but I don't" task. Perfect product to sell as "set it and forget it."

**Pricing**
$97/mo per location. Operator pays Adam $29/mo. Nets $68/mo per location × 20 clients = $1.3k/mo passive.

**Build cost**
Low-medium. Google My Business API is the tricky part (requires verification). 3 weeks.

**Cross-sell**
Pairs naturally with chatbot embed — review → review response → chatbot greets visitor triggered by response.`,
  },

  {
    title: "AI Content Calendar — 30 days of posts per client",
    status: "INBOX",
    tags: ["product", "marketplace", "resellable", "content"],
    body: `**Concept**
At the start of each month, AI generates a 30-day content calendar per client: blog topics, LinkedIn posts, Instagram captions, email subject lines. Client can approve/edit in a Notion-style editor. Auto-publishes to their connected accounts (Buffer / Typefully / native APIs).

**Why it wins**
"I know content works but I don't have time" is universal. Operators who can deliver consistent content win the trust war against DIY.

**Pricing**
$297/mo per client. Operator pays Adam $47/mo. Nets $250/mo × 15 clients = $3.75k/mo.

**Build cost**
Medium. Content gen is easy. The hard part is multi-channel publishing integrations. 4 weeks.`,
  },

  {
    title: "AI Lead Qualifier — enriched form submissions",
    status: "INBOX",
    tags: ["product", "marketplace", "resellable"],
    body: `**Concept**
Drop-in replacement for standard contact forms. Visitor submits → AI enriches with firmographics (Clearbit-style) → routes to the right person on the team with a pre-written brief. "Your 10 AM lead is a HIGH-fit: VP Marketing at a 50-person SaaS, LinkedIn active, likely budget $5-15k."

**Why it wins**
Agencies + consultants live and die on first-meeting quality. Anything that 2x's "fit" of leads walking into their calendar is instant ROI.

**Pricing**
$47/mo base, $197/mo per additional thousand enrichments. Operator margin: 50%.

**Build cost**
Medium. The form widget is trivial. Enrichment quality is the work — probably wrap Clay/Apollo's APIs and resell.`,
  },

  // ─── NEW LEAD MAGNETS (funnel top-of-funnel) ───────────────────────────────

  {
    title: "Local Business AI Scan — drop a zip, get AI-gap report on local biz",
    status: "INBOX",
    tags: ["lead-magnet", "tool", "viral"],
    body: `**Concept**
Public tool at /tools/local-ai-scan. Visitor drops a zip + industry → we show 10 local businesses with a rapid AI-gap report on each (same engine as AI Scout but heavily rate-limited for public).

**Why it wins**
- High curiosity: "wait, which local businesses suck at AI?"
- Immediately actionable for operators looking for clients
- Viral potential: operators share their city's scan on social

**Funnel**
Public sees 3 free businesses. Email capture to unlock all 10. Email capture → warm lead for OperatorOS pitch ("this is exactly what our members do at scale").

**Build cost**
Low. Lightweight wrapper around AI Scout with hard limits. 3-4 days.`,
  },

  {
    title: "AI Sales Script Generator — cold email + call script in 30s",
    status: "INBOX",
    tags: ["lead-magnet", "tool"],
    body: `**Concept**
Visitor inputs: what they sell, who they sell to, one win they've had → Claude generates a cold email + voicemail script + objection-handling table + LinkedIn InMail. Downloadable as PDF.

**Why it wins**
Every agency owner, freelancer, SDR, founder needs this. Huge TAM, zero-cost perception gap (they'd pay $47 for this easily).

**Funnel**
Captures email for delivery. Drop into "post-sales-generator" sequence that nurtures toward $47/mo Lite tier.

**Build cost**
Low. Pure Claude + template. 3 days.`,
  },

  {
    title: "AI Agency Name + Domain Brandability Check",
    status: "INBOX",
    tags: ["lead-magnet", "tool", "naming"],
    body: `**Concept**
Visitor types keywords, gets 20 AI agency name suggestions → each checked against Namecheap API for .com availability → Instagram / LinkedIn handle availability → trademark collision check (USPTO API).

**Why it wins**
Naming is the hardest step for new operators. Giving them a shortcut = instant value + huge capture moment.

**Funnel**
Naming → email capture → upsell path: "Here's your name. Want us to build your landing page? Claim your free OperatorOS trial."

**Build cost**
Low. Namecheap + Instagram availability + USPTO public API. 4-5 days.`,
  },

  {
    title: "AI Pricing Calculator — what should I charge for my AI service?",
    status: "INBOX",
    tags: ["lead-magnet", "tool"],
    body: `**Concept**
Operator inputs their service (chatbot build, SEO package, voice agent setup) + market (local, SMB, mid-market, enterprise) + time investment → output: recommended price ranges, comparable market rates, suggested package tiers.

**Why it wins**
"How do I price this?" is the #1 question in every agency Slack. Answering it = instant trust.

**Funnel**
Captured emails drop into Lite tier nurture. Natural upsell: "pricing is easy, closing is hard — here's OperatorOS."

**Build cost**
Low. Claude + comp-data seeded from public sources (Upwork, Toptal, Agency.com data). 3-4 days.`,
  },

  {
    title: "AI Chatbot Demo — drop URL, see chatbot preview on your own site",
    status: "INBOX",
    tags: ["lead-magnet", "tool", "conversion"],
    body: `**Concept**
Visitor drops their URL → Firecrawl scrapes → we instantly render a working AI chatbot trained on their own content inside an iframe preview of their homepage. Visceral demo moment.

**Why it wins**
"Here's what it would look like on YOUR site" closes deals in seconds. Nothing else can compete with this demo.

**Funnel**
Preview → "Want this live on your site?" → email capture → either direct to operator marketplace (find an operator) or to OperatorOS for agency founders.

**Build cost**
Medium. iframe preview overlay is the UX work. Already have the chatbot + Firecrawl pieces.`,
  },

  {
    title: '"Can I make $10k/mo as an AI operator?" Qualifier Quiz',
    status: "INBOX",
    tags: ["lead-magnet", "quiz", "qualifier"],
    body: `**Concept**
12-question quiz. Output: personalized score + income projection + recommended first service to sell + pathway ("start with Lite tier" vs "jump to Vault").

**Why it wins**
Self-qualifying. People who land in the HIGH group are pre-sold and should see Vault offer immediately. LOW group goes to nurture.

**Funnel architecture**
- Score 80+: direct booking link to a close-sales call with Adam
- Score 60-79: 7-day email sequence → Pro tier offer
- Score <60: Lite tier + Playbook

**Build cost**
Low. Reuse AI Readiness Quiz engine (already built at /tools/ai-readiness-quiz). 3 days.`,
  },

  // ─── COURSE / CURRICULUM ───────────────────────────────────────────────────

  {
    title: "🎓 30-Day Operator Launchpad — the course that funnels into community",
    status: "INBOX",
    tags: ["course", "curriculum", "flagship", "funnel"],
    body: `**Format**
Daily 15-minute video + daily 45-minute action task + community check-in. Delivered inside Mighty Networks. Self-paced but cohort-style (new cohort every 2 weeks for accountability).

**Price positioning**
Free with any OperatorOS subscription ($47+). This is the onboarding-to-activation ladder.

**The 30-day arc**

**Week 1: Foundation (Day 1-7)**
- D1: Install OperatorOS + set up Brand Kit
- D2: Pick your niche (quiz + recommendation)
- D3: Build your landing page (Website module)
- D4: Upload first 10 leads (Scout)
- D5: Write first cold outreach (Library templates + Claude)
- D6: Set up your calendar + chatbot on your site
- D7: Community intro post (accountability)

**Week 2: Outreach (Day 8-14)**
- D8: Launch Voice SDR on 100 leads
- D9: Daily Signal subscribed + pick your topics
- D10: Send first batch of cold emails
- D11: First pitch call (coached via AI)
- D12: Close or walk away — the "one-day rule"
- D13: Refine pitch based on objections
- D14: Review week → community check-in

**Week 3: Close + Deliver (Day 15-21)**
- D15: First deal signed (use Contract Studio)
- D16: Deliver first product (chatbot embed is the easiest starter)
- D17: Collect first review
- D18: Ask for referral in the delivery call
- D19: Add second product (SEO Auto-Fix upsell)
- D20: Invoice the client
- D21: Celebrate + post the win in community

**Week 4: Scale (Day 22-30)**
- D22: Turn on referral link (Dub.co)
- D23: First subcontractor via AI Hire (delegate delivery)
- D24: Second client (using momentum of first)
- D25: Raise prices (the post-first-client rule)
- D26: Apply for Pro → Vault upgrade
- D27: Decide on recurring cadence (content, outreach, newsletter)
- D28: Build your operator identity (personal brand)
- D29: 30-day retrospective + goals for next 30
- D30: Graduation — guaranteed Vault upgrade track review

**Why this course wins**
- Activation = money. People who finish this close deals. They stay subscribed.
- Community-first: every milestone is a community post. Peer pressure + social proof compounds.
- Directly funds everything else: graduates upgrade to Vault, become affiliates, recruit next cohort.

**Build cost**
High. 30 videos + 30 workbooks + community setup. 2-3 months of content work. But this is the #1 retention mechanism.`,
  },

  // ─── FLYWHEEL + ATTRIBUTION ───────────────────────────────────────────────

  {
    title: "🔁 The Flywheel — Dub + RevenueCat + commission ladder",
    status: "ACTIVE",
    tags: ["strategy", "flywheel", "attribution", "revenue"],
    body: `**The flywheel in 5 steps**
1. Lead magnet captures email (free, zero-cost)
2. Email → Lite ($47/mo community + basic tools)
3. Lite → Pro ($297/mo OperatorOS SaaS + resellable products)
4. Pro operator resells products to their clients (via Dub.co attribution)
5. Adam earns: subscription margin (Pro + Vault) + resale commission (30-70% kickback)
6. Operator's clients see "Powered by AIMS" → become new top-of-funnel emails
7. Loop

**Commission ladder (per operator tier)**
- Lite ($47/mo): 20% commission on any resale
- Pro ($297/mo): 40% commission
- Vault ($997/mo): 55% commission + free 1:1 onboarding
- Master ($2,497/mo): 70% commission + exclusive territory + co-sell with Adam

**Attribution stack**
- **Dub.co**: every link on every operator landing page → tracked click → tracked conversion
- **RevenueCat**: every subscription product (chatbot, voice, newsletter) → MRR share split automatically
- **Stripe**: one-off products (contract gen credits, brand kit) → direct revshare post-purchase
- **Operator dashboard**: shows $owed, $paid, click→conv rate, top products

**Payouts**
Monthly, 15th of the month, via Stripe Connect (for US operators) or Wise (international). Auto-1099 at year-end.

**Key metric to watch**
LTV:CAC by operator tier. If Vault operators have 4x+ LTV of Lite, we push more to Vault. Otherwise Lite is the main growth lever.`,
  },

  {
    title: "🏆 Operator Leaderboard — gamification + social proof engine",
    status: "INBOX",
    tags: ["strategy", "community", "retention"],
    body: `**Concept**
Public leaderboard of top operators ranked by: active clients, MRR generated (for resold products), referrals made, community karma. Top 10 always visible on /operators/leaderboard.

**Why it wins**
- Gamification drives activation better than any feature
- Top operators become case studies (free marketing for us)
- Prospects pick operators off the leaderboard (reverse-lead generation for Adam — no sales team needed)

**Mechanics**
- Points per closed deal ($ value)
- Points per referral
- Points per community post that gets 10+ reactions
- Monthly reset → monthly champion gets a spotlight + free Vault month
- Annual champion gets a physical award + speaking spot at annual retreat

**Build cost**
Medium. Scoreboard + points engine + periodic resets. 2 weeks.`,
  },

  {
    title: "🎯 Operator Marketplace — prospects find operators by niche",
    status: "INBOX",
    tags: ["marketplace", "strategy", "reverse-lead"],
    body: `**Concept**
Public directory at /find-an-operator. Prospect types industry + budget → gets matched with 3 top operators. Includes profile, reviews, specialties, pricing, booking link.

**Why it wins**
- Reverse-lead routing: AIMS qualifies inbound → distributes to paying operators. Every operator gets pipeline as a Pro perk.
- Premium paid placements ("featured operator") = monetization
- SEO gold: every operator profile is indexed by their niche/city

**Flow**
1. Prospect fills out brief ("I own a dental practice in Austin, want AI chatbot + review responder")
2. Algorithm matches by: niche, location, reviews, capacity
3. Top 3 notified → they have 4 hours to respond
4. Fastest responder usually wins
5. Operator closes → Dub attribution → Adam gets 15% finder's fee on first engagement

**Build cost**
Medium-high. Matching algo + operator profiles + review system + brief flow. 4 weeks.

**Why operators love it**
Pipeline without having to market themselves. Pure activation of the Pro tier — worth the subscription alone.`,
  },

  {
    title: "Signal Sponsor Slots — monetize the digest audience",
    status: "INBOX",
    tags: ["revenue", "signal", "content"],
    body: `**Concept**
Once Signal has 5k+ subscribers, open one sponsor slot per daily digest. Relevant AI tools bid to be mentioned ("Today's digest is brought to you by Cursor — the AI code editor. Try it free.").

**Pricing model**
$500 per sponsored digest at 10k subscribers. $2k at 50k. $10k at 250k.

**Why it wins**
- Pure margin — no marginal cost
- Non-intrusive (one line at the bottom, on-brand)
- Validates Signal as a real media property = leverage for other deals

**Build cost**
Low. Add a sponsor field to digest runs. Admin UI to schedule upcoming sponsors. 3-4 days.

**Scale path**
At 10k subscribers → maybe $500/day × 20 days/mo = $10k/mo. At 50k → $40k/mo. Becomes a serious revenue leg independent of SaaS.`,
  },
]

async function main() {
  console.log("[seed-ideas-vault] Starting…")

  // Target Adam specifically. Memory says 100 is the canonical email; the latest
  // user note says 102. Seed both if they exist so whichever is the active login
  // finds their ideas waiting.
  const owners = await db.user.findMany({
    where: {
      email: { in: ["adamwolfe102@gmail.com", "adamwolfe100@gmail.com"] },
    },
    select: { id: true, email: true },
  })

  if (owners.length === 0) {
    console.error("[seed-ideas-vault] No Adam user rows found. Check email match.")
    process.exit(1)
  }

  let created = 0
  let skipped = 0

  for (const owner of owners) {
    console.log(`\n[seed-ideas-vault] Owner: ${owner.email}`)
    for (const idea of IDEAS) {
      const existing = await db.idea.findFirst({
        where: { ownerId: owner.id, title: idea.title },
        select: { id: true },
      })
      if (existing) {
        skipped++
        continue
      }
      await db.idea.create({
        data: {
          ownerId: owner.id,
          title: idea.title,
          body: idea.body,
          tags: idea.tags,
          status: idea.status,
        },
      })
      created++
      console.log(`  [+] ${idea.status.padEnd(8)} ${idea.title.slice(0, 70)}`)
    }
  }

  console.log(`\n[seed-ideas-vault] Done. Created=${created} Skipped=${skipped} (already existed)`)
  await db.$disconnect()
}

main().catch(async (e) => {
  console.error("[seed-ideas-vault] Failed:", e)
  await db.$disconnect()
  process.exit(1)
})
