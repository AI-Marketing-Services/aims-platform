import { sendTrackedEmail, escapeHtml, emailLayout, h1, p, btn, divider } from "./index"
import { AIMS_FROM_EMAIL as FROM_EMAIL, AIMS_REPLY_TO as REPLY_TO } from "./senders"

function playCard(num: number, title: string, body: string) {
  return `
    <div style="border-left:3px solid #981B1B;padding:12px 16px;margin:0 0 12px;background:#F9FAFB;border-radius:0 6px 6px 0;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#981B1B;text-transform:uppercase;letter-spacing:0.06em;">Step ${num}</p>
      <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#111827;">${title}</p>
      <p style="margin:0;font-size:13px;color:#4B5563;line-height:1.6;">${body}</p>
    </div>
  `
}

/**
 * Send the AI Operating System Playbook email with PDF attached.
 * Called immediately after form submission.
 */
export async function sendAIPlaybookEmail(params: {
  to: string
  name: string
  pdfBuffer: Buffer
}) {
  const safeName = escapeHtml(params.name)
  const firstName = safeName.split(" ")[0] || "there"
  const strategyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aioperatorcollective.com"}/get-started`

  const body = `
    ${h1(`${firstName}, your AI Playbook is attached`)}
    ${p(`Thanks for downloading <strong style="color:#111827;">The AI Operating System for Business Owners</strong>. Your PDF is attached to this email - save it somewhere you will actually open it.`)}
    ${p("Here is what is inside:")}

    ${playCard(1, "Audit Your Business", "Pinpoint where AI can immediately reclaim time, eliminate errors, and multiply output across Sales, Ops, Marketing, Finance, and HR.")}
    ${playCard(2, "Choose Tools and Build Workflows", "Map the right AI tools to each function and build automated workflows that handle 80-90% of the repetitive work.")}
    ${playCard(3, "Test, Automate, and Measure", "Start with one high-value process, prove ROI fast, and track the metrics that matter - time saved, cost, output consistency.")}
    ${playCard(4, "Scale Across the Company", "Standardize winning workflows into SOPs and turn AI from a tool into a company-wide operating system.")}

    ${divider()}

    <div style="background:#08090D;border-radius:8px;padding:24px;text-align:center;margin:0 0 20px;">
      <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#F0EBE0;">Want us to deploy this for you?</p>
      <p style="margin:0 0 16px;font-size:13px;color:#9CA3AF;line-height:1.6;">
        AIMS builds AI infrastructure for businesses so you get the results without the learning curve.
        Book a free strategy call and we will map AIMS services to your biggest gaps.
      </p>
      ${btn("Book a Strategy Call", strategyUrl)}
    </div>

    ${p(`<em style="color:#6B7280;">P.S. The playbook includes 30+ ready-to-use prompts for Marketing, Sales, Customer Success, Product, Engineering, and Operations. Pick one department and ship one asset today.</em>`)}
  `

  return sendTrackedEmail({
    from: FROM_EMAIL,
    to: params.to,
    replyTo: REPLY_TO,
    subject: "Your AI Operating System Playbook is ready",
    html: emailLayout(
      body,
      "Your AI Operating System Playbook is attached. 4 steps to deploy AI across your business.",
      params.to
    ),
    attachments: [
      {
        filename: "AIMS-AI-Operating-System-Playbook.pdf",
        content: params.pdfBuffer,
        contentType: "application/pdf",
      },
    ],
    serviceArm: "lead-magnet",
  })
}
