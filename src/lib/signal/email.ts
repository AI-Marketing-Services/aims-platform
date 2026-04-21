import { sendTrackedEmail, escapeHtml } from "@/lib/email"
import { AIMS_FROM_EMAIL, AIMS_REPLY_TO } from "@/lib/email/senders"
import type { DigestItem } from "./digest"

export async function sendSignalEmail(params: {
  to: string
  name?: string | null
  items: DigestItem[]
  runDate: Date
}) {
  const { to, items, runDate } = params
  const dateLabel = runDate.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const cards = items
    .map(
      (it) => `
      <a href="${escapeHtml(it.url)}" style="display:block;margin:0 0 28px 0;padding:0;text-decoration:none;color:inherit;">
        <div style="font-family:'DM Mono',ui-monospace,monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#C4972A;margin:0 0 10px 0;">
          ${escapeHtml(it.topicLabel)}
        </div>
        <div style="font-family:Georgia,'Cormorant Garamond',serif;font-size:20px;line-height:1.3;color:#F0EBE0;margin:0 0 8px 0;">
          ${escapeHtml(it.headline)}
        </div>
        <div style="font-family:-apple-system,BlinkMacSystemFont,'DM Sans',sans-serif;font-size:14px;line-height:1.55;color:#F0EBE0;opacity:0.72;margin:0 0 8px 0;">
          ${escapeHtml(it.summary)}
        </div>
        <div style="font-family:'DM Mono',ui-monospace,monospace;font-size:11px;color:#C4972A;opacity:0.8;">
          ${escapeHtml(it.source)} &nbsp;&rarr;
        </div>
      </a>
    `,
    )
    .join("")

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Signal &middot; ${escapeHtml(dateLabel)}</title>
</head>
<body style="margin:0;padding:0;background:#08090D;">
  <div style="display:none;max-height:0;overflow:hidden;">${items.length} stor${items.length === 1 ? "y" : "ies"} &middot; all signal, no fluff.</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08090D;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr><td style="padding:0 24px 40px 24px;">
          <div style="font-family:'DM Mono',ui-monospace,monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#F0EBE0;opacity:0.5;margin:0 0 8px 0;">
            ${escapeHtml(dateLabel)}
          </div>
          <div style="font-family:Georgia,'Cormorant Garamond',serif;font-size:32px;color:#F0EBE0;margin:0 0 4px 0;">Signal</div>
          <div style="font-family:'DM Mono',ui-monospace,monospace;font-size:11px;color:#F0EBE0;opacity:0.5;">
            ${items.length} ${items.length === 1 ? "story" : "stories"}
          </div>
        </td></tr>
        <tr><td style="padding:0 24px 24px 24px;border-top:1px solid rgba(240,235,224,0.08);padding-top:32px;">
          ${cards}
        </td></tr>
        <tr><td style="padding:24px;border-top:1px solid rgba(240,235,224,0.08);">
          <div style="font-family:'DM Mono',ui-monospace,monospace;font-size:10px;color:#F0EBE0;opacity:0.35;text-align:center;">
            Signal &middot; AIMS &middot;
            <a href="https://www.aioperatorcollective.com/portal/signal/settings" style="color:#C4972A;text-decoration:none;">settings</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const subject = items.length === 1
    ? `Signal · ${items[0].headline.slice(0, 60)}`
    : `Signal · ${items.length} stories · ${dateLabel}`

  return sendTrackedEmail({
    from: AIMS_FROM_EMAIL,
    replyTo: AIMS_REPLY_TO,
    to,
    subject,
    html,
    serviceArm: "signal",
  })
}
