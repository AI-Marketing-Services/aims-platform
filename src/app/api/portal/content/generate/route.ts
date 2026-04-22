import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { analyzeWithClaude } from "@/lib/ai"
import { trackUsage } from "@/lib/usage"
import { ContentPieceType } from "@prisma/client"

const generateSchema = z.object({
  type: z.nativeEnum(ContentPieceType),
  dealId: z.string().optional(),
  context: z.string().max(2000).optional(),
})

async function getDbUserId(clerkId: string) {
  const u = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  return u?.id ?? null
}

interface DealInfo {
  companyName: string
  industry: string | null
  value: number
  notes: string | null
  stage: string
  wonAt: Date | null
}

interface MemberProfileInfo {
  businessName: string | null
  niche: string | null
  oneLiner: string | null
  idealClient: string | null
}

function buildSystemPrompt(
  type: ContentPieceType,
  operatorName: string,
  industry: string | null
): string {
  const clientIndustry = industry ?? "their industry"
  const operator = operatorName

  const prompts: Record<ContentPieceType, string> = {
    LINKEDIN_POST: `You are an expert B2B content strategist. Write a LinkedIn post (200-300 words) about ${operator} delivering measurable results for a client in ${clientIndustry}. The tone should be professional, specific, and story-driven — not generic. Include a compelling hook, the transformation delivered, and end with a thought-provoking question or insight. No hashtag spam. Return ONLY the post text with no preamble.`,

    CASE_STUDY: `You are an expert B2B copywriter. Write a detailed client case study (400-600 words) for ${operator}'s work in the ${clientIndustry} industry. Structure it exactly as:\n\n**Challenge**\n[2-3 sentences describing the client's problem before working with ${operator}]\n\n**Solution**\n[3-4 sentences on what ${operator} implemented and how]\n\n**Results**\n[3-5 bullet points with specific, measurable outcomes where possible]\n\n**Client Takeaway**\n[1-2 sentences of forward-looking impact]\n\nReturn ONLY the case study with no preamble.`,

    EMAIL_SEQUENCE: `You are an expert email copywriter. Write a 3-email nurture sequence for ${operator}'s AI services targeting clients in ${clientIndustry}. Format each email as:\n\n---\nEMAIL 1 — [Subject line]\n[Body, 100-150 words]\n\nEMAIL 2 — [Subject line]\n[Body, 100-150 words, sent 3 days later]\n\nEMAIL 3 — [Subject line]\n[Body, 100-150 words, sent 5 days later]\n---\n\nFocus on value education, objection handling, and a final CTA. Return ONLY the sequence with no preamble.`,

    TESTIMONIAL: `You are an expert customer success specialist. Write a professional testimonial request email that ${operator} can send to a happy client in ${clientIndustry}. The email should: be warm and specific (not generic), reference the successful outcome achieved, make it easy to respond with 2-3 guiding questions the client can answer, and offer to draft the testimonial for them if needed. Keep it under 200 words. Return ONLY the email text with no preamble.`,

    TWEET_THREAD: `You are an expert Twitter/X content strategist. Write a 5-tweet educational thread about ${operator}'s work helping a ${clientIndustry} client. Format it as:\n\n1/ [Hook tweet — compelling stat or counterintuitive insight, max 280 chars]\n\n2/ [Context / problem setup, max 280 chars]\n\n3/ [The solution approach, max 280 chars]\n\n4/ [The results / transformation, max 280 chars]\n\n5/ [Takeaway and CTA — follow for more + what to do next, max 280 chars]\n\nReturn ONLY the thread with no preamble.`,
  }

  return prompts[type]
}

function buildUserPrompt(
  type: ContentPieceType,
  dealInfo: DealInfo | null,
  profile: MemberProfileInfo | null,
  context?: string
): string {
  const lines: string[] = []

  if (profile?.businessName) lines.push(`Operator/Agency name: ${profile.businessName}`)
  if (profile?.oneLiner) lines.push(`What we do: ${profile.oneLiner}`)
  if (profile?.niche) lines.push(`Our niche: ${profile.niche}`)
  if (profile?.idealClient) lines.push(`Ideal client profile: ${profile.idealClient}`)

  if (dealInfo) {
    lines.push(`Client company: ${dealInfo.companyName}`)
    if (dealInfo.industry) lines.push(`Client industry: ${dealInfo.industry}`)
    if (dealInfo.value > 0) lines.push(`Deal value: $${dealInfo.value.toLocaleString()}`)
    if (dealInfo.stage) lines.push(`Deal stage: ${dealInfo.stage}`)
    if (dealInfo.wonAt) {
      const wonDate = dealInfo.wonAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      lines.push(`Won/closed: ${wonDate}`)
    }
    if (dealInfo.notes) lines.push(`Deal notes: ${dealInfo.notes}`)
  }

  if (context) lines.push(`Additional context: ${context}`)

  lines.push(`\nWrite the ${type.replace(/_/g, " ").toLowerCase()} now.`)

  return lines.join("\n")
}

function deriveTitle(
  type: ContentPieceType,
  companyName?: string | null,
  operatorName?: string | null
): string {
  const typeLabels: Record<ContentPieceType, string> = {
    LINKEDIN_POST: "LinkedIn Post",
    CASE_STUDY: "Case Study",
    EMAIL_SEQUENCE: "Email Sequence",
    TESTIMONIAL: "Testimonial Request",
    TWEET_THREAD: "Tweet Thread",
  }

  const label = typeLabels[type]
  if (companyName) return `${label} — ${companyName}`
  if (operatorName) return `${label} — ${operatorName}`
  return label
}

function getMaxTokens(type: ContentPieceType): number {
  const limits: Record<ContentPieceType, number> = {
    LINKEDIN_POST: 600,
    CASE_STUDY: 1200,
    EMAIL_SEQUENCE: 1200,
    TESTIMONIAL: 500,
    TWEET_THREAD: 700,
  }
  return limits[type]
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

    const [dealInfo, memberProfile] = await Promise.all([
      dealId
        ? db.clientDeal.findFirst({
            where: {
              id: dealId,
              userId: dbUserId,
              stage: { in: ["COMPLETED", "ACTIVE_RETAINER"] },
            },
            select: {
              companyName: true,
              industry: true,
              value: true,
              notes: true,
              stage: true,
              wonAt: true,
            },
          })
        : Promise.resolve(null),
      db.memberProfile.findUnique({
        where: { userId: dbUserId },
        select: {
          businessName: true,
          niche: true,
          oneLiner: true,
          idealClient: true,
        },
      }),
    ])

    if (dealId && !dealInfo) {
      return NextResponse.json(
        { error: "Deal not found or is not in a completed/active state" },
        { status: 404 }
      )
    }

    const operatorName = memberProfile?.businessName ?? "our agency"
    const industry = dealInfo?.industry ?? null

    const systemPrompt = buildSystemPrompt(type, operatorName, industry)
    const userPrompt = buildUserPrompt(type, dealInfo ?? null, memberProfile ?? null, context)

    const result = await analyzeWithClaude({
      prompt: userPrompt,
      systemPrompt,
      model: "claude-haiku-4-5-20251001",
      maxTokens: getMaxTokens(type),
      serviceArm: "content-engine",
      clientId: dbUserId,
    })

    trackUsage(dbUserId, "ai_chat", {
      contentType: type,
      dealId: dealId ?? null,
    }).catch(() => {})

    const title = deriveTitle(type, dealInfo?.companyName, memberProfile?.businessName)

    return NextResponse.json({ title, content: result.text })
  } catch (err) {
    logger.error("AI content generation failed", err, { userId })
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 })
  }
}
