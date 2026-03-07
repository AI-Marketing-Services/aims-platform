import { anthropic } from "@ai-sdk/anthropic"
import { streamText, tool } from "ai"
import { z } from "zod"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export const maxDuration = 30

const PORTAL_SYSTEM_PROMPT = `You are the AIMS Client Support Assistant. You help existing AIMS clients with their services, billing, and account questions.

CAPABILITIES:
- Explain what each service includes and how it works
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

BEHAVIOR:
- Be warm, professional, and direct
- If you can't resolve something, use the create_ticket tool
- Always direct billing changes to /portal/billing
- Keep responses concise`

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "AI not configured" }, { status: 503 })
  }

  const { messages } = await req.json()

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
      const services = user.subscriptions.map((s) => s.serviceArm.name).join(", ")
      const mrr = user.subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0)
      clientContext = `\n\nCLIENT CONTEXT:\nName: ${user.name || "Unknown"}\nActive services: ${services || "None yet"}\nMonthly spend: $${mrr}/mo\nOpen tickets: ${user.supportTickets.filter((t) => t.status === "open").length}`
    }
  } catch {}

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
          } catch {
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
  })

  return result.toTextStreamResponse()
}
