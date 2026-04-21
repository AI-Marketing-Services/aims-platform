import { analyzeWithClaude } from "@/lib/ai"
import type { Source } from "./sources"

export type CouncilPick = {
  url: string
  headline: string
  summary: string
  source: string
  publishedAt?: string
} | null

const MEMBERS = [
  { id: "A", model: "claude-sonnet-4-20250514" as const },
  { id: "B", model: "claude-haiku-4-5-20251001" as const },
  { id: "C", model: "claude-haiku-4-5-20251001" as const },
]
const CHAIRMAN = "claude-opus-4-20250514" as const

export async function councilPick(
  topic: { label: string },
  sources: Source[],
  programMd: string,
): Promise<CouncilPick> {
  if (sources.length === 0) return null

  const corpus = sources
    .slice(0, 12)
    .map((s, i) => `[${i}] ${s.domain} · ${s.publishedAt ?? "undated"}\n    ${s.title}\n    ${s.snippet.slice(0, 300)}\n    ${s.url}`)
    .join("\n\n")

  const stage1 = await Promise.all(
    MEMBERS.map((m) =>
      analyzeWithClaude({
        model: m.model,
        systemPrompt: programMd,
        prompt: `Topic: ${topic.label}\n\nCandidates:\n${corpus}\n\nPick the SINGLE most important story and return JSON:\n{"index": <number>, "headline": "...", "summary": "..."}\nReturn null if nothing meets the selection bar.`,
        maxTokens: 300,
        serviceArm: "signal",
      }).then((r) => ({ member: m.id, text: r.text })),
    ),
  )

  const reviewInput = stage1.map((s) => `Model ${s.member}:\n${s.text}`).join("\n\n")
  const reviews = await Promise.all(
    MEMBERS.map((m) =>
      analyzeWithClaude({
        model: m.model,
        systemPrompt: programMd,
        prompt: `Three models proposed picks for topic "${topic.label}".\n\n${reviewInput}\n\nRank them 1 (best) to 3 (worst) by signal value, adherence to voice rules, and source quality. Return JSON: {"ranking": ["A","B","C"], "note": "one line"}`,
        maxTokens: 150,
        serviceArm: "signal",
      }).then((r) => r.text),
    ),
  )

  const synthesis = await analyzeWithClaude({
    model: CHAIRMAN,
    systemPrompt: programMd,
    prompt: `You are the chairman. Topic: ${topic.label}\n\nCandidate pool (indexed):\n${corpus}\n\nCouncil proposals:\n${reviewInput}\n\nPeer reviews:\n${reviews.map((r, i) => `Reviewer ${MEMBERS[i].id}: ${r}`).join("\n")}\n\nReturn the final pick as strict JSON only:\n{"index": <number or null>, "headline": "<=12 words present tense", "summary": "<=20 words, one sentence"}\nIf no candidate clears the bar, return {"index": null, "headline": "", "summary": ""}.`,
    maxTokens: 250,
    serviceArm: "signal",
  })

  const parsed = extractJson(synthesis.text)
  if (!parsed || parsed.index === null || parsed.index === undefined) return null
  const chosen = sources[parsed.index as number]
  if (!chosen || !parsed.headline || !parsed.summary) return null

  return {
    url: chosen.url,
    headline: String(parsed.headline).trim(),
    summary: String(parsed.summary).trim(),
    source: chosen.domain,
    publishedAt: chosen.publishedAt,
  }
}

function extractJson(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) } catch { return null }
}
