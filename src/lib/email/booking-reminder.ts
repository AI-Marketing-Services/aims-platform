import { sendTrackedEmail, escapeHtml, emailLayout, h1, p, btn } from "./index"
import { getCalendarUrl } from "@/lib/collective-application"

const FROM_EMAIL = "AI Operator Collective <irtaza@modern-amenities.com>"
const REPLY_TO = "irtaza@modern-amenities.com"

type ReminderDay = 2 | 5 | 9

const COPY: Record<
  ReminderDay,
  { subject: string; preview: string; opener: string; body: string; cta: string }
> = {
  2: {
    subject: "Your operator review slot is still open",
    preview: "One call. 20 minutes. Still on the table.",
    opener: "Your application came through — the call is still open.",
    body:
      "We walked through your application. You're exactly the kind of operator we built this cohort for. The only thing left is to pick a time. Every day you wait is another day your best-fit prospects are getting picked off by the people who already moved.",
    cta: "Book your 20-min review",
  },
  5: {
    subject: "Five days on — are you still in?",
    preview: "Quick nudge before we stop emailing.",
    opener: "Checking in before your application ages out.",
    body:
      "We hold review slots for 7–10 days after an application comes in, then we quietly close them out so the next cohort doesn't bottleneck. Your slot is still open — but not for much longer. If the timing's off, reply and tell me; if you're still in, grab a time below.",
    cta: "Grab a review slot",
  },
  9: {
    subject: "Last call — your slot closes tomorrow",
    preview: "No hard feelings, just logistics.",
    opener: "One last note before we close your application.",
    body:
      "Your review window closes tomorrow. If the moment isn't right, no worries — the Operator Vault content keeps coming either way. But if you're serious about launching an advisory practice this quarter, this is the last easy on-ramp we can offer. One click books it.",
    cta: "Book before it closes",
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
      "If this isn't the right moment, just reply with \"not now\" — we'll stop the booking reminders (the Vault content stays flowing).",
    )}
    <p style="margin:32px 0 0;font-size:12px;color:#9CA3AF;line-height:1.6;">
      — Irtaza<br/>Operations, AI Operator Collective
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
