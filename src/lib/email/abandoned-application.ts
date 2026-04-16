import { sendTrackedEmail, escapeHtml, emailLayout, h1, p, btn } from "./index"

const FROM_EMAIL = "AI Operator Collective <irtaza@modern-amenities.com>"
const REPLY_TO = "irtaza@modern-amenities.com"

export async function sendAbandonedApplicationEmail(params: {
  to: string
  name: string
}) {
  const safeName = escapeHtml(params.name || "").trim()
  const firstName = safeName.split(" ")[0] || "there"
  const applyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://aioperatorcollective.com"}/apply`

  const body = `
    ${h1(`${firstName}, you forgot something.`)}
    ${p(
      "You started applying to the AI Operator Collective earlier today, but you didn't finish. It takes 3 minutes — no pressure, just 6 short questions and a call slot."
    )}
    ${p(
      "If you need a reason to come back: the operators who finish the application are the ones who actually start making moves. The ones who don't? They keep reading Twitter threads about AI and wondering why their peers are two steps ahead."
    )}
    ${btn(applyUrl, "Finish your application")}
    ${p(
      "If now isn't the right time, no worries — reply and tell me what's in the way. I'll leave you alone."
    )}
    <p style="margin:32px 0 0;font-size:12px;color:#9CA3AF;line-height:1.6;">
      — Irtaza<br/>Operations, AI Operator Collective
    </p>
    <p style="margin:24px 0 0;font-size:11px;color:#9CA3AF;line-height:1.55;font-style:italic;">
      Sent because you started an application at aioperatorcollective.com. You'll only receive
      this reminder once.
    </p>
  `

  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `${firstName}, you left your application half-finished`,
    html: emailLayout(body, "3 minutes to finish what you started."),
    serviceArm: "ai-operator-collective",
  })
}
