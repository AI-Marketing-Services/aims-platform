import { anthropic } from "@ai-sdk/anthropic"
import { streamText, tool, convertToModelMessages } from "ai"
import { z } from "zod"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { chatRatelimit } from "@/lib/ratelimit"
import { logApiCost, estimateAnthropicCost } from "@/lib/ai"
import { PORTAL_CHAT_SYSTEM_PROMPT } from "@/lib/ai/portal-chat-prompt"
import { searchKnowledge } from "@/lib/knowledge"
import { upsertChatSession } from "@/lib/db/chat-sessions"
import { logger } from "@/lib/logger"

export const maxDuration = 30

const MAX_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 2000

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
  let sessionId: string | undefined
  try {
    const body = await req.json()
    rawMessages = body?.messages
    sessionId = typeof body?.sessionId === "string" ? body.sessionId : undefined
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!Array.isArray(rawMessages)) {
    return Response.json({ error: "messages must be an array" }, { status: 400 })
  }

  // Persist chat session (non-blocking)
  if (sessionId) {
    upsertChatSession({
      sessionId,
      source: "portal",
      clerkUserId: userId,
      messages: rawMessages,
    }).catch(() => {})
  }

  const uiMessages = rawMessages
    .slice(-MAX_MESSAGES)
    .filter((m: unknown) => typeof m === "object" && m !== null)

  for (const m of uiMessages) {
    const msg = m as Record<string, unknown>
    if (typeof msg.content === "string" && msg.content.length > MAX_MESSAGE_LENGTH) {
      msg.content = msg.content.slice(0, MAX_MESSAGE_LENGTH)
    }
  }

  // Drop leading assistant messages (client-side welcome greeting) — Anthropic requires first message to be user role
  const firstUserIdx = uiMessages.findIndex((m) => (m as Record<string, unknown>).role === "user")
  const trimmedMessages = firstUserIdx >= 0 ? uiMessages.slice(firstUserIdx) : uiMessages

  const messages = await convertToModelMessages(trimmedMessages as Parameters<typeof convertToModelMessages>[0])

  // Fetch the minimum context the assistant needs: who this member is,
  // what their open support tickets look like. No service/subscription
  // framing — services aren't open to members yet.
  let clientContext = ""
  try {
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: {
        name: true,
        email: true,
        supportTickets: {
          orderBy: { createdAt: "desc" },
          take: 3,
          select: { subject: true, priority: true, status: true },
        },
      },
    })

    if (user) {
      const openTickets = user.supportTickets.filter((t) => t.status === "open")
      const ticketSummary =
        openTickets.length > 0
          ? `\nOpen tickets:\n${openTickets.map((t) => `- ${t.subject} (${t.priority})`).join("\n")}`
          : "\nNo open tickets."

      clientContext = `\n\nMEMBER CONTEXT:
Name: ${user.name || "Unknown"}
Email: ${user.email}${ticketSummary}

Use the member's name naturally. Do not share or reference any other member's data.`
    }
  } catch (err) {
    logger.error("Failed to fetch portal chat member context:", err)
  }

  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: PORTAL_CHAT_SYSTEM_PROMPT + clientContext,
    messages,
    maxOutputTokens: 512,
    tools: {
      create_ticket: tool({
        description: "Create a support ticket for issues the AI cannot resolve. Always use this instead of asking the member to visit a URL when they need human help.",
        inputSchema: z.object({
          subject: z.string(),
          message: z.string(),
          priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
        }),
        execute: async (input) => {
          try {
            const user = await db.user.findUnique({ where: { clerkId: userId } })
            if (!user) {
              return { success: false, message: "Ticket creation failed — please try /portal/support directly." }
            }
            const ticket = await db.supportTicket.create({
              data: {
                userId: user.id,
                subject: input.subject,
                message: input.message,
                priority: input.priority,
              },
              select: { id: true },
            })
            // Ticket ids are cuids — show the last 6 chars so it's
            // human-friendly and still unique enough to reference.
            const shortId = ticket.id.slice(-6).toUpperCase()
            return {
              success: true,
              ticketId: ticket.id,
              shortId,
              message: `Support ticket opened: [#${shortId}](/portal/support). Our team will follow up within 24 hours.`,
            }
          } catch (err) {
            logger.error("Portal chat create_ticket tool failed:", err)
            return { success: false, message: "Ticket creation failed — please try /portal/support directly." }
          }
        },
      }),

      search_knowledge: tool({
        description: "Search the Mighty Networks knowledge base + community docs for a member question. Returns relevant links the assistant can cite. Call this BEFORE answering any question about content, calls, community resources, or 'where do I find X'.",
        inputSchema: z.object({
          query: z.string().describe("The member's question, in their own words"),
        }),
        execute: async (input) => {
          const result = await searchKnowledge(input.query)
          if (result.entries.length === 0) {
            return {
              found: false,
              message: "No indexed content matches yet. Answer from general community knowledge only, or create a ticket if the question is specific.",
            }
          }
          return {
            found: true,
            entries: result.entries.map((e) => ({
              title: e.title,
              url: e.url,
              snippet: e.snippet,
            })),
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
