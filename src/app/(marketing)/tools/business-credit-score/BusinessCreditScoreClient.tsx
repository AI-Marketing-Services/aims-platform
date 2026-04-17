"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence, type Transition, type Variants } from "framer-motion"
import type { BezierDefinition } from "motion-utils"
import {
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  Loader2,
  BarChart3,
  Copy,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const QUESTIONS = [
  {
    id: 1,
    category: "Business Foundation",
    question: "What type of business entity do you operate?",
    options: [
      { label: "Sole proprietorship / no formal entity", score: 1 },
      { label: "Single-member LLC", score: 2 },
      { label: "Multi-member LLC or Partnership", score: 3 },
      { label: "S-Corp or C-Corp", score: 4 },
    ],
  },
  {
    id: 2,
    category: "Business Foundation",
    question: "Do you have a dedicated business bank account?",
    options: [
      { label: "No, I use personal accounts for business", score: 1 },
      { label: "Yes, but it's been open less than 6 months", score: 2 },
      { label: "Yes, open 6+ months with regular activity", score: 3 },
      { label: "Yes, with consistent balance and zero overdrafts", score: 4 },
    ],
  },
  {
    id: 3,
    category: "Business Foundation",
    question: "Is your EIN used consistently across all business accounts?",
    options: [
      { label: "I don't have an EIN", score: 1 },
      { label: "I have one but rarely use it", score: 2 },
      { label: "I use it for most accounts", score: 3 },
      { label: "All business accounts are registered under my EIN", score: 4 },
    ],
  },
  {
    id: 4,
    category: "Credit Profile",
    question: "How many active business credit accounts do you have?",
    options: [
      { label: "None", score: 1 },
      { label: "1–2 accounts", score: 2 },
      { label: "3–5 accounts", score: 3 },
      { label: "6 or more accounts", score: 4 },
    ],
  },
  {
    id: 5,
    category: "Credit Profile",
    question: "How is your payment history on business accounts?",
    options: [
      { label: "I've had missed payments or collections", score: 1 },
      { label: "Mostly on time, with occasional late payments", score: 2 },
      { label: "Always on time", score: 3 },
      { label: "Always on time — I often pay early or in full", score: 4 },
    ],
  },
  {
    id: 6,
    category: "Tradeline Reporting",
    question: "Do any of your vendors report to business credit bureaus?",
    options: [
      { label: "No vendor accounts at all", score: 1 },
      { label: "I have vendor accounts but they don't report", score: 2 },
      { label: "1–3 accounts reporting to bureaus", score: 3 },
      { label: "4+ accounts reporting to D&B, Experian, or Equifax Business", score: 4 },
    ],
  },
  {
    id: 7,
    category: "Credit Utilization",
    question: "What is your current business credit utilization rate?",
    options: [
      { label: "Over 80% — or I'm not sure", score: 1 },
      { label: "50–80% utilized", score: 2 },
      { label: "30–50% utilized", score: 3 },
      { label: "Under 30% utilized", score: 4 },
    ],
  },
  {
    id: 8,
    category: "Credit Monitoring",
    question: "How often do you monitor your business credit reports?",
    options: [
      { label: "I've never checked my business credit", score: 1 },
      { label: "Checked once, haven't since", score: 2 },
      { label: "Check occasionally", score: 3 },
      { label: "Monitor regularly with alerts set up", score: 4 },
    ],
  },
  {
    id: 9,
    category: "Business Maturity",
    question: "How long has your business been operating?",
    options: [
      { label: "Less than 1 year", score: 1 },
      { label: "1–2 years", score: 2 },
      { label: "2–5 years", score: 3 },
      { label: "5+ years", score: 4 },
    ],
  },
  {
    id: 10,
    category: "Business Maturity",
    question: "What is your current annual business revenue?",
    options: [
      { label: "Under $50K", score: 1 },
      { label: "$50K – $250K", score: 2 },
      { label: "$250K – $1M", score: 3 },
      { label: "Over $1M", score: 4 },
    ],
  },
]

const TIERS = [
  {
    label: "Credit Builder",
    range: [0, 39] as [number, number],
    color: "text-red-400",
    bgColor: "bg-red-900/20",
    borderColor: "border-red-800",
    desc: "Your business credit profile needs significant work. The good news — you can build fast with the right steps.",
  },
  {
    label: "Developing",
    range: [40, 59] as [number, number],
    color: "text-amber-400",
    bgColor: "bg-amber-900/20",
    borderColor: "border-amber-800",
    desc: "You have the basics in place. With focused action, you can significantly improve your score in 90 days.",
  },
  {
    label: "Established",
    range: [60, 79] as [number, number],
    color: "text-blue-400",
    bgColor: "bg-blue-900/20",
    borderColor: "border-blue-800",
    desc: "You've built solid business credit. Optimizing a few key areas will unlock better rates and higher limits.",
  },
  {
    label: "Strong",
    range: [80, 100] as [number, number],
    color: "text-green-400",
    bgColor: "bg-green-900/20",
    borderColor: "border-green-800",
    desc: "Your business credit is in excellent shape. You're positioned to access premium financing and vendor terms.",
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Step = "intro" | "quiz" | "email" | "submitting" | "results"

function getTier(pct: number) {
  return TIERS.find(({ range }) => pct >= range[0] && pct <= range[1]) ?? TIERS[0]
}

function computeScore(answers: number[]) {
  const totalScore = answers.reduce((s, a) => s + a, 0)
  const pct = Math.round(((totalScore - 10) / (40 - 10)) * 100)

  const foundation = Math.round(((answers[0] + answers[1] + answers[2] - 3) / 9) * 100)
  const creditProfile = Math.round(((answers[3] + answers[4] - 2) / 6) * 100)
  const tradelines = Math.round(((answers[5] - 1) / 3) * 100)
  const utilization = Math.round(((answers[6] + answers[7] - 2) / 6) * 100)
  const maturity = Math.round(((answers[8] + answers[9] - 2) / 6) * 100)

  return { totalScore, pct, dimensions: { foundation, creditProfile, tradelines, utilization, maturity } }
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
}

const PAGE_EASE: BezierDefinition = [0.25, 0.46, 0.45, 0.94]

const pageTransition: Transition = {
  type: "tween",
  ease: PAGE_EASE,
  duration: 0.35,
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
          Question {current} of {total}
        </span>
        <span className="text-xs font-mono text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#981B1B]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

function DimensionBar({
  label,
  value,
  delay,
}: {
  label: string
  value: number
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#1A1A1A]/70">{label}</span>
        <span className="text-sm font-mono text-[#981B1B]">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#981B1B]"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay: delay + 0.1, duration: 0.7, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function BusinessCreditScoreClient() {
  const [step, setStep] = useState<Step>("intro")
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [direction, setDirection] = useState(1)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleStart() {
    setStep("quiz")
    setCurrentQ(0)
    setAnswers([])
    setDirection(1)
  }

  function handleSelectOption(score: number, index: number) {
    if (selectedOption !== null) return // already advancing
    setSelectedOption(index)

    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)

    advanceTimerRef.current = setTimeout(() => {
      const newAnswers = [...answers]
      newAnswers[currentQ] = score

      if (currentQ + 1 >= QUESTIONS.length) {
        setAnswers(newAnswers)
        setSelectedOption(null)
        setStep("email")
      } else {
        setDirection(1)
        setAnswers(newAnswers)
        setCurrentQ((q) => q + 1)
        setSelectedOption(null)
      }
    }, 300)
  }

  function handleBack() {
    if (currentQ === 0) return
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    setSelectedOption(null)
    setDirection(-1)
    setCurrentQ((q) => q - 1)
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStep("submitting")

    const { totalScore, pct, dimensions } = computeScore(answers)

    try {
      const res = await fetch("/api/lead-magnets/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "BUSINESS_CREDIT_SCORE",
          email,
          name,
          company,
          score: pct,
          data: {
            answers,
            totalScore,
            dimensions,
          },
        }),
      })
      const json = await res.json() as { id?: string }
      if (json.id) setSubmissionId(json.id)
    } catch {
      // silent — still show results
    }

    setStep("results")
  }

  function handleCopyLink() {
    const url = submissionId
      ? `${window.location.origin}/tools/business-credit-score/results/${submissionId}`
      : window.location.href
    void navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------

  const { pct, dimensions } = answers.length === QUESTIONS.length
    ? computeScore(answers)
    : { pct: 0, dimensions: { foundation: 0, creditProfile: 0, tradelines: 0, utilization: 0, maturity: 0 } }

  const tier = getTier(pct)

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <AnimatePresence mode="wait">

        {/* ------------------------------------------------------------------ */}
        {/* INTRO                                                               */}
        {/* ------------------------------------------------------------------ */}
        {step === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex items-center justify-center px-4 py-16"
          >
            <div className="max-w-xl w-full space-y-8">
              {/* Label */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.4 }}
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4 text-[#981B1B]" />
                <span className="text-xs font-mono tracking-[0.2em] uppercase text-[#981B1B]">
                  Free Assessment
                </span>
              </motion.div>

              {/* Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-4xl sm:text-5xl font-light tracking-tight text-[#1A1A1A] leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                What&apos;s Your Business<br />
                <span className="text-[#981B1B]">Credit Score?</span>
              </motion.h1>

              {/* Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.45 }}
                className="text-base text-[#1A1A1A]/60 leading-relaxed"
              >
                Answer 10 quick questions and get a detailed scorecard showing exactly
                what&apos;s working, what&apos;s not, and the exact steps to build elite
                business credit.
              </motion.p>

              {/* Bullets */}
              <motion.ul
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.45 }}
                className="space-y-3"
              >
                {[
                  "Personalized score across 5 credit dimensions",
                  "Specific factors helping and hurting your score",
                  "Your 90-day credit building action plan",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#981B1B] mt-0.5 shrink-0" />
                    <span className="text-sm text-[#1A1A1A]/80">{item}</span>
                  </li>
                ))}
              </motion.ul>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34, duration: 0.45 }}
                className="space-y-3"
              >
                <button
                  onClick={handleStart}
                  className="group w-full flex items-center justify-center gap-2.5 bg-[#981B1B] hover:bg-[#d4a73a] text-[#F5F5F5] font-medium text-sm px-6 py-3.5 rounded transition-colors duration-200"
                >
                  Start Free Assessment
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
                <p className="text-center text-xs text-[#1A1A1A]/30">
                  Takes about 2 minutes — no credit card required
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* QUIZ                                                                */}
        {/* ------------------------------------------------------------------ */}
        {step === "quiz" && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col px-4 py-10"
          >
            {/* Top bar */}
            <div className="max-w-xl w-full mx-auto space-y-4">
              <div className="flex items-center gap-3">
                {currentQ > 0 && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1 text-xs text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70 transition-colors"
                    aria-label="Previous question"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                <div className="flex-1">
                  <ProgressBar current={currentQ + 1} total={QUESTIONS.length} />
                </div>
              </div>

              {/* Category chip */}
              <AnimatePresence mode="wait">
                <motion.span
                  key={`cat-${currentQ}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="inline-block text-[10px] font-mono tracking-[0.18em] uppercase text-[#981B1B]/80 border border-[#981B1B]/20 rounded px-2 py-0.5"
                >
                  {QUESTIONS[currentQ].category}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Question + options */}
            <div className="flex-1 flex items-start pt-8 justify-center px-0">
              <div className="max-w-xl w-full">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={`q-${currentQ}`}
                    custom={direction}
                    variants={pageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={pageTransition}
                    className="space-y-6"
                  >
                    {/* Question text */}
                    <h2
                      className="text-2xl sm:text-3xl font-light text-[#1A1A1A] leading-snug"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {QUESTIONS[currentQ].question}
                    </h2>

                    {/* Options */}
                    <div className="space-y-3">
                      {QUESTIONS[currentQ].options.map((opt, i) => {
                        const isSelected = selectedOption === i
                        const isPreviouslyAnswered =
                          selectedOption === null && answers[currentQ] === opt.score

                        return (
                          <motion.button
                            key={i}
                            custom={i}
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            onClick={() => handleSelectOption(opt.score, i)}
                            className={cn(
                              "w-full text-left px-5 py-4 rounded border transition-all duration-200",
                              "bg-[#FFFFFF] border-white/10 text-[#1A1A1A]/80 hover:border-[#981B1B]/50 hover:text-[#1A1A1A]",
                              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#981B1B]",
                              (isSelected || isPreviouslyAnswered) &&
                                "border-[#981B1B] bg-[#981B1B]/10 text-[#1A1A1A]"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <span
                                className={cn(
                                  "flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-mono transition-colors duration-200",
                                  isSelected || isPreviouslyAnswered
                                    ? "border-[#981B1B] bg-[#981B1B] text-[#F5F5F5]"
                                    : "border-white/20 text-[#1A1A1A]/40"
                                )}
                              >
                                {isSelected || isPreviouslyAnswered ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : (
                                  String.fromCharCode(65 + i)
                                )}
                              </span>
                              <span className="text-sm leading-snug">{opt.label}</span>
                            </div>
                          </motion.button>
                        )
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* EMAIL CAPTURE                                                       */}
        {/* ------------------------------------------------------------------ */}
        {step === "email" && (
          <motion.div
            key="email"
            custom={1}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={pageTransition}
            className="flex-1 flex items-center justify-center px-4 py-16"
          >
            <div className="max-w-md w-full space-y-8">
              {/* Heading */}
              <div className="space-y-3">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="text-xs font-mono tracking-[0.2em] uppercase text-[#981B1B]"
                >
                  Almost there...
                </motion.p>
                <motion.h2
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl sm:text-4xl font-light text-[#1A1A1A]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Your score is ready.
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16 }}
                  className="text-sm text-[#1A1A1A]/55"
                >
                  Enter your details to see your full Business Credit Scorecard.
                </motion.p>
              </div>

              {/* Form */}
              <motion.form
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                onSubmit={handleEmailSubmit}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="name"
                    className="block text-xs font-mono text-[#1A1A1A]/40 tracking-wider uppercase"
                  >
                    Full Name <span className="text-[#981B1B]">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full bg-[#FFFFFF] border border-white/10 rounded px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#981B1B]/60 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-xs font-mono text-[#1A1A1A]/40 tracking-wider uppercase"
                  >
                    Business Email <span className="text-[#981B1B]">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@company.com"
                    className="w-full bg-[#FFFFFF] border border-white/10 rounded px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#981B1B]/60 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="company"
                    className="block text-xs font-mono text-[#1A1A1A]/40 tracking-wider uppercase"
                  >
                    Company Name{" "}
                    <span className="text-[#1A1A1A]/25 normal-case tracking-normal font-sans text-[11px]">
                      (optional)
                    </span>
                  </label>
                  <input
                    id="company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full bg-[#FFFFFF] border border-white/10 rounded px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#981B1B]/60 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="group w-full flex items-center justify-center gap-2.5 bg-[#981B1B] hover:bg-[#d4a73a] text-[#F5F5F5] font-medium text-sm px-6 py-3.5 rounded transition-colors duration-200 mt-2"
                >
                  See My Credit Score
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </motion.form>
            </div>
          </motion.div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* SUBMITTING                                                          */}
        {/* ------------------------------------------------------------------ */}
        {step === "submitting" && (
          <motion.div
            key="submitting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex items-center justify-center px-4"
          >
            <div className="text-center space-y-5">
              <Loader2 className="w-8 h-8 text-[#981B1B] animate-spin mx-auto" />
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-[#1A1A1A]">
                  Calculating your business credit score...
                </p>
                <p className="text-xs text-[#1A1A1A]/40">
                  Analyzing your answers across 5 dimensions
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* RESULTS                                                             */}
        {/* ------------------------------------------------------------------ */}
        {step === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex items-start justify-center px-4 py-14"
          >
            <div className="max-w-xl w-full space-y-10">
              {/* Score hero */}
              <div className="text-center space-y-4">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  className="text-xs font-mono tracking-[0.2em] uppercase text-[#1A1A1A]/40"
                >
                  Your Business Credit Score
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
                  className="relative inline-flex flex-col items-center"
                >
                  <span
                    className="text-8xl sm:text-9xl font-light text-[#981B1B] leading-none tabular-nums"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {pct}
                  </span>
                  <span className="text-sm font-mono text-[#1A1A1A]/30 -mt-1">/ 100</span>
                </motion.div>

                {/* Tier badge */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium",
                    tier.bgColor,
                    tier.borderColor,
                    tier.color
                  )}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  {tier.label}
                </motion.div>

                {/* Tier description */}
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-sm text-[#1A1A1A]/55 max-w-sm mx-auto leading-relaxed"
                >
                  {tier.desc}
                </motion.p>
              </div>

              {/* Dimension breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[#FFFFFF] border border-white/8 rounded-lg p-6 space-y-5"
              >
                <h3 className="text-xs font-mono tracking-[0.18em] uppercase text-[#1A1A1A]/40">
                  Score Breakdown
                </h3>
                <div className="space-y-4">
                  <DimensionBar label="Business Foundation" value={dimensions.foundation} delay={0.45} />
                  <DimensionBar label="Credit Profile" value={dimensions.creditProfile} delay={0.5} />
                  <DimensionBar label="Tradeline Reporting" value={dimensions.tradelines} delay={0.55} />
                  <DimensionBar label="Credit Utilization" value={dimensions.utilization} delay={0.6} />
                  <DimensionBar label="Business Maturity" value={dimensions.maturity} delay={0.65} />
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                {submissionId && (
                  <a
                    href={`/tools/business-credit-score/results/${submissionId}`}
                    className="group flex-1 flex items-center justify-center gap-2.5 bg-[#981B1B] hover:bg-[#d4a73a] text-[#F5F5F5] font-medium text-sm px-6 py-3.5 rounded transition-colors duration-200"
                  >
                    View Full Scorecard
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </a>
                )}

                <button
                  onClick={handleCopyLink}
                  className={cn(
                    "flex items-center justify-center gap-2 px-5 py-3.5 rounded border text-sm transition-all duration-200",
                    copied
                      ? "border-[#981B1B]/40 bg-[#981B1B]/10 text-[#981B1B]"
                      : "border-white/10 bg-[#FFFFFF] text-[#1A1A1A]/60 hover:border-white/20 hover:text-[#1A1A1A]/80"
                  )}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>
              </motion.div>

              {/* Restart */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center"
              >
                <button
                  onClick={() => {
                    setStep("intro")
                    setCurrentQ(0)
                    setAnswers([])
                    setSelectedOption(null)
                    setSubmissionId(null)
                    setName("")
                    setEmail("")
                    setCompany("")
                  }}
                  className="text-xs text-[#1A1A1A]/25 hover:text-[#1A1A1A]/50 transition-colors underline underline-offset-2"
                >
                  Retake assessment
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
