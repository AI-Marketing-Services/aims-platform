import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { CheckCircle, AlertCircle, XCircle, Zap, ArrowRight } from "lucide-react"
import Link from "next/link"
import { ShareButtons } from "./ShareButtons"

interface Props {
  params: Promise<{ submissionId: string }>
}

const CATEGORIES = [
  {
    label: "AI Laggard",
    range: [0, 39] as [number, number],
    colorClass: "text-primary",
    bgClass: "bg-primary/10",
    borderClass: "border-primary/30",
    headline: "You're leaving serious revenue on the table",
    description:
      "Your competitors are running AI-powered outbound 24/7 while your team is still doing things manually. The good news: there's massive upside waiting, and AIMS can unlock it fast.",
    recommended: ["Website + CRM + Chatbot Bundle", "Cold Outbound System", "AI Voice Agents"],
  },
  {
    label: "Early Adopter",
    range: [40, 59] as [number, number],
    colorClass: "text-orange-500",
    bgClass: "bg-orange-900/15",
    borderClass: "border-orange-800",
    headline: "You have the foundation - now it's time to scale",
    description:
      "You've made some smart moves but your systems aren't working together. A few strategic automations could 2-3x your output without adding headcount.",
    recommended: ["Cold Outbound System", "SEO + AEO Strategy", "Audience Targeting"],
  },
  {
    label: "AI Ready",
    range: [60, 79] as [number, number],
    colorClass: "text-yellow-500",
    bgClass: "bg-yellow-900/15",
    borderClass: "border-yellow-800",
    headline: "You're ahead of most - let's optimize for growth",
    description:
      "Your infrastructure is solid and you understand the game. The next level is fine-tuning your AI stack and adding intelligence layers that compound over time.",
    recommended: ["AI Tool Tracker", "Pixel Intelligence", "Finance Automation"],
  },
  {
    label: "AI Leader",
    range: [80, 100] as [number, number],
    colorClass: "text-green-500",
    bgClass: "bg-green-900/15",
    borderClass: "border-green-800",
    headline: "You're operating at the top 10% - let's keep it that way",
    description:
      "You've built a real machine. The risk now is standing still while the landscape shifts. AIMS can help you stay ahead with custom AI builds and white-glove strategy.",
    recommended: ["Vending Placement Visualizer", "AI Tool Tracker", "Custom AI Builds"],
  },
]

function getCategoryIcon(label: string) {
  if (label === "AI Laggard") return <XCircle className="w-10 h-10 text-primary" />
  if (label === "Early Adopter") return <AlertCircle className="w-10 h-10 text-orange-500" />
  if (label === "AI Ready") return <Zap className="w-10 h-10 text-yellow-500" />
  return <CheckCircle className="w-10 h-10 text-green-500" />
}

export async function generateMetadata({ params }: Props) {
  const { submissionId } = await params
  const sub = await db.leadMagnetSubmission.findUnique({ where: { id: submissionId } })
  if (!sub) return { title: "AI Readiness Results - AIMS" }
  const score = sub.score ?? 0
  const cat = CATEGORIES.find((c) => score >= c.range[0] && score <= c.range[1]) ?? CATEGORIES[0]
  return {
    title: `${sub.name ?? "Someone"} scored ${score}/100 - ${cat.label} | AIMS`,
    description: `See how AI-ready this business is and take the free quiz to get your own personalized score.`,
  }
}

export default async function ResultsPage({ params }: Props) {
  const { submissionId } = await params
  const submission = await db.leadMagnetSubmission.findUnique({
    where: { id: submissionId },
  })

  if (!submission || submission.type !== "AI_READINESS_QUIZ") notFound()

  const score = submission.score ?? 0
  const category = CATEGORIES.find((c) => score >= c.range[0] && score <= c.range[1]) ?? CATEGORIES[0]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"
  const shareUrl = `${appUrl}/tools/ai-readiness-quiz/results/${submissionId}`
  const shareText = `I scored ${score}/100 on the AIMS AI Readiness Quiz - ${category.label}. See where your business stands:`

  return (
    <div className="min-h-screen bg-deep">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Header banner */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            <Zap className="w-3.5 h-3.5" />
            AI Readiness Assessment Results
          </div>
          {submission.name && (
            <p className="text-muted-foreground text-sm">
              Results for <span className="font-medium text-foreground">{submission.name}</span>
              {submission.company && <> · {submission.company}</>}
            </p>
          )}
        </div>

        {/* Score card */}
        <div className="bg-card border border-border rounded-2xl p-8 text-center mb-6 shadow-sm">
          <div className="flex justify-center mb-4">{getCategoryIcon(category.label)}</div>
          <div className="text-5xl sm:text-7xl font-black text-foreground mb-1">{score}</div>
          <div className="text-muted-foreground text-sm mb-3">AI Readiness Score</div>
          <div className={`text-xl font-bold mb-6 ${category.colorClass}`}>{category.label}</div>

          <div className="max-w-xs mx-auto mb-6">
            <div className="h-3 bg-deep rounded-full overflow-hidden">
              <div
                className="h-3 bg-primary rounded-full transition-all duration-700"
                style={{ width: `${score}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Laggard</span>
              <span>Leader</span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2">{category.headline}</h2>
          <p className="text-muted-foreground leading-relaxed">{category.description}</p>
        </div>

        {/* Recommended services */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-1">Services That Fix These Gaps</h3>
          <p className="text-sm text-muted-foreground mb-4">Tailored to your {category.label} profile - here is where to start.</p>
          <div className="space-y-3">
            {category.recommended.map((rec) => {
              const serviceDetails: Record<string, { desc: string; price: string }> = {
                "Website + CRM + Chatbot Bundle": { desc: "AI-powered website with built-in CRM and chatbot that captures leads 24/7", price: "from $97/mo" },
                "Cold Outbound System": { desc: "Automated outbound engine sending thousands of personalized emails monthly", price: "from $297/mo" },
                "AI Voice Agents": { desc: "Never miss a call - AI answers, qualifies, and books meetings for you", price: "Custom" },
                "SEO + AEO Strategy": { desc: "Rank in search and get cited by AI assistants like ChatGPT and Perplexity", price: "from $197/mo" },
                "Audience Targeting": { desc: "Precision B2B audiences built from 100M+ contacts for your outbound campaigns", price: "from $147/mo" },
                "AI Tool Tracker": { desc: "Monitor AI tool spend, usage, and ROI across your entire organization", price: "from $97/mo" },
                "Pixel Intelligence": { desc: "Identify anonymous website visitors and route them into automated follow-up", price: "from $197/mo" },
                "Finance Automation": { desc: "Automated P&L reporting, invoice processing, and financial dashboards", price: "from $247/mo" },
                "Vending Placement Visualizer": { desc: "AI-powered location scouting and placement optimization for vending operators", price: "Custom" },
                "Custom AI Builds": { desc: "Forward-deployed engineers build and deploy custom AI solutions you own forever", price: "Custom" },
              }
              const details = serviceDetails[rec] ?? { desc: "AI-powered solution tailored to your business needs", price: "Custom" }
              return (
                <div key={rec} className="border border-border rounded-xl p-4 hover:border-border transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-sm">{rec}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{details.desc}</p>
                      <p className="text-xs text-muted-foreground mt-2">{details.price}</p>
                    </div>
                    <Link href="/marketplace" className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                      View <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Share */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-1">Share your score</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Challenge your network to see how they compare.
          </p>
          <ShareButtons shareUrl={shareUrl} shareText={shareText} />
        </div>

        {/* CTA */}
        <div className="bg-card border border-primary/20 rounded-2xl p-8 text-center mb-6">
          <h3 className="text-2xl font-bold text-foreground mb-3">Ready to close the gap?</h3>
          <p className="text-muted-foreground mb-6">
            Book a free 30-minute strategy call. We&apos;ll walk through your score and build a custom AI roadmap.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 px-8 py-4 bg-card text-primary font-semibold rounded-xl hover:bg-primary/10 transition-colors"
          >
            Book Your Strategy Call
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Retake */}
        <p className="text-center text-sm text-muted-foreground">
          Want to see your score?{" "}
          <Link href="/tools/ai-readiness-quiz" className="text-primary hover:underline font-medium">
            Take the quiz
          </Link>
        </p>
      </div>
    </div>
  )
}
