"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ChevronRight, ArrowRight, Zap, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

// Step 1: Business type
const BUSINESS_TYPES = [
  { id: "local-service", label: "Local Service Business", description: "HVAC, plumbing, roofing, cleaning, landscaping" },
  { id: "saas", label: "SaaS / Tech Company", description: "Software, apps, platforms, developer tools" },
  { id: "agency", label: "Agency / Consultancy", description: "Marketing, sales, operations, finance consulting" },
  { id: "ecommerce", label: "E-Commerce / Retail", description: "Physical products, DTC brands, Shopify stores" },
  { id: "healthcare", label: "Healthcare / Wellness", description: "Clinics, dental, chiro, medspas, fitness" },
  { id: "financial", label: "Financial Services", description: "Insurance, mortgage, RIA, accounting" },
]

// Step 2: Team size
const TEAM_SIZES = [
  { id: "solo", label: "Solo / 1-2 people", description: "Just you or a small founding team" },
  { id: "small", label: "3-10 employees", description: "Small but growing team" },
  { id: "medium", label: "11-50 employees", description: "Established with dedicated functions" },
  { id: "large", label: "50+ employees", description: "Enterprise or scaling organization" },
]

// Step 3: Primary goals (multi-select)
const GOALS = [
  { id: "more-leads", label: "Generate more inbound leads" },
  { id: "outbound", label: "Build an outbound system" },
  { id: "seo", label: "Rank higher on Google / AI search" },
  { id: "close-faster", label: "Close deals faster" },
  { id: "automate-ops", label: "Automate repetitive tasks" },
  { id: "retain-clients", label: "Improve client retention" },
]

// Step 4: Current stack pain
const PAIN_POINTS = [
  { id: "no-crm", label: "No CRM or inconsistent pipeline" },
  { id: "manual-followup", label: "Too much manual follow-up" },
  { id: "bad-website", label: "Website doesn't convert visitors" },
  { id: "no-content", label: "No content or SEO strategy" },
  { id: "scattered-tools", label: "Too many disconnected tools" },
  { id: "no-automation", label: "No AI or automation in place" },
]

type StackRecommendation = {
  name: string
  description: string
  urgency: "critical" | "recommended" | "optional"
  pillar: "marketing" | "sales" | "operations" | "finance"
}

const PILLAR_COLORS = {
  marketing: "text-green-400 bg-green-900/15 border-green-800",
  sales: "text-blue-400 bg-blue-900/15 border-blue-800",
  operations: "text-orange-400 bg-orange-900/15 border-orange-800",
  finance: "text-purple-400 bg-purple-900/15 border-purple-800",
}

const URGENCY_COLORS = {
  critical: "text-primary bg-primary/10",
  recommended: "text-yellow-400 bg-yellow-900/15",
  optional: "text-muted-foreground bg-deep",
}

function buildRecommendations(
  businessType: string,
  teamSize: string,
  goals: string[],
  pains: string[]
): StackRecommendation[] {
  const recs: StackRecommendation[] = []

  // Always include CRM if no CRM
  if (pains.includes("no-crm") || goals.includes("close-faster")) {
    recs.push({ name: "AI-Powered CRM Setup", description: "Close CRM configured with custom pipelines, automations, and lead scoring.", urgency: "critical", pillar: "sales" })
  }

  // Outbound if goal is more leads or outbound
  if (goals.includes("more-leads") || goals.includes("outbound")) {
    recs.push({ name: "Cold Outbound System", description: "Multi-channel sequences - email + LinkedIn + SMS - targeting your ideal buyer persona.", urgency: "critical", pillar: "sales" })
  }

  // Website/SEO
  if (goals.includes("seo") || pains.includes("bad-website")) {
    recs.push({ name: "SEO + AEO Strategy", description: "Page-level SEO, technical fixes, and AI-answer optimization to rank on Google and ChatGPT.", urgency: "recommended", pillar: "marketing" })
  }

  // Automation
  if (pains.includes("manual-followup") || pains.includes("no-automation") || goals.includes("automate-ops")) {
    recs.push({ name: "AI Automation Suite", description: "Zapier/Make workflows that automate lead routing, follow-up sequences, and reporting.", urgency: "recommended", pillar: "operations" })
  }

  // Content
  if (goals.includes("seo") || pains.includes("no-content")) {
    recs.push({ name: "AI Content Engine", description: "Blog, case studies, and social content produced at scale with AI + human review.", urgency: "recommended", pillar: "marketing" })
  }

  // Chatbot for local/healthcare
  if (["local-service", "healthcare", "financial"].includes(businessType)) {
    recs.push({ name: "AI Lead Chatbot", description: "24/7 website chatbot that qualifies visitors and books discovery calls automatically.", urgency: "critical", pillar: "sales" })
  }

  // Pixel / audience for ecommerce
  if (businessType === "ecommerce") {
    recs.push({ name: "Pixel Intelligence + Retargeting", description: "De-anonymize website traffic and run AI retargeting campaigns across channels.", urgency: "recommended", pillar: "marketing" })
  }

  // Voice AI for high-volume
  if (teamSize === "medium" || teamSize === "large") {
    recs.push({ name: "AI Voice Agents", description: "Inbound and outbound AI voice agents that handle calls, qualify leads, and book appointments.", urgency: "optional", pillar: "operations" })
  }

  // Finance for bigger teams
  if (teamSize === "medium" || teamSize === "large") {
    recs.push({ name: "Revenue Analytics Dashboard", description: "Real-time pipeline health, CAC/LTV tracking, and forecasting built on your CRM data.", urgency: "optional", pillar: "finance" })
  }

  // Retention
  if (goals.includes("retain-clients")) {
    recs.push({ name: "Client Success Automation", description: "Automated onboarding sequences, check-in emails, and health score alerts to reduce churn.", urgency: "recommended", pillar: "operations" })
  }

  // SaaS-specific
  if (businessType === "saas") {
    recs.push({ name: "Product-Led Growth Stack", description: "In-app triggers, usage-based emails, and expansion revenue playbooks for SaaS.", urgency: "recommended", pillar: "sales" })
  }

  return recs
}

const STEPS = ["Business Type", "Team Size", "Goals", "Pain Points"]

export default function StackConfiguratorPage() {
  const [step, setStep] = useState(0)
  const [businessType, setBusinessType] = useState("")
  const [teamSize, setTeamSize] = useState("")
  const [goals, setGoals] = useState<string[]>([])
  const [pains, setPains] = useState<string[]>([])
  const [showGate, setShowGate] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const recommendations = buildRecommendations(businessType, teamSize, goals, pains)
  const critical = recommendations.filter((r) => r.urgency === "critical")
  const recommended = recommendations.filter((r) => r.urgency === "recommended")
  const optional = recommendations.filter((r) => r.urgency === "optional")

  function toggleGoal(id: string) {
    setGoals((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id])
  }

  function togglePain(id: string) {
    setPains((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id])
  }

  function canAdvance() {
    if (step === 0) return !!businessType
    if (step === 1) return !!teamSize
    if (step === 2) return goals.length > 0
    if (step === 3) return pains.length > 0
    return true
  }

  function advance() {
    if (step < 3) { setStep(step + 1); return }
    // Show results gate
    setShowGate(true)
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch("/api/lead-magnets/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "STACK_CONFIGURATOR",
          email,
          name,
          company,
          data: { businessType, teamSize, goals, pains },
          results: { stackCount: recommendations.length, criticalCount: critical.length },
        }),
      })
    } catch {}
    setSubmitting(false)
    setShowGate(false)
    setUnlocked(true)
  }

  return (
    <div className="min-h-screen bg-deep">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        {!unlocked && (
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-6">
              <Zap className="w-3.5 h-3.5" />
              Free AI Stack Builder
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Build Your Custom AI Stack
            </h1>
            <p className="text-lg text-muted-foreground">
              Answer 4 quick questions. Get a personalized stack of AIMS solutions ranked by impact for your business.
            </p>
          </div>
        )}

        {!unlocked && !showGate && (
          <>
            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>{STEPS[step]}</span>
                <span>Step {step + 1} of {STEPS.length}</span>
              </div>
              <div className="h-2 bg-surface rounded-full">
                <div
                  className="h-2 bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* Step 0: Business Type */}
              {step === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <h2 className="text-2xl font-bold text-foreground mb-6">What type of business do you run?</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {BUSINESS_TYPES.map((bt) => (
                      <button
                        key={bt.id}
                        onClick={() => setBusinessType(bt.id)}
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all",
                          businessType === bt.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card hover:border-border"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors",
                            businessType === bt.id ? "border-primary bg-primary" : "border-border"
                          )}>
                            {businessType === bt.id && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{bt.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{bt.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 1: Team Size */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <h2 className="text-2xl font-bold text-foreground mb-6">How big is your team?</h2>
                  <div className="space-y-3">
                    {TEAM_SIZES.map((ts) => (
                      <button
                        key={ts.id}
                        onClick={() => setTeamSize(ts.id)}
                        className={cn(
                          "w-full p-4 rounded-xl border-2 text-left transition-all",
                          teamSize === ts.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card hover:border-border"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                            teamSize === ts.id ? "border-primary bg-primary" : "border-border"
                          )}>
                            {teamSize === ts.id && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{ts.label}</p>
                            <p className="text-sm text-muted-foreground">{ts.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Goals */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <h2 className="text-2xl font-bold text-foreground mb-2">What are your top priorities? <span className="text-base font-normal text-muted-foreground">(pick all that apply)</span></h2>
                  <p className="text-muted-foreground mb-6">Select everything that matters - we'll weight your stack accordingly.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {GOALS.map((goal) => {
                      const selected = goals.includes(goal.id)
                      return (
                        <button
                          key={goal.id}
                          onClick={() => toggleGoal(goal.id)}
                          className={cn(
                            "p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3",
                            selected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-border"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                            selected ? "border-primary bg-primary" : "border-border"
                          )}>
                            {selected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <p className="font-medium text-foreground text-sm">{goal.label}</p>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Pain Points */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Where are the gaps? <span className="text-base font-normal text-muted-foreground">(pick all that apply)</span></h2>
                  <p className="text-muted-foreground mb-6">Be honest - this helps us prioritize the highest-leverage fixes first.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PAIN_POINTS.map((pain) => {
                      const selected = pains.includes(pain.id)
                      return (
                        <button
                          key={pain.id}
                          onClick={() => togglePain(pain.id)}
                          className={cn(
                            "p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3",
                            selected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-border"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                            selected ? "border-primary bg-primary" : "border-border"
                          )}>
                            {selected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <p className="font-medium text-foreground text-sm">{pain.label}</p>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              {step > 0 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
              ) : <div />}
              <button
                onClick={advance}
                disabled={!canAdvance()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {step < 3 ? "Next" : "Build My Stack"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* Email Gate */}
        {showGate && !unlocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-8 shadow-sm"
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Your Stack is Ready</h2>
              <p className="text-muted-foreground">
                We found <span className="font-semibold text-foreground">{recommendations.length} solutions</span> for your profile, including{" "}
                <span className="font-semibold text-primary">{critical.length} critical</span> upgrades. Enter your details to unlock your custom AI stack.
              </p>
            </div>
            <form onSubmit={handleUnlock} className="space-y-3">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full px-4 py-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground/50"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Work email"
                className="w-full px-4 py-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground/50"
              />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company name (optional)"
                className="w-full px-4 py-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground/50"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {submitting ? "Building..." : <>View My Custom Stack <ArrowRight className="w-4 h-4" /></>}
              </button>
              <p className="text-xs text-center text-muted-foreground">No spam. Unsubscribe anytime.</p>
            </form>
          </motion.div>
        )}

        {/* Results */}
        {unlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Your Custom AI Stack</h2>
              <p className="text-muted-foreground">
                {recommendations.length} solutions prioritized for your {BUSINESS_TYPES.find((b) => b.id === businessType)?.label ?? "business"}.
              </p>
            </div>

            {[
              { list: critical, title: "Critical - Fix These First", urgency: "critical" as const },
              { list: recommended, title: "Recommended Next", urgency: "recommended" as const },
              { list: optional, title: "Growth Unlocks", urgency: "optional" as const },
            ].filter(({ list }) => list.length > 0).map(({ list, title, urgency }) => (
              <div key={urgency}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn("text-xs font-semibold px-2 py-1 rounded-full", URGENCY_COLORS[urgency])}>
                    {urgency.toUpperCase()}
                  </span>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                </div>
                <div className="space-y-3">
                  {list.map((rec, i) => (
                    <motion.div
                      key={rec.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-card border border-border rounded-xl p-5 flex items-start gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">{rec.name}</h4>
                          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border capitalize", PILLAR_COLORS[rec.pillar])}>
                            {rec.pillar}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                      <a
                        href="/get-started"
                        className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        Add to Plan
                        <ChevronRight className="w-3 h-3" />
                      </a>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}

            <div className="bg-card border border-primary/20 rounded-2xl p-8 text-center mt-8">
              <h3 className="text-2xl font-bold text-foreground mb-3">Ready to deploy your stack?</h3>
              <p className="text-muted-foreground mb-6">
                Book a free 30-minute strategy call. We'll finalize your roadmap, confirm priorities, and give you a fixed monthly price.
              </p>
              <a
                href="/get-started"
                className="inline-flex items-center gap-2 px-8 py-4 bg-card text-primary font-semibold rounded-xl hover:bg-primary/10 transition-colors"
              >
                Book Strategy Call
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
