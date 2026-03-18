import { createGoogleGenerativeAI } from "@ai-sdk/google"

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY ?? "" })
import { streamText, tool } from "ai"
import { z } from "zod"
import { db } from "@/lib/db"
import { notifyNewLead } from "@/lib/notifications"
import { chatRatelimit, getIp } from "@/lib/ratelimit"
import { logApiCost } from "@/lib/ai"

export const maxDuration = 30

// Max messages per request and max content length to prevent token exhaustion
const MAX_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 2000

const AIMS_SYSTEM_PROMPT = `You are the AI assistant for AIMS (AI Managing Services). You help visitors understand our services and find the right solution for their business.

ABOUT AIMS:
AIMS is an AI-powered lead generation and business automation partner. We build and run outbound campaigns, AI calling systems, lead reactivation programs, SEO/AEO, websites, and operational tools. We serve B2B businesses, vending operators, car dealerships, home services, SaaS companies, and local businesses.

OUR SERVICES:

MARKETING PILLAR:
- Website + CRM + Chatbot ($97-$397/mo): GHL-powered website with CRM pipeline, booking calendar, and AI chatbot. Tiers: Starter ($97), Growth ($197), Pro ($297), Elite ($397).
- SEO & AEO Automation: Search engine + AI answer engine optimization. Technical audits, content pipeline, monthly reporting.
- Content Production Pod: AI-generated blog posts, social content, email copy.

SALES PILLAR:
- Cold Outbound Engine: Multi-domain email infrastructure with Clay enrichment, AI SDR sequences, reply handling.
- AI Voice Agent Platform: Inbound and outbound AI calling. Answers in under 60 seconds. Multi-location routing.
- Audience Targeting: 20,000+ prebuilt audience segments with semantic search.
- Pixel & Visitor Intelligence (beta): Website pixel that identifies visitors and triggers outbound sequences.
- Lead Reactivation: AI-powered campaigns that turn dead CRM leads into booked meetings.

OPERATIONS PILLAR:
- AI Tool Tracker: Research platform for evaluating AI tools with company-specific scorecards.
- RevOps Pipeline: Full CRM implementation with dashboards and attribution tracking.

FINANCE PILLAR:
- P&L Finance Automation ($1,000-$2,500/quarter): QuickBooks integration with AI-generated quarterly analysis.

KEY DIFFERENTIATORS:
- Battle-tested on our own portfolio companies generating $700K-$1M/month before offering to clients
- Most clients see qualified meetings within 2-4 weeks of launch
- Full-service: We handle everything, you show up to meetings
- AI-powered 24/7 coverage at a fraction of human team cost
- No long-term contracts required

QUALIFICATION BEHAVIOR:
1. Greet warmly. Ask what kind of business they run and what their biggest growth challenge is.
2. Based on their answer, recommend 1-2 specific AIMS services with pricing.
3. Ask qualifying questions: How many locations? Current monthly marketing spend? Main lead source today?
4. If they seem qualified (B2B, has budget, clear pain point), suggest booking a strategy call.
5. Always try to capture their name and email before the conversation ends. Frame it as "I'll send you a personalized recommendation."
6. If they mention vending or are a Vendingpreneur, highlight the Website+CRM package ($97/mo) and the Vending Placement Visualizer.
7. Never be pushy. Be helpful and informative. Let the value sell itself.
8. For custom service pricing (outbound, voice agents), say "Pricing depends on your setup — most engagements start with a free strategy call where we scope the right package."
9. Keep responses concise and conversational. Use line breaks. Avoid walls of text.
10. When you capture name and email, immediately use the capture_lead tool.`

export async function POST(req: Request) {
  // Rate limit public chat: 20 requests per minute per IP
  if (chatRatelimit) {
    const { success } = await chatRatelimit.limit(getIp(req))
    if (!success) return Response.json({ error: "Too many requests. Please slow down." }, { status: 429 })
  }

  if (!process.env.GEMINI_API_KEY) {
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

  // Clamp to last MAX_MESSAGES and truncate each content to MAX_MESSAGE_LENGTH
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = rawMessages
    .slice(-MAX_MESSAGES)
    .filter((m: unknown) => typeof m === "object" && m !== null)
    .map((m: unknown) => {
      const msg = m as Record<string, unknown>
      const content = typeof msg.content === "string"
        ? msg.content.slice(0, MAX_MESSAGE_LENGTH)
        : msg.content
      return { ...msg, content }
    })

  const result = streamText({
    model: google("gemini-2.0-flash-001"),
    system: AIMS_SYSTEM_PROMPT,
    messages,
    maxOutputTokens: 512,
    onFinish: async ({ usage }) => {
      const inputTokens = usage?.inputTokens ?? 0
      const outputTokens = usage?.outputTokens ?? 0
      await logApiCost({
        provider: "google",
        model: "gemini-2.0-flash-001",
        endpoint: "public-chat",
        tokens: inputTokens + outputTokens,
        cost: (inputTokens * 0.075 + outputTokens * 0.3) / 1_000_000,
        serviceArm: "website-chatbot",
        metadata: { inputTokens, outputTokens },
      }).catch(() => {})
    },
    tools: {
      capture_lead: tool({
        description: "Save a qualified lead to the AIMS CRM. Use when the visitor provides their name and email.",
        inputSchema: z.object({
          name: z.string().describe("Visitor's full name"),
          email: z.string().email().describe("Visitor's email address"),
          company: z.string().optional().describe("Company name if provided"),
          industry: z.string().optional().describe("Industry or business type"),
          challenge: z.string().optional().describe("Their main business challenge"),
          recommended_services: z.array(z.string()).optional().describe("Services you recommended"),
          qualification_score: z.number().min(1).max(10).optional().describe("How qualified 1-10"),
        }),
        execute: async (input) => {
          try {
            const deal = await db.deal.create({
              data: {
                contactName: input.name,
                contactEmail: input.email,
                company: input.company,
                industry: input.industry,
                source: "ai-chatbot",
                sourceDetail: [
                  input.recommended_services?.length ? `Recommended: ${input.recommended_services.join(", ")}` : null,
                  input.challenge ? `Challenge: ${input.challenge}` : null,
                  input.qualification_score ? `Score: ${input.qualification_score}/10` : null,
                ].filter(Boolean).join(". ") || null,
                channelTag: "website-chatbot",
                leadScore: input.qualification_score ? input.qualification_score * 10 : null,
                leadScoreTier: input.qualification_score
                  ? input.qualification_score >= 7 ? "hot" : input.qualification_score >= 4 ? "warm" : "cold"
                  : null,
              },
            })

            await notifyNewLead({
              contactName: input.name,
              contactEmail: input.email,
              company: input.company,
              source: "ai-chatbot",
              channelTag: "website-chatbot",
            }).catch((err) => console.error("Chatbot lead notification failed:", err))

            return { success: true, dealId: deal.id, message: `Lead saved. I'll have the team follow up with ${input.name} at ${input.email}.` }
          } catch (err) {
            console.error("Chatbot capture_lead tool failed:", err)
            return { success: false, message: "I'll make sure the team reaches out to you." }
          }
        },
      }),

      get_booking_link: tool({
        description: "Direct the visitor to book a strategy call when they're ready to move forward",
        inputSchema: z.object({
          service: z.string().optional().describe("Service slug the visitor is interested in"),
        }),
        execute: async (input) => {
          const url = input.service
            ? `/get-started?service=${input.service}&ref=chatbot`
            : `/get-started?ref=chatbot`
          return { url, message: "You can book your free strategy call here." }
        },
      }),
    },
  })

  return result.toTextStreamResponse()
}
