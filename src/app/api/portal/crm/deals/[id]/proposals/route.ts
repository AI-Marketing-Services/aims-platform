import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { analyzeWithClaude } from "@/lib/ai"
import { trackUsage } from "@/lib/usage"
import { randomBytes } from "crypto"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"

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

    const dealContext = `
Company: ${deal.companyName}
${deal.contactName ? `Contact: ${deal.contactName}` : ""}
${deal.contactEmail ? `Email: ${deal.contactEmail}` : ""}
${deal.industry ? `Industry: ${deal.industry}` : ""}
${deal.website ? `Website: ${deal.website}` : ""}
${deal.value > 0 ? `Estimated value: $${deal.value.toLocaleString()} ${deal.currency}` : ""}
${deal.notes ? `Notes: ${deal.notes}` : ""}
${services ? `Services requested: ${services}` : ""}
${additionalContext ? `Additional context: ${additionalContext}` : ""}
`.trim()

    const systemPrompt = `You are an expert AI services consultant writing a professional Statement of Work (SOW) / proposal document.

The operator's business: ${operatorName} — ${operatorNiche}

Write proposals in clean Markdown. Structure them professionally with:
1. Executive Summary (2-3 sentences max)
2. Understanding of the Challenge
3. Proposed Solution (with specific deliverables)
4. Investment (pricing table or range)
5. Timeline
6. Why Us
7. Next Steps

Use confident, professional language. Be specific about deliverables. Make the ROI clear. Keep it concise — under 600 words total. Do NOT use placeholder text like "[CLIENT NAME]" — use the actual names provided.`

    const prompt = `Write a proposal for this client:

${dealContext}

Proposal title: ${title ?? `AI Automation Services for ${deal.companyName}`}`

    const { text } = await analyzeWithClaude({
      systemPrompt,
      prompt,
      model: "claude-sonnet-4-20250514",
      maxTokens: 1500,
      serviceArm: "crm-proposals",
      clientId: dbUserId,
    })

    const shareToken = randomBytes(20).toString("hex")

    const proposal = await db.clientProposal.create({
      data: {
        clientDealId: dealId,
        title: title ?? `AI Automation Services for ${deal.companyName}`,
        content: text,
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

    return NextResponse.json({ proposal }, { status: 201 })
  } catch (err) {
    logger.error("Failed to generate proposal", err, { userId, dealId })
    return NextResponse.json({ error: "Failed to generate proposal" }, { status: 500 })
  }
}
