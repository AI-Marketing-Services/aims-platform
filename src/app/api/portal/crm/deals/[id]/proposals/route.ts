import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { analyzeWithClaude } from "@/lib/ai"
import { trackUsage } from "@/lib/usage"
import { randomBytes } from "crypto"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"
import { stripDashes } from "@/lib/text/strip-dashes"
import { markQuestEvent } from "@/lib/quests"

async function getDbUserId(clerkId: string): Promise<string | null> {
  const user = await getOrCreateDbUserByClerkId(clerkId)
  return user.id
}

async function getDealForUser(dealId: string, userId: string) {
  return db.clientDeal.findFirst({
    where: { id: dealId, userId },
    include: {
      contacts: { where: { isPrimary: true }, take: 1 },
      proposals: { orderBy: { createdAt: "desc" } },
      enrichment: true,
      // Pull recent text notes/transcripts so generation references real
      // meeting context, not just enrichment data.
      meetingNotes: {
        where: { content: { not: null } },
        orderBy: [{ meetingDate: "desc" }, { createdAt: "desc" }],
        take: 3,
      },
    },
  })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id: dealId } = await params
  const deal = await getDealForUser(dealId, dbUserId)
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ proposals: deal.proposals })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id: dealId } = await params
  const deal = await getDealForUser(dealId, dbUserId)
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const { title, additionalContext, services } = body as {
    title?: string
    additionalContext?: string
    services?: string
  }

  try {
    // Get operator's business profile for context
    const memberProfile = await db.memberProfile.findUnique({
      where: { userId: dbUserId },
      select: { businessName: true, oneLiner: true, niche: true },
    })

    const operatorName = memberProfile?.businessName ?? "AI Operator"
    const operatorNiche = memberProfile?.niche ?? "AI automation services"

    // Trim each meeting note to a budget so we don't blow Claude's context
    // window on a 90-minute Zoom transcript.
    const NOTE_BUDGET = 3500
    const notesBlock =
      deal.meetingNotes.length > 0
        ? `\n\nMEETING NOTES / TRANSCRIPTS (most recent first — leverage specific details from these in the proposal):\n${deal.meetingNotes
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

    const enrichmentBlock = deal.enrichment
      ? `
${deal.enrichment.description ? `What they do: ${deal.enrichment.description}` : ""}
${deal.enrichment.employeeRange ? `Size: ${deal.enrichment.employeeRange} employees` : ""}
${deal.enrichment.revenueRange ? `Revenue range: ${deal.enrichment.revenueRange}` : ""}
${deal.enrichment.foundedYear ? `Founded: ${deal.enrichment.foundedYear}` : ""}
${deal.enrichment.city || deal.enrichment.state ? `Location: ${[deal.enrichment.city, deal.enrichment.state].filter(Boolean).join(", ")}` : ""}
`.trim()
      : ""

    const dealContext = `
Company: ${deal.companyName}
${deal.contactName ? `Contact: ${deal.contactName}` : ""}
${deal.contactEmail ? `Email: ${deal.contactEmail}` : ""}
${deal.industry ? `Industry: ${deal.industry}` : ""}
${deal.website ? `Website: ${deal.website}` : ""}
${deal.value > 0 ? `Estimated value: $${deal.value.toLocaleString()} ${deal.currency}` : ""}
${enrichmentBlock}
${deal.notes ? `Operator notes: ${deal.notes}` : ""}
${services ? `Services requested: ${services}` : ""}
${additionalContext ? `Additional context: ${additionalContext}` : ""}${notesBlock}
`.trim()

    const systemPrompt = `You are an expert AI services consultant writing a professional Statement of Work (SOW) / proposal document for an AIMS Operator Collective member.

The operator's business: ${operatorName}, ${operatorNiche}

ABSOLUTE STYLE RULE: NEVER use em-dashes (—) anywhere in your output. Use periods, commas, colons, or sentence breaks instead. Em-dashes signal AI-generated text and clients can spot them. This rule is non-negotiable. Output containing any "—" character will be rejected.

OUTPUT FORMAT, strict Markdown rendering:
- Section headers as level-2 markdown headings (## Section Name) on their own line, blank line before AND after.
- Sub-points as level-3 (### Sub-point) ONLY if needed within a section.
- Bullet lists: EVERY bullet on its OWN LINE, prefixed by "- " (dash + space). NEVER concatenate multiple bullets onto a single line with • characters or any other separator. Each list item must end with a newline before the next "- " begins. Correct format:
  - **Slow inbound response**: Zillow leads going cold while agents are double booked
  - **Manual scheduling friction**: coordination of showings across properties
  - **Maintenance backlog**: vacancy gaps from delayed request handling
- For label-style bullets, use a colon (**Label**: description), NEVER an em-dash.
- NEVER use the bullet character "•" anywhere. Only use "- " for lists so Markdown renders them.
- Bold key terms with **double asterisks** (NOT html, NOT <strong>).
- Italics with *single asterisks*.
- Investment / pricing MUST be a proper GitHub-Flavored Markdown table when there are 2+ line items. Use this exact shape (header row, separator row with dashes, data rows, each on own line):

  | Service | Monthly Investment |
  | --- | --- |
  | Lead Response Chatbot | $1,200 |
  | Scheduling Automation | $800 |
  | **Total Monthly Investment** | **$3,500** |

- One-time setup fees stated separately on their own paragraph after the table, not crammed into the table.
- No HTML. No <br>. Blank lines between paragraphs and around headings.
- Do NOT wrap the entire output in a code fence.

REQUIRED SECTION STRUCTURE (in order):
## Executive Summary
2-3 sentences max — what we're delivering, the outcome it produces, the timeline.

## Understanding the Challenge
Bullet list of 3-5 specific pain points THIS company faces. If meeting notes are provided, EVERY bullet should reference something specifically discussed (use **Label** — description format). Otherwise infer from enrichment + industry.

## Proposed Solution
Bullet list of 3-6 concrete deliverables. Each: **Service name** — what it does + what tool stack it uses.

## Investment
Either a Markdown table (Service | Monthly | Setup) or bold inline pricing. Be specific with dollar amounts.

## Timeline
Numbered list (week 1 / week 2 / week 3+) with what gets delivered when.

## Why ${operatorName}
2-3 sentences. Pull from operator's niche. Be confident, no hedging.

## Next Steps
Numbered list of exactly 3 steps. The last step always reads: "Sign this proposal — I'll spin up the project the next business day."

LANGUAGE RULES:
- Confident, professional. No "we believe" / "we think" / "perhaps".
- Specific about deliverables — never vague like "improve operations".
- Make ROI explicit when meeting notes mention budget or current spend.
- Keep total under 700 words.
- NEVER use placeholders like "[CLIENT]" or "[COMPANY]" — use actual names from the context.
- If meeting notes exist, the Executive Summary MUST reference one specific detail from them (e.g. "Per our discussion about Q4 hiring...").`

    const prompt = `Write a proposal for this client:

${dealContext}

Proposal title: ${title ?? `AI Automation Services for ${deal.companyName}`}

Output ONLY the proposal markdown — no preamble, no commentary, no code fence wrapping.`

    const { text } = await analyzeWithClaude({
      systemPrompt,
      prompt,
      model: "claude-sonnet-4-20250514",
      maxTokens: 1500,
      serviceArm: "crm-proposals",
      clientId: dbUserId,
    })

    const shareToken = randomBytes(20).toString("hex")

    // Defensive long-dash sweep: even with the system prompt forbidding
    // them, older models occasionally slip in em-dashes, en-dashes, or
    // horizontal bars. Strip ALL long-dash variants before we save so
    // proposals always read like a human wrote them.
    const cleanedContent = stripDashes(text)

    const proposal = await db.clientProposal.create({
      data: {
        clientDealId: dealId,
        title: title ?? `AI Automation Services for ${deal.companyName}`,
        content: cleanedContent,
        totalValue: deal.value,
        currency: deal.currency,
        shareToken,
      },
    })

    // Log to deal activity
    await db.clientDealActivity.create({
      data: {
        clientDealId: dealId,
        type: "PROPOSAL_SENT",
        description: `Proposal generated: "${proposal.title}"`,
      },
    })

    trackUsage(dbUserId, "proposal_generate", { dealId, proposalId: proposal.id }).catch(() => {})

    // Quest: First Proposal + AI bot used
    void markQuestEvent(dbUserId, "proposal.first_generated", {
      metadata: { dealId, proposalId: proposal.id },
    })
    void markQuestEvent(dbUserId, "ai_bot.used", {
      metadata: { bot: "proposal-generator" },
    })

    return NextResponse.json({ proposal }, { status: 201 })
  } catch (err) {
    logger.error("Failed to generate proposal", err, { userId, dealId })
    return NextResponse.json({ error: "Failed to generate proposal" }, { status: 500 })
  }
}
