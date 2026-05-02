import { NextResponse } from "next/server"
import { sendTrackedEmail, emailLayout } from "@/lib/email"
import { AOC_FROM_EMAIL, AOC_REPLY_TO } from "@/lib/email/senders"
import { sendAbandonedApplicationEmail } from "@/lib/email/abandoned-application"
import { sendPostBookingConfirmationEmail, buildPostBookingEducationEmail } from "@/lib/email/post-booking-education"
import { sendAIPlaybookEmail } from "@/lib/email/ai-playbook"
import { sendBookingReminderEmail } from "@/lib/email/booking-reminder"
import { sendCollectiveInviteEmail } from "@/lib/email/collective-invite"
import { sendOperatorVaultEmail } from "@/lib/email/operator-vault"
import { buildOperatorVaultEmail } from "@/lib/email/community-sequence"
import { buildBusinessAIAuditEmail } from "@/lib/email/business-audit-sequence"
import { buildW2PlaybookEmail } from "@/lib/email/w2-playbook-sequence"
import {
  sendQuizResultsEmail,
  sendCalculatorResultsEmail,
  sendAuditResultsEmail,
  sendCreditScoreEmail,
  sendOpsAuditEmail,
  sendBusinessAIAuditEmail as sendBusinessAIAuditInlineEmail,
  sendW2PlaybookEmail as sendW2PlaybookInlineEmail,
} from "@/lib/email/lead-magnet-results"
import {
  sendTicketConfirmationEmail,
  sendReplyNotificationToClient,
  sendTicketStatusChangeEmail,
} from "@/lib/email/support"
import { buildAIPlaybookPDF } from "@/lib/pdf/ai-playbook"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"
export const maxDuration = 120

const TO = "adamwolfe102@gmail.com"
const NAME = "Adam (test)"
const FAKE_URL = "https://www.aioperatorcollective.com"

type Result = { template: string; ok: boolean; error?: string }

async function fire(label: string, fn: () => Promise<unknown>): Promise<Result> {
  try {
    await fn()
    return { template: label, ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error(`test-emails: ${label} failed`, err)
    return { template: label, ok: false, error: msg }
  }
}

async function fireSequence(
  label: string,
  builder: (i: number, meta: Record<string, unknown>) => { subject: string; html: string } | null,
  count: number,
  meta: Record<string, unknown>
): Promise<Result[]> {
  const results: Result[] = []
  for (let i = 0; i < count; i++) {
    const content = builder(i, meta)
    if (!content) {
      results.push({ template: `${label} [${i}]`, ok: false, error: "builder returned null" })
      continue
    }
    results.push(
      await fire(`${label} [${i}]`, () =>
        sendTrackedEmail({
          from: AOC_FROM_EMAIL,
          to: TO,
          replyTo: AOC_REPLY_TO,
          subject: `[TEST] ${content.subject}`,
          html: emailLayout(content.html, content.subject),
          serviceArm: "ai-operator-collective",
        })
      )
    )
  }
  return results
}

export async function GET(req: Request) {
  // Production guard: this route blasts ~30 emails on every call and shares
  // CRON_SECRET with 13 other cron jobs (single point of failure). Disable
  // it entirely in prod unless the operator explicitly opts in via env.
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_TEST_EMAILS) {
    return new Response(null, { status: 404 })
  }

  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Belt-and-suspenders: require an explicit confirmation query param so a
  // stray browser fetch / curl with the bearer token doesn't fire 30 emails
  // by accident.
  const url = new URL(req.url)
  if (url.searchParams.get("confirm") !== "YES") {
    return NextResponse.json(
      { error: "Confirmation required. Append ?confirm=YES to fire the test blast." },
      { status: 400 },
    )
  }

  const results: Result[] = []

  // Build PDF once for templates that need it
  let pdfBuffer: Buffer | null = null
  try { pdfBuffer = await buildAIPlaybookPDF() } catch { /* skip attachment if build fails */ }

  // ── Transactional ─────────────────────────────────────────────────────────
  results.push(await fire("abandoned-application", () =>
    sendAbandonedApplicationEmail({ to: TO, name: NAME })
  ))

  results.push(await fire("post-booking-confirmation (day 0 + PDF)", () =>
    sendPostBookingConfirmationEmail({
      to: TO,
      name: NAME,
      eventStartTime: new Date(Date.now() + 2 * 86400_000).toISOString(),
      meetingUrl: "https://zoom.us/j/test",
      rescheduleUrl: FAKE_URL,
      cancelUrl: FAKE_URL,
    })
  ))

  if (pdfBuffer) {
    results.push(await fire("ai-playbook (with PDF attachment)", () =>
      sendAIPlaybookEmail({ to: TO, name: NAME, pdfBuffer })
    ))
  } else {
    results.push({ template: "ai-playbook (with PDF attachment)", ok: false, error: "PDF build failed — skipped" })
  }

  results.push(await fire("booking-reminder day-2", () =>
    sendBookingReminderEmail({ to: TO, name: NAME, day: 2 })
  ))
  results.push(await fire("booking-reminder day-5", () =>
    sendBookingReminderEmail({ to: TO, name: NAME, day: 5 })
  ))
  results.push(await fire("booking-reminder day-9", () =>
    sendBookingReminderEmail({ to: TO, name: NAME, day: 9 })
  ))

  results.push(await fire("collective-invite", () =>
    sendCollectiveInviteEmail({ to: TO, firstName: NAME, tier: "community" })
  ))

  results.push(await fire("operator-vault chapter-1 (inline)", () =>
    sendOperatorVaultEmail({ to: TO, name: NAME })
  ))

  // ── Lead magnet results ────────────────────────────────────────────────────
  results.push(await fire("quiz-results", () =>
    sendQuizResultsEmail({ to: TO, name: NAME, score: 72, resultsUrl: FAKE_URL, data: {} })
  ))
  results.push(await fire("calculator-results", () =>
    sendCalculatorResultsEmail({ to: TO, name: NAME, resultsUrl: FAKE_URL, data: {}, results: { monthlySavings: 4200 } })
  ))
  results.push(await fire("audit-results", () =>
    sendAuditResultsEmail({ to: TO, name: NAME, score: 58, resultsUrl: FAKE_URL, data: {}, results: {} })
  ))
  results.push(await fire("credit-score", () =>
    sendCreditScoreEmail({ to: TO, name: NAME, score: 55, resultsUrl: FAKE_URL })
  ))
  results.push(await fire("ops-audit", () =>
    sendOpsAuditEmail({ to: TO, name: NAME, score: 65, resultsUrl: FAKE_URL, data: { scores: { costOfInefficiency: 48000, aiRoiPotential: 120000 } } })
  ))
  results.push(await fire("business-ai-audit inline delivery", () =>
    sendBusinessAIAuditInlineEmail({
      to: TO,
      name: NAME,
      resultsUrl: FAKE_URL,
      results: {
        report: {
          companyName: "Test Co",
          opportunityScore: 78,
          opportunities: [{ rank: 1, title: "AI Content", problem: "Manual", solution: "Automate it" }],
          priorityMove: { title: "Ship an AI content workflow", firstStep: "Pick one content type and automate it this week." },
        },
      },
    })
  ))
  results.push(await fire("w2-playbook inline delivery", () =>
    sendW2PlaybookInlineEmail({ to: TO, name: NAME, resultsUrl: FAKE_URL })
  ))

  // ── Support ───────────────────────────────────────────────────────────────
  results.push(await fire("support-ticket-confirmation", () =>
    sendTicketConfirmationEmail({ to: TO, name: NAME, subject: "Test support issue", ticketId: "TKT-0001" })
  ))
  results.push(await fire("support-reply-to-client", () =>
    sendReplyNotificationToClient({ to: TO, clientName: NAME, subject: "Test support issue", replyMessage: "Here's the fix...", authorName: "Adam", ticketId: "TKT-0001" })
  ))
  results.push(await fire("support-ticket-resolved", () =>
    sendTicketStatusChangeEmail({ to: TO, clientName: NAME, subject: "Test support issue", newStatus: "resolved", resolutionNote: "Fixed and deployed.", ticketId: "TKT-0001" })
  ))

  // ── Drip sequences ────────────────────────────────────────────────────────
  results.push(...await fireSequence(
    "post-booking-education", buildPostBookingEducationEmail, 4,
    { name: NAME, eventStartTime: new Date(Date.now() + 86400_000).toISOString(), meetingUrl: "https://zoom.us/j/test" }
  ))

  results.push(...await fireSequence(
    "operator-vault drip", buildOperatorVaultEmail, 5,
    { name: NAME }
  ))

  results.push(...await fireSequence(
    "business-ai-audit drip", buildBusinessAIAuditEmail, 2,
    { name: NAME, company: "Test Co", submissionId: "test-123" }
  ))

  results.push(...await fireSequence(
    "w2-playbook drip", buildW2PlaybookEmail, 2,
    { name: NAME }
  ))

  const sent = results.filter((r) => r.ok).length
  const failed = results.filter((r) => !r.ok).length

  return NextResponse.json({ sent, failed, total: results.length, results })
}
