import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { CheckCircle, AlertCircle, XCircle, Zap, ArrowRight, ChevronRight } from "lucide-react"
import Link from "next/link"
import { ShareButtons } from "./ShareButtons"

interface Props {
  params: Promise<{ submissionId: string }>
}

const CATEGORIES = [
  {
    label: "AI Laggard",
    range: [0, 39] as [number, number],
    colorClass: "text-red-500",
    bgClass: "bg-red-50",
    borderClass: "border-red-200",
    headline: "You're leaving serious revenue on the table",
    description:
      "Your competitors are running AI-powered outbound 24/7 while your team is still doing things manually. The good news: there's massive upside waiting, and AIMS can unlock it fast.",
    recommended: ["Website + CRM + Chatbot Bundle", "Cold Outbound System", "AI Voice Agents"],
  },
  {
    label: "Early Adopter",
    range: [40, 59] as [number, number],
    colorClass: "text-orange-500",
    bgClass: "bg-orange-50",
    borderClass: "border-orange-200",
    headline: "You have the foundation — now it's time to scale",
    description:
      "You've made some smart moves but your systems aren't working together. A few strategic automations could 2-3x your output without adding headcount.",
    recommended: ["Cold Outbound System", "SEO + AEO Strategy", "Audience Targeting"],
  },
  {
    label: "AI Ready",
    range: [60, 79] as [number, number],
    colorClass: "text-yellow-500",
    bgClass: "bg-yellow-50",
    borderClass: "border-yellow-200",
    headline: "You're ahead of most — let's optimize for growth",
    description:
      "Your infrastructure is solid and you understand the game. The next level is fine-tuning your AI stack and adding intelligence layers that compound over time.",
    recommended: ["AI Tool Tracker", "Pixel Intelligence", "Finance Automation"],
  },
  {
    label: "AI Leader",
    range: [80, 100] as [number, number],
    colorClass: "text-green-500",
    bgClass: "bg-green-50",
    borderClass: "border-green-200",
    headline: "You're operating at the top 10% — let's keep it that way",
    description:
      "You've built a real machine. The risk now is standing still while the landscape shifts. AIMS can help you stay ahead with custom AI builds and white-glove strategy.",
    recommended: ["Vending Placement Visualizer", "AI Tool Tracker", "Custom AI Builds"],
  },
]

function getCategoryIcon(label: string) {
  if (label === "AI Laggard") return <XCircle className="w-10 h-10 text-red-500" />
  if (label === "Early Adopter") return <AlertCircle className="w-10 h-10 text-orange-500" />
  if (label === "AI Ready") return <Zap className="w-10 h-10 text-yellow-500" />
  return <CheckCircle className="w-10 h-10 text-green-500" />
}

export async function generateMetadata({ params }: Props) {
  const { submissionId } = await params
  const sub = await db.leadMagnetSubmission.findUnique({ where: { id: submissionId } })
  if (!sub) return { title: "AI Readiness Results — AIMS" }
  const score = sub.score ?? 0
  const cat = CATEGORIES.find((c) => score >= c.range[0] && score <= c.range[1]) ?? CATEGORIES[0]
  return {
    title: `${sub.name ?? "Someone"} scored ${score}/100 — ${cat.label} | AIMS`,
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
  const shareText = `I scored ${score}/100 on the AIMS AI Readiness Quiz — ${category.label}. See where your business stands:`

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Header banner */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-[#DC2626] text-sm font-medium rounded-full mb-4">
            <Zap className="w-3.5 h-3.5" />
            AI Readiness Assessment Results
          </div>
          {submission.name && (
            <p className="text-gray-500 text-sm">
              Results for <span className="font-medium text-gray-700">{submission.name}</span>
              {submission.company && <> · {submission.company}</>}
            </p>
          )}
        </div>

        {/* Score card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center mb-6 shadow-sm">
          <div className="flex justify-center mb-4">{getCategoryIcon(category.label)}</div>
          <div className="text-7xl font-black text-gray-900 mb-1">{score}</div>
          <div className="text-gray-400 text-sm mb-3">AI Readiness Score</div>
          <div className={`text-xl font-bold mb-6 ${category.colorClass}`}>{category.label}</div>

          <div className="max-w-xs mx-auto mb-6">
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-3 bg-[#DC2626] rounded-full transition-all duration-700"
                style={{ width: `${score}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Laggard</span>
              <span>Leader</span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">{category.headline}</h2>
          <p className="text-gray-600 leading-relaxed">{category.description}</p>
        </div>

        {/* Recommended services */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Recommended Services</h3>
          <div className="space-y-3">
            {category.recommended.map((rec) => (
              <div key={rec} className={`flex items-center gap-3 p-3 ${category.bgClass} rounded-lg`}>
                <ChevronRight className="w-4 h-4 text-[#DC2626] flex-shrink-0" />
                <span className="text-gray-800 font-medium text-sm">{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Share */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-1">Share your score</h3>
          <p className="text-sm text-gray-500 mb-4">
            Challenge your network to see how they compare.
          </p>
          <ShareButtons shareUrl={shareUrl} shareText={shareText} />
        </div>

        {/* CTA */}
        <div className="bg-[#DC2626] rounded-2xl p-8 text-center text-white mb-6">
          <h3 className="text-2xl font-bold mb-3">Ready to close the gap?</h3>
          <p className="text-red-100 mb-6">
            Book a free 30-minute strategy call. We&apos;ll walk through your score and build a custom AI roadmap.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#DC2626] font-semibold rounded-xl hover:bg-red-50 transition-colors"
          >
            Book Your Strategy Call
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Retake */}
        <p className="text-center text-sm text-gray-400">
          Want to see your score?{" "}
          <Link href="/tools/ai-readiness-quiz" className="text-[#DC2626] hover:underline font-medium">
            Take the quiz
          </Link>
        </p>
      </div>
    </div>
  )
}
