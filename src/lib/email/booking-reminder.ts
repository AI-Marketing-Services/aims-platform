import { sendTrackedEmail, escapeHtml, emailLayout, h1, p, btn } from "./index"
import { getCalendarUrl } from "@/lib/collective-application"
import { AOC_FROM_EMAIL as FROM_EMAIL, AOC_REPLY_TO as REPLY_TO } from "./senders"

type ReminderDay = 2 | 5 | 9

const COPY: Record<
  ReminderDay,
  { subject: string; preview: string; opener: string; body: string; cta: string }
> = {
  2: {
    subject: "Your AI Operator Collective call is still open",
    preview: "A quick nudge, no pressure.",
    opener: "Just a gentle nudge on the call.",
    body:
      "Hey — we got your application a couple of days ago and noticed you haven't picked a call time yet. Totally get that life gets busy. Just wanted to make sure you didn't lose track of it. The call is 20 minutes, zero pressure — we walk you through a short presentation on where AI is actually working, answer any burning questions, and figure out if the Collective is a good fit together.",
    cta: "Pick a time that works",
  },
  5: {
    subject: "Still holding your spot",
    preview: "Checking in before we let the slot go.",
    opener: "Quick check-in.",
    body:
      "We're still holding a review slot for you. If the timing's off right now, just reply and tell me what's in the way — we can often figure something out. If you're still in but it slipped off your plate, it takes about one click to pick a time below.",
    cta: "Grab a time",
  },
  9: {
    subject: "Last nudge before we close the loop",
    preview: "Promise, we'll stop emailing.",
    opener: "Last gentle nudge.",
    body:
      "This is the last time we'll reach out on your application — we don't want to clutter your inbox. If the moment's not right, totally no hard feelings. If you want to pick it back up whenever, the application stays open at aioperatorcollective.com/apply. Otherwise we'll go quiet.",
    cta: "Pick a time if you're in",
  },
}

export async function sendBookingReminderEmail(params: {
  to: string
  name: string
  day: ReminderDay
  tier?: "hot" | "warm" | "cold"
}) {
  const cfg = COPY[params.day]
  const safeName = escapeHtml(params.name || "").trim()
  const greeting = safeName ? `${safeName.split(" ")[0]}, ${cfg.opener.toLowerCase()}` : cfg.opener
  const calUrl = getCalendarUrl(params.tier ?? "cold")

  const html = `
    ${h1(greeting)}
    ${p(cfg.body)}
    ${btn(calUrl, cfg.cta)}
    ${p(
      "If this isn't the right moment, just reply with \"not now\" — we'll stop the reminders. No pressure.",
    )}
    <p style="margin:32px 0 0;font-size:12px;color:#9CA3AF;line-height:1.6;">
      — The AI Operator Collective team
    </p>
    <p style="margin:24px 0 0;font-size:11px;color:#9CA3AF;line-height:1.55;font-style:italic;">
      Sent because you applied to the AI Operator Collective. You'll receive up to 3 booking reminders;
      reply to stop them sooner.
    </p>
  `

  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: cfg.subject,
    html: emailLayout(html, cfg.preview),
    serviceArm: "ai-operator-collective",
  })
}
