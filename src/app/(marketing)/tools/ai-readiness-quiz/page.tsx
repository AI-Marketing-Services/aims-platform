"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, CheckCircle, AlertCircle, XCircle, Zap, ArrowRight, Copy, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"

const QUESTIONS = [
  {
    id: 1,
    question: "How does your team currently generate new leads?",
    options: [
      { label: "We rely mostly on referrals and word of mouth", score: 1 },
      { label: "We run some outbound emails or cold calls manually", score: 2 },
      { label: "We use a CRM and have defined sequences", score: 3 },
      { label: "We have automated multi-channel outbound running", score: 4 },
    ],
  },
  {
    id: 2,
    question: "What does your current sales pipeline look like?",
    options: [
      { label: "No formal pipeline - deals tracked in a spreadsheet or memory", score: 1 },
      { label: "We have a CRM but it's not consistently updated", score: 2 },
      { label: "We have a defined pipeline with clear stage criteria", score: 3 },
      { label: "Fully tracked with automations, alerts, and reporting", score: 4 },
    ],
  },
  {
    id: 3,
    question: "How are you currently using AI in your business?",
    options: [
      { label: "We're not using AI at all yet", score: 1 },
      { label: "We use ChatGPT occasionally for writing tasks", score: 2 },
      { label: "We have a few AI tools integrated into our workflow", score: 3 },
      { label: "AI is core to our operations - we have custom agents running", score: 4 },
    ],
  },
  {
    id: 4,
    question: "What is your biggest challenge in growing revenue right now?",
    options: [
      { label: "Not enough new leads coming in", score: 1 },
      { label: "Leads aren't converting to meetings or demos", score: 2 },
      { label: "Deals stall and we struggle to close", score: 3 },
      { label: "Scaling delivery - we get the clients but fulfillment is the bottleneck", score: 4 },
    ],
  },
  {
    id: 5,
    question: "How much time does your team spend on manual follow-up and admin?",
    options: [
      { label: "Most of the day - we're constantly chasing leads and updating CRM", score: 1 },
      { label: "Several hours per day on repetitive tasks", score: 2 },
      { label: "A few hours per week - some things are automated", score: 3 },
      { label: "Almost none - nearly everything runs on autopilot", score: 4 },
    ],
  },
  {
    id: 6,
    question: "What is your monthly marketing + sales tech spend?",
    options: [
      { label: "Under $500/mo", score: 1 },
      { label: "$500–$2,000/mo", score: 2 },
      { label: "$2,000–$5,000/mo", score: 3 },
      { label: "$5,000+/mo", score: 4 },
    ],
  },
  {
    id: 7,
    question: "How quickly does your team follow up with new inbound leads?",
    options: [
      { label: "We get to them when we can - often days later", score: 1 },
      { label: "Usually within the same business day", score: 2 },
      { label: "Within a few hours of the lead coming in", score: 3 },
      { label: "Instantly - we have automated AI responses within minutes", score: 4 },
    ],
  },
]

type ScoreCategory = {
  label: string
  range: [number, number]
  color: string
  icon: React.ReactNode
  headline: string
  description: string
  recommended: string[]
}

const CATEGORIES: ScoreCategory[] = [
  {
    label: "AI Laggard",
    range: [7, 14],
    color: "text-primary",
    icon: <XCircle className="w-8 h-8 text-primary" />,
    headline: "You're leaving serious revenue on the table",
    description: "Your competitors are running AI-powered outbound 24/7 while your team is still doing things manually. The good news: there's massive upside waiting, and AIMS can unlock it fast.",
    recommended: ["Website + CRM + Chatbot Bundle", "Cold Outbound System", "AI Voice Agents"],
  },
  {
    label: "Early Adopter",
    range: [15, 20],
    color: "text-orange-500",
    icon: <AlertCircle className="w-8 h-8 text-orange-500" />,
    headline: "You have the foundation - now it's time to scale",
    description: "You've made some smart moves but your systems aren't working together. A few strategic automations could 2-3x your output without adding headcount.",
    recommended: ["Cold Outbound System", "SEO + AEO Strategy", "Audience Targeting"],
  },
  {
    label: "AI Ready",
    range: [21, 25],
    color: "text-yellow-500",
    icon: <Zap className="w-8 h-8 text-yellow-500" />,
    headline: "You're ahead of most - let's optimize for growth",
    description: "Your infrastructure is solid and you understand the game. The next level is fine-tuning your AI stack and adding intelligence layers that compound over time.",
    recommended: ["AI Tool Tracker", "Pixel Intelligence", "Finance Automation"],
  },
  {
    label: "AI Leader",
    range: [26, 28],
    color: "text-green-500",
    icon: <CheckCircle className="w-8 h-8 text-green-500" />,
    headline: "You're operating at the top 10% - let's keep it that way",
    description: "You've built a real machine. The risk now is standing still while the landscape shifts. AIMS can help you stay ahead with custom AI builds and white-glove strategy.",
    recommended: ["Vending Placement Visualizer", "AI Tool Tracker", "Custom AI Builds"],
  },
]

export default function AIReadinessQuizPage() {
  const [step, setStep] = useState<"intro" | "quiz" | "email" | "results">("intro")
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const totalScore = answers.reduce((sum, s) => sum + s, 0)

  const category = CATEGORIES.find(
    (c) => totalScore >= c.range[0] && totalScore <= c.range[1]
  ) ?? CATEGORIES[0]

  const pct = Math.round(((totalScore - 7) / (28 - 7)) * 100)

  function selectAnswer(score: number) {
    const updated = [...answers]
    updated[currentQ] = score
    setAnswers(updated)
    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ(currentQ + 1), 200)
    } else {
      setTimeout(() => setStep("email"), 200)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/lead-magnets/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "AI_READINESS_QUIZ",
          email,
          name,
          company,
          score: pct,
          data: { answers, score: totalScore, category: category.label },
        }),
      })
      const json = await res.json()
      if (json.id) setSubmissionId(json.id)
    } catch {}
    setSubmitting(false)
    setStep("results")
  }

  function copyShareLink() {
    const url = submissionId
      ? `${window.location.origin}/tools/ai-readiness-quiz/results/${submissionId}`
      : window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const shareText = `I scored ${pct}/100 on the AIMS AI Readiness Quiz - ${category.label}. See where your business stands:`
  const shareUrl = submissionId
    ? `${typeof window !== "undefined" ? window.location.origin : "https://aimseos.com"}/tools/ai-readiness-quiz/results/${submissionId}`
    : "https://aimseos.com/tools/ai-readiness-quiz"

  return (
    <div className="min-h-screen bg-deep">
      <div className="max-w-2xl mx-auto px-4 py-12 pt-8">
        <AnimatePresence mode="wait">

          {/* INTRO */}
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-6">
                <Zap className="w-3.5 h-3.5" />
                Free 2-Minute Assessment
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">
                How AI-Ready Is Your Business?
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Answer 7 questions about your current sales and marketing stack. Get a personalized score and a roadmap for where AI can add the most leverage.
              </p>
              <div className="bg-card border border-border rounded-2xl p-6 mb-8 text-left">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: "7", label: "Questions" },
                    { value: "2 min", label: "To complete" },
                    { value: "Free", label: "Instant results" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setStep("quiz")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors text-lg"
              >
                Start the Quiz
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="mt-4 text-sm text-muted-foreground">No email required to begin</p>
            </motion.div>
          )}

          {/* QUIZ */}
          {step === "quiz" && (
            <motion.div
              key={`q-${currentQ}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              {/* Progress bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>Question {currentQ + 1} of {QUESTIONS.length}</span>
                  <span>{Math.round(((currentQ) / QUESTIONS.length) * 100)}% complete</span>
                </div>
                <div className="h-2 bg-surface rounded-full">
                  <div
                    className="h-2 bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${((currentQ) / QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-8">
                {QUESTIONS[currentQ].question}
              </h2>

              <div className="space-y-3">
                {QUESTIONS[currentQ].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => selectAnswer(opt.score)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border-2 transition-all duration-150 bg-card hover:border-primary hover:bg-primary/10",
                      answers[currentQ] === opt.score
                        ? "border-primary bg-primary/10"
                        : "border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                        answers[currentQ] === opt.score
                          ? "border-primary bg-primary"
                          : "border-border"
                      )}>
                        {answers[currentQ] === opt.score && (
                          <div className="w-2.5 h-2.5 rounded-full bg-card" />
                        )}
                      </div>
                      <span className="text-foreground font-medium">{opt.label}</span>
                    </div>
                  </button>
                ))}
              </div>

              {currentQ > 0 && (
                <button
                  onClick={() => setCurrentQ(currentQ - 1)}
                  className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
              )}
            </motion.div>
          )}

          {/* EMAIL GATE */}
          {step === "email" && (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Quiz complete! See your results.
              </h2>
              <p className="text-muted-foreground mb-8">
                Enter your details below to unlock your AI Readiness Score and personalized recommendations.
              </p>
              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-8 text-left space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Work Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Inc."
                    className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {submitting ? "Processing..." : <>Reveal My Score <ArrowRight className="w-4 h-4" /></>}
                </button>
                <p className="text-xs text-center text-muted-foreground">
                  No spam. We respect your privacy. Unsubscribe anytime.
                </p>
              </form>
            </motion.div>
          )}

          {/* RESULTS */}
          {step === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <div className="mb-4">{category.icon}</div>
                <div className="text-6xl font-bold text-foreground mb-1">{pct}</div>
                <div className="text-muted-foreground mb-3">AI Readiness Score</div>
                <div className={cn("text-xl font-bold mb-2", category.color)}>
                  {category.label}
                </div>

                {/* Score bar */}
                <div className="max-w-xs mx-auto mt-4 mb-6">
                  <div className="h-3 bg-deep rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="h-3 bg-primary rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Laggard</span>
                    <span>Leader</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-2">{category.headline}</h3>
                <p className="text-muted-foreground">{category.description}</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <h4 className="font-semibold text-foreground mb-4">Recommended Services for You</h4>
                <div className="space-y-3">
                  {category.recommended.map((rec) => (
                    <div key={rec} className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                      <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-foreground font-medium">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Share section */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                  <h4 className="font-semibold text-foreground">Share your score</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Challenge your network to see how they compare - or save your unique results link.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={copyShareLink}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-surface transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? "Copied!" : "Copy link"}
                  </button>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Share on X
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A66C2] text-white rounded-lg text-sm font-medium hover:bg-[#0958a8] transition-colors"
                  >
                    Share on LinkedIn
                  </a>
                </div>
              </div>

              <div className="bg-primary rounded-2xl p-8 text-center text-white">
                <h3 className="text-2xl font-bold mb-3">Ready to close the gap?</h3>
                <p className="text-primary-foreground/80 mb-6">
                  Book a free 30-minute strategy call. We'll walk through your score in detail and build a custom AI roadmap for your business.
                </p>
                <a
                  href="/get-started"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-card text-primary font-semibold rounded-xl hover:bg-primary/10 transition-colors"
                >
                  Book Your Strategy Call
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
