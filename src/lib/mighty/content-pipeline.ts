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
            description: "<h2>What Is an AI Operator?</h2><p>An AI Operator is a professional who helps businesses implement, optimize, and manage AI tools and workflows. Unlike traditional consultants who deliver reports, AI Operators deliver <strong>results</strong> — working systems, automated processes, and measurable ROI.</p><p>In this lesson, you'll learn:</p><ul><li>The difference between an AI consultant and an AI operator</li><li>Why businesses are willing to pay premium rates for hands-on AI implementation</li><li>The three core skills every AI operator needs</li><li>How to position yourself as the go-to AI expert in your market</li></ul>",
          },
          {
            title: "Your First 30 Days",
            description: "<h2>Your First 30 Days as an AI Operator</h2><p>The first month sets the trajectory for your entire practice. This lesson gives you the exact playbook Ryan and Adam used to go from zero to paying clients.</p><p><strong>Week 1:</strong> Define your niche and ideal client profile</p><p><strong>Week 2:</strong> Build your core offer and pricing structure</p><p><strong>Week 3:</strong> Launch your outreach system</p><p><strong>Week 4:</strong> Close your first engagement</p><p>Each week includes specific tasks, templates, and check-ins to keep you on track.</p>",
          },
          {
            title: "Choosing Your Niche",
            description: "<h2>Choosing Your Niche</h2><p>Generalists compete on price. Specialists compete on value. This lesson walks you through the niche selection framework that ensures you're targeting businesses with real AI budgets and urgent problems.</p><p><strong>The Sweet Spot Framework:</strong></p><ul><li>Industries with high data volume + manual processes</li><li>Businesses doing $1M-$50M revenue (big enough to pay, small enough to need you)</li><li>Owners who are tech-curious but time-poor</li></ul><p>We'll also cover the niches to <strong>avoid</strong> and why.</p>",
          },
        ],
      },
      {
        title: "Mindset & Positioning",
        lessons: [
          {
            title: "The Operator Mindset",
            description: "<h2>The Operator Mindset</h2><p>The biggest difference between operators who succeed and those who stall isn't technical skill — it's mindset. This lesson covers the mental models that drive consistent results.</p><ul><li><strong>Builder over Advisor:</strong> Ship working systems, not slide decks</li><li><strong>Revenue Focus:</strong> Every project should tie to measurable business outcomes</li><li><strong>Speed Over Perfection:</strong> A working v1 beats a perfect plan every time</li><li><strong>Compound Growth:</strong> Each client makes the next one easier to land</li></ul>",
          },
          {
            title: "Pricing Your Services",
            description: "<h2>Pricing Your Services</h2><p>Most new operators undercharge dramatically. This lesson gives you the pricing framework that positions you as premium from day one.</p><p><strong>Three pricing models:</strong></p><ol><li><strong>Project-Based:</strong> $2,500-$15,000 per implementation</li><li><strong>Monthly Retainer:</strong> $1,500-$5,000/mo for ongoing optimization</li><li><strong>Value-Based:</strong> Percentage of measurable savings/revenue generated</li></ol><p>Includes real proposals, pricing scripts, and objection handling for the \"that's more than I expected\" conversation.</p>",
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
            description: "<h2>The Outreach Playbook</h2><p>Cold outreach works when you lead with value. This lesson gives you the exact sequences, templates, and follow-up cadences that consistently generate qualified conversations.</p><ul><li>LinkedIn DM sequences that get 30%+ response rates</li><li>Email templates that bypass the \"we're not interested\" reflex</li><li>The \"Free Audit\" approach that converts skeptics into clients</li><li>How to use AI tools to personalize outreach at scale</li></ul>",
          },
          {
            title: "The Discovery Call Framework",
            description: "<h2>The Discovery Call Framework</h2><p>A discovery call isn't a sales pitch — it's a diagnostic session. This lesson teaches you the framework that turns exploratory calls into signed proposals.</p><p><strong>The PAIN Framework:</strong></p><ul><li><strong>P</strong>roblem: What's broken or slow?</li><li><strong>A</strong>ttempts: What have they already tried?</li><li><strong>I</strong>mpact: What does this cost them monthly?</li><li><strong>N</strong>ext Steps: What would solving this be worth?</li></ul>",
          },
          {
            title: "Building Referral Engines",
            description: "<h2>Building Referral Engines</h2><p>Your best clients come from your existing clients. This lesson shows you how to systematize referrals so new business flows in without constant outreach.</p><ul><li>When and how to ask for referrals (timing is everything)</li><li>Building strategic partnerships with complementary service providers</li><li>Creating case studies that sell for you</li><li>The \"Results Review\" meeting that triggers organic referrals</li></ul>",
          },
        ],
      },
      {
        title: "Closing & Onboarding",
        lessons: [
          {
            title: "Writing Proposals That Close",
            description: "<h2>Writing Proposals That Close</h2><p>Your proposal should be a formality, not a coin flip. This lesson covers the proposal structure that achieves 70%+ close rates.</p><ul><li>The 1-page proposal format (ditch the 20-page deck)</li><li>Anchoring price to business impact, not hours</li><li>Including a \"do nothing\" cost to create urgency</li><li>Template library: audit proposals, retainer proposals, project proposals</li></ul>",
          },
          {
            title: "Client Onboarding System",
            description: "<h2>Client Onboarding System</h2><p>The first 48 hours after a client signs determine the entire engagement. This lesson gives you the onboarding system that sets expectations and builds immediate confidence.</p><ul><li>The welcome sequence (email + Loom walkthrough)</li><li>Access & permissions checklist</li><li>Week 1 quick wins to deliver immediate value</li><li>Communication cadence and reporting templates</li></ul>",
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
            title: "Claude & ChatGPT for Business",
            description: "<h2>Claude & ChatGPT for Business</h2><p>LLMs are the foundation of every AI operator's toolkit. This lesson covers how to configure and deploy Claude and ChatGPT for real business use cases.</p><ul><li>When to use Claude vs ChatGPT (strengths of each)</li><li>Building custom instructions for client-specific workflows</li><li>API integration basics for automation</li><li>Cost management and usage optimization</li></ul>",
          },
          {
            title: "Automation with n8n & Make",
            description: "<h2>Automation with n8n & Make</h2><p>The real money in AI operations is in automation. This lesson teaches you to build the workflows that save your clients 20+ hours per week.</p><ul><li>n8n vs Make: when to use which</li><li>The 5 automations every business needs</li><li>Connecting AI models to existing business tools</li><li>Error handling and monitoring for production workflows</li></ul>",
          },
          {
            title: "AI-Powered CRM & Sales",
            description: "<h2>AI-Powered CRM & Sales</h2><p>Help your clients close more deals with AI-enhanced sales systems.</p><ul><li>Lead scoring with AI (which leads are actually hot)</li><li>Automated follow-up sequences that sound human</li><li>Meeting prep bots that research prospects automatically</li><li>Pipeline analytics and forecasting with AI</li></ul>",
          },
        ],
      },
      {
        title: "Advanced Implementations",
        lessons: [
          {
            title: "Custom AI Assistants & Chatbots",
            description: "<h2>Custom AI Assistants & Chatbots</h2><p>Build AI assistants that handle customer support, internal Q&A, and process documentation — saving your clients thousands per month.</p><ul><li>RAG (Retrieval Augmented Generation) explained simply</li><li>Building knowledge bases from existing company docs</li><li>Deploying chatbots on websites and in Slack/Teams</li><li>Measuring ROI: tickets deflected, time saved, CSAT impact</li></ul>",
          },
          {
            title: "Content & Marketing Automation",
            description: "<h2>Content & Marketing Automation</h2><p>AI-powered content systems that produce consistent, on-brand output without burning out your client's marketing team.</p><ul><li>Blog post pipelines: research → outline → draft → edit</li><li>Social media content generation at scale</li><li>Email marketing sequences with AI personalization</li><li>SEO optimization workflows</li></ul>",
          },
          {
            title: "Data Analysis & Reporting",
            description: "<h2>Data Analysis & Reporting</h2><p>Turn your clients' data into actionable insights with AI-powered analysis and automated reporting.</p><ul><li>Building automated dashboards with AI summaries</li><li>Financial analysis and anomaly detection</li><li>Customer behavior pattern recognition</li><li>Generating executive reports that actually get read</li></ul>",
          },
        ],
      },
    ],
  },
  {
    name: "Module 4: Scaling Your Practice",
    sections: [
      {
        title: "Systems & Operations",
        lessons: [
          {
            title: "Productizing Your Services",
            description: "<h2>Productizing Your Services</h2><p>Stop trading time for money. This lesson shows you how to package your expertise into repeatable, scalable service products.</p><ul><li>The 3-tier service model (Audit → Implementation → Retainer)</li><li>Creating SOPs for every deliverable</li><li>Building templates and frameworks you reuse across clients</li><li>When to raise prices (hint: sooner than you think)</li></ul>",
          },
          {
            title: "Hiring & Delegation",
            description: "<h2>Hiring & Delegation</h2><p>You can't scale alone. This lesson covers when and how to bring on help — from VAs to junior operators.</p><ul><li>The first hire to make (it's not who you think)</li><li>Training AI operators: the curriculum that works</li><li>Contractor vs employee: tax and liability considerations</li><li>Tools for managing a distributed team</li></ul>",
          },
          {
            title: "Financial Management",
            description: "<h2>Financial Management for AI Operators</h2><p>Run your practice like a business, not a freelance gig.</p><ul><li>Setting up proper business accounting</li><li>Tax strategy for service businesses</li><li>Cash flow management and invoicing best practices</li><li>When to invest in tools vs when to bootstrap</li></ul>",
          },
        ],
      },
      {
        title: "Growth & Authority",
        lessons: [
          {
            title: "Building Your Personal Brand",
            description: "<h2>Building Your Personal Brand</h2><p>Your personal brand is your most valuable business asset. This lesson shows you how to build authority that attracts inbound opportunities.</p><ul><li>LinkedIn content strategy that positions you as an expert</li><li>Speaking and workshop opportunities</li><li>Creating case studies that demonstrate clear ROI</li><li>Building an email list of potential clients</li></ul>",
          },
          {
            title: "From Operator to Agency",
            description: "<h2>From Operator to Agency</h2><p>When you're ready, here's the playbook for scaling from solo operator to agency.</p><ul><li>The inflection point: when solo stops making sense</li><li>Building service packages for different market segments</li><li>Creating a sales engine that doesn't depend on you</li><li>The numbers: margins, utilization, and growth targets</li></ul>",
          },
        ],
      },
    ],
  },
]
