import { sendTrackedEmail, escapeHtml, emailLayout, h1, p, btn } from "./index"
import { AOC_FROM_EMAIL as FROM_EMAIL, AOC_REPLY_TO as REPLY_TO } from "./senders"

export async function sendAbandonedApplicationEmail(params: {
  to: string
  name: string
}) {
  const safeName = escapeHtml(params.name || "").trim()
  const firstName = safeName.split(" ")[0] || "there"
  const applyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://aioperatorcollective.com"}/apply`

  const body = `
    ${h1(`${firstName}, you left something behind.`)}
    ${p(
      "Hey — you started applying to the AI Operator Collective a bit earlier, but the form didn't quite get all the way to the finish line. Life happens, totally get it."
    )}
    ${p(
      "Just wanted to reach out in case you got pulled away and forgot. Your AI Operator Playbook is waiting on the other side once you book a call, and it's genuinely one of the most useful resources we've put together. It'd be a shame for you to miss out on it."
    )}
    ${p(
      "It takes about 3 minutes to finish — just a few short questions and picking a call time that works for you."
    )}
    ${btn(applyUrl, "Pick up where you left off")}
    ${p(
      "If the timing isn't right or you've changed your mind, totally no hard feelings — just reply and let me know. Otherwise, looking forward to meeting you."
    )}
    <p style="margin:32px 0 0;font-size:12px;color:#9CA3AF;line-height:1.6;">
      — The AI Operator Collective team
    </p>
    <p style="margin:24px 0 0;font-size:11px;color:#9CA3AF;line-height:1.55;font-style:italic;">
      Sent because you started an application at aioperatorcollective.com. You'll only receive this reminder once.
    </p>
  `

  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `${firstName}, your AI Operator Playbook is waiting`,
    html: emailLayout(body, "3 minutes to finish — your playbook is on the other side."),
    serviceArm: "ai-operator-collective",
  })
}
