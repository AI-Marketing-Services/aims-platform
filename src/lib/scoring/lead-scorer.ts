interface LeadSignals {
  source?: string
  industry?: string
  locationCount?: number
  quizScore?: number
  roiSavings?: number
  auditScore?: number
  hasWebsite?: boolean
  isVendingpreneur?: boolean
  chatbotQualScore?: number
}

interface LeadScore {
  score: number
  tier: "hot" | "warm" | "cold"
  reason: string
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW"
}

export function scoreLeadFromSignals(signals: LeadSignals): LeadScore {
  let score = 0
  const reasons: string[] = []

  // Source quality (0-30 pts)
  const sourceScores: Record<string, number> = {
    referral: 30,
    "ai-chatbot": 25,
    "roi-calculator": 20,
    "ai-readiness-quiz": 15,
    "website-audit": 15,
    "intake-form": 20,
    direct: 10,
  }
  const sourceScore = sourceScores[signals.source ?? ""] ?? 5
  score += sourceScore
  if (signals.source) reasons.push(`Source: ${signals.source}`)

  // Business signals (0-20 pts)
  if (signals.locationCount) {
    if (signals.locationCount >= 10) {
      score += 20
      reasons.push(`${signals.locationCount} locations`)
    } else if (signals.locationCount >= 5) {
      score += 15
      reasons.push(`${signals.locationCount} locations`)
    } else if (signals.locationCount >= 2) {
      score += 10
      reasons.push(`${signals.locationCount} locations`)
    }
  }

  // Vending community bonus
  if (signals.isVendingpreneur) {
    score += 15
    reasons.push("Vendingpreneur community")
  }

  // Engagement signals (0-35 pts)
  if (signals.quizScore !== undefined) {
    if (signals.quizScore < 40) {
      score += 20
      reasons.push(`Low AI readiness (${signals.quizScore}/100) = high need`)
    } else if (signals.quizScore < 60) {
      score += 12
      reasons.push(`Medium AI readiness (${signals.quizScore}/100)`)
    } else {
      score += 5
    }
  }

  if (signals.roiSavings !== undefined) {
    if (signals.roiSavings > 10000) {
      score += 25
      reasons.push(`$${signals.roiSavings.toLocaleString()}/mo ROI identified`)
    } else if (signals.roiSavings > 5000) {
      score += 15
      reasons.push(`$${signals.roiSavings.toLocaleString()}/mo ROI identified`)
    } else if (signals.roiSavings > 1000) {
      score += 8
    }
  }

  if (signals.auditScore !== undefined) {
    if (signals.auditScore < 30) {
      score += 20
      reasons.push(`Poor website audit (${signals.auditScore}/100)`)
    } else if (signals.auditScore < 50) {
      score += 12
      reasons.push(`Weak website audit (${signals.auditScore}/100)`)
    }
  }

  if (signals.chatbotQualScore !== undefined) {
    const chatScore = Math.round(signals.chatbotQualScore * 10)
    score += Math.min(chatScore, 25)
    reasons.push(`Chatbot qualified ${signals.chatbotQualScore}/10`)
  }

  // Industry bonus for high-value verticals
  const highValueIndustries = ["vending", "automotive", "healthcare", "saas", "dealership", "staffing"]
  if (signals.industry && highValueIndustries.some((i) => signals.industry!.toLowerCase().includes(i))) {
    score += 10
    reasons.push(`High-value industry: ${signals.industry}`)
  }

  score = Math.min(score, 100)

  const tier: LeadScore["tier"] = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold"
  const priority: LeadScore["priority"] =
    score >= 80 ? "URGENT" : score >= 60 ? "HIGH" : score >= 35 ? "MEDIUM" : "LOW"

  return {
    score,
    tier,
    reason: reasons.slice(0, 4).join(". "),
    priority,
  }
}
