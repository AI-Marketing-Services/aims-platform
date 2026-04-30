/**
 * AI Operator Playbook — W-2 Edition
 *
 * Twelve plays a corporate W-2 professional can run to leverage AI for either
 * (a) replacing their 9-5 with an AI services business, or (b) bringing AI
 * into the business they already work for and becoming the indispensable
 * person who shipped it.
 *
 * Each play is rendered on /tools/ai-playbook by the PlayCard component.
 * Edits to copy here flow straight to the page — the content is data-driven
 * so non-engineers can refine without touching JSX.
 */

export type PlayCategory = "build-a-business" | "transform-from-within"

export interface Play {
  id: string
  category: PlayCategory
  number: string  // "01", "02", etc — used for visual numbering
  title: string
  hook: string  // 1-2 sentence opening
  steps: string[]  // 3-5 actionable steps
  toolsToUse: string[]
  realWorldExample: string
  ctaLine: string  // The "see how Collective members run this" line
}

export const W2_PLAYS: Play[] = [
  {
    id: "audit-offer",
    category: "build-a-business",
    number: "01",
    title: "Turn the most painful workflow at your day job into a $1,500 fixed-price audit.",
    hook: "Don't brainstorm a 'cool AI business' from scratch. Look at the manual workflow that's been eating your team's hours for two years — that's your first product. You already know the buyer, the pain, and the workflow.",
    steps: [
      "List the top 3 manual processes at your company that take more than 5 hours per week and follow a predictable pattern.",
      "Pick the one with the most expensive humans doing it — that's your wedge.",
      "Package it as a $1,500 fixed-price 'AI Opportunity Audit' deliverable: 3 pages, current workflow → AI-assisted workflow → ROI math.",
      "Sell the audit before you build anything. You don't need a website. You need 5 conversations.",
    ],
    toolsToUse: ["Google Docs", "Loom", "Claude or ChatGPT for the analysis", "Calendly for scheduling"],
    realWorldExample: "A finance ops manager at a 200-person company sold the same audit she ran internally to 4 of her industry peers. $6,000 in 3 weeks while still in her W-2.",
    ctaLine: "Inside the Collective, members workshop their first audit live with an operator who's run 50+ of them.",
  },
  {
    id: "offer-engineering",
    category: "build-a-business",
    number: "02",
    title: "Stop selling your hours. Sell a fixed-scope AI workflow build.",
    hook: "Hourly billing is the trap. You cap out at the hours you have outside your day job — usually 10–15 a week — and you can never quit. Productized AI builds collapse the hours and hold the price.",
    steps: [
      "Take the workflow from Play 01 and define a fixed scope: input, output, exact deliverable.",
      "Price it at 10x your hourly rate. The price is the price regardless of whether it takes 4 hours or 14.",
      "Pre-build the AI components in advance. Each new client is a 70% pre-built deployment, not a from-scratch build.",
      "Stack 3 productized offers across $2k / $5k / $10k tiers so prospects self-select up.",
    ],
    toolsToUse: ["Cursor", "Make or n8n for the workflow plumbing", "Notion for the SOW template", "Stripe Payment Links"],
    realWorldExample: "An ex-McKinsey consultant productized a 'data cleanup → AI-tagged CRM' build. Started at $2,500. Now sells the same build at $9,500 in 7 days because 90% of the work is pre-built.",
    ctaLine: "The Collective curriculum spends an entire week on the unlearning process. It's the single most valuable shift in the program.",
  },
  {
    id: "internal-champion",
    category: "transform-from-within",
    number: "03",
    title: "Become the AI champion at your day job before anyone else does.",
    hook: "Your company is going to deploy AI eventually. The person who shows up with a working pilot — not a slide deck — becomes the indispensable hire. This play makes you that person.",
    steps: [
      "Pick one manual process inside your team that you personally do.",
      "Build a Cursor + Claude prototype that handles 80% of it. Don't ask permission, just build it on your own time.",
      "Run it for 2 weeks in parallel with your manual work. Document the time saved.",
      "Present the results to your manager as a 1-pager: 'I built this. Here's the time saved. Here's what scaling it would look like.' You're now the AI person.",
    ],
    toolsToUse: ["Cursor", "Claude", "Loom for the 60-second demo", "Google Docs for the 1-pager"],
    realWorldExample: "A product manager at a B2B SaaS company built a Claude-powered customer feedback summarizer in a weekend. Got moved into a brand-new 'AI strategy' role 90 days later — no title change request needed.",
    ctaLine: "Collective members workshop these internal pitches and the deployment plans together — you get the language to make leadership say yes.",
  },
  {
    id: "side-client-network",
    category: "build-a-business",
    number: "04",
    title: "Run your first 5 audits inside your existing network. Don't run cold email yet.",
    hook: "Cold outbound is what people do when they've already exhausted warm. You haven't. Your LinkedIn has 500 connections — most of them lead a team. Five 'free pilot' offers is a 30-minute message campaign, not a 30-day cold email build.",
    steps: [
      "Open LinkedIn. Filter your connections to anyone who manages a team (any function).",
      "Pick 10. Send each one a personalized 3-line message offering a free 30-min audit of their most manual workflow.",
      "Out of 10, 3-5 will say yes. That's your free pilot batch.",
      "Run the audits. 1-2 of them will convert into a paying engagement on the spot. The other 2-3 become your case studies and your referrals.",
      "At the end of each audit, always ask: 'Who else on your team or in your network has this same problem?' — this single question turns 5 pilots into 15 conversations.",
    ],
    toolsToUse: ["LinkedIn", "Loom for the audit walkthrough", "Google Docs for the audit deliverable", "Notion for tracking", "Apollo (for finding contact info at scale once you've identified your target niche)"],
    realWorldExample: "A sales operations manager messaged 12 LinkedIn connections asking for free pilot slots. Got 5 yeses, 2 paying clients ($3,500 each), 1 referral that became her highest-paying client, and 4 testimonials — all in 14 days.",
    ctaLine: "The Collective's Slack has a #pilot-pipeline channel where members swap pilot conversations and refine each other's outreach scripts.",
  },
  {
    id: "expert-positioning",
    category: "build-a-business",
    number: "05",
    title: "Pick a ridiculously narrow vertical. Own it inside 60 days.",
    hook: "Generalist AI consultants get ignored. 'AI for dental practice managers' gets calls returned. Your domain expertise from your W-2 is your moat — use it.",
    steps: [
      "Pick the most specific possible vertical you can credibly speak to from your W-2. Do NOT wait until your content is perfect — post the first piece within 7 days of picking your niche, even if it's rough. Speed of action beats perfection here.",
      "Write 12 LinkedIn posts about AI inside that vertical over 30 days. One post per problem you've actually solved.",
      "Repurpose each post into a 90-second Loom and post to YouTube with the same title as the LinkedIn post.",
      "Add 'AI for [your vertical]' to your LinkedIn headline. Your inbound conversations triple inside 6 weeks.",
    ],
    toolsToUse: ["LinkedIn", "Loom", "ChatGPT or Claude for first drafts", "Buffer for scheduling"],
    realWorldExample: "An HR ops director niched into 'AI for franchise compliance teams.' 90 days of LinkedIn posts. Now has 4 retainer clients in the same industry and gets 2 inbound referrals a month from former W-2 colleagues.",
    ctaLine: "The Collective's positioning teardowns happen monthly — members get their LinkedIn, website, and offers reviewed by operators in adjacent verticals.",
  },
  {
    id: "ai-augmented-job",
    category: "transform-from-within",
    number: "06",
    title: "Use AI to do your W-2 in 60% of the time. Bank the rest of the day for your business.",
    hook: "Most of your day job is a series of small repeatable tasks dressed up as 'work.' If you build a personal AI workflow around them, your output stays the same and your hours collapse. The reclaimed hours fund everything.",
    steps: [
      "Audit your last 4 weeks. Tag every recurring task: emails, status updates, slide prep, data pulls, summaries.",
      "Build a Claude project (or Cursor workspace) that handles each one with your specific context loaded.",
      "Run it in parallel for 2 weeks. Once you trust it, your day job collapses by 30-50%.",
      "Use the reclaimed hours for client work, content production, and the Collective community time.",
    ],
    toolsToUse: ["Claude Projects", "Cursor", "Notion AI", "Granola (passive AI notes — join a call and get a full transcript automatically without touching anything)"],
    realWorldExample: "A senior product designer at a fintech runs her entire weekly status reports + design QA cycle through Claude Projects. Gets her W-2 done by Wednesday afternoon. The other two days are her client work.",
    ctaLine: "The Collective has a 'workflow library' members contribute back into — every prompt, every Claude project setup, every Cursor workspace someone shipped.",
  },
  {
    id: "voice-agent-lead-gen",
    category: "build-a-business",
    number: "07",
    title: "Build an AI voice agent for inbound qualification and resell it to 10 local businesses.",
    hook: "Local service businesses are bleeding leads because nobody answers the phone outside business hours. A $500 setup fee + $200/mo for an AI voice agent that books appointments 24/7 is a no-brainer for them — and a recurring revenue base for you.",
    steps: [
      "Build one reference deployment using Bland.ai or Vapi for a local service business in your network.",
      "Document the build in a Loom and turn it into your sales asset.",
      "Walk into 20 local businesses (HVAC, dental, med spa, contractor) with the Loom. Setup fee + retainer.",
      "Once you have 5 clients, hire a contractor on Upwork to handle setups and you become the 'sales + relationship' layer.",
    ],
    toolsToUse: ["Assistable (recommended for GHL users)", "Vapi", "Retell AI", "GoHighLevel (GHL) for CRM + telephony routing", "Stripe for billing"],
    realWorldExample: "A former corporate IT manager spun up 12 AI voice agents for local home service businesses in 6 months using Assistable for the voice layer and GHL for CRM and telephony routing. $2,400/month recurring at month 6. Quit his W-2 at month 8.",
    ctaLine: "The Collective has a dedicated track on AI voice deployments — pricing models, escalation logic, and the operators who've already shipped 50+.",
  },
  {
    id: "newsletter-authority",
    category: "build-a-business",
    number: "08",
    title: "Launch a hyper-niche AI newsletter for your industry vertical.",
    hook: "A newsletter with 500 hand-curated subscribers in a single vertical is worth more than 10,000 generic followers. It becomes the demand-gen engine for everything else you do.",
    steps: [
      "Pick the vertical you know best from your W-2. Commit to a weekly send.",
      "Each issue: one specific AI use case you saw or built that week, in plain language, with a screenshot or Loom.",
      "Drive subscribers from LinkedIn posts, conference networking, and your existing W-2 contacts.",
      "After 90 days, run a single 'office hours' offer to the list. The early subscribers will book.",
    ],
    toolsToUse: ["Beehiiv or Substack", "Claude for first drafts", "Loom for visuals", "Senja for collecting testimonials", "Perplexity (for researching each week's AI use case before writing about it)"],
    realWorldExample: "A B2B marketing director launched 'AI for B2B marketing ops' on Beehiiv. Hit 800 subscribers in 4 months purely from LinkedIn. Now closes 2-3 retainer clients per month from inbound newsletter replies.",
    ctaLine: "The Collective publishes our internal cold email + newsletter outbound playbooks — exact subject lines, exact open rates, the works.",
  },
  {
    id: "ai-content-machine",
    category: "build-a-business",
    number: "09",
    title: "Sell AI-powered LinkedIn content production as a $2k/mo retainer to executives.",
    hook: "Every executive knows they 'should be on LinkedIn' and almost none of them do it consistently. If you can ghost-write their voice with AI in 90 minutes a week, the math is obvious.",
    steps: [
      "Build a Claude Project with one executive's voice loaded as the system prompt. Paste 30+ of their old LinkedIn posts, any blog posts they've written, and a Granola transcript from a recent call as the voice training material.",
      "Generate 5 posts a week, refine in 30 min, schedule via their LinkedIn.",
      "Charge $2,000/mo as a 'LinkedIn ghostwriting + AI engagement reply' retainer.",
      "Ship one client first. Their results become your sales asset for the next 5.",
    ],
    toolsToUse: ["Claude Projects", "Buffer or Hypefury", "Notion for editorial calendar", "Loom for status updates"],
    realWorldExample: "A copywriter at a consulting firm productized this exact offer. Six executive clients at $2k/mo each = $12k MRR. Quit her W-2 at month 9.",
    ctaLine: "The Collective has the prompt library and the voice-tuning playbook for this exact offer — it's one of the highest-conversion services in the alpha cohort.",
  },
  {
    id: "internal-automation-pitch",
    category: "transform-from-within",
    number: "10",
    title: "Pitch a 90-day 'AI pilot program' to your CEO.",
    hook: "Your CEO is panicking about AI quietly. They want to look smart in front of the board but they don't know what to actually do. You can be the person who shows up with the answer.",
    steps: [
      "Document 5 specific manual workflows inside your company that AI could automate. Real workflows, with real time/cost estimates.",
      "Build a 1-page pilot proposal: 'Here's the workflow, here's the AI build, here's the 30-day measurement plan, here's the projected ROI.'",
      "Pitch your CEO directly. Ask for budget for one pilot — $3-5k of tools + your time outside core role.",
      "Ship the pilot. Document everything. Present results at the next board meeting. You're the AI person.",
    ],
    toolsToUse: ["Notion for the 1-pager", "Cursor or Make for the build", "Loom for the demo video"],
    realWorldExample: "A senior analyst at a 500-person services firm pitched a 'sales handoff automation' pilot to her CEO. Built it in 3 weeks with Claude + Make. Saved $80k/year of manual work. Got promoted to a brand-new 'Director of AI Operations' role within 60 days of the pilot results.",
    ctaLine: "The Collective has a library of internal AI pilot proposals operators have actually used to get CEO buy-in. Every one that worked.",
  },
  {
    id: "consultant-displacement",
    category: "build-a-business",
    number: "11",
    title: "Replace a $20k/mo consulting firm with a productized AI deliverable.",
    hook: "Mid-market companies are paying boutique consultancies $15-30k/mo for work an AI workflow could do in days. You don't need to compete on prestige — you compete on speed and price.",
    steps: [
      "Identify a specific consulting deliverable in your industry (market research report, customer segmentation, competitive analysis).",
      "Build a Claude + Firecrawl + structured prompt workflow that produces the same deliverable in 4 hours.",
      "Price the productized version at $3,500-$5,000 — 1/4 of what the consultancy charges, 10x the margin.",
      "Sell to companies that have already paid for the consulting version. Show them the same output at the lower price.",
    ],
    toolsToUse: ["Claude (Sonnet or Opus)", "Firecrawl", "Cursor", "Notion for delivery", "Canva for visual polish", "Perplexity (for deep research before building the report pipeline)"],
    realWorldExample: "A former management consultant productized her 'competitive intelligence report' offering using Claude + Firecrawl. Went from billing 80 hours per report to 6 hours. Now sells 8-10 per month at $3,800 each.",
    ctaLine: "The Collective has a working library of these productized consulting offers — the prompt chains, the deliverable templates, the pricing pages.",
  },
  {
    id: "no-code-saas",
    category: "build-a-business",
    number: "12",
    title: "Ship a single-purpose AI tool as a $39/mo no-code SaaS.",
    hook: "You don't need to build a 'real' SaaS to get to $5k/mo. Lovable, Bolt, and Cursor let you ship a working tool in a weekend. Pick one painful problem in your vertical, build the smallest possible solution, charge for it.",
    steps: [
      "Pick the simplest possible AI tool your industry would pay for monthly.",
      "Build it in Lovable or Bolt over a weekend. Don't optimize for scale — optimize for shipping.",
      "Use Stripe + a Notion landing page for billing. No fancy onboarding.",
      "Get 100 paying customers at $39/mo from your existing network and LinkedIn before you even think about ads. That's $3,900 MRR — most of the way to quitting your W-2.",
    ],
    toolsToUse: ["Lovable or Bolt or v0", "Cursor for the polish pass", "Stripe Payment Links", "Resend for transactional email", "Vercel for hosting"],
    realWorldExample: "A product manager at an e-commerce platform shipped 'AI product description generator for Shopify stores' in a weekend on Lovable. Got to 140 customers at $29/mo in 5 months purely from a single Twitter thread that went viral.",
    ctaLine: "The Collective workshops the vertical-specific micro-SaaS plays members ship — picking the right wedge is half the battle and the community accelerates that decision.",
  },
  {
    id: "ai-audit-productized",
    category: "build-a-business",
    number: "13",
    title: "Turn the AI audit into a $497/month recurring 'AI Health Check' retainer.",
    hook: "Most operators do one audit and wonder where the next client comes from. The operators who scale turn the audit into a monthly retainer: every month, a 30-minute check-in, a 1-page update, and one new automation opportunity identified. It takes 30 minutes of your time. It generates $497 per month per client indefinitely.",
    steps: [
      "After delivering the initial audit, propose a 'Monthly AI Health Check' retainer at $497/month before the final audit call ends.",
      "Each month: schedule a 30-minute Granola-recorded check-in call, review what's working and what's breaking, identify one new automation opportunity.",
      "Deliver a 1-page AI Health Check update using Claude: 5 minutes to generate the structure, 10 minutes to refine with your observations from the call.",
      "After 3 months of health checks, you have enough trust and context to propose a full implementation engagement — your conversion rate from health check to implementation is over 60% in the Collective.",
      "One audit + health check retainer per client compounds: audit ($1,500 one-time) → health check ($497/mo) → implementation ($5,000–$15,000) → ongoing retainer ($1,500–$3,000/mo) → referral to their network.",
    ],
    toolsToUse: ["Granola (for call capture and automatic notes)", "Claude (for the 1-page update draft)", "Notion (for the deliverable template)", "Calendly or GoHighLevel (for recurring booking)", "Stripe (for recurring billing)"],
    realWorldExample: "A former project manager ran 8 AI audits in her first 90 days at $1,500 each ($12,000 in project revenue). Converted 5 into monthly health checks at $497/month ($2,485 MRR from health checks alone at month 4 — before closing a single implementation project). By month 9, 3 of those 5 health check clients had signed implementation projects averaging $8,500 each.",
    ctaLine: "The Collective's curriculum covers the exact audit framework, the health check template, and the word-for-word transition pitch from audit to retainer.",
  },
]
