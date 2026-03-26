import { sendTrackedEmail } from "./index"

const FROM_EMAIL = "AIMS <irtaza@modern-amenities.com>"
const REPLY_TO = "irtaza@modern-amenities.com"

function emailLayout(content: string, preheader = "") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AIMS</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F5F5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:#ffffff;border-radius:12px 12px 0 0;padding:28px 40px;border-bottom:1px solid #F0F0F0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <img src="https://aimseos.com/logo.png" alt="AIMS" width="36" height="36"
                      style="display:inline-block;vertical-align:middle;margin-right:10px;" />
                    <span style="font-size:18px;font-weight:800;color:#111827;vertical-align:middle;letter-spacing:-0.5px;">AIMS</span>
                  </td>
                  <td align="right">
                    <span style="font-size:11px;color:#9CA3AF;letter-spacing:0.05em;text-transform:uppercase;">Support</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background:#F9FAFB;border-radius:0 0 12px 12px;padding:24px 40px;border-top:1px solid #F0F0F0;">
              <p style="margin:0 0 8px;font-size:12px;color:#6B7280;">
                Questions? Reply to this email or reach us at
                <a href="mailto:${REPLY_TO}" style="color:#C4972A;text-decoration:none;">${REPLY_TO}</a>
              </p>
              <p style="margin:0;font-size:11px;color:#9CA3AF;">
                AIMS - AI-Powered Business Infrastructure -
                <a href="https://aimseos.com" style="color:#9CA3AF;text-decoration:none;">aimseos.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function btn(text: string, url: string) {
  return `<a href="${url}" style="display:inline-block;background:#C4972A;color:#ffffff;padding:13px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;margin:8px 0;">${text}</a>`
}

function h1(text: string) {
  return `<h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#111827;line-height:1.2;letter-spacing:-0.5px;">${text}</h1>`
}

function p(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;color:#4B5563;line-height:1.7;">${text}</p>`
}

// ─── Ticket confirmation to client ──────────────────────────────────────────

export async function sendTicketConfirmationEmail(params: {
  to: string
  name: string
  subject: string
  ticketId: string
}) {
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"}/portal/support`
  const body = `
    ${h1("We received your support ticket")}
    ${p(`Hey ${params.name} - we got your request and our team is on it.`)}
    <div style="background:#F9FAFB;border-left:4px solid #C4972A;border-radius:6px;padding:20px 24px;margin:0 0 24px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#C4972A;text-transform:uppercase;letter-spacing:0.08em;">Ticket Subject</p>
      <p style="margin:0;font-size:16px;font-weight:600;color:#111827;">${params.subject}</p>
      <p style="margin:8px 0 0;font-size:12px;color:#6B7280;">Ticket ID: ${params.ticketId}</p>
    </div>
    ${p("We typically respond within 24 hours. You can track the status and reply to your ticket directly from your portal.")}
    ${btn("View Your Ticket", portalUrl)}
    ${p("If your issue is urgent, reply to this email and we will prioritize your request.")}
  `
  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `Ticket received: ${params.subject}`,
    html: emailLayout(body, "We received your support ticket and will respond within 24 hours."),
    serviceArm: "support",
  })
}

// ─── Admin notification for new ticket ──────────────────────────────────────

export async function sendTicketNotificationToAdmin(params: {
  clientName: string
  clientEmail: string
  subject: string
  message: string
  priority: string
  ticketId: string
}) {
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"}/admin/support`
  const priorityLabel = params.priority === "urgent" ? "URGENT" : params.priority === "high" ? "HIGH" : params.priority
  const urgencyBar = params.priority === "urgent" || params.priority === "high"
    ? `<div style="background:#C4972A;color:#ffffff;padding:10px 16px;border-radius:6px;font-size:13px;font-weight:700;margin-bottom:20px;">${priorityLabel.toUpperCase()} PRIORITY TICKET</div>`
    : ""

  const body = `
    ${urgencyBar}
    ${h1("New Support Ticket")}
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin:0 0 24px;">
      ${[
        ["Client", params.clientName],
        ["Email", params.clientEmail],
        ["Priority", priorityLabel],
        ["Subject", params.subject],
      ].map(([label, value], i) => `
        <tr style="background:${i % 2 === 0 ? "#F9FAFB" : "#ffffff"};">
          <td style="padding:12px 16px;font-size:13px;color:#6B7280;width:100px;">${label}</td>
          <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;">${value}</td>
        </tr>
      `).join("")}
    </table>
    <div style="background:#F9FAFB;border-radius:8px;padding:16px;margin:0 0 24px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;">Message</p>
      <p style="margin:0;font-size:14px;color:#374151;white-space:pre-wrap;">${params.message}</p>
    </div>
    ${btn("View in Admin Portal", adminUrl)}
  `
  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: "irtaza@modern-amenities.com",
    replyTo: REPLY_TO,
    subject: `[AIMS Support] New ticket from ${params.clientName}: ${params.subject}`,
    html: emailLayout(body, `New support ticket from ${params.clientName}`),
    serviceArm: "support",
  })
}

// ─── Reply notification to client ───────────────────────────────────────────

export async function sendReplyNotificationToClient(params: {
  to: string
  clientName: string
  subject: string
  replyMessage: string
  authorName: string
  ticketId: string
}) {
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"}/portal/support`
  const body = `
    ${h1("New reply on your support ticket")}
    ${p(`Hey ${params.clientName} - the AIMS team has replied to your ticket.`)}
    <div style="background:#F9FAFB;border-left:4px solid #C4972A;border-radius:6px;padding:20px 24px;margin:0 0 24px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#C4972A;text-transform:uppercase;letter-spacing:0.08em;">Re: ${params.subject}</p>
      <p style="margin:8px 0 0;font-size:14px;color:#374151;white-space:pre-wrap;line-height:1.7;">${params.replyMessage}</p>
      <p style="margin:12px 0 0;font-size:12px;color:#9CA3AF;">- ${params.authorName}, AIMS Support</p>
    </div>
    ${btn("View Full Conversation", portalUrl)}
    ${p("You can reply directly from your portal or respond to this email.")}
  `
  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `Re: ${params.subject} - AIMS Support`,
    html: emailLayout(body, `The AIMS team replied to your support ticket.`),
    serviceArm: "support",
  })
}

// ─── Ticket status change notification ──────────────────────────────────────

export async function sendTicketStatusChangeEmail(params: {
  to: string
  clientName: string
  subject: string
  newStatus: string
  resolutionNote?: string | null
  ticketId: string
}) {
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"}/portal/support`
  const statusLabels: Record<string, string> = {
    resolved: "Resolved",
    closed: "Closed",
    in_progress: "In Progress",
  }
  const statusLabel = statusLabels[params.newStatus] ?? params.newStatus

  const body = `
    ${h1(`Your support ticket has been ${statusLabel.toLowerCase()}`)}
    ${p(`Hey ${params.clientName} - we are writing to let you know your ticket has been updated.`)}
    <div style="background:#F9FAFB;border-left:4px solid ${params.newStatus === "resolved" ? "#22C55E" : "#C4972A"};border-radius:6px;padding:20px 24px;margin:0 0 24px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${params.newStatus === "resolved" ? "#22C55E" : "#C4972A"};text-transform:uppercase;letter-spacing:0.08em;">Status: ${statusLabel}</p>
      <p style="margin:8px 0 0;font-size:16px;font-weight:600;color:#111827;">${params.subject}</p>
    </div>
    ${params.resolutionNote ? `
      <div style="background:#F0FDF4;border-radius:8px;padding:16px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#16A34A;text-transform:uppercase;">Resolution</p>
        <p style="margin:0;font-size:14px;color:#374151;white-space:pre-wrap;line-height:1.7;">${params.resolutionNote}</p>
      </div>
    ` : ""}
    ${p("If you need further help, you can reopen this ticket or create a new one from your portal.")}
    ${btn("View Ticket", portalUrl)}
  `
  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `Ticket ${statusLabel}: ${params.subject}`,
    html: emailLayout(body, `Your support ticket "${params.subject}" has been ${statusLabel.toLowerCase()}.`),
    serviceArm: "support",
  })
}
