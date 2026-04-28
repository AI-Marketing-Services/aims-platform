import { analyzeWithClaude } from "@/lib/ai"
import { logger } from "@/lib/logger"
import type { AnswerMap, LeadIdentity, QuizQuestion } from "./types"

interface AiSummaryResult {
  summary: string
  score: number // 0-100 qualification score
  tags: string[]
  recommendedArms: Array<{ slug: string; reason: string }>
}

const SYSTEM_PROMPT = `You are an analyst on the AI Operator Collective fulfillment team. Operators send their prospects through a short AI Audit; you read the answers and produce a tight, actionable lead summary.

Return ONLY valid JSON matching this shape (no markdown, no commentary):
{
  "summary": "<2-4 sentences. Lead with role + revenue band, then the single most useful detail from their open-ended answers, then an explicit qualification verdict.>",
  "score": <integer 0-100. 80+ = clearly qualified, 50-79 = warm, below 50 = not a fit right now>,
  "tags": ["<short kebab-case tags>", "..."],
  "recommendedArms": [{"slug": "<aims-service-arm-slug>", "reason": "<one sentence>"}]
}

Service-arm slugs you can recommend (use 1-3, only if clearly relevant):
ai-audit, ai-readiness, ai-ops-excellence, ai-cfo, ai-marketing, ai-sales, ai-content, ai-data, ai-website-audit, ai-research`

function renderAnswers(questions: QuizQuestion[], answers: AnswerMap): string {
  return questions
    .map((q) => {
      const raw = answers[q.id]
      if (raw == null || raw === "") return null
      const value = Array.isArray(raw)
        ? raw
            .map(
              (id) =>
                q.options?.find((o) => o.id === id)?.label ?? String(id),
            )
            .join(", ")
        : q.options
        ? q.options.find((o) => o.id === raw)?.label ?? String(raw)
        : String(raw)
      return `Q: ${q.label}\nA: ${value}`
    })
    .filter(Boolean)
    .join("\n\n")
}

export async function summarizeAuditResponse(params: {
  questions: QuizQuestion[]
  answers: AnswerMap
  lead: LeadIdentity
}): Promise<AiSummaryResult | null> {
  const transcript = renderAnswers(params.questions, params.answers)
  const leadHeader = [
    params.lead.name && `Name: ${params.lead.name}`,
    params.lead.email && `Email: ${params.lead.email}`,
    params.lead.company && `Company: ${params.lead.company}`,
    params.lead.role && `Role: ${params.lead.role}`,
  ]
    .filter(Boolean)
    .join("\n")

  const prompt = `${leadHeader || "Anonymous lead"}\n\n${transcript}`

  try {
    const { text } = await analyzeWithClaude({
      prompt,
      systemPrompt: SYSTEM_PROMPT,
      model: "claude-haiku-4-5-20251001",
      maxTokens: 700,
      serviceArm: "audit-quiz",
    })

    const cleaned = text.replace(/^```json\s*|\s*```$/g, "").trim()
    const parsed = JSON.parse(cleaned) as Partial<AiSummaryResult>

    if (typeof parsed.summary !== "string" || typeof parsed.score !== "number") {
      return null
    }

    return {
      summary: parsed.summary,
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
      recommendedArms: Array.isArray(parsed.recommendedArms)
        ? parsed.recommendedArms.slice(0, 3)
        : [],
    }
  } catch (err) {
    logger.error("Failed to summarize audit response", err)
    return null
  }
}
