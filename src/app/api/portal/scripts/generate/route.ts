import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { analyzeWithClaude } from "@/lib/ai"
import { trackUsage } from "@/lib/usage"
import { AiScriptType } from "@prisma/client"

const generateSchema = z.object({
  type: z.nativeEnum(AiScriptType),
  dealId: z.string().optional(),
  context: z.string().max(2000).optional(),
})

async function getDbUserId(clerkId: string) {
  const u = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  return u?.id ?? null
}

function buildSystemPrompt(type: AiScriptType): string {
  const base = `You are an expert sales copywriter for AI service agencies. Write concise, professional, and highly personalized outreach copy. Use placeholders like [COMPANY] and [CONTACT] only if you don't have real values. Return ONLY the script text — no explanation, no preamble, no markdown headers. Use plain line breaks for structure.`

  const typeInstructions: Record<AiScriptType, string> = {
    COLD_EMAIL: `${base}\n\nWrite a cold outreach email to a new prospect. Keep it under 150 words. Include: a compelling subject line (prefix with "Subject: "), a personalized opening, a clear value proposition tied to their industry, a single CTA to book a call. No fluff, no generic filler.`,
    DISCOVERY_CALL: `${base}\n\nWrite a discovery call script. Structure it as: 1) Opening & rapport (30 sec), 2) Agenda setting, 3) Qualifying questions (5-7 questions), 4) Pain point exploration, 5) Value bridge, 6) Next steps. Format each section with a clear label. Keep the total under 400 words.`,
    FOLLOW_UP: `${base}\n\nWrite a follow-up email for a prospect who went quiet after initial contact. Keep it under 100 words. Reference the original outreach, acknowledge their busy schedule, provide one new piece of value, and ask a direct yes/no question to re-engage.`,
    LINKEDIN_DM: `${base}\n\nWrite a LinkedIn direct message for cold outreach. Keep it under 80 words. No "I hope this finds you well." Open with a genuine observation about their work or company, state your value proposition in one sentence, end with a low-friction question.`,
    PROPOSAL_FOLLOW_UP: `${base}\n\nWrite a follow-up email after sending a proposal. Keep it under 120 words. Reference the proposal sent, address common objections briefly, reinforce the ROI, and create light urgency with a specific ask (e.g., 15-min call to answer questions).`,
  }

  return typeInstructions[type]
}

function buildUserPrompt(
  type: AiScriptType,
  dealInfo: {
    companyName?: string | null
    contactName?: string | null
    industry?: string | null
    value?: number | null
    notes?: string | null
  } | null,
  profile: {
    businessName?: string | null
    niche?: string | null
    idealClient?: string | null
    oneLiner?: string | null
  } | null,
  context?: string
): string {
  const lines: string[] = []

  if (profile?.businessName) lines.push(`My agency: ${profile.businessName}`)
  if (profile?.oneLiner) lines.push(`What we do: ${profile.oneLiner}`)
  if (profile?.niche) lines.push(`Our niche: ${profile.niche}`)
  if (profile?.idealClient) lines.push(`Ideal client: ${profile.idealClient}`)

  if (dealInfo) {
    if (dealInfo.companyName) lines.push(`Prospect company: ${dealInfo.companyName}`)
    if (dealInfo.contactName) lines.push(`Contact name: ${dealInfo.contactName}`)
    if (dealInfo.industry) lines.push(`Industry: ${dealInfo.industry}`)
    if (dealInfo.value && dealInfo.value > 0) lines.push(`Deal value: $${dealInfo.value.toLocaleString()}`)
    if (dealInfo.notes) lines.push(`Notes: ${dealInfo.notes}`)
  }

  if (context) lines.push(`Additional context: ${context}`)

  lines.push(`\nWrite the ${type.replace(/_/g, " ").toLowerCase()} now.`)

  return lines.join("\n")
}

function deriveTitleFromType(type: AiScriptType, companyName?: string | null): string {
  const typeLabels: Record<AiScriptType, string> = {
    COLD_EMAIL: "Cold Email",
    DISCOVERY_CALL: "Discovery Call Script",
    FOLLOW_UP: "Follow-Up Email",
    LINKEDIN_DM: "LinkedIn DM",
    PROPOSAL_FOLLOW_UP: "Proposal Follow-Up",
  }
  const label = typeLabels[type]
  const suffix = companyName ? ` — ${companyName}` : ""
  return `${label}${suffix}`
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  try {
    const body = await req.json()
    const parsed = generateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 })
    }

    const { type, dealId, context } = parsed.data

    // Fetch deal info and member profile in parallel
    const [dealInfo, memberProfile] = await Promise.all([
      dealId
        ? db.clientDeal.findFirst({
            where: { id: dealId, userId: dbUserId },
            select: {
              companyName: true,
              contactName: true,
              industry: true,
              value: true,
              notes: true,
            },
          })
        : Promise.resolve(null),
      db.memberProfile.findUnique({
        where: { userId: dbUserId },
        select: {
          businessName: true,
          niche: true,
          idealClient: true,
          oneLiner: true,
        },
      }),
    ])

    if (dealId && !dealInfo) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    const systemPrompt = buildSystemPrompt(type)
    const userPrompt = buildUserPrompt(type, dealInfo, memberProfile, context)

    const result = await analyzeWithClaude({
      prompt: userPrompt,
      systemPrompt,
      model: "claude-haiku-4-5-20251001",
      maxTokens: 800,
      serviceArm: "ai-script-builder",
      clientId: dbUserId,
    })

    // Track usage non-blocking
    trackUsage(dbUserId, "ai_chat", {
      scriptType: type,
      dealId: dealId ?? null,
    }).catch(() => {})

    const title = deriveTitleFromType(type, dealInfo?.companyName)

    return NextResponse.json({ title, content: result.text })
  } catch (err) {
    logger.error("AI script generation failed", err, { userId })
    return NextResponse.json({ error: "Failed to generate script" }, { status: 500 })
  }
}
