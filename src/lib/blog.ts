import fs from "fs"
import path from "path"
import matter from "gray-matter"

const BLOG_DIR = path.join(process.cwd(), "content/blog")

export interface BlogSection {
  type: "h2" | "h3" | "p" | "ul" | "ol" | "blockquote" | "callout"
  content: string | string[]
  label?: string
}

export interface BlogPost {
  slug: string
  title: string
  description: string
  excerpt: string
  date: string
  author: string
  category: string
  readTime: number
  image?: string
  content?: string // MDX raw content
  sections: BlogSection[] // legacy section-based content
  source: "mdx" | "hardcoded"
}

// ============ HARDCODED POSTS (legacy) ============

const HARDCODED_POSTS: Omit<BlogPost, "source">[] = [
  {
    slug: "ai-outbound-cold-email-2025",
    title: "Why AI-Powered Cold Email Converts 3x Better Than Manual Outreach in 2025",
    description: "Traditional cold email is dead. Here's what actually works - and the exact AI infrastructure behind campaigns generating 10-15% reply rates.",
    excerpt: "Traditional cold email is dead. Here's what actually works - and the exact AI infrastructure behind campaigns generating 10-15% reply rates.",
    date: "2025-02-18",
    author: "AIMS Team",
    category: "Cold Outbound",
    readTime: 7,
    sections: [
      {
        type: "p",
        content: "Cold email has a reputation problem. Years of spray-and-pray campaigns trained buyers to ignore anything that looks like a template. But while most companies gave up on outbound, a new approach - AI-powered, deeply personalized cold email - is quietly generating reply rates that haven't been seen since the early days of email marketing.",
      },
      {
        type: "p",
        content: "The difference isn't the channel. It's the infrastructure behind it.",
      },
      {
        type: "h2",
        content: "What Changed: The AI Personalization Layer",
      },
      {
        type: "p",
        content: "A decade ago, personalization meant merging {FirstName} and {Company} into an email. Buyers saw through it immediately - and they still do. What's changed is the ability to generate genuinely relevant, one-to-one opening lines at scale by pulling signals from:",
      },
      {
        type: "ul",
        content: [
          "Recent company news and press releases",
          "LinkedIn activity - posts, job changes, promotions",
          "Hiring patterns that signal intent (e.g., posting 5 sales roles = scaling outbound)",
          "Funding announcements and growth stage indicators",
          "Technographic data: what tools they're already using",
        ],
      },
      {
        type: "p",
        content: "When an email opens with a reference to something that actually happened at the prospect's company last week - not a generic line about their industry - reply rates jump significantly. Across our client campaigns, we see 3x the reply rate of control groups using standard personalization.",
      },
      {
        type: "h2",
        content: "The Infrastructure That Makes It Work",
      },
      {
        type: "p",
        content: "AI-powered outbound is more than ChatGPT writing your emails. The full stack looks like this:",
      },
      {
        type: "ol",
        content: [
          "Account list enrichment - sourcing and cleaning 500-2,000 ideal accounts per month based on firmographic and intent filters",
          "Signal extraction - pulling recent news, LinkedIn activity, and technographic data per account",
          "AI copy generation - personalized first lines and value propositions generated at account level",
          "Deliverability infrastructure - warmed domains, SPF/DKIM/DMARC, sending rotation",
          "Multi-step sequences - 4-6 touchpoints over 21 days, automatically pausing on reply or meeting booked",
          "CRM sync - every reply, bounce, and positive response logged with context",
        ],
      },
      {
        type: "h2",
        content: "What Results Actually Look Like",
      },
      {
        type: "p",
        content: "For context, industry benchmarks put cold email reply rates at 1-3% for generic campaigns. Here's what we see on optimized AI-powered campaigns:",
      },
      {
        type: "ul",
        content: [
          "Open rates: 40-55% (vs. industry avg of 20-25%)",
          "Reply rates: 8-15% (vs. industry avg of 1-3%)",
          "Positive response rates: 3-6% of total sends",
          "Lead-to-meeting conversion: 10-14%",
        ],
      },
      {
        type: "callout",
        label: "Key Insight",
        content: "These numbers don't happen on day one. The first 2-3 weeks are calibration - testing subject lines, value props, and sequences. Campaigns that follow the optimization protocol typically hit peak performance by week 4-6.",
      },
      {
        type: "h2",
        content: "The Compliance Side (Don't Skip This)",
      },
      {
        type: "p",
        content: "Scaling cold outbound without proper deliverability infrastructure is the fastest way to end up in spam folders - or worse, get your domain blacklisted. Every AIMS outbound system includes domain warming, unsubscribe handling, bounce management, and CAN-SPAM / GDPR compliance built in.",
      },
      {
        type: "h2",
        content: "Is AI Outbound Right for Your Business?",
      },
      {
        type: "p",
        content: "Cold outbound works best when: (1) you have a clearly defined ICP with 500+ addressable accounts, (2) your average contract value is $500+/month or $5,000+ one-time, and (3) your offer is something buyers can evaluate and act on from a short email.",
      },
      {
        type: "p",
        content: "If that sounds like your business, a properly built AI outbound system is likely the highest-leverage growth investment you can make right now.",
      },
    ],
  },
  {
    slug: "what-is-aeo-answer-engine-optimization",
    title: "What Is Answer Engine Optimization (AEO) - And Why It Matters More Than SEO in 2025",
    description: "ChatGPT, Perplexity, and Google's AI Overviews are changing how buyers find businesses. Here's how to make sure your company shows up when they ask.",
    excerpt: "ChatGPT, Perplexity, and Google's AI Overviews are changing how buyers find businesses. Here's how to make sure your company shows up when they ask.",
    date: "2025-02-10",
    author: "AIMS Team",
    category: "SEO & AEO",
    readTime: 6,
    sections: [
      {
        type: "p",
        content: "If you asked ChatGPT to recommend a marketing agency in your city right now, would your business show up? For most companies, the answer is no - and that's a problem that's getting more expensive to ignore every month.",
      },
      {
        type: "p",
        content: "Search behavior is shifting. An estimated 30%+ of queries that used to go to Google are now being answered by AI tools like ChatGPT, Perplexity, Claude, and Google's own AI Overviews. Those tools don't send traffic to your website - they give the answer directly. If your business isn't the answer, you're invisible.",
      },
      {
        type: "h2",
        content: "SEO vs. AEO: What's the Difference?",
      },
      {
        type: "p",
        content: "Traditional SEO is about ranking on page 1 of Google for the right keywords. Answer Engine Optimization (AEO) is about becoming the source AI systems cite when someone asks a question in your category.",
      },
      {
        type: "ul",
        content: [
          "SEO goal: rank for 'best HVAC company Dallas' → get the click",
          "AEO goal: be the answer when someone asks ChatGPT 'Who's the most reliable HVAC company in Dallas?'",
        ],
      },
      {
        type: "p",
        content: "The strategies overlap - good SEO helps AEO - but there are specific tactics that move the needle for AI visibility that don't apply to traditional search.",
      },
      {
        type: "h2",
        content: "How AI Search Engines Choose What to Cite",
      },
      {
        type: "p",
        content: "AI search tools pull from a combination of sources to construct their answers:",
      },
      {
        type: "ol",
        content: [
          "Indexed web content - pages, blog posts, and structured data that crawlers can read and understand",
          "Review platforms - Google, Yelp, Trustpilot, G2, Capterra (for B2B)",
          "Third-party mentions - news articles, industry publications, directory listings",
          "Schema markup - structured data that explicitly tells AI what your business does, where you're located, and what you offer",
          "Authority signals - backlinks, citation consistency, and domain age",
        ],
      },
      {
        type: "h2",
        content: "The 5 AEO Tactics That Matter Most Right Now",
      },
      {
        type: "ul",
        content: [
          "FAQ schema on every key page - answer the exact questions buyers type into AI tools",
          "Entity clarity - make sure your business name, category, and location are consistent everywhere (NAP consistency)",
          "Topical authority content - publish 20-30 articles that comprehensively cover your category",
          "Review velocity - more recent reviews on major platforms = more credibility signals to AI systems",
          "Citation building - ensure your business is listed correctly in 50+ directories and data aggregators",
        ],
      },
      {
        type: "callout",
        label: "Quick Win",
        content: "The fastest AEO win is FAQ schema. Take the 10 most common questions your customers ask and add structured FAQ markup to your homepage and service pages. This feeds AI systems a direct answer - attributed to your business.",
      },
      {
        type: "h2",
        content: "The Timeline for AEO Results",
      },
      {
        type: "p",
        content: "Unlike paid ads, AEO is a compounding investment. Most businesses see initial AI citation appearances within 60-90 days of a full implementation. The payoff is durable - once AI systems learn to trust your business as an authoritative source, that visibility compounds over time.",
      },
      {
        type: "p",
        content: "The businesses that invest in AEO now will have a significant head start on competitors who wait until AI search is impossible to ignore.",
      },
    ],
  },
  {
    slug: "ai-readiness-checklist-small-business",
    title: "The AI Readiness Checklist: 10 Questions Every Small Business Should Answer Before Investing in AI",
    description: "Before you spend a dollar on AI tools, answer these 10 questions. They'll tell you exactly where to start - and what to avoid.",
    excerpt: "Before you spend a dollar on AI tools, answer these 10 questions. They'll tell you exactly where to start - and what to avoid.",
    date: "2025-02-03",
    author: "AIMS Team",
    category: "AI Strategy",
    readTime: 5,
    sections: [
      {
        type: "p",
        content: "The AI tool market is overwhelming. New platforms launch every week promising to automate everything from your sales emails to your accounting. For small business owners, the real danger isn't missing out on AI - it's buying tools that don't fit, stacking subscriptions with no clear ROI, and burning out your team with too much change at once.",
      },
      {
        type: "p",
        content: "Before you invest in anything, work through this checklist. It takes 10 minutes and will save you months of wrong turns.",
      },
      {
        type: "h2",
        content: "The 10 Questions",
      },
      {
        type: "ol",
        content: [
          "What is your #1 revenue bottleneck right now? (Not enough leads? Leads not converting? Delivery/fulfillment breaking down?) AI works best when pointed at a specific, well-defined problem.",
          "Do you have a CRM? If yes, is it actually being used consistently? If no, this is almost always step 1 before any AI investment.",
          "How does your team currently follow up with new leads? What's your average response time? This single number often reveals the highest-leverage opportunity.",
          "How much time per week does your team spend on tasks that feel repetitive and predictable? List them - these are your automation candidates.",
          "What does your current monthly spend on marketing and sales tools look like? Are you getting clear ROI from each one?",
          "Do you have a documented sales process with clear stage criteria? AI can't optimize a process that doesn't exist yet.",
          "How are new leads currently finding you? Are you tracking which channels produce the best leads - not just the most leads?",
          "What does your website do when a visitor arrives at 10pm on a Saturday? If the answer is 'nothing,' an AI chatbot could be capturing leads you're currently losing.",
          "Have you tried any AI tools already? What worked? What didn't? Why? Prior experience is valuable data.",
          "What would a 10% improvement in your lead-to-close rate be worth annually? This calculation should anchor every AI investment decision you make.",
        ],
      },
      {
        type: "h2",
        content: "How to Use Your Answers",
      },
      {
        type: "p",
        content: "Look for the questions where your answer revealed the most friction or the biggest gap. That gap is your starting point.",
      },
      {
        type: "ul",
        content: [
          "No CRM → Start with CRM setup before any AI",
          "Slow lead follow-up → AI follow-up automation is your first move",
          "Too much manual admin → Map the workflows, then automate the most repetitive ones",
          "Website doing nothing at night → AI chatbot is a quick win",
          "No outbound motion → Build the outbound system before optimizing inbound",
        ],
      },
      {
        type: "callout",
        label: "Rule of Thumb",
        content: "The best AI investment is the one that solves your current biggest bottleneck - not the flashiest tool. Start narrow, prove ROI, then expand.",
      },
      {
        type: "h2",
        content: "The Most Common Mistake",
      },
      {
        type: "p",
        content: "The most common mistake small businesses make with AI is buying tools before processes. AI amplifies what's already working - it doesn't fix broken processes. If your sales team doesn't follow up consistently with leads today, an AI tool won't magically change that. The process has to be defined first.",
      },
      {
        type: "p",
        content: "The second most common mistake: trying to implement everything at once. Pick one problem, solve it with AI, prove the ROI, then move to the next. The businesses that win with AI are the ones that build systematically - not the ones that chase every new tool.",
      },
      {
        type: "h2",
        content: "Next Step",
      },
      {
        type: "p",
        content: "If you want a more structured assessment, take the AIMS AI Readiness Quiz. It's free, takes 2 minutes, and gives you a personalized score with specific recommendations based on your answers.",
      },
    ],
  },
]

// ============ MDX FILE-BASED POSTS ============

function estimateReadTime(content: string): number {
  const words = content.split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

function getMdxPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return []

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"))

  return files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8")
    const { data, content } = matter(raw)

    return {
      slug: file.replace(/\.mdx$/, ""),
      title: data.title ?? "Untitled",
      description: data.description ?? "",
      excerpt: data.description ?? "",
      date: data.date ?? "2026-01-01",
      author: data.author ?? "AIMS Team",
      category: data.category ?? "General",
      readTime: estimateReadTime(content),
      image: data.image,
      content,
      sections: [],
      source: "mdx" as const,
    }
  })
}

// ============ PUBLIC API ============

export function getAllPosts(): BlogPost[] {
  const hardcoded: BlogPost[] = HARDCODED_POSTS.map((p) => ({
    ...p,
    source: "hardcoded" as const,
  }))

  const mdx = getMdxPosts()

  return [...hardcoded, ...mdx].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.slug === slug)
}

export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug)
}
