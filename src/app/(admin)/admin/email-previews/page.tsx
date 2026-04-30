"use client"

import { useState, useMemo, useCallback } from "react"
import { Copy, Check, Mail, ChevronDown } from "lucide-react"
import { Breadcrumbs } from "@/components/shared/Breadcrumbs"

export const dynamic = "force-dynamic"

// ─── Email layout helpers (client-side copies, no server imports) ────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

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
                    <img src="https://www.aioperatorcollective.com/logo.png" alt="AIMS" width="36" height="36"
                      style="display:inline-block;vertical-align:middle;margin-right:10px;" />
                    <span style="font-size:18px;font-weight:800;color:#111827;vertical-align:middle;letter-spacing:-0.5px;">AIMS</span>
                  </td>
                  <td align="right">
                    <span style="font-size:11px;color:#9CA3AF;letter-spacing:0.05em;text-transform:uppercase;">AI Managing Services</span>
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
                <a href="mailto:team@aioperatorcollective.com" style="color:#981B1B;text-decoration:none;">team@aioperatorcollective.com</a>
              </p>
              <p style="margin:0 0 8px;font-size:11px;color:#9CA3AF;">
                AIMS - AI-Powered Business Infrastructure -
                <a href="https://www.aioperatorcollective.com" style="color:#9CA3AF;text-decoration:none;">aioperatorcollective.com</a>
              </p>
              <p style="margin:0 0 4px;font-size:11px;color:#9CA3AF;">
                Modern Amenities Group - 8 The Green, Suite A - Dover, DE 19901
              </p>
              <p style="margin:0;font-size:11px;color:#9CA3AF;">
                <a href="https://www.aioperatorcollective.com/unsubscribe" style="color:#9CA3AF;text-decoration:underline;">Unsubscribe</a>
                - <a href="https://www.aioperatorcollective.com/privacy" style="color:#9CA3AF;text-decoration:underline;">Privacy Policy</a>
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
  return `<a href="${url}" style="display:inline-block;background:#981B1B;color:#ffffff;padding:13px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;margin:8px 0;">${text}</a>`
}

function h1(text: string) {
  return `<h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#111827;line-height:1.2;letter-spacing:-0.5px;">${text}</h1>`
}

function p(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;color:#4B5563;line-height:1.7;">${text}</p>`
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #F0F0F0;margin:28px 0;" />`
}

// ─── Template types ─────────────────────────────────────────────────────────

type TemplateType =
  | "welcome"
  | "lead-magnet-results"
  | "fulfillment-assignment"
  | "internal-notification"
  | "support-ticket-created"
  | "support-reply"
  | "support-status-change"

const TEMPLATE_OPTIONS: Array<{ value: TemplateType; label: string }> = [
  { value: "welcome", label: "Welcome" },
  { value: "lead-magnet-results", label: "Lead Magnet Results" },
  { value: "fulfillment-assignment", label: "Fulfillment Assignment" },
  { value: "internal-notification", label: "Internal Notification" },
  { value: "support-ticket-created", label: "Support Ticket Created" },
  { value: "support-reply", label: "Support Reply" },
  { value: "support-status-change", label: "Support Status Change" },
]

// ─── Default field values per template ──────────────────────────────────────

function getDefaultFields(template: TemplateType): Record<string, string> {
  switch (template) {
    case "welcome":
      return {
        name: "Jane Doe",
        serviceName: "Wild Ducks (AI Website + CRM Chatbot)",
        tier: "Growth",
        portalUrl: "https://www.aioperatorcollective.com/portal/dashboard",
      }
    case "lead-magnet-results":
      return {
        name: "John Smith",
        type: "ai-readiness-quiz",
        score: "72",
        resultsUrl: "https://www.aioperatorcollective.com/results/abc123",
      }
    case "fulfillment-assignment":
      return {
        assigneeName: "Alex Rivera",
        clientName: "Acme Corp",
        serviceName: "Money Page (SEO + Content)",
        tier: "Pro",
        clientEmail: "client@acmecorp.com",
        clientWebsite: "https://acmecorp.com",
      }
    case "internal-notification":
      return {
        subject: "New high-value signup",
        message: "Acme Corp just purchased the Enterprise tier of Wild Ducks ($497/mo). Assigned to Alex Rivera for fulfillment.",
        urgency: "high",
      }
    case "support-ticket-created":
      return {
        name: "Jane Doe",
        subject: "Unable to access my dashboard",
        ticketId: "TKT-00042",
      }
    case "support-reply":
      return {
        clientName: "Jane Doe",
        subject: "Unable to access my dashboard",
        replyMessage: "Hi Jane - we identified the issue and have restored access to your dashboard. The root cause was a permission sync delay after your recent plan upgrade. Everything should be working now. Please let us know if you run into any other issues.",
        authorName: "Irtaza Barlas",
        ticketId: "TKT-00042",
      }
    case "support-status-change":
      return {
        clientName: "Jane Doe",
        subject: "Unable to access my dashboard",
        newStatus: "resolved",
        resolutionNote: "Permission sync issue resolved. Dashboard access restored. Monitoring for 24 hours to confirm stability.",
        ticketId: "TKT-00042",
      }
  }
}

// ─── Field metadata ─────────────────────────────────────────────────────────

function getFieldMeta(template: TemplateType): Array<{ key: string; label: string; type?: "select"; options?: string[] }> {
  switch (template) {
    case "welcome":
      return [
        { key: "name", label: "Recipient Name" },
        { key: "serviceName", label: "Service Name" },
        { key: "tier", label: "Tier" },
        { key: "portalUrl", label: "Portal URL" },
      ]
    case "lead-magnet-results":
      return [
        { key: "name", label: "Recipient Name" },
        { key: "type", label: "Lead Magnet Type", type: "select", options: ["ai-readiness-quiz", "roi-calculator", "website-audit", "segment-explorer", "stack-configurator"] },
        { key: "score", label: "Score (0-100)" },
        { key: "resultsUrl", label: "Results URL" },
      ]
    case "fulfillment-assignment":
      return [
        { key: "assigneeName", label: "Assignee Name" },
        { key: "clientName", label: "Client Name" },
        { key: "serviceName", label: "Service Name" },
        { key: "tier", label: "Tier" },
        { key: "clientEmail", label: "Client Email" },
        { key: "clientWebsite", label: "Client Website" },
      ]
    case "internal-notification":
      return [
        { key: "subject", label: "Subject" },
        { key: "message", label: "Message" },
        { key: "urgency", label: "Urgency", type: "select", options: ["low", "normal", "high"] },
      ]
    case "support-ticket-created":
      return [
        { key: "name", label: "Client Name" },
        { key: "subject", label: "Ticket Subject" },
        { key: "ticketId", label: "Ticket ID" },
      ]
    case "support-reply":
      return [
        { key: "clientName", label: "Client Name" },
        { key: "subject", label: "Ticket Subject" },
        { key: "replyMessage", label: "Reply Message" },
        { key: "authorName", label: "Author Name" },
        { key: "ticketId", label: "Ticket ID" },
      ]
    case "support-status-change":
      return [
        { key: "clientName", label: "Client Name" },
        { key: "subject", label: "Ticket Subject" },
        { key: "newStatus", label: "New Status", type: "select", options: ["in_progress", "resolved", "closed"] },
        { key: "resolutionNote", label: "Resolution Note" },
        { key: "ticketId", label: "Ticket ID" },
      ]
  }
}

// ─── HTML builders per template ─────────────────────────────────────────────

function buildEmailHtml(template: TemplateType, fields: Record<string, string>): string {
  switch (template) {
    case "welcome": {
      const body = `
        ${h1(`Welcome aboard, ${escapeHtml(fields.name)}!`)}
        ${p(`Your <strong style="color:#111827;">${escapeHtml(fields.serviceName)}${fields.tier ? ` (${escapeHtml(fields.tier)} tier)` : ""}</strong> subscription is now active. Here's what happens next:`)}
        <ol style="margin:0 0 24px;padding-left:20px;color:#4B5563;line-height:2;font-size:15px;">
          <li>Our team has been notified and will begin setup within <strong style="color:#111827;">24 hours</strong></li>
          <li>You'll receive a setup guide specific to your service</li>
          <li>Log into your portal to track progress and manage your account</li>
        </ol>
        ${btn("Go to Your Portal", fields.portalUrl)}
        ${divider()}
        ${p("Need help? Just reply to this email - we typically respond within 2 business hours.")}
      `
      return emailLayout(body, `Your ${escapeHtml(fields.serviceName)} is now active. Here's what to expect.`)
    }

    case "lead-magnet-results": {
      const score = fields.score ? parseInt(fields.score, 10) : undefined
      const subjectMap: Record<string, string> = {
        "ai-readiness-quiz": `Your AI Readiness Score: ${score ?? "Ready"}`,
        "roi-calculator": "Your Custom ROI Report from AIMS",
        "website-audit": "Your Website Audit Results",
        "segment-explorer": "Your Audience Segments Report",
        "stack-configurator": "Your Recommended AI Stack",
      }
      void subjectMap
      const body = `
        ${h1(`${fields.name ? `Hey ${escapeHtml(fields.name)} - ` : "Hey - "} your results are ready`)}
        ${score ? `
          <div style="background:#FEF2F2;border-left:4px solid #981B1B;border-radius:6px;padding:20px 24px;margin:0 0 24px;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#981B1B;text-transform:uppercase;letter-spacing:0.08em;">Your Score</p>
            <p style="margin:0;font-size:48px;font-weight:800;color:#111827;line-height:1;">${score}<span style="font-size:20px;color:#6B7280;">/100</span></p>
          </div>
        ` : ""}
        ${p("We've analyzed your inputs and put together a personalized report with specific recommendations for your business.")}
        ${btn("View Full Results", fields.resultsUrl)}
        ${divider()}
        ${p("Want to talk through your results with our team? We'll map the right AIMS services to your exact gaps - no pitch, just a working session.")}
        <a href="https://www.aioperatorcollective.com/get-started" style="font-size:14px;color:#981B1B;font-weight:600;text-decoration:none;">
          Book a free strategy call
        </a>
      `
      return emailLayout(body, "Your personalized AIMS results are ready to view.")
    }

    case "fulfillment-assignment": {
      const rows: Array<[string, string]> = [
        ["Client", escapeHtml(fields.clientName)],
        ["Service", `${escapeHtml(fields.serviceName)}${fields.tier ? ` (${escapeHtml(fields.tier)})` : ""}`],
        ["Email", escapeHtml(fields.clientEmail)],
      ]
      if (fields.clientWebsite) {
        rows.push(["Website", escapeHtml(fields.clientWebsite)])
      }
      const body = `
        ${h1("New fulfillment assignment")}
        ${p(`Hey ${escapeHtml(fields.assigneeName)}, a new client has been assigned to you.`)}
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin:0 0 24px;">
          ${rows.map(([label, value], i) => `
            <tr style="background:${i % 2 === 0 ? "#F9FAFB" : "#ffffff"};">
              <td style="padding:12px 16px;font-size:13px;color:#6B7280;width:120px;">${label}</td>
              <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#111827;">${value}</td>
            </tr>
          `).join("")}
        </table>
        ${btn("Open Admin Portal", "https://www.aioperatorcollective.com/admin")}
        ${p("Check the admin portal for setup tasks and the fulfillment checklist.")}
      `
      return emailLayout(body, `New fulfillment: ${escapeHtml(fields.clientName)} signed up for ${escapeHtml(fields.serviceName)}.`)
    }

    case "internal-notification": {
      const urgencyBar = fields.urgency === "high"
        ? `<div style="background:#981B1B;color:#ffffff;padding:10px 16px;border-radius:6px;font-size:13px;font-weight:700;margin-bottom:20px;">HIGH PRIORITY</div>`
        : fields.urgency === "normal"
        ? `<div style="background:#FEF2F2;color:#981B1B;padding:10px 16px;border-radius:6px;font-size:13px;font-weight:600;margin-bottom:20px;">Notification</div>`
        : ""
      const body = `
        ${urgencyBar}
        ${h1(escapeHtml(fields.subject))}
        <pre style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;padding:16px;font-size:13px;color:#374151;white-space:pre-wrap;overflow-wrap:break-word;">${escapeHtml(fields.message)}</pre>
        ${btn("Open Admin Portal", "https://www.aioperatorcollective.com/admin")}
      `
      return emailLayout(body)
    }

    case "support-ticket-created": {
      const portalUrl = "https://www.aioperatorcollective.com/portal/support"
      const safeSubject = escapeHtml(fields.subject)
      const body = `
        ${h1("We received your support ticket")}
        ${p(`Hey ${escapeHtml(fields.name)} - we got your request and our team is on it.`)}
        <div style="background:#F9FAFB;border-left:4px solid #981B1B;border-radius:6px;padding:20px 24px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#981B1B;text-transform:uppercase;letter-spacing:0.08em;">Ticket Subject</p>
          <p style="margin:0;font-size:16px;font-weight:600;color:#111827;">${safeSubject}</p>
          <p style="margin:8px 0 0;font-size:12px;color:#6B7280;">Ticket ID: ${escapeHtml(fields.ticketId)}</p>
        </div>
        ${p("We typically respond within 24 hours. You can track the status and reply to your ticket directly from your portal.")}
        ${btn("View Your Ticket", portalUrl)}
        ${p("If your issue is urgent, reply to this email and we will prioritize your request.")}
      `
      return emailLayout(body, "We received your support ticket and will respond within 24 hours.")
    }

    case "support-reply": {
      const portalUrl = "https://www.aioperatorcollective.com/portal/support"
      const safeSubject = escapeHtml(fields.subject)
      const body = `
        ${h1("New reply on your support ticket")}
        ${p(`Hey ${escapeHtml(fields.clientName)} - the AIMS team has replied to your ticket.`)}
        <div style="background:#F9FAFB;border-left:4px solid #981B1B;border-radius:6px;padding:20px 24px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#981B1B;text-transform:uppercase;letter-spacing:0.08em;">Re: ${safeSubject}</p>
          <p style="margin:8px 0 0;font-size:14px;color:#374151;white-space:pre-wrap;line-height:1.7;">${escapeHtml(fields.replyMessage)}</p>
          <p style="margin:12px 0 0;font-size:12px;color:#9CA3AF;">- ${escapeHtml(fields.authorName)}, AIMS Support</p>
        </div>
        ${btn("View Full Conversation", portalUrl)}
        ${p("You can reply directly from your portal or respond to this email.")}
      `
      return emailLayout(body, "The AIMS team replied to your support ticket.")
    }

    case "support-status-change": {
      const portalUrl = "https://www.aioperatorcollective.com/portal/support"
      const safeSubject = escapeHtml(fields.subject)
      const statusLabels: Record<string, string> = {
        resolved: "Resolved",
        closed: "Closed",
        in_progress: "In Progress",
      }
      const statusLabel = statusLabels[fields.newStatus] ?? fields.newStatus
      const body = `
        ${h1(`Your support ticket has been ${statusLabel.toLowerCase()}`)}
        ${p(`Hey ${escapeHtml(fields.clientName)} - we are writing to let you know your ticket has been updated.`)}
        <div style="background:#F9FAFB;border-left:4px solid ${fields.newStatus === "resolved" ? "#22C55E" : "#981B1B"};border-radius:6px;padding:20px 24px;margin:0 0 24px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${fields.newStatus === "resolved" ? "#22C55E" : "#981B1B"};text-transform:uppercase;letter-spacing:0.08em;">Status: ${statusLabel}</p>
          <p style="margin:8px 0 0;font-size:16px;font-weight:600;color:#111827;">${safeSubject}</p>
        </div>
        ${fields.resolutionNote ? `
          <div style="background:#F0FDF4;border-radius:8px;padding:16px;margin:0 0 24px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#16A34A;text-transform:uppercase;">Resolution</p>
            <p style="margin:0;font-size:14px;color:#374151;white-space:pre-wrap;line-height:1.7;">${escapeHtml(fields.resolutionNote)}</p>
          </div>
        ` : ""}
        ${p("If you need further help, you can reopen this ticket or create a new one from your portal.")}
        ${btn("View Ticket", portalUrl)}
      `
      return emailLayout(body, `Your support ticket "${safeSubject}" has been ${statusLabel.toLowerCase()}.`)
    }
  }
}

// ─── Page component ─────────────────────────────────────────────────────────

export default function EmailPreviewsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("welcome")
  const [fields, setFields] = useState<Record<string, string>>(() => getDefaultFields("welcome"))
  const [copied, setCopied] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleTemplateChange = useCallback((template: TemplateType) => {
    setSelectedTemplate(template)
    setFields(getDefaultFields(template))
    setCopied(false)
    setDropdownOpen(false)
  }, [])

  const handleFieldChange = useCallback((key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }))
    setCopied(false)
  }, [])

  const html = useMemo(() => buildEmailHtml(selectedTemplate, fields), [selectedTemplate, fields])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(html)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea")
      textarea.value = html
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [html])

  const fieldMeta = useMemo(() => getFieldMeta(selectedTemplate), [selectedTemplate])
  const selectedLabel = TEMPLATE_OPTIONS.find((o) => o.value === selectedTemplate)?.label ?? ""

  return (
    <div>
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin/dashboard" },
            { label: "Email Previews" },
          ]}
        />
        <h1 className="text-2xl font-bold text-foreground">Email Previews</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Preview and test all transactional email templates.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
        {/* Left panel: controls */}
        <div className="space-y-6">
          {/* Template selector */}
          <div className="rounded-xl border border-border bg-card p-5">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Template
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground hover:border-primary/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  {selectedLabel}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                  {TEMPLATE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleTemplateChange(opt.value)}
                      className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                        opt.value === selectedTemplate
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-surface/80"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Field inputs */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Test Data
            </p>
            <div className="space-y-3">
              {fieldMeta.map((meta) => (
                <div key={meta.key}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {meta.label}
                  </label>
                  {meta.type === "select" ? (
                    <select
                      value={fields[meta.key] ?? ""}
                      onChange={(e) => handleFieldChange(meta.key, e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                    >
                      {meta.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : meta.key === "message" || meta.key === "replyMessage" || meta.key === "resolutionNote" ? (
                    <textarea
                      value={fields[meta.key] ?? ""}
                      onChange={(e) => handleFieldChange(meta.key, e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={fields[meta.key] ?? ""}
                      onChange={(e) => handleFieldChange(meta.key, e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              copied
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied to Clipboard
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy HTML
              </>
            )}
          </button>
        </div>

        {/* Right panel: preview */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Preview
            </p>
            <span className="text-xs text-muted-foreground">
              {(html.length / 1024).toFixed(1)} KB
            </span>
          </div>
          <div className="p-4">
            <iframe
              srcDoc={html}
              title="Email preview"
              className="w-full rounded-lg border border-border bg-white"
              style={{ minHeight: 700, height: "calc(100vh - 280px)" }}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
