import { anthropic } from "@ai-sdk/anthropic"
import { streamText, tool, convertToModelMessages } from "ai"
import { z } from "zod"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { chatRatelimit, getIp } from "@/lib/ratelimit"
import { logApiCost, estimateAnthropicCost } from "@/lib/ai"
import { AIMS_KNOWLEDGE_BASE } from "@/lib/ai/knowledge-base"

export const maxDuration = 30

const MAX_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 2000

const PORTAL_SYSTEM_PROMPT = `You are the AIMS Client Support Assistant. You help existing AIMS clients with their services, billing, and account questions.

CAPABILITIES:
- Explain what each service includes, how it works, and what it costs - use the knowledge base below for accurate details
- Help with billing questions (direct to /portal/billing for payment changes)
- Recommend additional services based on what they already have
- Create support tickets for issues you can't resolve
- Explain the onboarding process and next steps
- Answer questions about campaign performance, setup timelines, and deliverables

UPSELL AWARENESS (only when relevant, never pushy):
- Has Website+CRM → "Now that you have the site capturing leads, Cold Outbound fills the top of funnel"
- Has Cold Outbound → "Voice Agents following up calls + emails closes 3x more deals"
- Has Voice Agents → "Audience Targeting lets you know WHO to call before they raise their hand"
- Has SEO → "Content Production gives you 4x the content output with half the team time"
- Has Pixel Intelligence → "Audience Targeting turns that visitor data into high-converting ad campaigns"
- Has AI Content Engine → "AI Reputation Engine amplifies that content by generating reviews and managing your brand presence"
- Has Lead Reactivation → "RevOps Pipeline keeps those reactivated leads organized and moving through your funnel"

BEHAVIOR:
- Be warm, professional, and direct
- If you can't resolve something, use the create_ticket tool
- Always direct billing changes to /portal/billing
- Keep responses concise
- When a client asks about a service they already have, reference their active subscription and tier
- When a client asks about a new service, recommend based on synergy with their current services
- Use exact pricing from the knowledge base - never guess at prices
- Direct clients to /portal/marketplace to browse and purchase new services

${AIMS_KNOWLEDGE_BASE}`

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limit per authenticated user: 30 requests per minute
  if (chatRatelimit) {
    const { success } = await chatRatelimit.limit(`portal-chat:${userId}`)
    if (!success) return Response.json({ error: "Too many requests. Please slow down." }, { status: 429 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "AI not configured" }, { status: 503 })
  }

  let rawMessages: unknown
  try {
    const body = await req.json()
    rawMessages = body?.messages
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!Array.isArray(rawMessages)) {
    return Response.json({ error: "messages must be an array" }, { status: 400 })
  }


  const uiMessages = rawMessages
    .slice(-MAX_MESSAGES)
    .filter((m: unknown) => typeof m === "object" && m !== null)

  const messages = await convertToModelMessages(uiMessages as Parameters<typeof convertToModelMessages>[0])

  // Fetch client context
  let clientContext = ""
  try {
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          include: { serviceArm: true },
        },
        supportTickets: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    })

    if (user) {
      const serviceDetails = user.subscriptions.map(
        (s) => `- ${s.serviceArm.name} ($${s.monthlyAmount}/mo, ${s.tier ?? "standard"} tier)`
      )
      const mrr = user.subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0)
      const openTickets = user.supportTickets.filter((t) => t.status === "open")
      const ticketSummary = openTickets.length > 0
        ? `\nOpen tickets:\n${openTickets.map((t) => `- ${t.subject} (${t.priority})`).join("\n")}`
        : "\nNo open tickets."

      clientContext = `\n\nCLIENT CONTEXT:
Name: ${user.name || "Unknown"}
Active services (${user.subscriptions.length}):
${serviceDetails.length > 0 ? serviceDetails.join("\n") : "None yet - they haven't subscribed to any services."}
Total monthly spend: $${mrr}/mo
${ticketSummary}

IMPORTANT: If this client asks about a service they already have, acknowledge their active subscription and offer to help with it. If they ask about a service they don't have, suggest how it complements their existing services.`
    }
  } catch (err) {
    console.error("Failed to fetch portal chat client context:", err)
  }

  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: PORTAL_SYSTEM_PROMPT + clientContext,
    messages,
    maxOutputTokens: 512,
    tools: {
      create_ticket: tool({
        description: "Create a support ticket for issues the AI cannot resolve",
        inputSchema: z.object({
          subject: z.string(),
          message: z.string(),
          priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
        }),
        execute: async (input) => {
          try {
            const user = await db.user.findUnique({ where: { clerkId: userId } })
            if (user) {
              await db.supportTicket.create({
                data: {
                  userId: user.id,
                  subject: input.subject,
                  message: input.message,
                  priority: input.priority,
                },
              })
            }
            return { success: true, message: "Support ticket created. Our team will follow up within 24 hours." }
          } catch (err) {
            console.error("Portal chat create_ticket tool failed:", err)
            return { success: false, message: "Ticket creation failed. Please try /portal/support directly." }
          }
        },
      }),

      suggest_service: tool({
        description: "Suggest a complementary service when naturally relevant to the conversation",
        inputSchema: z.object({
          service_slug: z.string(),
          reason: z.string(),
        }),
        execute: async (input) => {
          return {
            message: `You can explore ${input.service_slug} at /portal/marketplace. ${input.reason}`,
          }
        },
      }),
    },
    onFinish: async ({ usage }) => {
      const model = "claude-haiku-4-5-20251001"
      const inputTokens = usage?.inputTokens ?? 0
      const outputTokens = usage?.outputTokens ?? 0
      await logApiCost({
        provider: "anthropic",
        model,
        endpoint: "portal-chat",
        tokens: inputTokens + outputTokens,
        cost: estimateAnthropicCost(model, inputTokens, outputTokens),
        serviceArm: "portal-support",
        clientId: userId,
        metadata: { inputTokens, outputTokens },
      })
    },
  })

  return result.toTextStreamResponse()
}
