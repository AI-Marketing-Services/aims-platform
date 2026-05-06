import { sendTrackedEmail, escapeHtml, emailLayout, h1, p, btn } from "./index"
import { getCalendarUrl } from "@/lib/collective-application"
import { AOC_FROM_EMAIL as FROM_EMAIL, AOC_REPLY_TO as REPLY_TO } from "./senders"

type ReminderDay = 2 | 5 | 9

const COPY: Record<
  ReminderDay,
  { subject: string; preview: string; heading: string; body: string; cta: string }
> = {
  2: {
    subject: "your AI Operator Collective call is still open",
    preview: "A quick nudge, no pressure.",
    heading: "Still holding a spot for you.",
    body:
      "Matt here from the AI Operator Collective. We got your application a couple of days ago but noticed you haven't picked a call time yet. Totally get that life gets busy. The call is 20 minutes, zero pressure. I walk you through a short presentation on where AI is actually working for operators, answer any burning questions you have, and we figure out together if the Collective is a good fit.",
    cta: "Pick a time that works",
  },
  5: {
    subject: "still holding your spot",
    preview: "Checking in before I let the slot go.",
    heading: "Quick check in.",
    body:
      "Matt again. I'm still holding a review slot for you. If the timing's off right now, just reply and tell me what's in the way. We can usually figure something out. If you're still in but it slipped off your plate, it's one click below to pick a time.",
    cta: "Grab a time",
  },
  9: {
    subject: "last nudge, then I'll go quiet",
    preview: "Promise, I'll stop emailing.",
    heading: "Last gentle nudge.",
    body:
      "This is the last time I'll reach out on your application. I don't want to clutter your inbox. If the moment's not right, totally no hard feelings. You can always pick it back up whenever at aioperatorcollective.com/apply. Otherwise I'll go quiet.",
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
  const firstName = safeName.split(" ")[0] || "there"
  const calUrl = getCalendarUrl(params.tier ?? "cold")

  const html = `
    ${h1(`${firstName}, ${cfg.heading.toLowerCase()}`)}
    ${p(cfg.body)}
    ${btn(cfg.cta, calUrl)}
    ${p(
      `If this isn't the right moment, just reply with "not now" and I'll stop the reminders. No pressure, ${firstName}.`
    )}
    <p style="margin:32px 0 0;font-size:13px;color:#4B5563;line-height:1.6;">
      Matt<br/>
      <span style="color:#9CA3AF;font-size:12px;">AI Operator Collective</span>
    </p>
    <p style="margin:24px 0 0;font-size:11px;color:#9CA3AF;line-height:1.55;font-style:italic;">
      Sent because you applied to the AI Operator Collective. You'll receive up to 3 booking reminders. Reply to stop them sooner.
    </p>
  `

  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `${firstName}, ${cfg.subject}`,
    html: emailLayout(html, cfg.preview),
    serviceArm: "ai-operator-collective",
    templateKey: `aoc.booking-reminder.day-${params.day}`,
  })
}
