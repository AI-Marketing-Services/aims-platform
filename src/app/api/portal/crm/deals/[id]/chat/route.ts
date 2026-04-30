import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { analyzeWithClaude } from "@/lib/ai"
import {
  debitCredits,
  hasBalance,
  InsufficientCreditsError,
} from "@/lib/enrichment/credits/ledger"
import { stripDashes } from "@/lib/text/strip-dashes"

export const dynamic = "force-dynamic"
export const maxDuration = 30

const CHAT_COST = 2

/**
 * POST /api/portal/crm/deals/[id]/chat
 *
 * Conversational AI chat scoped to a single ClientDeal. Operator asks
 * questions like:
 *   - "What should I focus on with this lead?"
 *   - "Draft 3 different subject lines for the next email"
 *   - "Summarize all our meeting notes"
 *   - "What objections is this lead likely to raise?"
 *
 * Full deal context (enrichment + contacts + activities + meeting
 * notes + recent proposals) is loaded server-side and injected into
 * the system prompt so the operator doesn't have to re-explain the
 * deal each turn.
 *
 * Charges 2 credits per message. Pre-flight balance check.
 */

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
})

const bodySchema = z.object({
  // Last 6 messages of operator + AI exchanges. Client maintains the
  // history; server is stateless.
  messages: z.array(messageSchema).min(1).max(12),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const dbUserId = await ensureDbUserIdForApi()
  if (!dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: dealId } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid messages", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  // Pre-flight balance check
  const balance = await hasBalance(dbUserId, CHAT_COST)
  if (!balance.ok) {
    return NextResponse.json(
      {
        error: "Insufficient credits",
        required: CHAT_COST,
        available: balance.current,
      },
      { status: 402 },
    )
  }

  // Load full deal context, scoped to ownership
  const deal = await db.clientDeal.findFirst({
    where: { id: dealId, userId: dbUserId },
    include: {
      enrichment: true,
      contacts: { take: 5, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      activities: { take: 12, orderBy: { createdAt: "desc" } },
      meetingNotes: {
        where: { content: { not: null } },
        orderBy: [{ meetingDate: "desc" }, { createdAt: "desc" }],
        take: 3,
      },
      proposals: {
        select: { title: true, status: true, totalValue: true, currency: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
  })
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 })
  }

  const operator = await db.user.findUnique({
    where: { id: dbUserId },
    select: {
      name: true,
      memberProfile: { select: { businessName: true, niche: true } },
    },
  })

  // Build a tight context block the AI gets every turn
  const contextLines: string[] = []
  contextLines.push(`THE DEAL`)
  contextLines.push(`Company: ${deal.companyName}`)
  if (deal.industry || deal.enrichment?.industry) {
    contextLines.push(`Industry: ${deal.enrichment?.industry ?? deal.industry}`)
  }
  if (deal.contactName) contextLines.push(`Primary contact: ${deal.contactName}`)
  if (deal.contactEmail) contextLines.push(`Email: ${deal.contactEmail}`)
  contextLines.push(`Stage: ${deal.stage}`)
  if (deal.value > 0) {
    contextLines.push(`Deal value: ${deal.currency} ${deal.value.toLocaleString()}`)
  }
  if (typeof deal.leadScore === "number") {
    contextLines.push(`Lead score: ${deal.leadScore}/100`)
  }
  if (deal.tags.length > 0) {
    contextLines.push(`Tags: ${deal.tags.join(", ")}`)
  }
  if (deal.notes) {
    contextLines.push(`Operator notes:\n${deal.notes.slice(0, 500)}`)
  }

  if (deal.enrichment) {
    contextLines.push(``)
    contextLines.push(`COMPANY RESEARCH (auto-enriched)`)
    if (deal.enrichment.description) {
      contextLines.push(deal.enrichment.description.slice(0, 500))
    }
    if (deal.enrichment.employeeRange) {
      contextLines.push(`Size: ${deal.enrichment.employeeRange} employees`)
    }
    if (deal.enrichment.revenueRange) {
      contextLines.push(`Revenue: ${deal.enrichment.revenueRange}`)
    }
    if (deal.enrichment.foundedYear) {
      contextLines.push(`Founded: ${deal.enrichment.foundedYear}`)
    }
    if (deal.enrichment.city || deal.enrichment.state) {
      contextLines.push(
        `Location: ${[deal.enrichment.city, deal.enrichment.state]
          .filter(Boolean)
          .join(", ")}`,
      )
    }
  }

  if (deal.contacts.length > 0) {
    contextLines.push(``)
    contextLines.push(`CONTACTS`)
    for (const c of deal.contacts) {
      const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ")
      const parts = [
        fullName,
        c.title ? `(${c.title})` : null,
        c.email ?? null,
        c.phone ?? null,
      ].filter(Boolean)
      contextLines.push(`- ${parts.join(" / ")}`)
    }
  }

  if (deal.meetingNotes.length > 0) {
    contextLines.push(``)
    contextLines.push(`MEETING NOTES / TRANSCRIPTS (most recent first)`)
    const NOTE_BUDGET = 3000
    for (const n of deal.meetingNotes) {
      const dateStr = n.meetingDate
        ? new Date(n.meetingDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "undated"
      const trimmed =
        (n.content ?? "").length > NOTE_BUDGET
          ? (n.content ?? "").slice(0, NOTE_BUDGET) + "\n[...truncated]"
          : n.content ?? ""
      contextLines.push(
        `[${n.kind} ${dateStr}${n.title ? `: ${n.title}` : ""}]\n${trimmed}`,
      )
    }
  }

  if (deal.activities.length > 0) {
    contextLines.push(``)
    contextLines.push(`RECENT ACTIVITY (last 12 entries)`)
    for (const a of deal.activities.slice(0, 8)) {
      contextLines.push(
        `- ${a.type}: ${(a.description ?? "(no detail)").slice(0, 200)}`,
      )
    }
  }

  if (deal.proposals.length > 0) {
    contextLines.push(``)
    contextLines.push(`PROPOSALS SENT`)
    for (const p of deal.proposals) {
      contextLines.push(
        `- "${p.title}" (${p.status}, ${p.currency} ${p.totalValue.toLocaleString()}, ${new Date(p.createdAt).toLocaleDateString()})`,
      )
    }
  }

  const operatorBusiness =
    operator?.memberProfile?.businessName ?? operator?.name ?? "the operator"
  const operatorNiche =
    operator?.memberProfile?.niche ?? "AI services and operations"

  const systemPrompt = `You are ${operatorBusiness}'s AI deal assistant. The operator runs an AI services / operations business in the niche of ${operatorNiche} and you are answering their question about ONE specific deal.

ABSOLUTE STYLE RULE: NEVER use em-dashes (—) anywhere in your response. Use periods, commas, or colons instead. This rule is non-negotiable.

You have full context on the deal in the user message below. Use it. Be specific. Reference real details: the company name, what they do, the meeting notes, recent activity, the proposal status.

Answer concisely. The operator is on the run, often on mobile. Default response length: 2-4 short paragraphs unless they explicitly ask for more.

When the operator asks for content (an email subject, a pitch line, a list of objections), output that content directly. No preamble like "Here are some ideas". Just the content.

When the operator asks a strategic question (what should I focus on, is this deal worth pursuing), give a direct opinion grounded in the data, not a hedge.

Format: plain text by default. Use markdown lists when listing 3+ items. Use **bold** sparingly for emphasis.`

  const contextMessage = contextLines.join("\n")

  // Construct the conversation: prepend the context as a system-style
  // user-message + assistant-acknowledge so Anthropic's API treats the
  // context as foundation, then the actual exchange.
  const conversationMessages = parsed.data.messages

  try {
    await debitCredits({
      userId: dbUserId,
      amount: CHAT_COST,
      reason: "enrichment-debit",
      metadata: { dealId, operation: "deal-chat" },
    })

    // Build the prompt. Claude wrapper takes a single prompt string and
    // optional system prompt. We concatenate context + history into a
    // single user message that the wrapper relays.
    const historyText = conversationMessages
      .map(
        (m) =>
          `${m.role === "user" ? "Operator" : "Assistant"}: ${m.content}`,
      )
      .join("\n\n")

    const result = await analyzeWithClaude({
      systemPrompt,
      prompt: `${contextMessage}

---

CONVERSATION SO FAR:

${historyText}

---

Respond to the operator's last message. Be specific, grounded, and concise.`,
      model: "claude-haiku-4-5-20251001",
      maxTokens: 800,
      serviceArm: "deal-chat",
      clientId: dealId,
    })

    // Strip all long-dash variants defensively
    const reply = stripDashes(result.text).trim()

    return NextResponse.json({
      ok: true,
      reply,
      creditsCost: CHAT_COST,
    })
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: err.required,
          available: err.available,
        },
        { status: 402 },
      )
    }
    logger.error("Deal chat failed", err, {
      endpoint: "POST /api/portal/crm/deals/[id]/chat",
      userId: dbUserId,
      dealId,
    })
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Chat failed",
      },
      { status: 500 },
    )
  }
}
