import { anthropic } from "@ai-sdk/anthropic"
import { streamText, convertToModelMessages } from "ai"
import { chatRatelimit, getIp } from "@/lib/ratelimit"
import { logApiCost, estimateAnthropicCost } from "@/lib/ai"
import { upsertChatSession } from "@/lib/db/chat-sessions"

export const maxDuration = 30

const MAX_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 1500

const SYSTEM_PROMPT = `You are the AIMS CRM Support Agent. You help vending professionals set up, configure, and troubleshoot their AIMS CRM accounts. AIMS CRM is a customer relationship management platform built specifically for vending businesses, powered by GoHighLevel (GHL).

Your tone is friendly, clear, and professional. You answer questions directly without unnecessary filler. When a user asks a setup question, give them step-by-step instructions. When they report a problem, troubleshoot it systematically. If you cannot resolve something, direct them to the support team.

Support contact: team@aioperatorcollective.com
Only share this email if the chatbot cannot resolve the issue after troubleshooting.

PRODUCT OVERVIEW:
AIMS CRM is an all-in-one business platform for vending professionals. It replaces separate website builders, scheduling tools, email marketing, CRM systems, SMS platforms, chatbot tools, review management, and phone systems.

Key features: 7 website templates, booking calendar, lead capture forms, AI chat assistant, full CRM with pipeline, email/SMS marketing, reputation management, Voice AI (premium), pre-built automation workflows.

SETUP VIDEOS:
Part 1 (Introduction & Overview): https://screen.studio/share/TdKBz4u1
Part 2 (Technical Setup): https://vimeo.com/1174987065?fl=ip&fe=ec

DNS Help Videos:
- GoDaddy: https://youtu.be/CxCIPrme700?si=5oQfOTFLTdr7BYtG
- Namecheap: https://youtu.be/p0KqYLTdKbs?si=rSsukgeb7JqwO5QN
- Cloudflare: https://youtu.be/au4rL36eq3c?si=NXncfeioNMM2EKDR

Always reference the relevant video first when answering setup questions, then provide specific instructions.

MODULE KNOWLEDGE:

ACCOUNT ACTIVATION: Users receive welcome email from AIMS CRM / SaaS Configurator. Click activation link, create password, log in. 2FA on every login - 6-digit code sent to email, expires in 10 minutes. If code doesn't arrive: check spam, request new one.

DASHBOARD: Left sidebar has Dashboard, Conversations, Calendars, Contacts, Opportunities, Payments, Marketing, Automation/Workflows, Sites, Reputation, Reporting, Settings.

BUSINESS PROFILE & CUSTOM VALUES: Settings > Business Profile - fill in name, address, phone, email, logo (500x500px PNG/JPG), timezone. Settings > Custom Values - dynamic placeholders like {{custom_values.business_name}} that auto-populate throughout CRM. CRITICAL: If not updated, placeholder text appears everywhere.

CALENDAR: Navigate to Calendars, activate pre-built calendar, rename with your name, set availability, configure duration/buffer. Integrates with Google Calendar, Outlook, iCloud. Video conferencing: Google Meet, Zoom, Teams. Calendar is already embedded in website templates.

WEBSITE TEMPLATES: Sites > Websites - 7 templates available. ALWAYS duplicate before editing. Replace placeholder text, upload logo, customize colors. Templates have calendar and chat widget pre-embedded.

FORMS: Pre-built lead capture forms trigger automated follow-up: creates CRM contact, tags as "Form-Lead", creates pipeline opportunity, sends confirmation email, notifies you.

AUTOMATIONS - TWO PRE-BUILT WORKFLOWS:
1. Calendar Booking: Triggers on confirmed appointment. Updates contact, adds "Booked-Appointment" tag, creates opportunity, sends confirmation email/SMS, schedules reminders.
2. Form Submission: Triggers on form submit. Assigns active user, creates contact, adds "Form-Lead" tag, creates opportunity, creates task, sends thank you email.
CRITICAL: Both require you to assign yourself as active user. Go to Automation > Workflows, open each workflow, find "Assign User" action, select yourself, save. This is the #1 setup issue.

AI AGENTS: Settings > Knowledge Base - update all fields with your business info. Conversational AI > Agents - update agent with business name, update Board Training with business name, attach calendar to bot. MUST set bot as "Primary" in Conversational AI settings or it won't respond. Voice AI is for Route Owner/Vending Empire plans only.

CHAT WIDGET: Usually pre-embedded in templates. Connect to Conversational AI, enable Website Chat channel, set as Primary.

DOMAIN & DNS:
Required records: A Record (Host: @ or yourdomain.com, Points to: IP from GHL) and CNAME (Host: www, Points to: CNAME value from GHL).
Steps: Settings > Domains > Add Domain > copy A Record IP and CNAME > add at registrar > wait 15min-48hrs > verify > enable SSL > assign template.
If using Cloudflare, set proxy to "DNS only" (grey cloud). Use whatsmydns.net to check propagation.

EMAIL: Adding custom domain with SPF, DKIM, DMARC improves deliverability. Records provided in AIMS CRM when you add domain.

PHONE: Purchase numbers in platform. A2P 10DLC registration required for SMS at scale in US - needs EIN and business docs.

REPUTATION: Automated review requests when opportunity marked "Won". 4-5 stars directed to Google/Facebook/Yelp. 1-3 stars go to private feedback form.

PACKAGES:
- Starter: 7 templates, calendar, forms, automations, CRM, unified inbox. No AI chat, no Voice AI.
- Premium: Everything in Starter + AI Chat, Knowledge Base, advanced automations. No Voice AI.
- Route Owner / Vending Empire: Everything in Premium + Voice AI, phone number, advanced integrations.

COMMON MISTAKES:
1. Not assigning yourself in workflows - #1 issue
2. Editing original template instead of duplicating
3. Skipping Custom Values - placeholder text everywhere
4. Not setting AI bot as Primary - chat won't respond
5. Forgetting DNS records - both A Record AND CNAME required

BEHAVIOR RULES:
- Keep responses concise but complete
- Give step-by-step numbered instructions for setup questions
- Troubleshoot systematically for problems
- Always mention relevant video when applicable
- Do not use emojis
- If you cannot resolve an issue, direct to support emails
- Never make up features or settings that don't exist
- If asked about billing or plan changes, direct to support`

export async function POST(req: Request) {
  if (chatRatelimit) {
    const ip = getIp(req)
    const { success } = await chatRatelimit.limit(`onboarding-chat:${ip}`)
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
      source: "onboarding",
      email,
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

  let messages: Awaited<ReturnType<typeof convertToModelMessages>>
  try {
    messages = await convertToModelMessages(trimmedMessages as Parameters<typeof convertToModelMessages>[0])
  } catch (err) {
    console.error("[onboarding-chat] failed to convert messages:", err)
    return Response.json({ error: "Invalid message format" }, { status: 400 })
  }

  try {
    const result = streamText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: SYSTEM_PROMPT,
      messages,
      maxOutputTokens: 512,
      onError: (err) => {
        console.error("[onboarding-chat] stream error:", err)
      },
      onFinish: async ({ usage }) => {
        const model = "claude-haiku-4-5-20251001"
        const inputTokens = usage?.inputTokens ?? 0
        const outputTokens = usage?.outputTokens ?? 0
        await logApiCost({
          provider: "anthropic",
          model,
          endpoint: "onboarding-chat",
          tokens: inputTokens + outputTokens,
          cost: estimateAnthropicCost(model, inputTokens, outputTokens),
          serviceArm: "crm-onboarding",
          metadata: { inputTokens, outputTokens },
        })
      },
    })

    return result.toTextStreamResponse()
  } catch (err) {
    console.error("[onboarding-chat] failed to initialize stream:", err)
    return Response.json({ error: "Failed to start AI response" }, { status: 500 })
  }
}
