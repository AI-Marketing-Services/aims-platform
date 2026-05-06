import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { hasEntitlement } from "@/lib/entitlements"
import { FEATURE_ENTITLEMENTS } from "@/lib/plans/registry"
import { analyzeWithClaude, classifyAnthropicError } from "@/lib/ai"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

const generateSchema = z.object({
  clientDealId: z.string(),
  /** ISO date for the start of the recap week (Monday). Defaults to last Monday. */
  weekStartDate: z.string().datetime().optional(),
})

async function checkAccess(userId: string): Promise<boolean> {
  const u = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  if (u?.role === "ADMIN" || u?.role === "SUPER_ADMIN") return true
  return hasEntitlement(userId, FEATURE_ENTITLEMENTS.CLIENT_UPDATES)
}

function startOfWeek(d: Date): Date {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  const day = out.getDay()
  // Monday-start; getDay() returns 0=Sun, 1=Mon, ...
  const diff = (day + 6) % 7
  out.setDate(out.getDate() - diff)
  return out
}

/** GET /api/portal/client-updates — list user's updates. */
export async function GET() {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const allowed = await checkAccess(userId)
  if (!allowed) {
    return NextResponse.json(
      { error: "upgrade_required", entitlement: FEATURE_ENTITLEMENTS.CLIENT_UPDATES },
      { status: 402 },
    )
  }

  const updates = await db.clientUpdate.findMany({
    where: { userId },
    orderBy: { weekStartDate: "desc" },
    take: 100,
  })
  return NextResponse.json({ updates })
}

/**
 * POST /api/portal/client-updates — generate a draft weekly recap for a deal.
 *
 * Pulls activity from the past 7 days plus invoices + content shipped, then
 * asks Claude to draft a friendly recap email in the operator's voice. Saves
 * as a draft for the operator to review + edit before sending.
 */
export async function POST(req: Request) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const allowed = await checkAccess(userId)
  if (!allowed) {
    return NextResponse.json(
      { error: "upgrade_required", entitlement: FEATURE_ENTITLEMENTS.CLIENT_UPDATES },
      { status: 402 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = generateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const weekStart = parsed.data.weekStartDate
    ? new Date(parsed.data.weekStartDate)
    : startOfWeek(new Date())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const deal = await db.clientDeal.findFirst({
    where: { id: parsed.data.clientDealId, userId },
    include: {
      activities: {
        where: { createdAt: { gte: weekStart, lt: weekEnd } },
        orderBy: { createdAt: "asc" },
      },
      invoices: {
        where: { createdAt: { gte: weekStart, lt: weekEnd } },
        orderBy: { createdAt: "asc" },
      },
      contentPieces: {
        where: { createdAt: { gte: weekStart, lt: weekEnd } },
        orderBy: { createdAt: "asc" },
      },
    },
  })
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 })
  }

  const operator = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, memberProfile: { select: { businessName: true } } },
  })

  const generatedFrom = {
    deal: { companyName: deal.companyName, contactName: deal.contactName },
    activities: deal.activities.map((a) => ({
      type: a.type,
      description: a.description,
      createdAt: a.createdAt,
    })),
    invoices: deal.invoices.map((i) => ({
      total: i.total,
      currency: i.currency,
      status: i.status,
      createdAt: i.createdAt,
    })),
    contentPieces: deal.contentPieces.map((c) => ({
      title: c.title,
      type: c.type,
      createdAt: c.createdAt,
    })),
  }

  const systemPrompt = `You are drafting a weekly recap email for an AI operator's retainer client. Write in the operator's voice — warm, professional, concrete. Mention the actual work shipped this week (no fluff or generic statements). End with a brief look-ahead and a CTA to reply with feedback.`

  const userPrompt = `<context>
Operator: ${operator?.name ?? "the operator"}${operator?.memberProfile?.businessName ? ` from ${operator.memberProfile.businessName}` : ""}
Client: ${deal.companyName}${deal.contactName ? ` (primary contact: ${deal.contactName})` : ""}
Week: ${weekStart.toISOString().slice(0, 10)} → ${weekEnd.toISOString().slice(0, 10)}
</context>

<this_weeks_data>
${JSON.stringify(generatedFrom, null, 2)}
</this_weeks_data>

Output JSON ONLY in this exact shape:
{"subject": "Weekly update – ${deal.companyName} – Week of ${weekStart.toISOString().slice(0, 10)}", "body": "the full email body, plain text, with line breaks"}`

  try {
    const result = await analyzeWithClaude({
      prompt: userPrompt,
      systemPrompt,
      model: "claude-haiku-4-5-20251001",
      maxTokens: 1500,
      serviceArm: "client-updates",
      clientId: deal.id,
    })

    let parsedJson: { subject: string; body: string } | null = null
    try {
      const match = result.text.match(/\{[\s\S]*\}/)
      if (match) parsedJson = JSON.parse(match[0])
    } catch {
      // fallthrough
    }

    const subject =
      parsedJson?.subject ??
      `Weekly update — ${deal.companyName} — week of ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    const updateBody = parsedJson?.body ?? result.text

    const update = await db.clientUpdate.create({
      data: {
        userId,
        clientDealId: deal.id,
        status: "draft",
        weekStartDate: weekStart,
        subject,
        body: updateBody,
        generatedFrom: generatedFrom as object,
      },
    })

    return NextResponse.json({ update })
  } catch (err) {
    const classified = classifyAnthropicError(err)
    if (classified) {
      return NextResponse.json(
        { error: classified.message },
        { status: classified.status },
      )
    }
    logger.error("Client Update generation failed", err, { userId })
    return NextResponse.json(
      { error: "Update generation failed" },
      { status: 500 },
    )
  }
}
