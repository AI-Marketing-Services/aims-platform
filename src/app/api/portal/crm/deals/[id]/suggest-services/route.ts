import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { analyzeWithClaude } from "@/lib/ai"
import { debitCredits, hasBalance, InsufficientCreditsError } from "@/lib/enrichment/credits/ledger"
import { PLAYBOOK_MANIFEST } from "@/lib/playbooks/manifest"
import { stripDashes, stripDashesArr } from "@/lib/text/strip-dashes"

export const dynamic = "force-dynamic"
export const maxDuration = 30

const SUGGEST_COST = 3 // small claude haiku call

/**
 * POST /api/portal/crm/deals/[id]/suggest-services
 *
 * Reads the ClientDeal + ClientDealEnrichment + matching industry
 * playbook, sends it to Claude Haiku, and returns a structured set of
 * recommended services, pain points, integrations, and a tailored
 * pitch angle the operator can drop straight into the proposal form.
 *
 * The recommendation is grounded in:
 *   - The enriched company profile (industry, size, revenue, description,
 *     management company if managed property, etc.)
 *   - Industry-matched playbook entries from PLAYBOOK_MANIFEST so the
 *     output references real services the operator can actually deliver
 *     instead of hallucinated SKUs
 *
 * Charges 3 credits per call. Cheap enough that operators will use it
 * routinely; expensive enough to reflect the real Claude cost.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: dealId } = await params

  // Pre-flight balance check
  const balance = await hasBalance(dbUserId, SUGGEST_COST)
  if (!balance.ok) {
    return NextResponse.json(
      {
        error: "Insufficient credits",
        required: SUGGEST_COST,
        available: balance.current,
      },
      { status: 402 },
    )
  }

  // Load Deal + enrichment + recent meeting notes (highest-signal
  // context for personalised service recommendations)
  const deal = await db.clientDeal.findFirst({
    where: { id: dealId, userId: dbUserId },
    include: {
      enrichment: true,
      contacts: { take: 5 },
      meetingNotes: {
        where: { content: { not: null } },
        orderBy: [{ meetingDate: "desc" }, { createdAt: "desc" }],
        take: 3,
      },
    },
  })
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 })
  }

  // Pick a matching playbook by industry (loose substring match — many
  // industries map to the same playbook)
  const industryRaw =
    deal.enrichment?.industry ?? deal.industry ?? deal.companyName
  const industryLc = industryRaw.toLowerCase()
  const matchedPlaybook = PLAYBOOK_MANIFEST.find((p) =>
    industryLc.includes(p.id.toLowerCase()) ||
    industryLc.includes(p.industry.toLowerCase()) ||
    p.industry.toLowerCase().includes(industryLc),
  )

  // Build a tight context block for the prompt
  const enrichmentSummary = deal.enrichment
    ? [
        `Company: ${deal.companyName}`,
        deal.enrichment.description ? `Description: ${deal.enrichment.description}` : null,
        deal.enrichment.industry ? `Industry: ${deal.enrichment.industry}` : null,
        deal.enrichment.employeeRange
          ? `Employees: ${deal.enrichment.employeeRange}`
          : deal.enrichment.employeeCount
            ? `Employees: ~${deal.enrichment.employeeCount}`
            : null,
        deal.enrichment.revenueRange ? `Revenue: ${deal.enrichment.revenueRange}` : null,
        deal.enrichment.foundedYear ? `Founded: ${deal.enrichment.foundedYear}` : null,
        deal.enrichment.city || deal.enrichment.state
          ? `Location: ${[deal.enrichment.city, deal.enrichment.state].filter(Boolean).join(", ")}`
          : null,
        deal.enrichment.managementCompany
          ? `Managed by: ${deal.enrichment.managementCompany}`
          : null,
        deal.contacts.length > 0
          ? `Known contacts: ${deal.contacts
              .map((c) => `${c.firstName}${c.lastName ? ` ${c.lastName}` : ""}${c.title ? ` (${c.title})` : ""}`)
              .join(", ")}`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    : `Company: ${deal.companyName}\nIndustry: ${deal.industry ?? "unknown"}\n(no enrichment data yet)`

  // Meeting notes — the operator's actual conversations with this lead.
  // Highest-signal context for "what should we propose?" — far more
  // specific than generic enrichment data.
  const NOTE_BUDGET = 3000 // chars per note, ~750 tokens
  const notesContext =
    deal.meetingNotes.length > 0
      ? `\n\nMeeting notes / transcripts (most recent first — leverage these for ULTRA-specific recommendations):\n${deal.meetingNotes
          .map((n) => {
            const dateStr = n.meetingDate
              ? new Date(n.meetingDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "undated"
            const trimmed =
              (n.content ?? "").length > NOTE_BUDGET
                ? (n.content ?? "").slice(0, NOTE_BUDGET) + "\n[…truncated]"
                : n.content ?? ""
            return `[${n.kind} ${dateStr}${n.title ? ` — ${n.title}` : ""}]\n${trimmed}`
          })
          .join("\n\n---\n\n")}`
      : ""

  const playbookContext = matchedPlaybook
    ? `\nRelevant playbook (${matchedPlaybook.industry}):
Pain point industry-wide: ${matchedPlaybook.topPain}
Average deal size: ${matchedPlaybook.avgDealSize}
Use cases:
${matchedPlaybook.useCases
  .map(
    (uc) =>
      `- ${uc.title} ($${uc.monthlyValue}/mo, ${uc.difficulty}): ${uc.solution}\n  Tools: ${uc.tools.join(", ")}`,
  )
  .join("\n")}`
    : "\n(no industry-specific playbook matched — use AIMS Operator Collective's standard service catalog)"

  const systemPrompt = `You are an AI services strategist helping an AIMS Operator Collective operator pitch a custom AI solution to a specific business.

ABSOLUTE STYLE RULE: NEVER use em-dashes (—) anywhere in any field. Use periods, commas, or colons instead. This rule is non-negotiable.

You output ONLY valid JSON, no markdown, no explanation. Schema:
{
  "services": ["service 1", "service 2", "service 3"],
  "painPoints": ["specific pain this business likely faces", "another"],
  "integrations": ["specific tool/platform to integrate with"],
  "pitchAngle": "1-2 sentence pitch tailored to this exact business",
  "estimatedMonthlyValue": "$X,XXX to $Y,YYY/mo (range, no em-dash)"
}

services: 3-5 specific AI services this operator could deliver. Use plain
human names (e.g. "AI lead-qualification chatbot", not "GPT-4 powered RAG").
Prefer services from the playbook context if one is provided.

painPoints: 2-4 specific operational pain points THIS business likely has
based on industry, size, location, age. Be concrete.

integrations: 2-3 specific platforms/tools to integrate with, based on
what businesses in this space typically already use.

pitchAngle: 1-2 sentences max. Speaks to this specific company's known
strengths or positioning. References their actual description if available.

estimatedMonthlyValue: realistic monthly retainer range based on company
size + complexity of the service stack.`

  try {
    await debitCredits({
      userId: dbUserId,
      amount: SUGGEST_COST,
      reason: "enrichment-debit",
      metadata: { dealId, operation: "suggest-services" },
    })

    const result = await analyzeWithClaude({
      systemPrompt,
      prompt: `${enrichmentSummary}${playbookContext}${notesContext}

Recommend the AI services pitch for this exact business. JSON only.${
        notesContext
          ? "\n\nIMPORTANT: leverage the meeting notes — pain points / objections / interests the operator captured there are FAR more specific than the enrichment data. Build recommendations around what was actually discussed."
          : ""
      }`,
      model: "claude-haiku-4-5-20251001",
      maxTokens: 800,
      serviceArm: "deal-suggest",
      clientId: dealId,
    })

    // analyzeWithClaude returns { text, usage }
    const raw = result.text ?? ""

    // Strip ```json fences if Claude wrapped despite our system prompt
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim()

    let parsed: {
      services?: string[]
      painPoints?: string[]
      integrations?: string[]
      pitchAngle?: string
      estimatedMonthlyValue?: string
    }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      logger.warn("AI suggest-services returned non-JSON", { dealId, raw: cleaned.slice(0, 300) })
      return NextResponse.json(
        { error: "AI returned malformed output. Try again." },
        { status: 500 },
      )
    }

    // Defensive long-dash sweep on every string field returned to the
    // client (em, en, figure, horizontal-bar, two-em, three-em).
    return NextResponse.json({
      ok: true,
      services: stripDashesArr(parsed.services),
      painPoints: stripDashesArr(parsed.painPoints),
      integrations: stripDashesArr(parsed.integrations),
      pitchAngle: stripDashes(parsed.pitchAngle) || null,
      estimatedMonthlyValue:
        stripDashes(parsed.estimatedMonthlyValue) || null,
      creditsCost: SUGGEST_COST,
      matchedPlaybook: matchedPlaybook ? matchedPlaybook.industry : null,
    })
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: "Insufficient credits", required: err.required, available: err.available },
        { status: 402 },
      )
    }
    logger.error("AI suggest-services failed", err, {
      endpoint: "POST /api/portal/crm/deals/[id]/suggest-services",
      userId: dbUserId,
      dealId,
    })
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Suggestion failed",
      },
      { status: 500 },
    )
  }
}
