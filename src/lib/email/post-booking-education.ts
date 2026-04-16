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
import { AOC_FROM_EMAIL as FROM_EMAIL, AOC_REPLY_TO as REPLY_TO } from "./senders"

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
    ${p("We're excited to meet you. Here's how we'll spend our time together, and how to make sure you get the most out of it.")}

    ${p("<strong style='color:#111827;'>What the call is about:</strong> We'll walk you through a short presentation on where AI actually creates leverage for people like you, answer any burning questions you've been sitting on, and figure out together whether the Collective is a good fit. That's it — no high-pressure pitch.")}

    ${p("A few things to lock in before we meet:")}

    ${playCard(
      "1.",
      "RSVP and add it to your calendar right now.",
      "Tap the calendar invite Calendly sent you and accept it. If it landed on your phone, make sure it saved to your primary calendar — not a secondary account you never check. Double-book protection."
    )}
    ${playCard(
      "2.",
      "Be at a computer — not your phone.",
      "We'll be sharing our screen and walking you through a presentation. Mobile works in a pinch, but you'll get way more out of it on a laptop or desktop. Plan to sit down somewhere quiet with no distractions."
    )}
    ${playCard(
      "3.",
      "Bring one or two burning AI questions.",
      "What are you actually stuck on? What tools are you eyeing but haven't pulled the trigger on? What would save you the most time this month if it just worked? Come with those, and we'll tear through them live."
    )}
    ${playCard(
      "4.",
      "Skim the AI Operator Playbook (attached).",
      "Five short chapters, ~15 minutes. Not required — but if you read it, our call goes deeper and you leave with more."
    )}

    ${btn(nextStepsUrl, "Prep resources + AI use cases")}

    ${divider()}

    <p style="margin:0 0 8px;font-size:13px;color:#4B5563;line-height:1.6;">
      <strong style="color:#111827;">Need to reschedule?</strong>
      ${params.rescheduleUrl ? `<a href="${params.rescheduleUrl}" style="color:#981B1B;">Pick a different time</a>` : "Reply to this email and we'll find a better time."}
      — but please don't ghost, we held this slot for you.
    </p>
    ${
      params.meetingUrl
        ? `<p style="margin:0 0 8px;font-size:13px;color:#4B5563;line-height:1.6;"><strong style="color:#111827;">Meeting link:</strong> <a href="${params.meetingUrl}" style="color:#981B1B;">${params.meetingUrl}</a></p>`
        : ""
    }

    <p style="margin:24px 0 0;font-size:11px;color:#9CA3AF;line-height:1.55;font-style:italic;">
      Over the next few days we'll send a few short emails — a case study from a member, the top AI tools we're using ourselves, and a handful of prompts you can steal. Not a firehose. Reply "stop" anytime.
    </p>
  `

  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `${firstName}, your AI Operator call is confirmed — here's how to prep`,
    html: emailLayout(
      body,
      "RSVP, be at a computer, bring your burning AI questions."
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
    // Day 1 — Playbook patterns (no fabricated names or specific dollar claims)
    return {
      subject: "The 4 moves our best operators make in their first 90 days",
      html: `
        ${h1(`${firstName}, here's what actually moves the needle.`)}
        ${p("Before our call, we wanted to show you the pattern we see over and over again among operators who start strong in the Collective. These aren't hypothetical — they're the moves that come up in almost every Collective call where someone is actually shipping.")}
        ${p("Four moves. All four come up in your playbook. Read these so our call can go deeper.")}

        ${playCard(
          "Move 1",
          "Pick a lane and stop hedging.",
          "\"Small businesses\" is not an ICP. \"Anyone who needs marketing\" is not an ICP. The operators who get traction fast are the ones who pick one specific buyer they actually understand — a role, an industry, a company stage. Once you have that, everything downstream gets easier."
        )}
        ${playCard(
          "Move 2",
          "Put your offer in one sentence.",
          "<em>\"I help [specific buyer] [specific outcome] by [specific mechanism].\"</em> If you can't finish that sentence without hedging, you don't have an offer yet — you have a job title. This is the single hardest thing to write and the single biggest unlock."
        )}
        ${playCard(
          "Move 3",
          "Use the discovery script, then price in ranges.",
          "The playbook's discovery script is designed to surface the real pain in 25 minutes without making the prospect feel like they're being sold to. When they ask what it costs, a range (\"engagements in this space run $X–$Y depending on scope\") moves you from vendor to advisor in one sentence."
        )}
        ${playCard(
          "Move 4",
          "Run the same play again instead of inventing new ones.",
          "The operators who scale fastest aren't the ones reinventing their offer every two weeks. They're the ones running the same proven play 4–5 times. Your playbook is a set of proven plays — use them as-is, iterate on delivery, keep the same offer stable while you build momentum."
        )}

        ${p("When we talk, we'll figure out which of these four you're strongest on and which one is the current bottleneck. The whole point is to save you months of trial and error.")}

        ${btn(nextStepsUrl, "See more prep resources")}
      `,
    }
  }

  if (emailIndex === 1) {
    // Day 2 — AI tools (Adam's personal stack)
    return {
      subject: "The 10 AI tools I actually use every day",
      html: `
        ${h1(`${firstName}, here's the stack I really use.`)}
        ${p("There are 500+ \"top AI tool\" lists on LinkedIn this week. Most of them are recycled. This one is different — it's the tools I personally use multiple times a day to run the AIMS portfolio. If I stopped using any of these, my work would be slower tomorrow.")}

        ${playCard(
          "01",
          "Claude",
          "My primary thinking partner. I use it for analysis, strategy sessions, coding, spreadsheet work, and building micro-tools with no-code directly inside of Claude. If I had to pick one AI tool to keep and delete everything else, this is it. <a href=\"https://claude.ai\" style=\"color:#981B1B;\">claude.ai</a>"
        )}
        ${playCard(
          "02",
          "Perplexity",
          "The best AI-powered research tool — answers come with real citations so you can trust them. Their new browser agent (Comet) also automates research tasks across the web. I use it anytime I'd normally open 12 tabs. <a href=\"https://perplexity.ai\" style=\"color:#981B1B;\">perplexity.ai</a>"
        )}
        ${playCard(
          "03",
          "Dex",
          "A Chrome browser agent that works alongside you with full context of what's on your screen. You don't have to describe what you're looking at — it already sees it. Huge for anyone who lives in the browser."
        )}
        ${playCard(
          "04",
          "Raycast",
          "Command-K for your whole Mac. Launch apps, respond to Slack, check email, run AI prompts — all without leaving your keyboard. Once you use it for a week, using a laptop without it feels broken. <a href=\"https://raycast.com\" style=\"color:#981B1B;\">raycast.com</a>"
        )}
        ${playCard(
          "05",
          "Wispr Flow",
          "The best speech-to-text tool I've used. Hold a button, talk, release — your words appear wherever the cursor is. I draft entire emails and doc sections this way faster than I can type. <a href=\"https://wisprflow.ai\" style=\"color:#981B1B;\">wisprflow.ai</a>"
        )}
        ${playCard(
          "06",
          "Little Bird (honorable mention)",
          "Joins all my calls like a meeting notetaker, records my screen during the day, AND runs any automation I describe in plain English — \"go check my email, Slack messages, and build out my to-do list for today.\" New, powerful, worth watching."
        )}
        ${playCard(
          "07",
          "v0 (by Vercel)",
          "For building app mockups or small websites fast. Type what you want, get a working prototype in minutes. Great for validating ideas without hiring a designer. <a href=\"https://v0.dev\" style=\"color:#981B1B;\">v0.dev</a>"
        )}
        ${playCard(
          "08",
          "Instantly",
          "My cold outreach workhorse. Manages sending accounts, warmup, sequences, and reply handling. If you're running any outbound campaign to businesses, this is the engine. <a href=\"https://instantly.ai\" style=\"color:#981B1B;\">instantly.ai</a>"
        )}
        ${playCard(
          "09",
          "Notion + Notion AI",
          "Where my playbooks, SOPs, and research live. Notion AI actually retrieves from YOUR docs instead of generating generic text — it's like having a research assistant who's read everything you've ever written. <a href=\"https://notion.so\" style=\"color:#981B1B;\">notion.so</a>"
        )}
        ${playCard(
          "10",
          "Firecrawl",
          "Turns any website into clean Markdown that an LLM can read. Every research or scraping workflow I run starts here. Feed it a URL, get a perfectly formatted doc ready to hand to Claude. <a href=\"https://firecrawl.dev\" style=\"color:#981B1B;\">firecrawl.dev</a>"
        )}

        ${p("You don't need all 10 on day one. Start with Claude + Perplexity + Raycast. Those three alone will give most people 5+ hours back a week.")}

        ${btn(nextStepsUrl, "See more prep resources")}
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
        ${p("Quick reminder — we're on today. A few nudges so it goes smoothly:")}

        ${playCard("1.", "Sit down at a computer, not your phone.", "We'll share our screen and walk you through a short presentation. Mobile will miss half of it.")}
        ${playCard("2.", "Have one or two AI questions ready.", "What are you stuck on? What would save you the most time this month if it just worked? Come with those and we'll tear through them live.")}
        ${playCard("3.", "Skim the playbook if you haven't.", "10 minutes is enough. It makes the call go deeper.")}

        ${p("If something's come up and you genuinely can't make it, hit the reschedule link in your Calendly confirmation — no hard feelings. Otherwise, see you soon.")}

        ${btn(nextStepsUrl, "Review the prep page")}
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
    { delay: 1, subject: "The 4 moves our best operators make early", templateKey: "aoc-day-1-playbook-moves" },
    { delay: 2, subject: "The 10 AI tools I actually use every day", templateKey: "aoc-day-2-tools" },
    { delay: 3, subject: "5 prompts that save operators 10+ hours/week", templateKey: "aoc-day-3-prompts" },
  ],
} as const
