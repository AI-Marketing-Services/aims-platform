import { sendTrackedEmail, escapeHtml, emailLayout, h1, p, btn } from "./index"
import { AIMS_FROM_EMAIL as FROM_EMAIL, AIMS_REPLY_TO as REPLY_TO } from "./senders"

// ─── Ticket confirmation to client ──────────────────────────────────────────

export async function sendTicketConfirmationEmail(params: {
  to: string
  name: string
  subject: string
  ticketId: string
}) {
  const safeSubject = escapeHtml(params.subject)
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aioperatorcollective.com"}/portal/support`
  const body = `
    ${h1("We received your support ticket")}
    ${p(`Hey ${escapeHtml(params.name)} - we got your request and our team is on it.`)}
    <div style="background:#F9FAFB;border-left:4px solid #981B1B;border-radius:6px;padding:20px 24px;margin:0 0 24px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#981B1B;text-transform:uppercase;letter-spacing:0.08em;">Ticket Subject</p>
      <p style="margin:0;font-size:16px;font-weight:600;color:#111827;">${safeSubject}</p>
      <p style="margin:8px 0 0;font-size:12px;color:#6B7280;">Ticket ID: ${escapeHtml(params.ticketId)}</p>
    </div>
    ${p("We typically respond within 24 hours. You can track the status and reply to your ticket directly from your portal.")}
    ${btn("View Your Ticket", portalUrl)}
    ${p("If your issue is urgent, reply to this email and we will prioritize your request.")}
  `
  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `Ticket received: ${safeSubject}`,
    html: emailLayout(body, "We received your support ticket and will respond within 24 hours."),
    serviceArm: "support",
    templateKey: "support.ticket-confirmation",
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
  const safeSubject = escapeHtml(params.subject)
  const safeMessage = escapeHtml(params.message)
  const safeClientName = escapeHtml(params.clientName)
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aioperatorcollective.com"}/admin/support`
  const priorityLabel = params.priority === "urgent" ? "URGENT" : params.priority === "high" ? "HIGH" : params.priority
  const urgencyBar = params.priority === "urgent" || params.priority === "high"
    ? `<div style="background:#981B1B;color:#ffffff;padding:10px 16px;border-radius:6px;font-size:13px;font-weight:700;margin-bottom:20px;">${priorityLabel.toUpperCase()} PRIORITY TICKET</div>`
    : ""

  const body = `
    ${urgencyBar}
    ${h1("New Support Ticket")}
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin:0 0 24px;">
      ${[
        ["Client", safeClientName],
        ["Email", escapeHtml(params.clientEmail)],
        ["Priority", priorityLabel],
        ["Subject", safeSubject],
      ].map(([label, value], i) => `
        <tr style="background:${i % 2 === 0 ? "#F9FAFB" : "#ffffff"};">
          <td style="padding:12px 16px;font-size:13px;color:#6B7280;width:100px;">${label}</td>
          <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;">${value}</td>
        </tr>
      `).join("")}
    </table>
    <div style="background:#F9FAFB;border-radius:8px;padding:16px;margin:0 0 24px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;">Message</p>
      <p style="margin:0;font-size:14px;color:#374151;white-space:pre-wrap;">${safeMessage}</p>
    </div>
    ${btn("View in Admin Portal", adminUrl)}
  `
  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: process.env.INTERNAL_NOTIFY_TO ?? "team@aioperatorcollective.com",
    replyTo: REPLY_TO,
    subject: `[AIMS Support] New ticket from ${safeClientName}: ${safeSubject}`,
    html: emailLayout(body, `New support ticket from ${safeClientName}`),
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
  const safeSubject = escapeHtml(params.subject)
  const safeReplyMessage = escapeHtml(params.replyMessage)
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aioperatorcollective.com"}/portal/support`
  const body = `
    ${h1("New reply on your support ticket")}
    ${p(`Hey ${escapeHtml(params.clientName)} - the AIMS team has replied to your ticket.`)}
    <div style="background:#F9FAFB;border-left:4px solid #981B1B;border-radius:6px;padding:20px 24px;margin:0 0 24px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#981B1B;text-transform:uppercase;letter-spacing:0.08em;">Re: ${safeSubject}</p>
      <p style="margin:8px 0 0;font-size:14px;color:#374151;white-space:pre-wrap;line-height:1.7;">${safeReplyMessage}</p>
      <p style="margin:12px 0 0;font-size:12px;color:#9CA3AF;">- ${escapeHtml(params.authorName)}, AIMS Support</p>
    </div>
    ${btn("View Full Conversation", portalUrl)}
    ${p("You can reply directly from your portal or respond to this email.")}
  `
  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `Re: ${safeSubject} - AIMS Support`,
    html: emailLayout(body, `The AIMS team replied to your support ticket.`),
    serviceArm: "support",
    templateKey: "support.reply-to-client",
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
  const safeSubject = escapeHtml(params.subject)
  const safeResolutionNote = params.resolutionNote ? escapeHtml(params.resolutionNote) : null
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aioperatorcollective.com"}/portal/support`
  const statusLabels: Record<string, string> = {
    resolved: "Resolved",
    closed: "Closed",
    in_progress: "In Progress",
  }
  const statusLabel = statusLabels[params.newStatus] ?? params.newStatus

  const body = `
    ${h1(`Your support ticket has been ${statusLabel.toLowerCase()}`)}
    ${p(`Hey ${escapeHtml(params.clientName)} - we are writing to let you know your ticket has been updated.`)}
    <div style="background:#F9FAFB;border-left:4px solid ${params.newStatus === "resolved" ? "#22C55E" : "#981B1B"};border-radius:6px;padding:20px 24px;margin:0 0 24px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${params.newStatus === "resolved" ? "#22C55E" : "#981B1B"};text-transform:uppercase;letter-spacing:0.08em;">Status: ${statusLabel}</p>
      <p style="margin:8px 0 0;font-size:16px;font-weight:600;color:#111827;">${safeSubject}</p>
    </div>
    ${safeResolutionNote ? `
      <div style="background:#F0FDF4;border-radius:8px;padding:16px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#16A34A;text-transform:uppercase;">Resolution</p>
        <p style="margin:0;font-size:14px;color:#374151;white-space:pre-wrap;line-height:1.7;">${safeResolutionNote}</p>
      </div>
    ` : ""}
    ${p("If you need further help, you can reopen this ticket or create a new one from your portal.")}
    ${btn("View Ticket", portalUrl)}
  `
  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: `Ticket ${statusLabel}: ${safeSubject}`,
    html: emailLayout(body, `Your support ticket "${safeSubject}" has been ${statusLabel.toLowerCase()}.`),
    serviceArm: "support",
    templateKey: "support.ticket-resolved",
  })
}
