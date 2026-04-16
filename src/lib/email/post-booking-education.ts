import {
  sendTrackedEmail,
  escapeHtml,
  emailLayout,
  h1,
  p,
  btn,
  divider,
} from "./index"
import { buildAIPlaybookPDF } from "@/lib/pdf/ai-playbook"

const FROM_EMAIL = "AI Operator Collective <irtaza@modern-amenities.com>"
const REPLY_TO = "irtaza@modern-amenities.com"

export interface EmailContent {
  subject: string
  html: string
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://aioperatorcollective.com"
}

function playCard(num: string, title: string, body: string): string {
  return `
    <div style="border-left:3px solid #981B1B;padding:14px 18px;margin:0 0 14px;background:#F9FAFB;border-radius:0 6px 6px 0;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#981B1B;text-transform:uppercase;letter-spacing:0.08em;">${num}</p>
      <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111827;">${title}</p>
      <p style="margin:0;font-size:13px;color:#4B5563;line-height:1.65;">${body}</p>
    </div>
  `
}

/* -------------------------------------------------------------------------- */
/*  Day 0 — sent IMMEDIATELY after booking via Calendly webhook               */
/*          (has PDF attached; skips the queue)                                */
/* -------------------------------------------------------------------------- */

export async function sendPostBookingConfirmationEmail(params: {
  to: string
  name: string
  eventStartTime?: string | null
  meetingUrl?: string | null
  rescheduleUrl?: string | null
  cancelUrl?: string | null
}) {
  const safeName = escapeHtml(params.name || "").trim()
  const firstName = safeName.split(" ")[0] || "there"

  const whenLine = params.eventStartTime
    ? `Your call is confirmed for <strong style="color:#111827;">${new Date(params.eventStartTime).toLocaleString("en-US", { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" })}</strong>.`
    : "Your call is confirmed. Check your inbox for the Calendly confirmation with the exact time."

  const nextStepsUrl = `${appUrl()}/apply/next-steps?email=${encodeURIComponent(params.to)}`

  let pdfBuffer: Buffer | null = null
  try {
    pdfBuffer = await buildAIPlaybookPDF()
  } catch {
    pdfBuffer = null
  }

  const body = `
    ${h1(`${firstName}, your call is confirmed.`)}
    ${p(whenLine)}
    ${p("Three things to do before we talk:")}

    ${playCard(
      "1.",
      "RSVP + add it to your calendar right now.",
      "Tap the calendar invite Calendly just sent you. If you're on mobile, make sure it's saved to your primary calendar — not a secondary one that no one checks. If you need to reschedule, use the link below."
    )}
    ${playCard(
      "2.",
      "Read the AI Operator Playbook (attached).",
      "This is the same playbook we use inside the AIMS portfolio. Read it before the call so we can go deep instead of covering basics. Five chapters, ~15 minutes start to finish."
    )}
    ${playCard(
      "3.",
      "Open the next-steps page.",
      "We put together a page with case studies, AI use cases by industry, and the exact tools operators in our community are using right now. It's the fastest way to see what's possible before we talk."
    )}

    ${btn(nextStepsUrl, "Open Next Steps")}

    ${divider()}

    <p style="margin:0 0 8px;font-size:13px;color:#4B5563;line-height:1.6;">
      <strong style="color:#111827;">Need to reschedule?</strong>
      ${params.rescheduleUrl ? `<a href="${params.rescheduleUrl}" style="color:#981B1B;">Pick a different time</a>` : "Reply to this email and we'll find a better time."}
    </p>
    ${
      params.meetingUrl
        ? `<p style="margin:0 0 8px;font-size:13px;color:#4B5563;line-height:1.6;"><strong style="color:#111827;">Meeting link:</strong> <a href="${params.meetingUrl}" style="color:#981B1B;">${params.meetingUrl}</a></p>`
        : ""
    }

    <p style="margin:24px 0 0;font-size:11px;color:#9CA3AF;line-height:1.55;font-style:italic;">
      Over the next few days we'll send you a short series with real case studies, the AI tools our operators swear by, and the prompts that free up the most hours each week. Reply "stop" anytime and we'll close the loop.
    </p>
  `

  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `${firstName}, your AI Operator call is confirmed — playbook attached`,
    html: emailLayout(
      body,
      "RSVP, skim the playbook, open the next-steps page before we talk."
    ),
    attachments: pdfBuffer
      ? [
          {
            filename: "AI-Operator-Playbook.pdf",
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ]
      : undefined,
    serviceArm: "ai-operator-collective",
  })
}

/* -------------------------------------------------------------------------- */
/*  Days 1–3 + Meeting Morning — routed through the shared email queue         */
/* -------------------------------------------------------------------------- */

export function buildPostBookingEducationEmail(
  emailIndex: number,
  metadata: Record<string, unknown>
): EmailContent | null {
  const name = (metadata.name as string) || "there"
  const firstName = escapeHtml(name).split(" ")[0] || "there"
  const nextStepsUrl = `${appUrl()}/apply/next-steps`

  if (emailIndex === 0) {
    // Day 1 — Case study
    return {
      subject: "How Taylor went from W-2 to $18K/mo in 90 days",
      html: `
        ${h1(`${firstName}, here's a W-2 to $18K/mo case study.`)}
        ${p("Taylor was a senior marketing manager at a mid-size SaaS. She'd been reading AI threads on LinkedIn for 18 months without actually <em>doing</em> anything. Sound familiar?")}
        ${p("Here's what changed once she joined the Collective:")}

        ${playCard("Week 1", "Picked her lane and stopped hedging.", "She picked one ICP — SaaS marketing leaders at companies with 20–200 employees. Not \"small businesses.\" Not \"anyone who needs marketing.\" One specific buyer she actually understood.")}
        ${playCard("Week 2–3", "Built the offer in one sentence, then in one proposal.", "\"I help Series A/B SaaS marketing teams replace their entire content production pipeline with an AI-managed system.\" That sentence is her entire marketing.")}
        ${playCard("Week 4", "Closed her first client using an AIMS playbook verbatim.", "She used our discovery script (it's in the Vault Chapter 3) and the pricing-in-ranges move. $4K/mo retainer, signed within 2 weeks of the first call.")}
        ${playCard("Month 2–3", "Scaled to $18K MRR with 4 clients.", "Same playbook, just run four more times. She didn't invent anything — she executed what other operators in the Collective had already proven.")}

        ${p("Your call with us is where we figure out which of these moves fits your current position. Don't overthink prep — just read the playbook.")}

        ${btn(nextStepsUrl, "See more case studies")}
      `,
    }
  }

  if (emailIndex === 1) {
    // Day 2 — AI tools
    return {
      subject: "The 10 AI tools every operator in the Collective is using",
      html: `
        ${h1(`${firstName}, here's the operator stack.`)}
        ${p("This is the actual tool stack the top operators in the AIMS portfolio run. Not theoretical. Not \"what's trending.\" The 10 tools that most operators have paid for in the last 90 days.")}

        ${playCard("01", "Clay", "Enrichment + outbound. The single highest-leverage tool in the outbound stack. Waterfall enrichment means your list is actually deliverable; Claygent means your personalization is specific, not generic.")}
        ${playCard("02", "Cursive", "AI meeting copilot that writes your follow-ups instantly. Turns a 30-min discovery into a rev-ready follow-up email before the prospect closes their laptop.")}
        ${playCard("03", "Instantly.ai", "Cold email platform with unlimited sending accounts. If you're running outbound and not on Instantly or Smartlead, you're leaving meetings on the table.")}
        ${playCard("04", "N8N", "Self-hostable workflow builder. Beats Zapier at scale because you own the instance and can run long-running jobs without per-step pricing.")}
        ${playCard("05", "Firecrawl", "Web scraping API that returns clean Markdown for LLMs. Every research workflow starts here — feed it a URL, get an agent-ready doc.")}
        ${playCard("06", "Tavily", "AI-optimized search API. Built for agents. When you need an LLM to do research, Tavily is the tool you pipe in.")}
        ${playCard("07", "Linear", "Issue tracker for operators who treat their business like a product. Nothing else has this much signal per click.")}
        ${playCard("08", "Claude Code", "The coding agent that ships features while you're asleep. Most operators underestimate this until they see what a good plan + a solid agent loop can produce overnight.")}
        ${playCard("09", "Anthropic Claude", "Primary reasoning model. Better than GPT for writing, analysis, and long-context work. Every member of the Collective has the Max plan.")}
        ${playCard("10", "Notion + Notion AI", "Where the playbooks live. Internal knowledge base + AI that can actually retrieve and compose from your own docs.")}

        ${p("The full 195-tool stack library (with scorecards) is on the next-steps page. Full transparency: we maintain it because we actually use it.")}

        ${btn(nextStepsUrl, "Open the tool library")}
      `,
    }
  }

  if (emailIndex === 2) {
    // Day 3 — Prompts
    return {
      subject: "5 prompts that save Collective operators 10+ hours/week",
      html: `
        ${h1(`${firstName}, steal these 5 prompts.`)}
        ${p("These are the prompts that members of the Collective paste into Claude or ChatGPT multiple times a day. You can steal them directly — they're designed to be copy-pasted, not admired.")}

        ${playCard(
          "Prompt 1",
          "Discovery call synthesizer",
          "<em>Paste the transcript. Pull out: (1) the real pain (not the stated pain), (2) the exact words the prospect used for success, (3) the 3 objections most likely to come up, (4) a proposed scope + price range based on the pain size. Return as sections.</em>"
        )}
        ${playCard(
          "Prompt 2",
          "ICP list cleaner",
          "<em>I'm going to paste a list of 200 companies. Score each 1–10 on fit based on this ICP: [paste ICP]. For anything scored 7+, write a one-line \"why they fit\" I can drop into a cold email. Return as CSV: company, score, why.</em>"
        )}
        ${playCard(
          "Prompt 3",
          "Offer-in-one-sentence stress test",
          "<em>Here's my current offer: [paste]. Act as a skeptical buyer in my ICP. Give me the 5 questions this offer fails to answer, the 3 competitors they'd immediately mentally compare to, and a rewritten version that's 40% more specific without adding length.</em>"
        )}
        ${playCard(
          "Prompt 4",
          "Proposal → SOW converter",
          "<em>Turn this proposal into a tight SOW a mid-market buyer would actually sign. Scope, deliverables, timeline, out-of-scope items, and payment terms in that order. Max 1 page. No filler.</em>"
        )}
        ${playCard(
          "Prompt 5",
          "LinkedIn post from operator note",
          "<em>Here's a raw ops note: [paste]. Turn it into a LinkedIn post in my voice: opinion up top, one specific example in the middle, one contrarian line to close. No hashtags. No \"here's why\" phrases.</em>"
        )}

        ${p("On our call we'll go through which of these maps to your actual work. See you soon.")}

        ${btn(nextStepsUrl, "Open the prompt library")}
      `,
    }
  }

  if (emailIndex === 3) {
    // Meeting morning — final reminder
    return {
      subject: `${firstName}, your AI Operator call is today`,
      html: `
        ${h1("Today's the day.")}
        ${p("Quick reminder — we're on today. Two things to have ready:")}

        ${playCard("1.", "The playbook PDF.", "Open it once before the call so the terminology lands — ICP sentence, one-paragraph offer, pricing-in-ranges. 10 minutes of skim is enough.")}
        ${playCard("2.", "One specific blocker.", "The biggest outcome of this call is you leaving with a next move. Come with one concrete thing you're stuck on — we'll unblock it live instead of doing a generic Q&A.")}

        ${p("If something comes up and you need to reschedule, hit the link in your Calendly confirmation — no hard feelings. Otherwise, see you soon.")}

        ${btn(nextStepsUrl, "Review the next-steps page")}
      `,
    }
  }

  return null
}

/* -------------------------------------------------------------------------- */
/*  Sequence definition for EMAIL_SEQUENCES / queueEmailSequence              */
/* -------------------------------------------------------------------------- */

export const POST_BOOKING_EDUCATION_SEQUENCE = {
  name: "Post-Booking Education (AOC)",
  emails: [
    { delay: 1, subject: "How a W-2 pro went to $18K/mo in 90 days", templateKey: "aoc-day-1-case-study" },
    { delay: 2, subject: "The 10 AI tools every operator is using", templateKey: "aoc-day-2-tools" },
    { delay: 3, subject: "5 prompts that save operators 10+ hours/week", templateKey: "aoc-day-3-prompts" },
    { delay: 5, subject: "Your AI Operator call is today", templateKey: "aoc-meeting-morning" },
  ],
} as const
