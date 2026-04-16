import type { Metadata } from "next"
import Link from "next/link"
import {
  CheckCircle2,
  ArrowRight,
  Calendar,
  FileText,
  Sparkles,
  Zap,
  Target,
  TrendingUp,
  Users,
  MessageCircle,
  Wrench,
  BookOpen,
  Download,
  Video,
  BarChart3,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Your call is confirmed — AI Operator Collective",
  description:
    "Prep for your AI Operator strategy call. AI use cases by industry, the operator tool stack, and real case studies from the community.",
  robots: { index: false, follow: false },
}

/* -------------------------------------------------------------------------- */
/*  AI use cases — pulled from the trackr master resource library             */
/* -------------------------------------------------------------------------- */

interface UseCase {
  niche: string
  title: string
  before: string
  after: string
  tools: string[]
}

const USE_CASES: UseCase[] = [
  {
    niche: "Marketing consultant",
    title: "AI SEO Content Engine",
    before: "Writing one blog post per week, eight hours each, competing with agencies that publish daily.",
    after: "AI research → outline → draft → human-edit pipeline. Higher content volume without scaling headcount.",
    tools: ["Perplexity", "Claude", "Notion"],
  },
  {
    niche: "Sales rep / BDR",
    title: "Hyper-personalized cold outbound",
    before: "Reading LinkedIn profiles manually to write warm cold emails, one at a time.",
    after: "Enrichment → Claygent research → Instantly sequence. Personalization at scale without sounding templated.",
    tools: ["Apollo", "Clay", "Instantly"],
  },
  {
    niche: "Customer success / support",
    title: "AI tier-1 support agent",
    before: "Support team drowning in repetitive tickets. Founder pulled into support every day.",
    after: "Notion KB feeding an AI agent that handles common tier-1 questions while humans focus on the hard ones.",
    tools: ["Notion", "Intercom Fin"],
  },
  {
    niche: "Engineering manager",
    title: "AI engineering velocity stack",
    before: "PR review backlogs. Long cycles to ship small changes.",
    after: "Claude Code + Cursor + Linear. Shorter review cycles, fewer bottlenecks.",
    tools: ["Claude Code", "Cursor", "Linear"],
  },
  {
    niche: "Operations / RevOps",
    title: "AI tool research pipeline",
    before: "Evaluating new SaaS takes days. Vendor calls and scattered notes.",
    after: "Perplexity deep-dive → scorecard in Notion. Minutes instead of days with one source of truth.",
    tools: ["Perplexity", "Notion", "Claude"],
  },
  {
    niche: "Content / media",
    title: "AI video marketing machine",
    before: "One polished YouTube video per month. No shorts. No repurposing.",
    after: "A single recording fans out into short-form, posts, and newsletter with AI handling the repurposing.",
    tools: ["Runway", "Canva", "Descript"],
  },
  {
    niche: "Founder / CEO",
    title: "AI-native operating system",
    before: "Hiring for every function. Payroll eating margin.",
    after: "Agent-heavy ops. Humans lead strategy + client relationships; agents run content, research, admin.",
    tools: ["n8n", "Claude Code", "Linear"],
  },
  {
    niche: "Analytics / data",
    title: "Self-serve AI analytics stack",
    before: "Ad-hoc SQL requests from every team. Analyst pulled in every day.",
    after: "Team self-serves through natural-language queries into the warehouse.",
    tools: ["PostHog", "Metabase", "Claude"],
  },
  {
    niche: "People ops / HR",
    title: "AI-automated onboarding",
    before: "Week-long new-hire onboarding, manual SaaS provisioning across 10 tools.",
    after: "Templates fully provision on day 1. Less HR overhead, new hires productive faster.",
    tools: ["Rippling", "Notion", "Ramp"],
  },
  {
    niche: "RevOps / inbound leader",
    title: "Multi-thread inbound leads playbook",
    before: "Inbound trial signups get the same generic nurture. Reps pick the best ones manually.",
    after: "Enrichment + scoring + tiered routing with alerts so the best-fit leads never get lost in the noise.",
    tools: ["Clay", "Apollo", "Slack"],
  },
]

const OPERATOR_TOOLS = [
  { name: "Claude", category: "Reasoning", score: "10.0" },
  { name: "Perplexity", category: "Research", score: "9.7" },
  { name: "Dex", category: "Browser Agent", score: "9.2" },
  { name: "Raycast", category: "Launcher", score: "9.8" },
  { name: "Wispr Flow", category: "Speech-to-Text", score: "9.5" },
  { name: "Little Bird", category: "Meeting AI", score: "9.0" },
  { name: "v0", category: "App Builder", score: "9.0" },
  { name: "Instantly", category: "Cold Email", score: "9.3" },
  { name: "Notion", category: "Knowledge", score: "9.1" },
  { name: "Firecrawl", category: "Web-to-LLM", score: "9.2" },
]

/* -------------------------------------------------------------------------- */

export default function PostBookingNextStepsPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF7] text-[#1A1A1A]">
      {/* ── HERO ── */}
      <section className="relative px-5 sm:px-8 pt-16 sm:pt-24 pb-10 sm:pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson/10 text-crimson mb-5">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-wider">Your call is confirmed</span>
          </div>
          <h1 className="font-playfair text-3xl sm:text-5xl md:text-6xl text-[#1A1A1A] mb-5 leading-[1.05]">
            Prep once. Show up sharp.<br />
            <span className="italic text-crimson">Get more out of the call.</span>
          </h1>
          <p className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto">
            Below is everything we&apos;ve sent to your inbox, plus the case
            studies, AI use cases by industry, and tool stack used by operators
            already inside the Collective. Skim it before we talk.
          </p>
        </div>
      </section>

      {/* ── PREP CHECKLIST ── */}
      <section className="px-5 sm:px-8 pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-[#E3E3E3] p-6 sm:p-10 shadow-sm">
            <h2 className="font-playfair text-2xl sm:text-3xl text-[#1A1A1A] mb-6">
              Three things to do right now
            </h2>
            <ol className="space-y-5">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-crimson text-white flex items-center justify-center font-bold">
                  1
                </span>
                <div>
                  <p className="font-semibold text-[#1A1A1A] mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-crimson" />
                    RSVP to the calendar invite Calendly sent you.
                  </p>
                  <p className="text-sm text-[#4B5563]">
                    Saved to your primary calendar — not a secondary one you
                    never check. Need to reschedule? Use the link in your
                    Calendly confirmation email.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-crimson text-white flex items-center justify-center font-bold">
                  2
                </span>
                <div>
                  <p className="font-semibold text-[#1A1A1A] mb-1 flex items-center gap-2">
                    <Download className="w-4 h-4 text-crimson" />
                    Read the AI Operator Playbook (in your inbox).
                  </p>
                  <p className="text-sm text-[#4B5563]">
                    15 minutes, five chapters. If you haven&apos;t received it,
                    check spam or reply to the confirmation email and we&apos;ll
                    resend.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-crimson text-white flex items-center justify-center font-bold">
                  3
                </span>
                <div>
                  <p className="font-semibold text-[#1A1A1A] mb-1 flex items-center gap-2">
                    <Target className="w-4 h-4 text-crimson" />
                    Come with one specific blocker you want unblocked.
                  </p>
                  <p className="text-sm text-[#4B5563]">
                    The best outcome of this call is you leaving with a
                    concrete next move. Pick your biggest real stuck point so
                    we can unstick it live.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* ── IT'S NOT TOO LATE ── */}
      <section className="px-5 sm:px-8 pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto bg-[#08090D] text-[#F0EBE0] rounded-2xl p-8 sm:p-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson/20 text-crimson mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-wider">
              Real operators, real results
            </span>
          </div>
          <h2 className="font-playfair text-2xl sm:text-4xl mb-4 leading-tight">
            It is not too late.
            <span className="block italic text-crimson mt-1">
              You&apos;re earlier than most W-2 professionals.
            </span>
          </h2>
          <p className="text-[#9CA3AF] text-base sm:text-lg leading-relaxed max-w-2xl mb-6">
            The first wave of &quot;AI operators&quot; was hype — consultants
            selling AI courses about AI. The second wave is operators who
            actually ship. Members in the Collective are real professionals
            running their own work with these tools and sharing what&apos;s
            working every week.
          </p>
          <p className="text-[#9CA3AF] text-base sm:text-lg leading-relaxed max-w-2xl">
            You don&apos;t have to figure it out alone or bet your next move on
            a LinkedIn thread. You learn alongside operators who are building
            in real time.
          </p>
        </div>
      </section>

      {/* ── AI USE CASES BY INDUSTRY ── */}
      <section className="px-5 sm:px-8 pb-12 sm:pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-mono uppercase tracking-wider text-crimson mb-2">
              AI Use Cases by Niche
            </p>
            <h2 className="font-playfair text-2xl sm:text-4xl text-[#1A1A1A] mb-4">
              How operators in every niche are actually using AI.
            </h2>
            <p className="text-[#4B5563]">
              Not theoretical. Each of these is in production somewhere in the
              Collective right now, with the hours saved to prove it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {USE_CASES.map((uc, i) => (
              <article
                key={i}
                className="bg-white rounded-xl border border-[#E3E3E3] p-6 hover:border-crimson/40 transition-colors"
              >
                <div className="mb-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-crimson mb-1">
                    {uc.niche}
                  </p>
                  <h3 className="font-semibold text-[#1A1A1A] text-lg leading-tight">
                    {uc.title}
                  </h3>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#999] block mb-0.5">
                      Before
                    </span>
                    <p className="text-[#4B5563] leading-snug">{uc.before}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#999] block mb-0.5">
                      After
                    </span>
                    <p className="text-[#1A1A1A] leading-snug">{uc.after}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F0F0F0] flex flex-wrap gap-1.5">
                  {uc.tools.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-[#FAFAF7] text-[#4B5563] rounded border border-[#E3E3E3]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOOL STACK ── */}
      <section className="px-5 sm:px-8 pb-12 sm:pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <p className="text-xs font-mono uppercase tracking-wider text-crimson mb-2">
              The Operator Stack
            </p>
            <h2 className="font-playfair text-2xl sm:text-4xl text-[#1A1A1A] mb-4">
              12 tools Collective operators actually pay for.
            </h2>
            <p className="text-[#4B5563] max-w-2xl">
              Scored by the operators using them in production — not by a
              &quot;top 10&quot; post. The full 195-tool scorecard library is
              inside the Collective.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {OPERATOR_TOOLS.map((tool) => (
              <div
                key={tool.name}
                className="bg-white rounded-lg border border-[#E3E3E3] p-4 flex items-center justify-between gap-2 hover:border-crimson/30 transition-colors"
              >
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-[#999] mb-0.5">
                    {tool.category}
                  </p>
                  <p className="font-semibold text-[#1A1A1A]">{tool.name}</p>
                </div>
                <span className="font-mono font-bold text-crimson text-lg">
                  {tool.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT YOU GET ── */}
      <section className="px-5 sm:px-8 pb-12 sm:pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-wider text-crimson mb-2">
              Inside the Collective
            </p>
            <h2 className="font-playfair text-2xl sm:text-4xl text-[#1A1A1A] mb-4">
              What you get once you&apos;re in.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: BookOpen,
                title: "8-module operator curriculum",
                body:
                  "From first-offer sentence to closing month-one engagements — the full ramp, videos plus cheat sheets.",
              },
              {
                icon: Wrench,
                title: "195-tool scored library",
                body:
                  "Every tool Collective members have tried, with scorecards, pricing, and the exact workflow they run.",
              },
              {
                icon: FileText,
                title: "43 ready-to-ship templates",
                body:
                  "AI SEO pipeline, cold outbound engine, tier-1 support agent, ops automation — copy, configure, ship.",
              },
              {
                icon: MessageCircle,
                title: "7 cold email sequences",
                body:
                  "Verbatim sequences that are working right now across the portfolio. Swap ICP, send.",
              },
              {
                icon: Users,
                title: "Weekly operator calls",
                body:
                  "Wins, losses, and live teardowns. See what&apos;s working this week — not what worked in 2023.",
              },
              {
                icon: Zap,
                title: "10 flagship SaaS teardowns",
                body:
                  "How 6 portfolio products were built, priced, and distributed — including the ones that failed.",
              },
              {
                icon: BarChart3,
                title: "52 agent + marketing skills",
                body:
                  "10 agents + 42 marketing skills across SEO, CRO, copy, paid, growth, sales, and strategy.",
              },
              {
                icon: Video,
                title: "30-day LinkedIn calendar",
                body:
                  "A full month of content prompts built for W-2 professionals repositioning as AI operators.",
              },
              {
                icon: Sparkles,
                title: "Every playbook as a PDF",
                body:
                  "Downloadable + printable. Read them offline on a plane, not squinting at a tab.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl border border-[#E3E3E3] p-5 hover:border-crimson/30 transition-colors"
              >
                <item.icon className="w-5 h-5 text-crimson mb-3" />
                <h3 className="font-semibold text-[#1A1A1A] mb-1.5">
                  {item.title}
                </h3>
                <p className="text-sm text-[#4B5563] leading-snug">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL STRIPE ── */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-24">
        <div className="max-w-4xl mx-auto text-center bg-white rounded-2xl border border-[#E3E3E3] p-10 sm:p-14">
          <TrendingUp className="w-8 h-8 text-crimson mx-auto mb-4" />
          <h2 className="font-playfair text-2xl sm:text-4xl text-[#1A1A1A] mb-4">
            See you on the call.
          </h2>
          <p className="text-[#4B5563] max-w-xl mx-auto mb-6 text-base sm:text-lg">
            Save this page — we&apos;ll keep adding case studies and playbooks
            here so your pre-call prep stays fresh.
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-crimson hover:text-crimson-dark"
          >
            Back to application
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
