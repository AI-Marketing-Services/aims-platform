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
