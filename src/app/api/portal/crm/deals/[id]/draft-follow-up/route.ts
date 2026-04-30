import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { analyzeWithClaude } from "@/lib/ai"
import { debitCredits, hasBalance, InsufficientCreditsError } from "@/lib/enrichment/credits/ledger"

export const dynamic = "force-dynamic"
export const maxDuration = 30

const DRAFT_COST = 3

/**
 * POST /api/portal/crm/deals/[id]/draft-follow-up
 *
 * Drafts a personalized follow-up email for a single ClientDeal.
 * Claude Haiku reads the enriched company profile + the deal's recent
 * activity timeline + the operator's name, and writes a 3-paragraph
 * email that references real specifics (not generic 'just checking in'
 * boilerplate).
 *
 * Returns { subject, body, tone } — the UI shows it in a modal, the
 * operator edits in-place, then copies / sends. Operator stays in
 * control: AI never sends anything.
 *
 * Credit cost: 3 (same as suggest-services). Cheap enough to use
 * routinely on every stale deal.
 */

const bodySchema = z.object({
  tone: z.enum(["friendly", "direct", "curious", "value-led"]).optional().default("friendly"),
  intent: z.enum(["check-in", "share-resource", "ask-for-meeting", "respond-to-objection"])
    .optional()
    .default("check-in"),
  customNote: z.string().max(500).optional(),
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

  let body: unknown = {}
  try {
    body = await req.json()
  } catch {
    // empty body is fine — defaults apply
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid options", issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const { tone, intent, customNote } = parsed.data

  // Pre-flight balance check
  const balance = await hasBalance(dbUserId, DRAFT_COST)
  if (!balance.ok) {
    return NextResponse.json(
      {
        error: "Insufficient credits",
        required: DRAFT_COST,
        available: balance.current,
      },
      { status: 402 },
    )
  }

  // Load Deal + enrichment + recent activity + operator name + recent
  // meeting notes (the killer context for personalised follow-ups).
  const [deal, operator] = await Promise.all([
    db.clientDeal.findFirst({
      where: { id: dealId, userId: dbUserId },
      include: {
        enrichment: true,
        contacts: { take: 3, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
        activities: { take: 8, orderBy: { createdAt: "desc" } },
        // Pull the 3 most recent text notes/transcripts (skip files —
        // we can't read PDF/audio binaries inline). Operator's notes
        // become the most-specific context Claude has.
        meetingNotes: {
          where: { content: { not: null } },
          orderBy: [{ meetingDate: "desc" }, { createdAt: "desc" }],
          take: 3,
        },
      },
    }),
    db.user.findUnique({
      where: { id: dbUserId },
      select: { name: true, email: true, memberProfile: { select: { businessName: true } } },
    }),
  ])
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 })
  }

  // Pick the primary contact (or first contact, or fallback)
  const primaryContact =
    deal.contacts.find((c) => c.isPrimary) ?? deal.contacts[0] ?? null
  const recipientName =
    primaryContact?.firstName ??
    deal.contactName?.split(" ")[0] ??
    "there"

  // Days since last touch
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(deal.updatedAt).getTime()) / 86400000,
  )

  // Compact context block
  const contextLines: string[] = []
  contextLines.push(`Recipient: ${recipientName} at ${deal.companyName}`)
  if (primaryContact?.title) contextLines.push(`Their role: ${primaryContact.title}`)
  if (deal.enrichment?.description) {
    contextLines.push(`What they do: ${deal.enrichment.description}`)
  } else if (deal.industry) {
    contextLines.push(`Industry: ${deal.industry}`)
  }
  if (deal.enrichment?.employeeRange) {
    contextLines.push(`Size: ${deal.enrichment.employeeRange} employees`)
  }
  if (deal.enrichment?.city || deal.enrichment?.state) {
    contextLines.push(
      `Location: ${[deal.enrichment.city, deal.enrichment.state].filter(Boolean).join(", ")}`,
    )
  }
  contextLines.push(`Current pipeline stage: ${deal.stage}`)
  contextLines.push(`Days since last touch: ${daysSinceUpdate}`)
  if (deal.notes) {
    contextLines.push(`Operator notes: ${deal.notes.slice(0, 300)}`)
  }
  if (deal.activities.length > 0) {
    const recentActivity = deal.activities
      .slice(0, 4)
      .map((a) => `- ${a.type}: ${a.description ?? "(no description)"}`)
      .join("\n")
    contextLines.push(`Recent activity:\n${recentActivity}`)
  }
  // Meeting notes / transcripts — THE highest-signal context. Trim each
  // note to a budget so we don't blow Claude's context window with a
  // 60-minute Zoom transcript. Most-recent first.
  if (deal.meetingNotes.length > 0) {
    const NOTE_CHAR_BUDGET = 4000 // ~1000 tokens per note × 3 notes max
    const notesBlock = deal.meetingNotes
      .map((n) => {
        const dateStr = n.meetingDate
          ? new Date(n.meetingDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "undated"
        const heading = `${n.kind === "TRANSCRIPT" ? "Transcript" : "Note"} (${dateStr})${n.title ? ` — ${n.title}` : ""}`
        const trimmed =
          (n.content ?? "").length > NOTE_CHAR_BUDGET
            ? (n.content ?? "").slice(0, NOTE_CHAR_BUDGET) + "\n[…truncated]"
            : n.content ?? ""
        return `${heading}\n${trimmed}`
      })
      .join("\n\n---\n\n")
    contextLines.push(`Meeting notes / transcripts (most recent first):\n${notesBlock}`)
  }
  if (customNote) contextLines.push(`Custom note from operator: ${customNote}`)

  const senderName = operator?.name?.split(" ")[0] ?? "there"
  const senderBusiness = operator?.memberProfile?.businessName ?? null

  const intentDescriptions: Record<typeof intent, string> = {
    "check-in": "a soft check-in to revive the conversation without being pushy",
    "share-resource":
      "a share of a relevant resource (case study, playbook, or insight) that would be valuable to them given their business",
    "ask-for-meeting": "a direct ask for a 20-minute call to discuss a specific opportunity",
    "respond-to-objection":
      "a follow-up addressing a likely objection they may have based on the activity history",
  }

  const toneDescriptions: Record<typeof tone, string> = {
    friendly: "warm, conversational, like writing to a peer",
    direct: "concise, no fluff, gets to the point in the first sentence",
    curious: "genuinely curious about their business — leads with a question",
    "value-led": "leads with a specific tactical insight or observation about their business",
  }

  const systemPrompt = `You are a sales-savvy assistant drafting a follow-up email for an AIMS Operator Collective member to send to a real prospect they've engaged before.

Output ONLY valid JSON, no markdown:
{
  "subject": "subject line (under 60 chars, no spam triggers, ideally references a specific detail)",
  "body": "3 short paragraphs separated by \\n\\n. Plain text only. Sign with: ${senderName}${senderBusiness ? ` at ${senderBusiness}` : ""}",
  "rationale": "1 sentence explaining what specific detail you referenced and why it should resonate"
}

Tone: ${toneDescriptions[tone]}.
Intent: ${intentDescriptions[intent]}.

Hard rules:
- If meeting notes / transcripts are provided, REFERENCE A SPECIFIC DETAIL FROM THEM. The meeting notes are real things the operator and recipient actually discussed — leveraging them ("Per our discussion last Tuesday about the Q4 hiring plan…") is the entire reason this email outperforms a cold draft. Do NOT just summarise the notes — pull one specific detail and build the email around it.
- If no meeting notes are provided, reference a SPECIFIC detail from the recipient's business (their description, size, location, or industry). Generic "hope you're well" openers are forbidden.
- Keep it under 120 words total.
- Never invent facts. If the context doesn't say something, don't claim it.
- The CTA in the third paragraph should match the intent: a check-in asks a question, a share gives them a link they can click, a meeting ask proposes 2 specific time windows, an objection-response acknowledges + addresses it.
- Do NOT include any "P.S." or "Sent from my iPhone" boilerplate.
- The signature line must end with the sender's name (and business if provided). No fake titles.`

  try {
    await debitCredits({
      userId: dbUserId,
      amount: DRAFT_COST,
      reason: "enrichment-debit",
      metadata: { dealId, operation: "draft-follow-up", tone, intent },
    })

    const result = await analyzeWithClaude({
      systemPrompt,
      prompt: contextLines.join("\n"),
      model: "claude-haiku-4-5-20251001",
      maxTokens: 600,
      serviceArm: "deal-followup",
      clientId: dealId,
    })

    const raw = result.text ?? ""
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim()

    let parsed: { subject?: string; body?: string; rationale?: string }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      logger.warn("AI follow-up draft returned non-JSON", {
        dealId,
        raw: cleaned.slice(0, 300),
      })
      return NextResponse.json(
        { error: "AI returned malformed output. Try again." },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      subject: parsed.subject ?? `Following up — ${deal.companyName}`,
      body: parsed.body ?? "",
      rationale: parsed.rationale ?? null,
      recipient: {
        name: recipientName,
        email: primaryContact?.email ?? deal.contactEmail ?? null,
      },
      creditsCost: DRAFT_COST,
      tone,
      intent,
    })
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: "Insufficient credits", required: err.required, available: err.available },
        { status: 402 },
      )
    }
    logger.error("AI follow-up draft failed", err, {
      endpoint: "POST /api/portal/crm/deals/[id]/draft-follow-up",
      userId: dbUserId,
      dealId,
    })
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Draft failed" },
      { status: 500 },
    )
  }
}
