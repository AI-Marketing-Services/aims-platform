import type { Metadata } from "next"
import { auth, currentUser } from "@clerk/nextjs/server"

export const metadata: Metadata = {
  title: "Your Tool Results | AIMS",
  description: "View your AI readiness quiz, ROI calculator, and website audit results.",
}
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { ArrowRight, BarChart2, Globe, Brain, ChevronRight, ExternalLink } from "lucide-react"

const TYPE_META: Record<string, {
  label: string
  icon: React.ReactNode
  color: string
  bg: string
  resultsPath: (id: string) => string
  retakePath: string
}> = {
  AI_READINESS_QUIZ: {
    label: "AI Readiness Quiz",
    icon: <Brain className="w-5 h-5" />,
    color: "text-purple-600",
    bg: "bg-purple-50",
    resultsPath: (id) => `/tools/ai-readiness-quiz/results/${id}`,
    retakePath: "/tools/ai-readiness-quiz",
  },
  ROI_CALCULATOR: {
    label: "ROI Calculator",
    icon: <BarChart2 className="w-5 h-5" />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    resultsPath: () => "/tools/roi-calculator",
    retakePath: "/tools/roi-calculator",
  },
  WEBSITE_AUDIT: {
    label: "Website Audit",
    icon: <Globe className="w-5 h-5" />,
    color: "text-green-600",
    bg: "bg-green-50",
    resultsPath: () => "/tools/website-audit",
    retakePath: "/tools/website-audit",
  },
}

const TOOLS_AVAILABLE = [
  {
    key: "AI_READINESS_QUIZ",
    label: "AI Readiness Quiz",
    description: "7 questions. Get a personalized AI adoption score and roadmap.",
    href: "/tools/ai-readiness-quiz",
    icon: <Brain className="w-5 h-5" />,
    bg: "bg-purple-50",
    color: "text-purple-600",
  },
  {
    key: "ROI_CALCULATOR",
    label: "ROI Calculator",
    description: "See the monthly savings from automating your sales ops.",
    href: "/tools/roi-calculator",
    icon: <BarChart2 className="w-5 h-5" />,
    bg: "bg-blue-50",
    color: "text-blue-600",
  },
  {
    key: "WEBSITE_AUDIT",
    label: "Website Audit",
    description: "Free AI-powered audit of your site's conversion readiness.",
    href: "/tools/website-audit",
    icon: <Globe className="w-5 h-5" />,
    bg: "bg-green-50",
    color: "text-green-600",
  },
]

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function ScoreBadge({ score, type }: { score: number | null; type: string }) {
  if (score === null) return <span className="text-gray-400 text-sm">—</span>

  let color = "text-red-600 bg-red-50"
  if (score >= 80) color = "text-green-600 bg-green-50"
  else if (score >= 60) color = "text-yellow-600 bg-yellow-50"
  else if (score >= 40) color = "text-orange-600 bg-orange-50"

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {score}/100
    </span>
  )
}

export default async function ToolsDashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in?redirect_url=/tools/dashboard")

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress

  const submissions = email
    ? await db.leadMagnetSubmission.findMany({
        where: { email },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : []

  const completedTypes = new Set(submissions.map((s) => s.type))
  const remainingTools = TOOLS_AVAILABLE.filter((t) => !completedTypes.has(t.key as never))

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Free Tools Dashboard</h1>
          <p className="text-gray-500">
            All your assessments and results in one place.
            {email && <> Showing results for <span className="font-medium text-gray-700">{email}</span>.</>}
          </p>
        </div>

        {/* Past submissions */}
        {submissions.length > 0 ? (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Assessments</h2>
            <div className="space-y-4">
              {submissions.map((sub) => {
                const meta = TYPE_META[sub.type]
                if (!meta) return null
                return (
                  <div
                    key={sub.id}
                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className={`w-10 h-10 rounded-lg ${meta.bg} ${meta.color} flex items-center justify-center flex-shrink-0`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{meta.label}</span>
                        <ScoreBadge score={sub.score ? Math.round(sub.score) : null} type={sub.type} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(sub.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {sub.type === "AI_READINESS_QUIZ" && (
                        <Link
                          href={meta.resultsPath(sub.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#DC2626] hover:underline"
                        >
                          View results
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                      <Link
                        href={meta.retakePath}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                      >
                        Retake
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center mb-10">
            <p className="text-gray-400 mb-4">You haven&apos;t completed any assessments yet.</p>
            <Link
              href="/tools/ai-readiness-quiz"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#DC2626] text-white text-sm font-semibold rounded-lg hover:bg-[#B91C1C] transition-colors"
            >
              Take the AI Readiness Quiz
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Remaining tools to try */}
        {remainingTools.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {submissions.length > 0 ? "More free tools" : "Get started"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {remainingTools.map((tool) => (
                <Link
                  key={tool.key}
                  href={tool.href}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className={`w-9 h-9 rounded-lg ${tool.bg} ${tool.color} flex items-center justify-center mb-3`}>
                    {tool.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{tool.label}</h3>
                  <p className="text-xs text-gray-500 mb-4">{tool.description}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#DC2626] group-hover:underline">
                    Start free
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade CTA */}
        {submissions.length > 0 && (
          <div className="mt-10 bg-[#DC2626] rounded-2xl p-8 text-center text-white">
            <h3 className="text-xl font-bold mb-2">Ready to act on your results?</h3>
            <p className="text-red-100 text-sm mb-6">
              Browse the full AIMS service marketplace and build your custom AI stack.
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#DC2626] text-white text-sm font-semibold rounded-lg hover:bg-[#B91C1C] transition-colors"
            >
              Browse Services
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
