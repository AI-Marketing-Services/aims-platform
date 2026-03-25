import { anthropic } from "@ai-sdk/anthropic"
import { streamText, convertToModelMessages } from "ai"
import { chatRatelimit, getIp } from "@/lib/ratelimit"
import { logApiCost, estimateAnthropicCost } from "@/lib/ai"
import { upsertChatSession } from "@/lib/db/chat-sessions"

export const maxDuration = 30

const MAX_MESSAGES = 15
const MAX_MESSAGE_LENGTH = 1000

const INTAKE_SYSTEM_PROMPT = `You are the AIMS intake specialist - a sharp, curious conversationalist who helps visitors figure out if AIMS can solve their problems.

YOUR GOAL:
Qualify inbound visitors by understanding their business, pain points, and goals. When the conversation is going well, collect their name and email so the team can follow up.

CONVERSATION FLOW:
1. Start by asking what brought them here - what's not working in their business?
2. Ask about their company: industry, team size, current tools, revenue range
3. Dig into specific pain points: where are they losing time, money, or deals?
4. When you understand their situation, introduce the relevant AIMS offering:
   - **Wild Ducks** - Forward-deployed AI engineers embedded in your team. They build custom AI workflows, automations, and tools tailored to your business. Best for companies that need hands-on AI implementation, not just advice.
   - **Money Page** - Revenue intelligence that turns your website, CRM, and ad data into actionable insights. Identifies which pages, campaigns, and touchpoints actually drive revenue. Best for companies spending on marketing but unsure what's working.
   - **Steel Trap** - Sales data architecture that captures, enriches, and organizes every lead and customer interaction. Eliminates data silos, fixes broken CRM workflows, and gives your sales team a single source of truth. Best for companies with messy pipelines and lost leads.
5. Only introduce services that match their pain points - never dump all three
6. When the visitor seems engaged, say something like "Happy to have someone from the team reach out - what's the best name and email?"

BEHAVIOR:
- Keep every response to 2-3 sentences max
- Ask one question at a time
- Be direct and conversational, not corporate
- Never push or hard-sell - just ask smart questions
- If someone asks pricing, say it depends on scope and offer to connect them with the team
- If someone asks a technical question you can't answer, acknowledge it and offer to connect them with an engineer
- Do not use emojis
- Do not use bullet points in chat messages - write in natural sentences`

export async function POST(req: Request) {
  // Rate limit by IP: 20 requests per minute
  if (chatRatelimit) {
    const ip = getIp(req)
    const { success } = await chatRatelimit.limit(`intake-chat:${ip}`)
    if (!success) return Response.json({ error: "Too many requests. Please slow down." }, { status: 429 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "AI not configured" }, { status: 503 })
  }

  let rawMessages: unknown
  let sessionId: string | undefined
  let email: string | undefined
  try {
    const body = await req.json()
    rawMessages = body?.messages
    sessionId = typeof body?.sessionId === "string" ? body.sessionId : undefined
    email = typeof body?.email === "string" ? body.email : undefined
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
      source: "intake",
      email,
      messages: rawMessages,
    })
  }

  const uiMessages = rawMessages
    .slice(-MAX_MESSAGES)
    .filter((m: unknown) => typeof m === "object" && m !== null)

  // Drop leading assistant messages (client-side welcome greeting) — Anthropic requires first message to be user role
  const firstUserIdx = uiMessages.findIndex((m) => (m as Record<string, unknown>).role === "user")
  const trimmedMessages = firstUserIdx >= 0 ? uiMessages.slice(firstUserIdx) : uiMessages

  const messages = await convertToModelMessages(trimmedMessages as Parameters<typeof convertToModelMessages>[0])

  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: INTAKE_SYSTEM_PROMPT,
    messages,
    maxOutputTokens: 256,
    onFinish: async ({ usage }) => {
      const model = "claude-haiku-4-5-20251001"
      const inputTokens = usage?.inputTokens ?? 0
      const outputTokens = usage?.outputTokens ?? 0
      await logApiCost({
        provider: "anthropic",
        model,
        endpoint: "intake-chat",
        tokens: inputTokens + outputTokens,
        cost: estimateAnthropicCost(model, inputTokens, outputTokens),
        serviceArm: "marketing-intake",
        metadata: { inputTokens, outputTokens },
      })
    },
  })

  return result.toTextStreamResponse()
}
