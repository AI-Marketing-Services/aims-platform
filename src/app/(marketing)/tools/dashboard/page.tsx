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
    color: "text-purple-400",
    bg: "bg-purple-900/15",
    resultsPath: (id) => `/tools/ai-readiness-quiz/results/${id}`,
    retakePath: "/tools/ai-readiness-quiz",
  },
  ROI_CALCULATOR: {
    label: "ROI Calculator",
    icon: <BarChart2 className="w-5 h-5" />,
    color: "text-blue-400",
    bg: "bg-blue-900/15",
    resultsPath: () => "/tools/roi-calculator",
    retakePath: "/tools/roi-calculator",
  },
  WEBSITE_AUDIT: {
    label: "Website Audit",
    icon: <Globe className="w-5 h-5" />,
    color: "text-green-400",
    bg: "bg-green-900/15",
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
    bg: "bg-purple-900/15",
    color: "text-purple-400",
  },
  {
    key: "ROI_CALCULATOR",
    label: "ROI Calculator",
    description: "See the monthly savings from automating your sales ops.",
    href: "/tools/roi-calculator",
    icon: <BarChart2 className="w-5 h-5" />,
    bg: "bg-blue-900/15",
    color: "text-blue-400",
  },
  {
    key: "WEBSITE_AUDIT",
    label: "Website Audit",
    description: "Free AI-powered audit of your site's conversion readiness.",
    href: "/tools/website-audit",
    icon: <Globe className="w-5 h-5" />,
    bg: "bg-green-900/15",
    color: "text-green-400",
  },
]

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function ScoreBadge({ score, type }: { score: number | null; type: string }) {
  if (score === null) return <span className="text-muted-foreground text-sm">—</span>

  let color = "text-primary bg-primary/10"
  if (score >= 80) color = "text-green-400 bg-green-900/15"
  else if (score >= 60) color = "text-yellow-400 bg-yellow-900/15"
  else if (score >= 40) color = "text-orange-400 bg-orange-900/15"

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
    <div className="min-h-screen bg-deep">
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Free Tools Dashboard</h1>
          <p className="text-muted-foreground">
            All your assessments and results in one place.
            {email && <> Showing results for <span className="font-medium text-foreground">{email}</span>.</>}
          </p>
        </div>

        {/* Past submissions */}
        {submissions.length > 0 ? (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">Your Assessments</h2>
            <div className="space-y-4">
              {submissions.map((sub) => {
                const meta = TYPE_META[sub.type]
                if (!meta) return null
                return (
                  <div
                    key={sub.id}
                    className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className={`w-10 h-10 rounded-lg ${meta.bg} ${meta.color} flex items-center justify-center flex-shrink-0`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-foreground text-sm">{meta.label}</span>
                        <ScoreBadge score={sub.score ? Math.round(sub.score) : null} type={sub.type} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(sub.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {sub.type === "AI_READINESS_QUIZ" && (
                        <Link
                          href={meta.resultsPath(sub.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          View results
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                      <Link
                        href={meta.retakePath}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-surface transition-colors"
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
          <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center mb-10">
            <p className="text-muted-foreground mb-4">You haven&apos;t completed any assessments yet.</p>
            <Link
              href="/tools/ai-readiness-quiz"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Take the AI Readiness Quiz
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Remaining tools to try */}
        {remainingTools.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {submissions.length > 0 ? "More free tools" : "Get started"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {remainingTools.map((tool) => (
                <Link
                  key={tool.key}
                  href={tool.href}
                  className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className={`w-9 h-9 rounded-lg ${tool.bg} ${tool.color} flex items-center justify-center mb-3`}>
                    {tool.icon}
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">{tool.label}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{tool.description}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary group-hover:underline">
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
          <div className="mt-10 bg-primary rounded-2xl p-8 text-center text-white">
            <h3 className="text-xl font-bold mb-2">Ready to act on your results?</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Browse the full AIMS service marketplace and build your custom AI stack.
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 bg-card text-primary text-sm font-semibold rounded-lg hover:bg-primary/10 transition-colors"
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
