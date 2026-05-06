import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { hasEntitlement } from "@/lib/entitlements"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"
import { analyzeWithClaude, classifyAnthropicError } from "@/lib/ai"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

const createSchema = z.object({
  title: z.string().min(1).max(200),
  source: z.string().max(200).optional(),
  transcript: z.string().min(1).max(200_000),
  clientDealId: z.string().optional(),
})

async function checkAccess(userId: string): Promise<boolean> {
  const u = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  if (u?.role === "ADMIN" || u?.role === "SUPER_ADMIN") return true
  return hasEntitlement(userId, FEATURE_ENTITLEMENTS.RECORDINGS)
}

/** GET /api/portal/recordings — list user's recordings. */
export async function GET() {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const allowed = await checkAccess(userId)
  if (!allowed) {
    return NextResponse.json(
      { error: "upgrade_required", entitlement: FEATURE_ENTITLEMENTS.RECORDINGS },
      { status: 402 },
    )
  }

  const recordings = await db.callRecording.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      source: true,
      clientDealId: true,
      summary: true,
      status: true,
      createdAt: true,
    },
  })
  return NextResponse.json({ recordings })
}

/**
 * POST /api/portal/recordings
 *
 * Accepts a pasted transcript + optional metadata. Asks Claude to extract
 * a structured buyer summary (pain, budget, decision-makers, objections,
 * action items) PLUS a follow-up email draft. Saves and returns the
 * record so the operator can review on the detail page.
 */
export async function POST(req: Request) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const allowed = await checkAccess(userId)
  if (!allowed) {
    return NextResponse.json(
      { error: "upgrade_required", entitlement: FEATURE_ENTITLEMENTS.RECORDINGS },
      { status: 402 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // If a deal is linked, verify ownership.
  if (parsed.data.clientDealId) {
    const deal = await db.clientDeal.findFirst({
      where: { id: parsed.data.clientDealId, userId },
      select: { id: true },
    })
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }
  }

  const systemPrompt = `You are an AI assistant that processes discovery-call transcripts. Extract structured signals plus draft a follow-up email. Output JSON only.`

  const userPrompt = `<transcript>
${parsed.data.transcript.slice(0, 50_000)}
</transcript>

Output JSON ONLY in this exact shape:
{
  "summary": "2-3 sentence executive summary of what was discussed",
  "pains": ["specific pain point", ...],
  "budget": "stated or implied budget; null if not discussed",
  "decisionMakers": ["names + roles of who decides"],
  "objections": ["concerns raised"],
  "actionItems": ["next steps to take"],
  "scoreOutOf10": 7,
  "scoreReasoning": "brief why",
  "followUpDraft": "subject + body of a follow-up email the operator can send right now"
}`

  let summaryJson: Record<string, unknown> = {}
  let followUpDraft = ""
  try {
    const result = await analyzeWithClaude({
      prompt: userPrompt,
      systemPrompt,
      model: "claude-haiku-4-5-20251001",
      maxTokens: 2500,
      serviceArm: "recordings",
      clientId: parsed.data.clientDealId,
    })
    const match = result.text.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        summaryJson = JSON.parse(match[0])
        followUpDraft = String(
          (summaryJson as Record<string, unknown>).followUpDraft ?? "",
        )
        // Strip the followUp from the summary blob to keep the JSON clean.
        delete (summaryJson as Record<string, unknown>).followUpDraft
      } catch {
        summaryJson = { summary: result.text }
      }
    } else {
      summaryJson = { summary: result.text }
    }
  } catch (err) {
    const classified = classifyAnthropicError(err)
    if (classified) {
      return NextResponse.json(
        { error: classified.message },
        { status: classified.status },
      )
    }
    logger.error("Recording summary failed", err, { userId })
    return NextResponse.json(
      { error: "Recording analysis failed" },
      { status: 500 },
    )
  }

  const recording = await db.callRecording.create({
    data: {
      userId,
      clientDealId: parsed.data.clientDealId ?? null,
      title: parsed.data.title,
      source: parsed.data.source ?? null,
      transcript: parsed.data.transcript,
      summary: summaryJson as object,
      followUpDraft: followUpDraft || null,
      status: "ready",
    },
  })

  return NextResponse.json({ recording })
}
