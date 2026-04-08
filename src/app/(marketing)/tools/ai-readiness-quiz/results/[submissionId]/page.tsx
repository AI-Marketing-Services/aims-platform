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
      "Your competitors are running AI-powered outbound 24/7 while your team is still doing things manually. The good news: there's massive upside waiting, and a clear starting sequence you can run this month.",
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
      "You've built a real machine. The risk now is standing still while the landscape shifts. The operators pulling further ahead are the ones compounding AI-native advantages every month.",
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
  if (!sub) return { title: "AI Readiness Results | AI Operator Collective" }
  const score = sub.score ?? 0
  const cat = CATEGORIES.find((c) => score >= c.range[0] && score <= c.range[1]) ?? CATEGORIES[0]
  return {
    title: `${sub.name ?? "Someone"} scored ${score}/100 — ${cat.label} | AI Operator Collective`,
    description: `See how AI-ready this business is and take the free quiz to get your own personalized score.`,
    openGraph: {
      title: `${score}/100 — ${cat.label}`,
      description: "Take the free AI Readiness Quiz to benchmark your business.",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aioperatorcollective.com"
  const shareUrl = `${appUrl}/tools/ai-readiness-quiz/results/${submissionId}`
  const shareText = `I scored ${score}/100 on the AI Readiness Quiz — ${category.label}. See where your business stands:`

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

        {/* Share */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-1">Share your score</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Challenge your network to see how they compare.
          </p>
          <ShareButtons shareUrl={shareUrl} shareText={shareText} />
        </div>

        {/* CTA — Collective */}
        <div className="bg-card border border-primary/20 rounded-2xl p-8 text-center mb-6">
          <h3 className="text-2xl font-bold text-foreground mb-3">You know the gap. Closing it is the harder half.</h3>
          <p className="text-muted-foreground mb-6">
            The AI Operator Collective is where operators workshop the AI moves their business
            should run — with playbooks, working tooling, and people who&apos;ve already shipped
            what you&apos;re trying to build. Apply below.
          </p>
          <Link
            href="/#apply"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            Apply to the Collective
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
