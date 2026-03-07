import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { DollarSign, TrendingUp, Clock, ArrowRight, Zap } from "lucide-react"
import Link from "next/link"
import { ShareButtons } from "./ShareButtons"

interface Props {
  params: Promise<{ submissionId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { submissionId } = await params
  const sub = await db.leadMagnetSubmission.findUnique({ where: { id: submissionId } })
  if (!sub) return { title: "ROI Calculator Results — AIMS" }
  const data = sub.data as Record<string, unknown>
  const savings = data?.monthlySavings as number | undefined
  return {
    title: `${sub.name ?? "Someone"} could save $${savings?.toLocaleString() ?? "—"}/mo with AI | AIMS`,
    description: "See how much time and money AI automation could save this business — and calculate your own ROI.",
  }
}

export default async function ROIResultsPage({ params }: Props) {
  const { submissionId } = await params
  const submission = await db.leadMagnetSubmission.findUnique({
    where: { id: submissionId },
  })

  if (!submission || submission.type !== "ROI_CALCULATOR") notFound()

  const data = (submission.data ?? {}) as Record<string, unknown>
  const results = (submission.results ?? {}) as Record<string, unknown>

  const monthlySavings = (results.monthlySavings ?? data.monthlySavings ?? 0) as number
  const annualSavings = monthlySavings * 12
  const hoursReclaimed = (results.hoursReclaimed ?? data.hoursReclaimed ?? 0) as number
  const roiMultiple = (results.roiMultiple ?? data.roiMultiple ?? 3) as number

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"
  const shareUrl = `${appUrl}/tools/roi-calculator/results/${submissionId}`
  const shareText = `I could save $${monthlySavings.toLocaleString()}/mo with AI automation. Calculate your business ROI:`

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-2xl mx-auto px-4 py-12">

        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-[#DC2626] text-sm font-medium rounded-full mb-4">
            <Zap className="w-3.5 h-3.5" />
            AI ROI Calculator Results
          </div>
          {submission.name && (
            <p className="text-gray-500 text-sm">
              Results for <span className="font-medium text-gray-700">{submission.name}</span>
              {submission.company && <> · {submission.company}</>}
            </p>
          )}
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            {
              icon: DollarSign,
              label: "Monthly Savings",
              value: `$${monthlySavings.toLocaleString()}`,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              icon: TrendingUp,
              label: "Annual Impact",
              value: `$${annualSavings.toLocaleString()}`,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              icon: Clock,
              label: "Hours Reclaimed/mo",
              value: hoursReclaimed > 0 ? `${hoursReclaimed}h` : "—",
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
          ].map((metric) => (
            <div key={metric.label} className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
              <div className={`w-10 h-10 ${metric.bg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              <div className={`text-3xl font-black ${metric.color} mb-1`}>{metric.value}</div>
              <div className="text-sm text-gray-500">{metric.label}</div>
            </div>
          ))}
        </div>

        {/* ROI summary card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your AI ROI Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Estimated monthly savings</span>
              <span className="font-semibold text-gray-900">${monthlySavings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">12-month cumulative impact</span>
              <span className="font-semibold text-green-600">${annualSavings.toLocaleString()}</span>
            </div>
            {roiMultiple > 0 && (
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Estimated ROI multiple</span>
                <span className="font-semibold text-gray-900">{roiMultiple}x</span>
              </div>
            )}
            {hoursReclaimed > 0 && (
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Time reclaimed per month</span>
                <span className="font-semibold text-gray-900">{hoursReclaimed} hours</span>
              </div>
            )}
          </div>
        </div>

        {/* What AIMS delivers */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">How AIMS Generates This ROI</h3>
          <div className="space-y-3">
            {[
              "AI-powered lead gen running 24/7 while your team focuses on closing",
              "Automated follow-up sequences that never let a lead go cold",
              "CRM pipelines that surface the right deals at the right time",
              "Operations automations that eliminate hours of repetitive admin work",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-gray-600">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Share */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-1">Share your results</h3>
          <p className="text-sm text-gray-500 mb-4">Let your network see what AI could do for them too.</p>
          <ShareButtons shareUrl={shareUrl} shareText={shareText} />
        </div>

        {/* CTA */}
        <div className="bg-[#DC2626] rounded-2xl p-8 text-center text-white mb-6">
          <h3 className="text-2xl font-bold mb-3">Ready to capture this ROI?</h3>
          <p className="text-red-100 mb-6">
            Book a free strategy call and we&apos;ll show you exactly which AIMS solutions generate the fastest return for your business.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#DC2626] font-semibold rounded-xl hover:bg-red-50 transition-colors"
          >
            Book Strategy Call
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <p className="text-center text-sm text-gray-400">
          Want to recalculate?{" "}
          <Link href="/tools/roi-calculator" className="text-[#DC2626] hover:underline font-medium">
            Run the calculator again
          </Link>
        </p>
      </div>
    </div>
  )
}
