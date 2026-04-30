/**
 * Content pipeline for programmatically creating AI Operator Collective
 * course modules, lessons, posts, and community content via Mighty Networks API.
 *
 * This pipeline:
 * 1. Creates spaces (courses) with proper structure
 * 2. Adds sections and lessons with AI-generated content
 * 3. Publishes articles and posts for community engagement
 * 4. Creates events for recurring calls
 * 5. Sets up engagement (polls, tags, badges)
 */

import {
  createSpace,
  createCollection,
  createCoursework,
  updateCoursework,
  createPost,
  createEvent,
  createPoll,
  createTag,
  listCoursework,
  MIGHTY_IDS,
} from "./index"
import type {
  MightySpace,
  MightyCoursework,
  MightyPost,
  MightyCollection,
  MightyTag,
  CourseworkStatus,
  CompletionCriteria,
  UnlockingCriteria,
} from "./types"
import { logger } from "@/lib/logger"

// ─── Course Module Builder ───────────────────────────────

export interface CourseModuleDefinition {
  name: string
  sections: CourseSectionDefinition[]
}

export interface CourseSectionDefinition {
  title: string
  lessons: CourseLessonDefinition[]
}

export interface CourseLessonDefinition {
  title: string
  description: string
  completionCriteria?: CompletionCriteria
  unlockingCriteria?: UnlockingCriteria
}

/**
 * Build a complete course module in the Mighty Networks community.
 * Creates a space → sections → lessons with proper hierarchy.
 */
export async function buildCourseModule(
  module: CourseModuleDefinition,
  options: {
    collectionId?: number
    status?: CourseworkStatus
    sequential?: boolean
  } = {}
): Promise<{
  space: MightySpace | null
  sections: MightyCoursework[]
  lessons: MightyCoursework[]
}> {
  const {
    status = "hidden",
    sequential = true,
  } = options

  const result: {
    space: MightySpace | null
    sections: MightyCoursework[]
    lessons: MightyCoursework[]
  } = { space: null, sections: [], lessons: [] }

  // Step 1: Create the course space
  const space = await createSpace({ name: module.name })
  if (!space) {
    logger.error("[Mighty] Failed to create course space", module.name, {
      action: "buildCourseModule",
    })
    return result
  }
  result.space = space

  // Step 2: Get the overview (auto-created with the space)
  const existing = await listCoursework(space.id)
  const overview = existing.find((cw) => cw.type === "overview")
  const parentId = overview?.id

  // Step 3: Create sections and lessons
  for (const section of module.sections) {
    const sectionItem = await createCoursework(space.id, {
      type: "section",
      parent_id: parentId,
      title: section.title,
      status,
    })

    if (!sectionItem) {
      logger.warn(`[Mighty] Failed to create section: ${section.title}`, {
        action: "buildCourseModule",
      })
      continue
    }

    result.sections.push(sectionItem)

    // Create lessons within the section
    for (const lesson of section.lessons) {
      const lessonItem = await createCoursework(space.id, {
        type: "lesson",
        parent_id: sectionItem.id,
        title: lesson.title,
        description: lesson.description,
        status,
        completion_criteria: lesson.completionCriteria ?? "visited",
        unlocking_criteria: sequential
          ? (lesson.unlockingCriteria ?? "sequential")
          : "none",
      })

      if (lessonItem) {
        result.lessons.push(lessonItem)
      } else {
        logger.warn(`[Mighty] Failed to create lesson: ${lesson.title}`, {
          action: "buildCourseModule",
        })
      }
    }
  }

  logger.info(
    `[Mighty] Built course "${module.name}": ${result.sections.length} sections, ${result.lessons.length} lessons`,
    { action: "buildCourseModule" }
  )

  return result
}

/**
 * Publish all coursework items in a course space (set status to "posted").
 */
export async function publishCourse(spaceId: number): Promise<number> {
  const items = await listCoursework(spaceId)
  let published = 0

  for (const item of items) {
    if (item.status !== "posted") {
      const updated = await updateCoursework(spaceId, item.id, {
        status: "posted",
      })
      if (updated) published++
    }
  }

  return published
}

// ─── Article/Post Publisher ──────────────────────────────

export interface ArticleDefinition {
  title: string
  body: string
  spaceId?: number
  notify?: boolean
}

/**
 * Publish an article to a space in the community.
 * Defaults to the Activity Feed space.
 */
export async function publishArticle(
  article: ArticleDefinition
): Promise<MightyPost | null> {
  return createPost(
    {
      space_id: article.spaceId ?? MIGHTY_IDS.spaces.activityFeed,
      title: article.title,
      description: article.body,
      post_type: "article",
    },
    article.notify ?? false
  )
}

/**
 * Publish a batch of articles to a space.
 * Adds a small delay between posts to avoid rate limits.
 */
export async function publishArticleBatch(
  articles: ArticleDefinition[]
): Promise<MightyPost[]> {
  const results: MightyPost[] = []

  for (const article of articles) {
    const post = await publishArticle(article)
    if (post) results.push(post)

    // Small delay to respect rate limits (100 req/min)
    await new Promise((resolve) => setTimeout(resolve, 700))
  }

  return results
}

// ─── Recurring Event Creator ─────────────────────────────

export interface RecurringEventDefinition {
  title: string
  description: string
  spaceId?: number
  dayOfWeek: string
  startTime: string
  durationMinutes: number
  timeZone?: string
  link?: string
  frequency?: "weekly" | "daily" | "monthly"
}

/**
 * Create a recurring community event (e.g., weekly Office Hours).
 */
export async function createRecurringEvent(
  event: RecurringEventDefinition
) {
  const now = new Date()
  const tz = event.timeZone ?? "America/New_York"

  // Find the next occurrence of the specified day
  const dayMap: Record<string, number> = {
    SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
  }
  const targetDay = dayMap[event.dayOfWeek.toUpperCase()] ?? 1
  const currentDay = now.getDay()
  const daysUntil = (targetDay - currentDay + 7) % 7 || 7
  const nextDate = new Date(now)
  nextDate.setDate(now.getDate() + daysUntil)

  const [hours, minutes] = event.startTime.split(":").map(Number)
  nextDate.setHours(hours, minutes, 0, 0)

  const endDate = new Date(nextDate.getTime() + event.durationMinutes * 60_000)

  return createEvent({
    title: event.title,
    description: event.description,
    starts_at: nextDate.toISOString(),
    ends_at: endDate.toISOString(),
    event_type: "online_meeting",
    space_id: event.spaceId ?? MIGHTY_IDS.spaces.callsEvents,
    time_zone: tz,
    link: event.link,
    rsvp_enabled: true,
    post_in_feed: true,
    frequency: event.frequency ?? "weekly",
    interval: 1,
  })
}

// ─── Engagement Setup ────────────────────────────────────

/**
 * Create the standard set of member tags for the AI Operator Collective.
 */
export async function setupCommunityTags(): Promise<MightyTag[]> {
  const tagDefinitions = [
    { title: "New Member", description: "Recently joined the community", color: "#4CAF50" },
    { title: "Community", description: "Community tier member", color: "#2196F3" },
    { title: "Accelerator", description: "Accelerator tier member", color: "#FF9800" },
    { title: "Inner Circle", description: "Inner Circle tier member", color: "#981B1B" },
    { title: "Course Complete", description: "Completed the operator playbook", color: "#9C27B0" },
    { title: "Active Contributor", description: "Regularly contributes to discussions", color: "#00BCD4" },
    { title: "AIMS Client", description: "Active AIMS platform client", color: "#C4972A" },
  ]

  const tags: MightyTag[] = []
  for (const def of tagDefinitions) {
    const tag = await createTag(def)
    if (tag) tags.push(tag)
    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  return tags
}

/**
 * Create an engagement poll in the community.
 */
export async function createEngagementPoll(
  title: string,
  choices: string[],
  spaceId?: number
) {
  return createPoll({
    poll_type: "multiple_choice",
    space_id: spaceId ?? MIGHTY_IDS.spaces.activityFeed,
    title,
    choices,
    notify: true,
  })
}

// ─── AI Operator Collective Course Catalog ───────────────
// These are the module definitions ready to be pushed to the community.

export const AI_OPERATOR_MODULES: CourseModuleDefinition[] = [
  {
    name: "Module 1: AI Operator Foundations",
    sections: [
      {
        title: "Getting Started",
        lessons: [
          {
            title: "What Is an AI Operator?",
            description: `<h2>What Is an AI Operator?</h2>
<p>Before you buy a single course or install a single tool, you need to understand what this role actually is — because it is not what most people online are selling you. An AI Operator is someone who helps businesses implement and manage AI systems that produce measurable results. Not slide decks. Not strategy memos. Working systems.</p>
<h3>The Tools Operators Actually Use Every Day</h3>
<p>Here is the honest answer to what a productive day looks like for a working operator:</p>
<ul>
<li><strong>Claude</strong> — the default for anything where output quality matters. Strategy documents, client-facing writing, code reviews, proposals, long-form reasoning, debugging. When something needs to be good enough to send to a client or publish, it goes through Claude.</li>
<li><strong>Granola</strong> — passive meeting notes. You join a call, Granola runs in the background, and afterward you have a full transcript with AI-generated summaries. No typing, no distraction, nothing missed. This is the single biggest productivity unlock in the past year.</li>
<li><strong>Make or N8N</strong> — one of these runs behind nearly every client workflow. Make for speed and visual simplicity. N8N for complex, multi-branch automations that need self-hosting or granular control. Pick one and learn it deeply.</li>
<li><strong>Cursor</strong> — AI-native coding interface with context awareness across an entire codebase. When building client tools, dashboards, or custom applications, this is where it happens.</li>
<li><strong>GoHighLevel (GHL)</strong> — CRM, calendar booking, voice agents, SMS campaigns, email sequences, pipeline management, and landing pages in one platform. The key advantage is white-labeling: create a snapshot of an entire client setup and deploy it across multiple similar clients in minutes.</li>
</ul>
<p>Honorable mentions: Perplexity for research (replaces 80% of Google searches for operators). Claude Code for agentic development where you need autonomous codebase-level work.</p>
<h3>The Mistake That Kills Most New Operators Before They Start</h3>
<p>Analysis paralysis. People spend three months researching tools and have nothing to show for it. The fix is not finding a better research framework — it is stopping the research entirely and going to talk to real businesses about real problems.</p>
<p>The tools become obvious once you understand the problem you are solving. YouTube alone contains years of real-world AI implementation examples. Look up what already exists, study it, go talk to a business owner about their actual frustrations. Stop thinking about tools. Start thinking about problems.</p>
<h3>Key Actions</h3>
<ul>
<li>Install Claude, Granola, and one automation platform (Make or N8N) this week — not both automation platforms, just one</li>
<li>Open Claude and ask it: what problems do small businesses in [your target industry] struggle with that AI could solve?</li>
<li>List three local businesses you could call this week and offer a free 30-minute audit</li>
</ul>`,
          },
          {
            title: "Your First 30 Days",
            description: `<h2>Your First 30 Days as an AI Operator</h2>
<p>The first month is not about building anything. It is about learning enough to know what is worth building — and getting in front of real people who will pay you for it. Most operators skip this phase and pay for it later with months of building things nobody wants.</p>
<h3>Day 1: Your AI Positioning Session</h3>
<p>Before you do anything else, open Claude or ChatGPT and have it interview you. Ask it to help you figure out: what industries do you have real experience in? What companies could you credibly walk into and be taken seriously? What problems have you seen firsthand that AI could address? What tools already exist in your target market? Use this session to get specific about your offer and your target before you waste time going broad.</p>
<h3>Days 2 to 30: Talk to People</h3>
<p>Do not spend this time figuring out what tools to buy. Walk into businesses. Ask for managers. Ask what problems they are dealing with. Cold call. LinkedIn outreach. Reach out to family and friends and offer a free AI audit. Do not suggest anything yet — just listen and learn. The better your questions get, the more deals you will eventually close. This phase feels unproductive. It is actually the most productive thing you can do.</p>
<h3>Days 30 to 60: Define the Offer and Start Building</h3>
<p>Once you know what you want to do — chatbots, CRM automations, voice agents, SEO visibility, lead gen systems — start defining your ideal client profile. Begin scraping leads from Google Maps, Apollo, or LinkedIn. Start reaching out. Build one portfolio piece, even if just for yourself. Map your funnel weekly: what are you offering, who are you offering it to, where is the friction?</p>
<h3>Days 60 to 90: Build Your Presence</h3>
<p>Now you have enough to say something real. Build a simple website using Bolt, Lovable, or Base44. Get a logo from BrandCrowd or generate one with ChatGPT image generation. Start posting content on LinkedIn or X — real screenshots of workflows you have built, real problems you have solved, real client conversations (anonymized). Push your prototype to GitHub. Host it on Vercel. Keep building with Claude Code.</p>
<h3>The Realistic Timeline</h3>
<p>Months 1 to 3: learning the stack, talking to people, figuring out your offer. No real revenue. Most people quit here. Something is happening — you are building the foundation every future dollar will sit on. Months 4 to 6: first one or two paying clients, $2,000 to $5,000 monthly recurring revenue. Months 7 to 12: three to five clients, $8,000 to $15,000 MRR. Months 13 to 18: $15,000 to $25,000 MRR — the window where most people quit their job, not because they feel safe, but because the opportunity cost of staying employed is now higher than the risk of going full-time. Anyone promising W-2 replacement income in 90 days is selling a course, not telling you the truth.</p>
<h3>Key Actions</h3>
<ul>
<li>Schedule your AI positioning session today — minimum 45 minutes with Claude</li>
<li>Book five discovery conversations with business owners in your target industry this week</li>
<li>Do not buy any tool subscriptions until you have had at least ten real conversations with potential clients</li>
</ul>`,
          },
          {
            title: "Choosing Your Niche",
            description: `<h2>Choosing Your Niche</h2>
<p>The single most durable advantage you can have as an AI operator is deep vertical knowledge. AI can be applied to almost any industry — but if you already know the language, the workflows, the frustrations, and the people in a specific vertical, you can apply it in ways a generalist never could. That expertise is your moat.</p>
<h3>The First Rule: Your Niche</h3>
<p>Whatever industry you have meaningful experience in is your starting point. Not because it is comfortable, but because you already understand the problems from the inside. You will sound credible in the first five minutes of a conversation. You will ask questions that make owners feel understood. That alone closes more deals than any outreach template.</p>
<h3>Niches That Work Well</h3>
<p>Small to mid-sized B2B companies with inbound lead flow they cannot handle tend to be the most receptive — medical services, auto dealerships, auction houses, distributors, home services contractors. The ROI math in these niches is obvious: every missed call is a missed booking. When you can say "we recover X missed calls per month, each worth $Y," clients understand immediately because that number translates directly to revenue they recognize as lost.</p>
<h3>Niches That Waste Your Time</h3>
<p>Consumer retail has thin margins and complex buying cycles — hard to show clear ROI. Creative agencies that already think they understand AI are difficult to convince and rarely see you as adding value beyond what they have already attempted. Most damaging: businesses whose actual problem is a broken business model. No automation fixes bad unit economics.</p>
<h3>The Discovery Audit Approach</h3>
<p>Before you define your niche by title, run informal audits. Walk into five businesses in an industry and ask what they would fix if they could. Look for: leads they cannot follow up fast enough, operations they track on spreadsheets or paper, tools that do not talk to each other, finances they do not have real-time visibility into, websites that do not convert. The niche that keeps surfacing the same two or three problems is the niche worth owning. You are not choosing a niche based on what sounds impressive — you are choosing it based on where problems are consistent, urgent, and visible enough to command a real budget to fix.</p>
<h3>Key Actions</h3>
<ul>
<li>List the three industries where you have the deepest work experience or personal connection</li>
<li>For each industry, write down the top three operational problems you have personally witnessed or heard about</li>
<li>Run one informal discovery audit — walk into a local business this week and ask about their biggest operational frustrations, with no pitch attached</li>
</ul>`,
          },
        ],
      },
      {
        title: "Mindset and Positioning",
        lessons: [
          {
            title: "The Operator Mindset",
            description: `<h2>The Operator Mindset</h2>
<p>The gap between operators who build real practices and those who stall indefinitely is not technical skill. It is not even network or experience. It is the willingness to ship something imperfect and learn from reality faster than any course ever taught them. This lesson is about the mental models that consistently separate the ones who break through.</p>
<h3>Speed of Action Over Speed of Learning</h3>
<p>Winners ship usable things in their first week and iterate. People still in the "learning phase" at month six are not building a practice — they are building a comfort zone. The market teaches you faster than any course. A working v1 that a real client uses for 30 days will teach you more than 200 hours of tutorial content. Stop optimizing for feeling ready. Start optimizing for getting feedback.</p>
<h3>Analysis Paralysis Is the Real Threat</h3>
<p>The biggest mistake new operators make is spending months researching tools and having nothing to show for it. They watch YouTube. They compare platforms. They build elaborate comparison spreadsheets. Meanwhile, someone else closed three clients with worse tools and more confidence. The fix is not finding the perfect tool — it is throwing yourself into the problem and letting the tools become obvious. You will never feel ready. Go anyway.</p>
<h3>Always Be Closing — and Be Physically Present</h3>
<p>Talk to people constantly. Put yourself in positions where potential clients will be. Ask to be referred. Show up in person. In-person conversations convert at roughly ten times the rate of cold email because trust builds in minutes, not weeks. If you can be at a coffee shop and strike up a conversation with someone talking about their business problems, do it — people love talking about AI right now, and genuine curiosity from someone who clearly knows what they are doing is rare.</p>
<h3>Charge Real Money Before You Feel Ready</h3>
<p>Operators who are still charging $500 at month twelve because they do not feel confident enough never break through. Charging more forces you to deliver at a higher level, which forces you to become worth it. The price you set signals the category you are in. Set it too low and you attract clients who will drain you for every dollar. Set it at a real number and you attract clients who take the engagement seriously. Price is not something you earn your way into — it is something you decide.</p>
<h3>Key Actions</h3>
<ul>
<li>Identify one thing you have been "researching" for more than two weeks — ship a version of it this week even if it is rough</li>
<li>Write down your current pricing. If it is below $1,500 for a setup engagement, rewrite it at double and practice saying the new number out loud</li>
<li>Schedule one in-person meeting with a business owner this week — coffee, a walk, anything that gets you in the same room</li>
</ul>`,
          },
          {
            title: "Pricing Your Services",
            description: `<h2>Pricing Your Services</h2>
<p>Most new operators undercharge by a factor of three or more. This lesson gives you the structure that prevents that mistake — and the framework for evolving your pricing as your practice grows.</p>
<h3>How Pricing Evolves</h3>
<p>Early engagements should be priced to get your foot in the door and build case studies, not to maximize revenue. Work for free or at steep discounts on your first one or two projects in order to prove you can deliver. A case study with real numbers — calls recovered, appointments booked, hours saved, revenue generated — is worth ten times what you would have charged for that first project. The case study is the asset. The early revenue is incidental.</p>
<p>Raise your prices when demand exceeds your capacity. When you cannot take a new client without sacrificing delivery quality on existing ones, that is your signal. Do not wait until it feels comfortable — it never will.</p>
<h3>The Three-Layer Pricing Structure</h3>
<ul>
<li><strong>Layer 1 — Setup fee (one-time):</strong> Covers discovery, integration, initial build, testing, and deployment. Price this for the complexity and risk involved, not the hours. A simple automation might be $1,500. A voice agent integrated into a legacy phone system might be $5,000.</li>
<li><strong>Layer 2 — Monthly retainer (recurring):</strong> Covers ongoing optimization, monitoring, reporting, prompt tuning, and iteration. Tier this by usage volume, number of workflows, or number of locations. This is your predictable income.</li>
<li><strong>Layer 3 — Usage pass-throughs (variable):</strong> API costs, dialer minutes, SMS sends, email infrastructure. Mark these up modestly or pass through at cost — never absorb them.</li>
</ul>
<h3>A Real Pricing Example</h3>
<p>An AI voice agent for recall outreach at an auto dealership: $1,500 setup plus $500 per month. Intentionally priced below standard market rate because this particular dealership group has twenty-plus locations. The first location proves ROI. Then the same system rolls out to the remaining nineteen. The per-location retainer at scale is where the real revenue lives. Price the first engagement to win the relationship, not to maximize the invoice.</p>
<h3>The Minimum Viable Offer</h3>
<p>Pick one automation, for one niche, at one price. Not a menu of services. Not a full-service AI agency. One thing. For example: "I build AI receptionists for dental offices. $2,500 setup, $500 per month. Answers after-hours calls, books appointments on your calendar, texts the caller a confirmation. If it does not recover at least $X in missed revenue within 60 days, you do not pay the second month." This works because the client knows exactly what they are getting. You know exactly what you are building. There is no scope creep because scope was defined before the conversation started. A single productized offer beats a full-service positioning every time when you are starting out.</p>
<h3>Three-Month Upfront Option</h3>
<p>Offer clients the option to pay three months of retainer upfront in exchange for waiving the setup fee. They save money and you get commitment plus runway to show ROI. Showing results takes time — a client who churns at month two never saw the full value. Getting them to month four with a prepayment dramatically improves retention and gives you working capital.</p>
<h3>Key Actions</h3>
<ul>
<li>Write down your minimum viable offer — one automation, one niche, one price, one guarantee — in two sentences</li>
<li>Build a simple proposal template with all three pricing layers laid out clearly</li>
<li>Identify your first target case study engagement and decide what you will offer in exchange for permission to document results publicly</li>
</ul>`,
          },
        ],
      },
    ],
  },
  {
    name: "Module 2: Client Acquisition",
    sections: [
      {
        title: "Finding Clients",
        lessons: [
          {
            title: "The Outreach Playbook",
            description: `<h2>The Outreach Playbook</h2>
<p>Getting your first clients is less about finding the perfect message and more about building the right system underneath it. Most operators focus on the copy and ignore the infrastructure. The infrastructure determines whether your outreach even gets seen — and it matters more than any subject line.</p>
<h3>Landing the First Client: The Free Audit Approach</h3>
<p>The most reliable way to get your first engagement is to run an AI audit before anyone has given you money. Show up to a business, ask the right questions, and identify real problems: lead generation gaps, slow response times, tools that do not talk to each other, manual tracking on spreadsheets, finances with no real-time visibility. Be genuinely curious — people are far more willing to work with someone who asks smart questions than someone who arrives with a pitch.</p>
<p>Get your foot in the door by offering to solve one specific problem at no cost. Do not ask for money upfront unless you have strong existing case studies. A single free audit can turn into a multi-solution ongoing engagement because you earned the right to expand scope by delivering on the first thing. The more access you get — to their CRM, their P&L, their lead pipeline, their call recordings — the more problems you will find.</p>
<h3>Cold Outreach Infrastructure</h3>
<p>When you are ready to scale outreach, infrastructure matters more than copy. The standard stack that works at volume:</p>
<ul>
<li><strong>Instantly</strong> — email sending and warmup. Deliverability depends on sending from warmed domains, not your primary domain.</li>
<li><strong>Apollo</strong> — contact data sourcing. Title, company, email, phone.</li>
<li><strong>Clay</strong> — enrichment and personalization at scale. This is where AI sits on top of the contact data to generate lines specific to each prospect.</li>
</ul>
<h3>Message Structure That Gets Replies</h3>
<p>Three lines, specific and true:</p>
<ul>
<li><strong>Line 1:</strong> Something specific and accurate about their business that a bot could not have written — a recent post they made, a location they just opened, a hire they announced, a review they received. One sentence that proves you actually looked.</li>
<li><strong>Line 2:</strong> A specific outcome tied to a dollar amount or time figure from a comparable client. Not "we help businesses like yours" — a real number from a real result.</li>
<li><strong>Line 3:</strong> One low-commitment question. Not a calendar link. Not a pitch deck. One question that is easy to answer yes or no to.</li>
</ul>
<p>Avoid: emojis, "hope this finds you well," calendar links in the first message, paragraphs about your company history. The goal of the first message is to get a reply, not to close a deal.</p>
<h3>Key Actions</h3>
<ul>
<li>Identify five businesses you could walk into this week and offer a free AI audit — no pitch, just questions</li>
<li>Set up one warmed sending domain in Instantly before running any cold email at scale</li>
<li>Write three versions of your opening line using the specificity framework above and send them to ten prospects each to test which performs best</li>
</ul>`,
          },
          {
            title: "The Discovery Call Framework",
            description: `<h2>The Discovery Call Framework</h2>
<p>A discovery call that converts is not a sales pitch. It is a diagnostic session where you do most of the listening and almost none of the talking. The goal is to understand the problem deeply enough to know whether you can solve it — and whether the prospect is serious enough to pay for the solution.</p>
<h3>The Question That Separates Buyers from Tire-Kickers</h3>
<p>The single most important question in any discovery call is not one question — it is a conversation that builds to this: "If we do not fix this in the next 90 days, what does it cost you?" If they can answer in dollars, they will pay. If they give you a vague answer or wave their hands, you have a tire-kicker. No amount of follow-up will change that.</p>
<p>The conversation structure that gets you to that question naturally: have them walk you through a day at their job. What does their current operation look like? Where do they think they are losing out? What tools do they use? What have they tried before and why did it not work? The last question is critical — it prevents you from pitching the exact thing they just failed at with another vendor.</p>
<h3>How to Talk to Skeptics</h3>
<p>Do not mention AI if you do not have to. Focus on solving their problems. Sound like someone who understands their business. Clients do not care about the technical side — they care about outcomes, timeline, and cost.</p>
<p>When you do need to explain it: treat it like an assistant who has read every email, document, and call transcript in their business, works 24 hours a day, never forgets anything, and costs less than a part-time employee. Not magic — just never tired and never drops a follow-up.</p>
<p>If you can demo, always demo with their actual data. Skepticism dissolves in about 90 seconds when someone sees their own business data being processed in front of them. A generic demo is forgettable. A demo using their real customers and their real products is not.</p>
<h3>Key Actions</h3>
<ul>
<li>Write out your discovery call structure in sequence — opening, workflow walkthrough, cost of inaction question, prior attempts question, next steps</li>
<li>Practice the "what does it cost you" question until you can deliver it naturally in conversation without it feeling like a script</li>
<li>Prepare one demo using sample data structured to look like your target client's industry — have it ready to pull up in any meeting</li>
</ul>`,
          },
          {
            title: "Building Referral Engines",
            description: `<h2>Building Referral Engines</h2>
<p>The best clients you will ever have come through someone who already trusts you. Referrals close faster, require less convincing, and almost never require you to justify your price. But referrals do not happen automatically — they require a system and a habit.</p>
<h3>Trust Earns Access, and Access Surfaces Problems</h3>
<p>The most powerful referral dynamic starts with delivering on the first thing you promised. When a client sees real results from the first engagement, they start giving you more access — to their CRM, their financials, their lead pipeline, their call recordings, their team. The more access you have, the more problems you find. One solved problem that earns deeper access will consistently lead to expanded scope, higher retainers, and introductions to other business owners in their network who face the same problems.</p>
<p>Referrals happen naturally when clients feel like you are genuinely invested in their outcome, not just completing a deliverable. The operators who build referral machines are the ones who treat each engagement like a long-term relationship, not a project with an end date.</p>
<h3>Always Be Closing — Including When You Are Already Working</h3>
<p>Put yourself in positions where clients and potential clients will be. Ask to be referred explicitly — most satisfied clients will never think to refer you on their own, but almost all of them will say yes when you ask directly. Show up in person when you can. In-person conversations convert at roughly ten times the rate of cold email because trust builds in minutes, not weeks.</p>
<p>Talk to people constantly. If you are at a coffee shop and overhear someone discussing a business problem, introduce yourself. People love talking about AI right now — genuine expertise and curiosity from someone who actually builds things is rare and memorable.</p>
<h3>Creating Case Studies That Sell for You</h3>
<p>A documented case study with real numbers — calls handled, appointments booked, hours saved, revenue attributed — does referral work passively. Send it to warm contacts. Post it on LinkedIn. Include it in every proposal. One strong case study with specific metrics is worth more than a dozen testimonials with vague praise. Ask clients for permission to document results from the first day of onboarding, not after the engagement ends.</p>
<h3>Key Actions</h3>
<ul>
<li>After your next client delivery, ask directly: "Do you know two or three other business owners who deal with the same problem we just solved?"</li>
<li>Build a one-page case study template — problem, solution, specific results — and populate it with your first real client outcome</li>
<li>Schedule a monthly check-in with every active client that includes a brief results review — this is the most natural trigger for referral conversations</li>
</ul>`,
          },
        ],
      },
      {
        title: "Closing and Onboarding",
        lessons: [
          {
            title: "Writing Proposals That Close",
            description: `<h2>Writing Proposals That Close</h2>
<p>By the time a prospect receives your proposal, the decision should already be made. The proposal is a formality that confirms what you discussed verbally — not a document designed to convince someone who is still on the fence. If you are relying on the proposal to close the deal, the discovery call did not do its job.</p>
<p>That said, you will face objections. Here is how to handle the five that come up in almost every engagement.</p>
<h3>Objection 1: "We are not ready yet"</h3>
<p>Reframe readiness as a cost. "Not ready" is a statement about comfort, not about timing. Offer a contained 30-day pilot focused on one workflow — no disruption to existing operations, measurable results within 30 days, and they walk away clean if it does not work. This structure removes the risk that is behind the objection.</p>
<h3>Objection 2: "Our team can handle this"</h3>
<p>You are not replacing the team — you are giving them leverage to focus on higher-value work instead of spending ten hours a week on a task that can be automated. Name the specific task. "Instead of your team manually following up on every missed call, the system handles that automatically and flags the ones that need human attention."</p>
<h3>Objection 3: "We tried ChatGPT and it did not work"</h3>
<p>Agreed — raw ChatGPT rarely works in a business context. You are not selling a ChatGPT subscription. You are building a system: AI plus CRM plus calendar plus their actual data plus trained team processes. Then show a dashboard or a working demo. The objection evaporates when they see what a purpose-built system looks like versus a generic prompt box.</p>
<h3>Objection 4: "Will this replace jobs?"</h3>
<p>Be direct. It replaces tasks, not people. If their goal is specifically to reduce headcount, tell them you are not the right fit for that goal. Disqualifying yourself here protects you from a client relationship that will be adversarial from day one — and someone on their team will actively work against the implementation if they believe their job is at risk.</p>
<h3>Objection 5: "This is too expensive"</h3>
<p>Never drop the price. "Compared to what? Let's do the math on what [the specific problem] is currently costing you." Calculate it together. If the problem costs them $8,000 per month in missed revenue or wasted labor and your retainer is $1,500 per month, the math speaks for itself. Dropping price signals that your pricing is negotiable and sets the tone for every future conversation about scope and cost.</p>
<h3>Key Actions</h3>
<ul>
<li>Write out your responses to all five objections and practice them until the responses feel natural and specific to your niche</li>
<li>Create a one-page proposal template that anchors pricing to business impact, not hours worked</li>
<li>Add a "cost of doing nothing" line to every proposal — what does inaction cost them over the next 12 months?</li>
</ul>`,
          },
          {
            title: "Client Onboarding System",
            description: `<h2>Client Onboarding System</h2>
<p>The first 48 hours after a client signs determine the emotional tone of the entire engagement. Most operators underinvest in this phase and pay for it with clients who become anxious, micromanaging, or disengaged before the work even starts. A structured onboarding system prevents all of that.</p>
<h3>Day 1: Welcome Email Within Hours of Signing</h3>
<p>Send a welcome email the same day the contract is signed — ideally within hours. This email should set clear expectations: who the primary point of contact is, what the escalation path looks like if something goes wrong, and a link to a shared workspace where all project documents will live. The goal is to immediately signal that you are organized and that they made the right decision.</p>
<h3>Day 1: Access Request Checklist</h3>
<p>Deliver a complete checklist of every system you need credentials for. CRM logins, phone system access, calendar connections, DNS records if you are setting up email infrastructure, analytics platforms, any existing automation tools. Structure this as a checklist they can work through at their own pace so nothing gets forgotten and you are not chasing credentials for three weeks.</p>
<h3>Within 48 Hours: Kickoff Call</h3>
<p>Schedule a 60-minute kickoff call with the agenda published in advance. Confirm the full scope of the engagement. Walk through the timeline week by week. Identify any blockers that could delay Week 1. Commit to a specific deliverable due by the end of the first week — with a named due date, not a vague timeframe. This call is about creating shared accountability, not just covering administrative ground.</p>
<h3>Days 2 to 5: DNS and Integration Setup (Async)</h3>
<p>Handle domain verification, API connections, CRM integrations, and phone number provisioning asynchronously during the first week. Nothing goes live on Day 1. Everything gets tested in a sandbox first. This discipline prevents the trust-destroying moment where a half-configured system fires on real customer data before it is ready.</p>
<h3>End of Week 1: Something Tangible and Visible</h3>
<p>By Friday of the first week, the client needs to see something real. A working prototype. A configured voice agent making test calls. A dashboard populated with their actual data. A completed audit with specific, actionable recommendations. The deliverable does not need to be perfect — it needs to be concrete. If they do not see something tangible by end of Week 1, you have lost them emotionally even if the contract runs 12 more months. Week 1 is about momentum, not perfection.</p>
<h3>Key Actions</h3>
<ul>
<li>Build your welcome email template today — primary contact, escalation path, shared workspace link, next steps</li>
<li>Create your access request checklist and organize it by category: CRM, telephony, calendar, DNS, analytics, existing tools</li>
<li>Define what your standard Week 1 deliverable is for your core offer — make it concrete, visible, and achievable within five business days</li>
</ul>`,
          },
        ],
      },
    ],
  },
  {
    name: "Module 3: AI Implementation Playbooks",
    sections: [
      {
        title: "Core AI Tools",
        lessons: [
          {
            title: "Claude and ChatGPT for Business",
            description: `<h2>Claude and ChatGPT for Business</h2>
<p>The operators who get the most out of AI tools are not the ones who pick one and defend it — they are the ones who understand what each tool is actually good at and route tasks accordingly without thinking twice about it. This lesson gives you the routing logic that experienced operators use every day.</p>
<h3>The Tool Learning Order That Works</h3>
<p>Start with ChatGPT. It builds your prompting instinct and covers a broad range of tasks well enough to get started. Then move to Claude — this is where real work happens. Strategy documents, code reviews, client deliverables, deep research, long-form reasoning. The output quality gap between Claude and other models on complex, nuanced tasks is significant and becomes more obvious the higher the stakes of the output. After you have a working feel for both, learn one automation platform: Make (fastest to learn, most visual, broadest integration library) or N8N (better for complex self-hosted workflows with full control). Pick one, not both. Then GoHighLevel — CRM, calendar, voice agents, SMS, email, funnels, all in one platform. After that, specialize based on what your clients actually need.</p>
<p>Skip any AI course priced over $500. Most of what you need is in the tools themselves, in communities like this one, and in asking the AI directly.</p>
<h3>Claude: The Default for Serious Work</h3>
<p>When the output needs to be good enough to send to a client or publish, it goes through Claude. Strategy documents, writing client-facing proposals, reviewing and debugging code, drafting SOPs, long-form reasoning, building discovery frameworks. Claude handles nuance better, produces cleaner writing, and is more reliable on complex multi-step tasks. When you are working with something that requires actual judgment — not just speed — Claude is the default.</p>
<h3>ChatGPT: Specific Use Cases</h3>
<p>Image generation, quick throwaway tasks, voice-mode conversations, and second opinions on Claude's output. ChatGPT still leads on some real-time voice interactions and is useful for generating rough drafts you plan to heavily edit. When you need something fast and the output quality threshold is lower, ChatGPT is fine. When the output is going to a client, it goes through Claude.</p>
<h3>Perplexity: Research That Replaces Google</h3>
<p>Perplexity replaces about 80% of Google searches for active operators. "What is the current status of X?" "Compare these three vendors." "Find me the primary source on Y." The key advantage is cited sources — when you are handing research to a client, citations matter because they can verify the information and because it signals credibility. Keep all three tools open. The 30 seconds it takes to switch tabs is nothing compared to getting the wrong tool's mediocre output and having to redo the work.</p>
<h3>Key Actions</h3>
<ul>
<li>Spend one week routing every task through the appropriate tool based on the framework above — log which tool you used for what and notice where you get better results</li>
<li>Ask Claude to help you build a standard prompt template for the most common deliverable in your niche</li>
<li>Set up Perplexity as your default for any research task this week and compare results to your previous Google habit</li>
</ul>`,
          },
          {
            title: "Automation with n8n and Make",
            description: `<h2>Automation with n8n and Make</h2>
<p>The real leverage in AI operations is not the AI itself — it is the automation layer that connects AI output to business systems. A perfectly written Claude response that someone has to manually copy into a CRM is not a product. A workflow that captures the trigger, runs the AI, and logs the result in the right system automatically — that is what clients pay recurring fees for.</p>
<h3>The Top Three Automations Worth Building First</h3>
<p><strong>1. AI Voice Agent for Inbound and Outbound Calls.</strong> This is the automation with the most immediately visible ROI. Calls handled, appointments booked, revenue generated — the numbers are concrete and show up fast. Build it once, tune it to a niche, and redeploy it as a snapshot across similar clients. One well-configured voice agent template can be deployed across ten locations of the same business type with minimal customization per site.</p>
<p><strong>2. AI-Driven SEO and AEO Visibility.</strong> Most businesses have no idea they are invisible in AI-powered search — ChatGPT, Perplexity, and Google AI Overviews. Auditing their share of voice and improving their rankings is a high-margin service because the deliverable is data and strategy, not heavy technical builds. The client sees a clear before-and-after.</p>
<p><strong>3. Cold Email Infrastructure with AI Personalization.</strong> You are selling the machine: warmed domains, deliverability monitoring, domain rotation, and a Clay personalization layer on top that generates custom first lines at scale. Clients cannot build this themselves because maintaining deliverability at scale requires significant ongoing technical work. That complexity is your moat.</p>
<h3>The First Automation to Build: Lead Form to CRM to Personalized Email</h3>
<p>This specific automation touches every core primitive you need to master. A form submission triggers Make or N8N, which enriches the contact via Clay or Apollo (company info, title, LinkedIn, recent activity), creates a CRM record, runs the lead data through Claude to generate a personalized first-touch email, and sends it via your email platform. This flow produces obvious measurable business value — responding in two minutes beats responding in two hours, and every business knows it. It is sellable to almost any small business with an inbound form.</p>
<h3>The 5-Step Scoping Process</h3>
<p>Before touching any tool, scope the automation properly:</p>
<ul>
<li><strong>Step 1:</strong> Map the current workflow on paper — every step, handoff, tool, and person involved. If the client cannot map their own workflow, the problem is process, not AI.</li>
<li><strong>Step 2:</strong> Find the highest-friction step — where does work stall, where do errors happen, where are customers waiting? Focus on the most painful step, not the most automatable one.</li>
<li><strong>Step 3:</strong> Define the success metric before picking a tool. "Response time under two minutes." "80% of inbound calls answered on first ring." If you cannot define what success looks like, you cannot define the build.</li>
<li><strong>Step 4:</strong> Pick the smallest viable piece — not the entire workflow, just the one step where AI moves the needle most with the least integration complexity. Ship that, prove it works, then expand.</li>
<li><strong>Step 5:</strong> Plan the failure modes. What happens when the AI gets something wrong? Who is the human in the loop? What is the escalation path?</li>
</ul>
<h3>Key Actions</h3>
<ul>
<li>Build the lead form to CRM to personalized email automation this week — even if just as a personal portfolio piece with dummy data</li>
<li>Choose Make or N8N and commit to it — spend two hours building something real in your chosen platform before evaluating the other</li>
<li>Run the five-step scoping process on your next client conversation before you touch any tooling</li>
</ul>`,
          },
          {
            title: "AI-Powered CRM and Sales",
            description: `<h2>AI-Powered CRM and Sales</h2>
<p>The tools that run an AI operator's business are not the same as the tools that run a client's business — but understanding both is essential. This lesson covers the full stack that powers a professional AI operator practice, with a real client engagement as the case study.</p>
<h3>The Operator Tech Stack</h3>
<p>For CRM and operations: GoHighLevel handles all client-facing communication — CRM, automations, voice agents, SMS, email, pipelines. Close handles internal sales pipeline tracking and outreach to new prospects. For automation: Make for fast, visual, straightforward multi-step workflows. N8N for complex, self-hosted multi-branch logic and custom integrations that need full control. For voice: Assistable or an equivalent voice agent platform connected to GHL for telephony and call routing. For project management: Asana for task management, quarterly goals, and team accountability. Notion for documentation, SOPs, knowledge bases, and internal wikis. For communication: Slack for internal team coordination. GHL for all client-facing messages.</p>
<h3>Real Client Engagement: Auto Dealership Recall Outreach</h3>
<p>This is what a real AI operator engagement looks like from contract to running system. The client is an auto dealership. The problem is recall outreach — proactively calling previous customers when a recall is due, checking in, and booking service appointments. If the customer does not answer, the system leaves a voicemail and sends a follow-up email automatically.</p>
<p><strong>Week 0 (discovery, before contract):</strong> 30-minute call to confirm fit. Confirm access to the phone system, CRM, calendar, and existing call recordings and scripts. Assess whether their technical infrastructure is modern enough — digital calendar, CRM with API access — or whether you will be working around legacy systems.</p>
<p><strong>Week 1 (build):</strong> Configure the voice agent platform. Write conversation flows from actual call transcripts and recall scripts — not generic templates. Connect to their calendar for automated booking. Set outbound call triggers based on their recall schedule. Integrate to the CRM so every interaction is logged. Build voicemail drop and email follow-up sequences for non-answers.</p>
<p><strong>Week 2 (test and deploy):</strong> Internal sandbox testing. Limited live test on one department or one phone line. Monitor every call, review transcripts, catch failures. Then full rollout on the primary line with a reporting dashboard live.</p>
<p><strong>Weeks 3 to 4 (optimize):</strong> Weekly calls reviewing call logs. Tune prompts and conversation flows based on real failures — callers saying something unexpected, the agent not handling an edge case, bookings landing at the wrong time. By end of month one, the agent handles the majority of routine recall outreach without human intervention.</p>
<p><strong>Ongoing retainer:</strong> Monthly monitoring, reporting on calls handled, appointments booked, and revenue attributed. Iteration as the recall schedule changes or as the client expands the system to additional locations.</p>
<h3>Key Actions</h3>
<ul>
<li>Set up your personal GHL account and configure one basic pipeline for tracking your own sales process</li>
<li>Map the tech stack you would use to deliver a voice agent for a client in your target niche — from telephony to CRM to reporting</li>
<li>Write a one-paragraph case study from any real workflow you have built, even a test build — document the problem, the system, and the measurable result</li>
</ul>`,
          },
        ],
      },
      {
        title: "Advanced Implementations",
        lessons: [
          {
            title: "Custom AI Assistants and Chatbots",
            description: `<h2>Custom AI Assistants and Chatbots</h2>
<p>Voice agents and chatbots are among the most visible AI deliverables you can build for clients — and the most misunderstood. The demo almost always works. The implementation almost always hits a wall. Understanding why, and planning for it from day one, is what separates operators who build lasting client relationships from those who churn after 60 days.</p>
<h3>Week-by-Week Engagement Reality</h3>
<p>Here is what a real voice agent implementation looks like from discovery to running system, using the auto dealership recall example as the case study.</p>
<p>Discovery begins before you sign the contract. Spend 30 minutes confirming fit. Get access to call recordings, existing scripts, calendar systems, and CRM before you write a single line of configuration. If they cannot give you access to their real workflows, you are building a generic system that will not work in their specific context.</p>
<p>Week 1 is the build. Configure the agent platform. Write conversation flows from real call transcripts — not from imagination. Connect to the client's actual calendar. Set up trigger logic based on their real schedule or data. Integrate to their CRM so every interaction is automatically logged. Build voicemail drop and follow-up email sequences for the calls that do not get answered. Everything goes into a sandbox first.</p>
<p>Week 2 is testing and deployment. Internal testing, then a limited live test on one department or one phone line. Monitor every call. Review transcripts line by line. Catch the edge cases before they become client-facing failures. Only then does it go live on the primary line with a reporting dashboard.</p>
<p>Weeks 3 and 4 are optimization. Weekly calls reviewing call logs. Real callers say things you did not anticipate. The agent handles 90% of it and fails on the 10% that exposes gaps in the conversation flow. You tune the prompts from real failure data, not hypothetical scenarios. By end of month one, the agent is handling the bulk of routine outreach independently.</p>
<h3>The Last 5% Problem</h3>
<p>Most operators can get 95% of the way to a working solution with generic AI tools. The demo looks great. The client is excited. Then implementation hits reality. That last 5% — connecting AI output to the client's existing CRM, integrating with legacy software that does not have a modern API, getting data to flow into their actual reporting tools — is where everything breaks. This is especially painful with older companies whose operational software predates the API era.</p>
<p>Two principles that prevent this from becoming a crisis: surface-level integrations that plug into the client's existing stack are safer, more sustainable, and easier to maintain than deep replacements. And half of AI services is change management. You are not just shipping software — you are changing how people work. Plan for training. Plan for resistance. Plan for the manager who does not want the system to succeed because it threatens their role. The operators who last are the ones who treat the human side of implementation as seriously as the technical side.</p>
<h3>Key Actions</h3>
<ul>
<li>Before your next client build, document every system the AI output will need to touch — CRM, calendar, phone system, email — and confirm API access for each before week one begins</li>
<li>Write a change management plan for your next implementation that includes who might resist it, why, and how you will address that</li>
<li>Build in a human review step for the first 30 days of every AI system you deploy — do not give the AI full autonomous authority on day one</li>
</ul>`,
          },
          {
            title: "Content and Marketing Automation",
            description: `<h2>Content and Marketing Automation</h2>
<p>Content is how operators build authority that attracts inbound clients — and content automation is one of the highest-margin services you can sell. This lesson covers both: how to systematize your own content creation, and how to build content and visibility systems for clients.</p>
<h3>The Content Creation Process That Actually Works</h3>
<p>The bottleneck in content creation is never the writing. It is always the raw material. If you do not have real things to talk about, no content framework will save you.</p>
<p>Capture raw material constantly. Granola captures every client meeting without you typing a word — afterward you have a full transcript and AI-generated summary of everything discussed. Screenshot dashboards and metrics when they show something interesting. Take voice notes immediately after client calls about lessons learned, problems that came up, or solutions that worked. This capture habit is the foundation.</p>
<p>Batch-write once a week. One focused 60 to 90-minute block per week to turn raw material into three to five posts. Not every day. Sitting down every morning to write from scratch is an inefficient use of the time when you are in active client delivery. Batch it, schedule it, and move on.</p>
<p>Engage live daily — 15 to 20 minutes responding to comments, engaging with other people's posts, and having real conversations. Posts get visibility. Comments and DMs get clients.</p>
<h3>AEO as a Billable Client Service</h3>
<p>Answer Engine Optimization is one of the highest-margin services an operator can offer right now. Most businesses have no idea they are completely invisible in AI-powered search. When someone asks ChatGPT, Perplexity, or Google AI Overviews "who is the best [niche] in [city]?" — your client is probably not in the answer. Auditing that visibility gap and improving it is a compelling service because the deliverable is data and strategy, not heavy technical builds.</p>
<p>The audit itself is simple to demonstrate: ask the AI tools about the client's category and location and show them the results. The invisibility tends to be jarring and creates immediate urgency. Improvement comes from structured content, FAQ pages, authoritative citations from trusted sources, schema markup, and an ongoing content strategy that feeds the AI systems with accurate, organized information about the business. Ongoing monitoring, quarterly reports on share of voice, and content iteration make this a natural retainer service.</p>
<h3>Key Actions</h3>
<ul>
<li>Set up Granola this week and use it in your next three client calls — review the transcripts for content raw material afterward</li>
<li>Block one 60-minute window per week in your calendar for content batching — treat it as a client deliverable, not optional</li>
<li>Run an AEO audit on one business in your target niche by asking three AI tools about them — document what you find and use it as a prospecting asset</li>
</ul>`,
          },
          {
            title: "Data Analysis and Reporting",
            description: `<h2>Data Analysis and Reporting</h2>
<p>AI systems break. Knowing how to troubleshoot them systematically — and how to avoid the technical mistakes that cause most failures — is what keeps clients from churning and keeps your retainers intact. This lesson covers both: a structured troubleshooting process and the six technical mistakes that take down AI implementations at scale.</p>
<h3>The 5-Step Troubleshooting Process</h3>
<p><strong>Step 1: Is this an adoption problem?</strong> Check usage logs first. 80% of client reports that something "is not working" turn out to be that nobody is using it. This requires a change management conversation, not a technical fix. Walk through the logs before touching any system configuration.</p>
<p><strong>Step 2: Is the data clean?</strong> Bad inputs make AI look broken. Audit data quality before adjusting anything else. If the CRM fields are inconsistent, if the calendar is not syncing correctly, if the contact data has gaps — those cause failures that look like AI failures but are not.</p>
<p><strong>Step 3: Is the configuration still correct?</strong> Things drift. Someone edits a field mapping. A calendar setting changes. A CRM structure gets updated without anyone telling you. Compare what was originally shipped to what is currently running before assuming the AI is the problem.</p>
<p><strong>Step 4: Is the integration firing?</strong> Check automation logs for failed runs, webhook errors, and API rate limits. This is where actual breakage lives most of the time — not in the AI layer, but in the connections between systems.</p>
<p><strong>Step 5: Is it an AI model issue?</strong> Rarely the root cause. If you have ruled out the first four steps, now you look at prompts, model behavior, and output formatting. During troubleshooting, communicate every step publicly in the client's shared channel. Walking through your methodology — reporting what you find, showing your work — rebuilds trust faster than any fix. Silence during troubleshooting destroys trust.</p>
<h3>The Six Technical Mistakes That Kill AI Implementations</h3>
<ul>
<li><strong>Over-engineering the first build.</strong> Five tools chained together for a two-tool problem. Every additional tool is another point of failure, another API to monitor, another subscription to pay for. Start with the simplest version that solves the problem.</li>
<li><strong>No monitoring or logging.</strong> Shipping a workflow with no visibility into what is happening is how clients discover failures before you do. Every production workflow needs basic logging and error alerts from day one.</li>
<li><strong>No human in the loop.</strong> Giving AI full authority on day one means the first bad output — wrong appointment time, strange email to a customer — becomes a trust crisis. Always build in a human review step for the first 30 days minimum.</li>
<li><strong>Hardcoded prompts duplicated everywhere.</strong> The same prompt living in ten different workflows means one change requires ten edits and an update missed in one place. Centralize prompts in one location — an Airtable table, a JSON config file, a Notion database — and reference them from workflows.</li>
<li><strong>No version control.</strong> Editing automations live with no changelog means when something breaks, there is no way to roll back. Document every significant change, even just in a Notion doc with a date and description.</li>
<li><strong>Ignoring rate limits and costs.</strong> Works perfectly in testing with ten contacts. Runs in production against 5,000 and generates a $400 API bill, hits rate limits, and gets an email domain flagged for spam. Instrument spend monitoring before scaling any workflow.</li>
</ul>
<h3>Key Actions</h3>
<ul>
<li>Add basic logging and an error alert to every production automation you are currently running — even a simple email alert when a workflow fails</li>
<li>Audit your current active workflows: are any prompts duplicated across multiple workflows that should be centralized?</li>
<li>Build a troubleshooting checklist using the five steps above and use it the next time a client reports an issue before touching any configuration</li>
</ul>`,
          },
        ],
      },
    ],
  },
  {
    name: "Module 4: Scaling Your Practice",
    sections: [
      {
        title: "Systems and Operations",
        lessons: [
          {
            title: "Productizing Your Services",
            description: `<h2>Productizing Your Services</h2>
<p>The operators who scale are not the ones who offer the most services — they are the ones who get very good at delivering one thing repeatedly. Productization is not a limitation on what you can do. It is what makes growth possible without burning out.</p>
<h3>One Offer, Said Five Different Ways</h3>
<p>Pick one automation for one niche at one price. Not a menu. Not a full-service positioning. One specific thing. Then say it five different ways until it is so clear that a prospect understands exactly what they are buying before you finish your first sentence. Here is the template: "I build [specific system] for [specific business type]. [Setup price] to build it, [monthly price] to maintain it. It [does one specific thing that produces one specific outcome]. If it does not [measurable result] within [timeframe], you do not pay the second month."</p>
<p>This format works because the client knows what they are getting, you know what you are building, and there is no scope creep because scope was defined before the first conversation started. A productized single offer beats full-service AI agency positioning every time when you are starting out — it is easier to explain, easier to sell, easier to deliver, and easier to get testimonials for.</p>
<h3>Surface-Level Integrations Beat Deep Replacements</h3>
<p>Half of AI services work is change management. You are not just shipping software — you are changing how people work. The operators who last are the ones who treat the human side of implementation as seriously as the technical side. Plan for training. Plan for resistance. Plan for the manager who does not want the system to succeed because it threatens their perceived value.</p>
<p>Surface-level integrations that plug into the client's existing stack are safer, more sustainable, and easier to maintain than systems that rip out and replace core operational processes. If you fully replace a company's existing operating workflow, you become completely liable for keeping it running forever. That is a different business than the one you want to run. Plug in where you can add value, prove the ROI, and expand from there.</p>
<h3>Building for Repeatability</h3>
<p>Every time you deliver your core offer, document what you did. Build a playbook. Capture the configuration steps, the conversation flow scripts, the integration setup, the onboarding sequence, the reporting template. The second delivery of the same system should take half as long as the first. The fifth delivery should take a quarter of the time. Repeatability is how you increase margin without raising prices, and it is how you eventually hire someone else to do the delivery work while you focus on sales and relationship management.</p>
<h3>Key Actions</h3>
<ul>
<li>Write your single productized offer in the template format above — one automation, one niche, one price, one guarantee</li>
<li>After your next client delivery, spend one hour documenting every step you took — this becomes the first version of your delivery playbook</li>
<li>Identify one process in your current client engagements where you are doing deep replacement work and map out a surface-level integration alternative</li>
</ul>`,
          },
          {
            title: "Hiring and Delegation",
            description: `<h2>Hiring and Delegation</h2>
<p>You do not need to bring in people as quickly as you think. AI tools will offload a significant portion of admin work, accounting, creative copywriting, and outbound marketing. Before you hire a person, exhaust what the tools can do. Ask Perplexity, Claude, and ChatGPT: "What tools can automate [specific task] for an AI services business?" You will often find that the answer is a $50 per month subscription, not a $4,000 per month contractor.</p>
<h3>Exhaust the Tools First</h3>
<p>The question is not "when do I hire?" — it is "what can I not yet automate?" Invoicing, follow-up emails, research, social media scheduling, basic reporting, first-draft proposals — all of these can be handled or significantly accelerated by the same tools you are selling to clients. If you are manually doing any of these tasks, you are not running your practice like a product, you are running it like a job.</p>
<h3>The First Hire: Contractor, Not Employee</h3>
<p>When you do hire, make it a contractor, not a full-time employee. The first person should handle the lowest-leverage work consuming your calendar. That is usually one of two things: technical build work (so you can spend more time selling) or admin and inbox management (so you can spend more time building). Not both. Pick the constraint that is actually blocking your revenue growth and hire to remove that specific constraint.</p>
<p>Full-time hires come later — when your cash flow is predictable enough to carry a salary through a slow month without stress. The test is simple: could you sustain this salary for three months with zero new client revenue? If not, it is a contractor engagement, not a full-time role.</p>
<h3>Where to Find the Right People</h3>
<p>Your network first. Communities second — people who are already engaged in AI operator spaces understand the work and often need freelance income while building their own practices. Freelance platforms like Upwork for specific skill sets. And people who actively engage with your content on LinkedIn or X — someone who consistently asks good questions in your comments is often exactly the kind of person who would do good work for you. Find them there before paying for job board visibility.</p>
<h3>Key Actions</h3>
<ul>
<li>List every task you did this week that took more than 30 minutes — then ask Claude which of those could be partially or fully automated</li>
<li>Define the one constraint that is most limiting your revenue growth right now: is it time spent building, time spent selling, or time spent on admin?</li>
<li>Write a one-paragraph contractor brief for the role that would remove that constraint — specific tasks, expected hours, required skills, outcome metrics</li>
</ul>`,
          },
          {
            title: "Financial Management",
            description: `<h2>Financial Management for AI Operators</h2>
<p>Pricing is not a one-time decision you make when you launch your practice. It is something you revisit as your capacity, your case studies, and your demand all change. Understanding how to evolve your pricing structure — and how to manage the variable costs underneath it — is what separates a sustainable practice from a project-by-project scramble.</p>
<h3>How Pricing Should Evolve</h3>
<p>Early engagements are priced to get a foot in the door and build the case studies that make every future sale easier. Work for free or at steep discounts on your first one or two projects specifically to prove you can deliver. A documented case study with real numbers — calls recovered, appointments booked, hours saved, revenue generated — is worth ten times what you would have charged for that first project. The case study is the asset. The early revenue is secondary.</p>
<p>Raise prices when demand exceeds your capacity. The signal is not "I feel ready" — it is "I cannot take a new client without compromising delivery quality on existing ones." That is the moment to raise your rates, not after it starts to feel comfortable. It will never feel comfortable. That is not the right signal to wait for.</p>
<h3>The Three-Layer Pricing Structure</h3>
<p>Layer 1 is the setup fee — a one-time payment covering discovery, integration, initial build, testing, and deployment. Price this for the complexity and risk involved, not the hours. A simple automation is $1,500. A voice agent integrated into a legacy phone system might be $5,000 or more.</p>
<p>Layer 2 is the monthly retainer — covering ongoing optimization, monitoring, reporting, prompt tuning, and iteration. Tier this by usage volume, number of workflows, or number of client locations. This is your predictable revenue base.</p>
<p>Layer 3 is usage pass-throughs — API costs, dialer minutes, SMS sends, email infrastructure. Mark these up modestly or pass them through at cost. Never absorb API and infrastructure costs into your retainer. They are variable and scale with client usage, which means absorbing them creates a margin problem that compounds as the client grows.</p>
<h3>The Three-Month Prepayment Offer</h3>
<p>Offer clients the option to pay three months of retainer upfront in exchange for waiving the setup fee. They save money; you get commitment and working capital. More importantly, you get the time needed to show ROI. Showing results from an AI system takes time — a client who churns at month two never reached the point where the system was fully optimized. Getting them to month four with a prepayment dramatically improves retention outcomes and gives you financial runway when you are in an active growth phase.</p>
<h3>Key Actions</h3>
<ul>
<li>Separate your pricing into three layers today — setup, retainer, and pass-throughs — and update your proposal template to reflect all three</li>
<li>Review your current API and infrastructure costs for all active client engagements and confirm they are being passed through, not absorbed</li>
<li>Add a prepayment option to your next proposal with the exact trade-off stated: three months upfront, setup fee waived</li>
</ul>`,
          },
        ],
      },
      {
        title: "Growth and Authority",
        lessons: [
          {
            title: "Building Your Personal Brand",
            description: `<h2>Building Your Personal Brand</h2>
<p>Your personal brand is what makes inbound possible — the state where people reach out to you rather than you always reaching out to them. Getting there requires a content approach that is fundamentally different from what most people post online, plus a set of free resources that most operators overlook entirely.</p>
<h3>The Free Resources That Actually Matter</h3>
<p>Shubham Saboo's GitHub repository "Awesome LLM Apps" has over 70,000 stars and contains more than 100 production-ready AI agent templates — RAG systems, multi-agent setups, voice agents, MCP integrations. Every example includes step-by-step tutorials and working code you can deploy, study, and modify. This is not theory. It is a free codebase of working implementations.</p>
<p>The Unwind AI newsletter at theunwindai.com is high-signal filtered AI news for builders and operators — no hype, no trend chasing. LinkedIn and X are worth following strategically: find operators who post real workflow screenshots and actual client results, not influencers summarizing press releases. The difference is obvious within a few posts.</p>
<p>The most underrated resource: ask the AI itself. Open Claude, ChatGPT, or Perplexity and ask "What are the best automation platforms for [specific niche]?" or "How do I build a voice agent for a car dealership?" You get more useful, specific answers in ten minutes of asking AI than in ten hours of passively watching tutorials.</p>
<h3>LinkedIn Content That Converts</h3>
<p>Receipts beat opinions. "Here is the exact workflow I built for a client this week, here is what it did, here are the numbers" outperforms "5 tips for using AI in business" every single time. Screenshots of dashboards, before-and-after metrics, real workflow diagrams — this is the content that converts followers into leads.</p>
<p>Before and after: screenshot of chaos, screenshot of clean result, one paragraph connecting the two. This format is simple, repeatable, and consistently performs well because it shows rather than tells.</p>
<p>Counterintuitive takes perform well. "Stop building AI voice agents until you have done X" outperforms "Here is why AI voice agents are great" because it creates pattern interruption and implies earned insight. What does not work: generic tool rankings, top-ten AI tools lists, AI-is-going-to-change-everything thought leadership. These get likes from other AI people but zero inbound from actual buyers.</p>
<h3>The Content Process</h3>
<p>Capture raw material constantly — Granola handles meeting notes automatically, screenshot everything interesting, take voice notes after every significant client interaction. Batch-write weekly in one focused block. Schedule posts so content goes out consistently even when you are deep in delivery work. Engage live daily for 15 to 20 minutes responding to comments and having real conversations. The posts get visibility. The comments and DMs get clients.</p>
<h3>Key Actions</h3>
<ul>
<li>Bookmark the Awesome LLM Apps GitHub repo and spend 20 minutes browsing templates relevant to your niche this week</li>
<li>Write one LinkedIn post using the before-and-after format from a real workflow you have built — screenshot included</li>
<li>Set up your weekly content batch block in your calendar — 60 to 90 minutes, same time each week, treated as a non-negotiable</li>
</ul>`,
          },
          {
            title: "From Operator to Agency",
            description: `<h2>From Operator to Agency</h2>
<p>The path from solo operator to agency is not a straight line and it is not fast. Most operators who try to rush it end up with the overhead of an agency and the revenue of a freelancer. This lesson gives you the honest timeline, the $500 start sequence, and the signals that tell you when to make each move.</p>
<h3>Starting from Zero: The $500 Framework</h3>
<p>If you are starting with $500, here is where it goes — and where it does not go. Almost all of it goes into outbound infrastructure: a warmed sending domain in Instantly, a contact data subscription in Apollo, and basic domain setup. Not courses. Not a website. Not a logo. Not software subscriptions you will not use for two months. The website comes later. The tools come as you earn them.</p>
<p>Days 1 to 7: Pick one niche with some connection to your background. List 100 businesses. Research actual problems — call them, walk in, ask questions. Do not build anything. Days 8 to 30: Pick one offer — one specific automation, one price, one target. Build it for yourself or offer a free pilot to someone on your list. Document everything you build. Days 31 to 60: Reach out to all 100 on your list using the pilot as proof. Expect two to five responses. Close one or two at half your target price to get case studies. At this stage, case studies are worth more than revenue. Days 61 to 90: Raise your price. Use case studies to close two more clients. Reinvest every dollar into better tooling: Instantly at scale, Clay for enrichment, additional warmed domains.</p>
<h3>The Realistic Timeline to Agency</h3>
<p>Months 1 to 3: Learning the stack, talking to people, figuring out the offer. No real revenue. Most people quit here. Do not. Something is happening — you are building the foundation every future dollar will sit on. Months 4 to 6: First one or two paying clients. $2,000 to $5,000 MRR. Still part-time. Still figuring out delivery. Months 7 to 12: Three to five clients. $8,000 to $15,000 MRR. Your current job starts getting in the way of opportunity. Months 13 to 18: $15,000 to $25,000 MRR. This is the window where most operators quit their W-2 — not because they feel safe, but because the opportunity cost of staying employed is now higher than the risk of going full-time. Months 19 to 24: $25,000 or more MRR. First contractor hired to handle delivery. Beginning to think like a business owner: systems, delegation, positioning, and eventually a real agency with repeatable operations.</p>
<p>These timelines assume a real defined offer, consistent outbound activity, and actual delivery of results. Anyone promising W-2 replacement income in 90 days is selling a course, not telling you the truth.</p>
<h3>Key Actions</h3>
<ul>
<li>Write down where you are on the timeline above — which phase are you in, and what is the one constraint that is keeping you from moving to the next?</li>
<li>If you have not yet closed your first client, complete the 100-business list this week and begin outreach using your free audit offer</li>
<li>Identify the metric that will signal your pricing increase — a specific client count, a specific MRR number, or a specific capacity constraint — and write it down as a commitment</li>
</ul>`,
          },
        ],
      },
    ],
  },
]

// ─── Intermediate and Advanced Lesson Definitions ─────────
// Curriculum space: 23411754
// Section IDs from CONTENT-INVENTORY.md:

export const INTERMEDIATE_SALES_MARKETING_LESSONS: CourseLessonDefinition[] = [
  {
    title: "Speed to Lead: Building an AI Voice Agent Business",
    description: `<h2>Speed to Lead: Building an AI Voice Agent Business</h2>
<p>Of all the automations an AI operator can offer, the voice agent has the clearest and most immediate ROI. Calls handled, appointments booked, revenue recovered from missed inquiries — the numbers show up fast and translate directly into language every business owner already understands. This is the automation to build first and the one to productize for repeatable deployment across similar clients.</p>
<h3>Why Voice Agents Win</h3>
<p>Every missed call is a missed booking. For businesses in medical services, auto dealerships, home services, and similar high-ticket inbound verticals, the math is simple: if your average service value is $400 and you miss ten calls per week, that is $4,000 per week in recoverable revenue. A voice agent that answers after-hours calls, qualifies the caller, books the appointment, and sends a confirmation text costs $500 per month to maintain. The ROI conversation takes less than five minutes.</p>
<p>Build it once, tune it to the niche, and redeploy it as a GHL snapshot across similar clients. One well-configured voice agent template for auto dealership recall outreach can be deployed across twenty locations of the same dealership group with minimal per-site customization. That scale economics is what makes voice agents the anchor offer for a productized practice.</p>
<h3>A Real Engagement: Auto Dealership Recall Outreach</h3>
<p>This is what a live voice agent implementation looks like from contract to running system. The client is an auto dealership. The problem is recall outreach — proactively calling previous customers when a recall is due, booking service appointments, and following up automatically when calls go unanswered.</p>
<p><strong>Week 0 — Discovery (before contract):</strong> A 30-minute call to confirm fit. Confirm access to the phone system, CRM, calendar, and existing call recordings and scripts. Assess whether their technical infrastructure is modern enough for integration — digital calendar, CRM with API access — or whether workarounds will be needed for legacy systems.</p>
<p><strong>Week 1 — Build:</strong> Configure the voice agent platform (Assistable). Write conversation flows from actual call transcripts and existing recall scripts — not generic templates. Connect to the client's calendar for automated booking. Set outbound call triggers based on the real recall schedule. Integrate to the CRM so every interaction is logged automatically. Build voicemail drop and email follow-up for non-answers.</p>
<p><strong>Week 2 — Test and Deploy:</strong> Internal sandbox testing first. Then a limited live test on one department or one phone line. Monitor every call, review every transcript, catch failures before they reach real customers. Full rollout on the primary line with a live reporting dashboard.</p>
<p><strong>Weeks 3 to 4 — Optimize:</strong> Weekly calls reviewing call logs. Real callers say things you did not anticipate. Tune prompts and conversation flows from actual failure data — an unexpected question, an edge case the agent did not handle, a booking that landed at the wrong time. By end of month one, the agent handles the majority of routine recall outreach without human intervention.</p>
<p><strong>Ongoing retainer:</strong> Monthly monitoring and reporting on calls handled, appointments booked, and revenue attributed. Iteration as the recall schedule changes or as the client expands to additional locations.</p>
<h3>Pricing the Voice Agent</h3>
<p>A standard starting structure: $1,500 setup fee plus $500 per month per location. Intentionally price the first location below market rate when the client has multiple locations — the first location proves ROI, and then you roll the same system out to the remaining locations at full per-location retainer. The per-location scale revenue is where the real business lives.</p>
<h3>The Tech Stack</h3>
<p>Assistable or an equivalent voice agent platform handles the conversation layer. GoHighLevel handles telephony routing, SMS follow-up, CRM integration, and pipeline tracking. Make or N8N connects the trigger logic — recall schedule data firing the outbound call sequence. The whole system runs on infrastructure you already own and can redeploy for every new client in the niche.</p>
<h3>Key Actions</h3>
<ul>
<li>Build a test voice agent using Assistable or a comparable platform this week — configure it to handle a simple inbound inquiry flow for a business type in your target niche</li>
<li>Write out the ROI math for one specific client type: average service value, estimated missed calls per week, recoverable revenue, your monthly retainer cost</li>
<li>Set up one GHL snapshot of your base voice agent configuration so it can be redeployed across similar clients in minutes</li>
</ul>`,
  },
  {
    title: "Cold Email Infrastructure That Does Not Land in Spam",
    description: `<h2>Cold Email Infrastructure That Does Not Land in Spam</h2>
<p>Cold email at scale is not about the copy. Most operators waste time obsessing over subject lines while their emails are quietly being routed to spam folders or blocked by spam filters entirely. Infrastructure determines whether your message gets seen. Once you have the infrastructure right, the copy becomes the variable worth optimizing. Get the infrastructure wrong and nothing else matters.</p>
<h3>Why You Are Selling the Machine</h3>
<p>When you offer cold email infrastructure as a service, you are not selling email marketing in the traditional sense. You are selling the technical system that makes outbound possible at scale: warmed domains, deliverability monitoring, domain rotation, and an AI personalization layer on top that generates custom first lines for each prospect. Clients cannot build this themselves because maintaining deliverability at scale requires ongoing technical work — tracking bounce rates, rotating sending domains before they get flagged, monitoring spam scores, managing warmup schedules. That complexity is the moat. If a client could set this up in an afternoon, they would not pay you for it.</p>
<h3>The Standard Stack</h3>
<ul>
<li><strong>Instantly</strong> — email sending platform and domain warmup. You never send cold outreach from your primary domain. You run it through separate sending domains that have been warmed over two to four weeks before any real outreach begins.</li>
<li><strong>Apollo</strong> — contact data sourcing. Title, company, verified email, phone number, and basic company information. The starting point for any prospecting list.</li>
<li><strong>Clay</strong> — enrichment and AI personalization at scale. This is where you pull additional signals — recent LinkedIn activity, company news, job postings, funding announcements — and then run each contact through a prompt that generates a custom first line specific to that prospect. The AI personalization layer is what makes outreach feel researched instead of blasted.</li>
</ul>
<h3>Message Structure That Gets Replies</h3>
<p>Three lines, built around specificity:</p>
<ul>
<li><strong>Line 1:</strong> Something specific and true about their business that a bot could not have generated without context — a recent post, a location they just opened, a hire they announced, a review they received. One sentence that proves you actually looked at them specifically.</li>
<li><strong>Line 2:</strong> A specific outcome tied to a dollar amount or time figure from a comparable client engagement. Not a vague capability statement — a real number from a real result.</li>
<li><strong>Line 3:</strong> One low-commitment question. Not a calendar link. Not a pitch deck link. One question the recipient can answer in one sentence.</li>
</ul>
<p>What to avoid: emojis, "hope this finds you well," calendar booking links in the first message, and any paragraph that starts with "We help companies like yours." The goal of the first message is to get a reply, not to close a deal. Calendar links in message one are presumptuous and drop reply rates significantly.</p>
<h3>Where the $500 Goes When You Are Starting</h3>
<p>If you are starting with limited capital, almost all of it should go into outbound infrastructure — not a website, not a logo, not software subscriptions you will not use for two months. A warmed sending domain in Instantly costs roughly $30 per month. Apollo for contact data is your highest-priority subscription. Clay becomes worth the investment once you have a working outreach sequence to personalize. Start lean, scale the infrastructure as revenue allows, and reinvest first dollars into the tools that directly produce more outbound volume.</p>
<h3>Key Actions</h3>
<ul>
<li>Set up one warmed sending domain in Instantly this week — start the warmup process now so it is ready when you need it</li>
<li>Build a Clay workflow that pulls Apollo contact data and generates a custom first line for each prospect using a Claude prompt — test it on 25 contacts before scaling</li>
<li>Write three variations of your three-line outreach message and A/B test them by sending each to a separate segment of 20 to 30 prospects</li>
</ul>`,
  },
  {
    title: "AEO: Getting Your Clients Found in AI-Powered Search",
    description: `<h2>AEO: Getting Your Clients Found in AI-Powered Search</h2>
<p>Traditional SEO optimizes for Google's ten blue links. Answer Engine Optimization — AEO — optimizes for the answers that ChatGPT, Perplexity, and Google AI Overviews generate when someone asks a question. Most businesses have invested years in traditional SEO and have no idea they are completely invisible in AI-powered search. That invisibility is a real, measurable, and growing problem — and closing that gap is a high-margin service with a straightforward audit-to-retainer sales motion.</p>
<h3>Why AEO Matters More Than Most Clients Realize</h3>
<p>When a potential customer opens ChatGPT and asks "who is the best dentist in [city]" or "what is the top freight broker for temperature-controlled loads in the southeast," they get an answer. If your client is not in that answer, they are invisible to that buyer at the exact moment of highest intent. This is not a future problem — it is happening now, and the gap between businesses optimized for AI search and those that are not is widening every month.</p>
<p>The audit itself is a compelling sales tool. Open ChatGPT and Perplexity in front of the prospect and ask about their category and location. Show them the results. Show them who is being recommended instead. Invisibility tends to be jarring when you see it happen in real time with your own business name missing from the answer. That demonstration creates urgency in a way no slide deck can.</p>
<h3>How to Run an AEO Audit</h3>
<p>Ask three to five AI tools the questions a potential customer of this business would ask: "Who is the best [service] in [location]?" "What [business type] should I use for [specific need]?" "Compare [client name] to [competitor]." Document the results for each tool. Note whether the client appears, how prominently, what is said about them, and whether the information is accurate. This becomes the deliverable for the initial audit session.</p>
<h3>What Improves AI Search Visibility</h3>
<ul>
<li><strong>Structured content:</strong> Clear, question-and-answer formatted pages that directly address what potential customers ask. AI models pull from content that is organized as direct answers, not marketing copy.</li>
<li><strong>FAQ pages with real questions:</strong> Pages structured around the actual questions buyers type into AI tools — not general questions about the business, but specific, intent-driven questions.</li>
<li><strong>Authoritative citations:</strong> Getting the business mentioned in reputable sources — local publications, industry directories, review platforms — that AI models treat as credible. AI tools cite sources; being cited in sources that AI trusts improves visibility.</li>
<li><strong>Schema markup:</strong> Structured data that helps AI systems understand what the business does, where it is located, what it specializes in, and how to accurately describe it.</li>
<li><strong>Consistent NAP data:</strong> Business name, address, and phone number consistent across every directory, listing, and web property. Inconsistencies signal unreliability to AI systems that aggregate information.</li>
</ul>
<h3>The Ongoing Service Model</h3>
<p>The initial audit is a one-time deliverable. The ongoing service is quarterly share-of-voice reporting — running the same AI audit every 90 days, tracking which questions the client now appears in, and identifying new gaps to address. Content strategy and publication to feed AI systems with accurate, organized information about the business becomes the retainer work. This is a high-margin service because the deliverable is data and strategy, not heavy technical builds, and the improvement compounds over time as more content assets accumulate.</p>
<h3>Key Actions</h3>
<ul>
<li>Run a free AEO audit on one business in your target niche this week — document the results and use it as a prospecting asset in your next outreach sequence</li>
<li>Ask Claude to help you write five FAQ-formatted content pieces for a target client, structured around the exact questions their potential customers ask AI tools</li>
<li>Build a simple AEO audit report template you can deliver as the output of a paid discovery engagement — include before-state screenshots, gap analysis, and a 90-day improvement roadmap</li>
</ul>`,
  },
]

export const ADVANCED_DEV_TOOLS_LESSONS: CourseLessonDefinition[] = [
  {
    title: "Cursor and Claude Code: Building AI Systems Without Being a Developer",
    description: `<h2>Cursor and Claude Code: Building AI Systems Without Being a Developer</h2>
<p>You do not need to be a software engineer to build client-facing tools, dashboards, and custom applications. What you need is the right interface between you and the code — one that understands the context of your entire project and can help you build incrementally without requiring you to understand every underlying line. That interface is Cursor, with Claude Code handling the autonomous work that goes beyond interactive editing.</p>
<h3>Cursor vs Standard Code Editors</h3>
<p>Most code editors are passive tools. You write code, they display it. Cursor is an AI-native coding interface built on top of VS Code — meaning all the same extensions and file types work — but with a fundamental difference: it has context awareness across your entire codebase. When you describe a change or ask it to build something, Cursor can see all the related files, understand how components connect, and write code that fits the project's existing patterns rather than generic boilerplate.</p>
<p>For an AI operator building client dashboards or custom automation interfaces, this matters because most of the code you write is not greenfield — it is additions to existing projects with existing conventions. Cursor handles that context in a way that generic AI chat tools cannot.</p>
<h3>How Claude Code Fits In</h3>
<p>Cursor is for interactive development — you are in the loop, reviewing changes, steering the direction. Claude Code is for autonomous codebase work — you describe a larger goal and Claude Code works through the implementation independently, handling multiple files and multiple steps without requiring you to approve each one. Use Cursor when you want to stay close to the work. Use Claude Code when the task is well-defined and you want to hand it off and review the result.</p>
<p>In practice: Cursor for building a new page or component where you want to iterate as you go. Claude Code for refactoring an existing module, writing a full feature based on a spec, or doing multi-file cleanup work where the task is clear and the output is reviewable at the end.</p>
<h3>The Basic Workflow for Client Builds</h3>
<p>Start with a rapid prototype using Lovable or Bolt — describe the product in plain language and get a working frontend in minutes. This is the demo version, the thing you show clients before building the real thing. Once the concept is approved, move to Cursor for the production build. Connect to Supabase for data storage, auth, and APIs. Deploy on Vercel. Push the code to GitHub throughout so you have version history and can roll back if something breaks. Polish details back in Cursor where AI-assisted editing keeps iteration fast.</p>
<h3>When to Use Specialized Tools</h3>
<p>As clients demand more complexity — custom integrations, legacy system connections, specialized data pipelines — you will need to go beyond what Cursor and Claude Code can handle alone. This is where the tool learning order from Module 1 matters: once you have a working feel for Make or N8N, GHL, and the core AI models, you can identify which specialized tools a specific client problem requires and learn them in context rather than in the abstract.</p>
<h3>Key Actions</h3>
<ul>
<li>Install Cursor this week and rebuild one tool or dashboard you have previously built in a simpler way — notice how context awareness changes the editing experience</li>
<li>Use Lovable or Bolt to prototype the UI for your next client deliverable before writing a single line of production code — show the prototype to the client for feedback first</li>
<li>Push everything you build to a GitHub repository from day one, even personal projects — version control is a professional habit, not an advanced skill</li>
</ul>`,
  },
  {
    title: "Scoping and Delivering Complex AI Projects",
    description: `<h2>Scoping and Delivering Complex AI Projects</h2>
<p>The most common reason AI implementations fail is not bad technology — it is bad scoping. Work begins before anyone has agreed on what success looks like, what systems need to connect, or what happens when something goes wrong. This lesson gives you the five-step scoping process that prevents those failures, plus the six technical mistakes that take down even well-scoped projects at execution.</p>
<h3>The 5-Step Scoping Process</h3>
<p><strong>Step 1: Map the current workflow on paper.</strong> Every step, every handoff, every tool, and every person involved. Do this with the client, not in advance. If they cannot map their own workflow, the problem is process, not AI — and you cannot automate what you cannot define. A client who says "our process is complicated" when asked to describe it is telling you something important about whether they are ready for an AI implementation.</p>
<p><strong>Step 2: Find the highest-friction step.</strong> Where does work stall? Where do errors happen? Where are customers waiting? The goal is not to identify the most automatable step — it is to identify the step that causes the most pain. Solving the highest-friction problem produces the most visible ROI and builds the most trust for expanding scope later.</p>
<p><strong>Step 3: Define the success metric before picking a tool.</strong> "Response time under two minutes." "80% of inbound calls answered on the first ring." "Zero missed follow-ups on leads over $5,000." If you cannot define what success looks like in concrete, measurable terms before you build anything, you will spend the entire engagement arguing about whether it is working. Define it, get the client to agree to it in writing, and build the reporting to track it from day one.</p>
<p><strong>Step 4: Pick the smallest viable piece.</strong> Not the entire workflow, just the one step where AI moves the needle most with the least integration complexity. Ship that first, prove it works with real data, then expand. The temptation to build the complete vision in the first engagement is what causes scope creep, timeline slippage, and trust erosion when delivery takes longer than expected.</p>
<p><strong>Step 5: Plan the failure modes.</strong> What happens when the AI gets something wrong? Who is the human in the loop? What is the escalation path when an edge case occurs? What is the rollback plan if the system needs to be disabled quickly? These questions should be answered before the build begins, not after the first incident.</p>
<h3>The Six Technical Mistakes That Kill Complex Projects</h3>
<ul>
<li><strong>Over-engineering the first build.</strong> Five tools chained for a two-tool problem. Every additional tool is another point of failure and another subscription to monitor. Start simple.</li>
<li><strong>No monitoring or logging.</strong> Shipping workflows with no visibility into what is happening means clients discover failures before you do. Every production system needs basic logging and error alerts from day one.</li>
<li><strong>No human in the loop.</strong> Full AI authority on day one means the first bad output becomes a trust crisis. Build in a human review step for the first 30 days of every deployment.</li>
<li><strong>Hardcoded prompts duplicated everywhere.</strong> Centralize prompts in one location — Airtable, a JSON config, a Notion database — and reference them from workflows. One change, one location.</li>
<li><strong>No version control.</strong> Automations edited live with no changelog mean no rollback path when something breaks. Document every significant change, even in a simple shared doc.</li>
<li><strong>Ignoring rate limits and API costs.</strong> Works in testing with ten contacts. Runs in production against 5,000 and generates unexpected API bills, hits rate limits, and flags email domains. Instrument spend monitoring before scaling any workflow.</li>
</ul>
<h3>The Last 5% Problem</h3>
<p>Most operators get 95% of the way to a working solution with generic tools. The demo works. The client is excited. Then real implementation hits the actual tech stack — connecting AI output to a CRM with a proprietary API, integrating with legacy software that predates modern API design, getting data to flow into reporting tools the client has used for a decade. That last 5% is where most projects stall. Plan for it in the scoping phase, not after you hit the wall.</p>
<h3>Key Actions</h3>
<ul>
<li>Before your next client engagement, run through all five scoping steps in a 60-minute working session with the client present — document the output as a signed scope of work</li>
<li>Add a failure modes section to every scope document — at minimum, document the human escalation path and the rollback plan</li>
<li>Audit your current active automations for the six technical mistakes and address any that are missing monitoring, logging, or version tracking</li>
</ul>`,
  },
  {
    title: "From Prototype to Product: Lovable, Bolt, and Vercel",
    description: `<h2>From Prototype to Product: Lovable, Bolt, and Vercel</h2>
<p>The fastest way to lose a client opportunity is to spend three weeks building a production-quality version of something they end up not wanting. The fastest way to close a deal is to show them a working prototype of exactly what you are proposing — built in hours, not weeks. This lesson covers the no-code to production workflow that operators use to move fast without building on a fragile foundation.</p>
<h3>The Tool Hierarchy</h3>
<p>Each tool in this stack has a specific job. Understanding which to use at which stage prevents overbuilding early and under-delivering later.</p>
<p><strong>Lovable and Bolt</strong> are rapid prototyping tools. Describe the product in plain language — the pages, the functionality, the data it should display — and get a working frontend in minutes. This is the demo version. It is not production-ready and it is not meant to be. It is meant to show the client what you are proposing before you invest production-level effort in building it. Iterate with the client on the prototype until the concept is locked. Then build the real version.</p>
<p><strong>Supabase</strong> is for real applications that need data persistence, authentication, and APIs. When the prototype is approved and you are building the production version, Supabase handles the database layer, user auth, and API endpoints. It is designed for exactly this workflow — moving from prototype to production quickly without rebuilding the data model from scratch.</p>
<p><strong>Vercel</strong> is where everything lives in production. Connect the GitHub repository, configure environment variables, and deploy in minutes. Vercel handles CDN distribution, serverless functions, and automatic deployments on every push to the main branch. Every project you build should be on GitHub and deployed on Vercel from day one — even prototypes, because showing a live URL is more compelling than a screenshot.</p>
<p><strong>Cursor</strong> is where you do the production polish. Once the prototype is approved and the Supabase schema is in place, Cursor handles the implementation work — building out the pages, connecting the data layer, writing the API routes, adding the business logic that the prototype could not handle. AI-assisted editing in Cursor keeps the iteration fast while keeping the code organized and maintainable.</p>
<h3>The Workflow in Practice</h3>
<p>Describe the product to Lovable or Bolt and get a working prototype. Show it to the client and iterate until the concept is agreed on. Set up a Supabase project with the data schema the production version will need. Start the GitHub repository and connect it to Vercel for automatic deployments. Open Cursor and build the production version using the prototype as a reference for design and functionality. Deploy the working version to Vercel and share the live URL with the client as the Week 1 deliverable.</p>
<p>The key discipline is knowing when to stop prototyping and start building for real. Prototypes are disposable — they exist to validate the concept. Once the concept is validated, rebuild it properly rather than trying to production-harden prototype code.</p>
<h3>When to Use Each Tool</h3>
<ul>
<li>Lovable or Bolt: initial concept validation, client demos before build approval, rapid iteration on UI before committing to development</li>
<li>Supabase: any application that needs real data, user accounts, or an API layer</li>
<li>Vercel: every project, from day one, for hosting and deployment</li>
<li>Cursor: production implementation, feature additions, code polish, and any work that requires understanding the full codebase context</li>
<li>Claude Code: larger autonomous tasks like refactoring a module, implementing a full feature from a spec, or multi-file cleanup where you want to review the result rather than approve each step</li>
</ul>
<h3>Key Actions</h3>
<ul>
<li>Build a prototype of your core client offer using Lovable or Bolt this week — describe the product in plain language and see what it produces in under 30 minutes</li>
<li>Set up a Supabase project and Vercel deployment for one active or upcoming client project — establish the infrastructure before the production build begins</li>
<li>Practice the handoff from prototype to Cursor: take a Lovable prototype and rebuild one component of it in Cursor using proper production patterns</li>
</ul>`,
  },
]

// ─── Update and Create Functions ─────────────────────────

/**
 * Normalize a lesson title for fuzzy matching.
 * Handles the "and" vs "&" discrepancy between code and Mighty Networks.
 */
function normalizeLessonTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
}

/**
 * Update existing lesson content in the Mighty Networks curriculum space.
 * Matches lessons by normalized title and updates their description.
 * Space 23411754 = "Curriculum and Playbooks" (the single space containing all sections)
 */
export async function updateExistingLessons(
  spaceId: number = 23411754
): Promise<{ updated: number; skipped: number; notFound: string[] }> {
  const result = { updated: 0, skipped: 0, notFound: [] as string[] }

  // Fetch all current coursework items from the space
  const allItems = await listCoursework(spaceId)

  // Build a lookup map of normalized title to coursework item
  const itemByNormalizedTitle = new Map<string, MightyCoursework>()
  for (const item of allItems) {
    if (item.type === "lesson" && item.title) {
      itemByNormalizedTitle.set(normalizeLessonTitle(item.title), item)
    }
  }

  // Collect all lesson definitions from AI_OPERATOR_MODULES
  const allLessons: CourseLessonDefinition[] = []
  for (const mod of AI_OPERATOR_MODULES) {
    for (const section of mod.sections) {
      for (const lesson of section.lessons) {
        allLessons.push(lesson)
      }
    }
  }

  for (const lesson of allLessons) {
    const normalizedTitle = normalizeLessonTitle(lesson.title)
    const match = itemByNormalizedTitle.get(normalizedTitle)

    if (!match) {
      result.notFound.push(lesson.title)
      logger.warn(`[Mighty] Lesson not found in space: "${lesson.title}"`, {
        action: "updateExistingLessons",
      })
      continue
    }

    const updated = await updateCoursework(spaceId, match.id, {
      description: lesson.description,
    })

    if (updated) {
      result.updated++
      logger.info(`[Mighty] Updated lesson: "${lesson.title}"`, {
        action: "updateExistingLessons",
      })
    } else {
      result.skipped++
      logger.warn(`[Mighty] Failed to update lesson: "${lesson.title}"`, {
        action: "updateExistingLessons",
      })
    }

    // Respect rate limits — 400ms between updates
    await new Promise((resolve) => setTimeout(resolve, 400))
  }

  logger.info(
    `[Mighty] updateExistingLessons complete: ${result.updated} updated, ${result.skipped} skipped, ${result.notFound.length} not found`,
    { action: "updateExistingLessons" }
  )

  return result
}

/**
 * Create lessons in empty curriculum sections.
 * Populates "Intermediate: AI-Powered Sales and Marketing" (section 100750283)
 * and "Advanced: Building with AI Development Tools" (section 100750287).
 */
export async function createMissingLessons(
  spaceId: number = 23411754
): Promise<{ created: number; failed: string[] }> {
  const result = { created: 0, failed: [] as string[] }

  const sectionGroups: Array<{
    sectionId: number
    lessons: CourseLessonDefinition[]
  }> = [
    {
      sectionId: 100750283,
      lessons: INTERMEDIATE_SALES_MARKETING_LESSONS,
    },
    {
      sectionId: 100750287,
      lessons: ADVANCED_DEV_TOOLS_LESSONS,
    },
  ]

  for (const group of sectionGroups) {
    for (const lesson of group.lessons) {
      const created = await createCoursework(spaceId, {
        type: "lesson",
        parent_id: group.sectionId,
        title: lesson.title,
        description: lesson.description,
        status: "posted",
        completion_criteria: lesson.completionCriteria ?? "visited",
        unlocking_criteria: lesson.unlockingCriteria ?? "sequential",
      })

      if (created) {
        result.created++
        logger.info(
          `[Mighty] Created lesson in section ${group.sectionId}: "${lesson.title}"`,
          { action: "createMissingLessons" }
        )
      } else {
        result.failed.push(lesson.title)
        logger.warn(
          `[Mighty] Failed to create lesson in section ${group.sectionId}: "${lesson.title}"`,
          { action: "createMissingLessons" }
        )
      }

      // Respect rate limits — 400ms between creates
      await new Promise((resolve) => setTimeout(resolve, 400))
    }
  }

  logger.info(
    `[Mighty] createMissingLessons complete: ${result.created} created, ${result.failed.length} failed`,
    { action: "createMissingLessons" }
  )

  return result
}
