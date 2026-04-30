import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logCronExecution } from "@/lib/cron-log"
import { logger } from "@/lib/logger"
import { sendTrackedEmail, emailLayout, h1, p, btn, divider, escapeHtml } from "@/lib/email"
import { AIMS_FROM_EMAIL, AIMS_REPLY_TO } from "@/lib/email/senders"
import { EVENT_TYPES } from "@/lib/events/emit"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Weekly performance roll-up. Runs every Monday at 8am ET (13:00 UTC).
 * vercel.json: { "path": "/api/cron/weekly-rollup", "schedule": "0 13 * * 1" }
 *
 * Different framing from the daily digest (which says "act now"):
 * the weekly roll-up answers "did last week move the needle?" so the
 * operator can see momentum, set the week's intentions, and stay
 * motivated even on slow weeks.
 *
 * Includes:
 *   - Wins last week: deals advanced to ACTIVE_RETAINER or COMPLETED
 *   - Pipeline movement: net dollars added (deals created - deals lost)
 *   - Activity score: outreach, calls, notes, proposals sent
 *   - Open pipeline snapshot
 *   - Top dollar opportunities sitting idle (high-value, no touch in 5+ days)
 *   - Encouraging callout when the week was zero-signal (don't ghost them)
 *
 * Honors notifMarketingDigest opt-in. Skipping is preferable to spam,
 * but we DO send the encouragement email even on quiet weeks because
 * the value is the regular cadence + reflective prompt, not just news.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()
  const now = new Date()
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const since5d = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)

  let sent = 0
  let skipped = 0
  let errors = 0

  try {
    const operators = await db.user.findMany({
      where: {
        role: { in: ["RESELLER", "ADMIN", "SUPER_ADMIN"] },
        emailNotifs: true,
        notifMarketingDigest: true,
      },
      select: { id: true, email: true, name: true },
    })

    for (const op of operators) {
      try {
        const [
          newWins,
          newRetainers,
          newDeals,
          newLosses,
          activityCount,
          proposalsSent,
          pipelineSnapshot,
          idleHighValue,
        ] = await Promise.all([
          // Wins = COMPLETED last 7d
          db.clientDeal.findMany({
            where: { userId: op.id, stage: "COMPLETED", wonAt: { gte: since7d } },
            select: { id: true, companyName: true, value: true, currency: true },
            take: 10,
          }),
          // New retainers = ACTIVE_RETAINER set in last 7d (use updatedAt
          // as a proxy because we don't track stage-change timestamps
          // independently of updatedAt)
          db.clientDeal.findMany({
            where: {
              userId: op.id,
              stage: "ACTIVE_RETAINER",
              updatedAt: { gte: since7d },
            },
            select: { id: true, companyName: true, value: true },
            take: 10,
          }),
          // Deals created last 7d (raw count for pipeline-add metric)
          db.clientDeal.findMany({
            where: { userId: op.id, createdAt: { gte: since7d } },
            select: { value: true },
          }),
          // Deals lost last 7d
          db.clientDeal.findMany({
            where: { userId: op.id, stage: "LOST", updatedAt: { gte: since7d } },
            select: { value: true },
          }),
          // Activity volume = any logged activity in last 7d
          db.clientDealActivity.count({
            where: {
              clientDeal: { userId: op.id },
              createdAt: { gte: since7d },
            },
          }),
          // Proposals sent last 7d
          db.operatorEvent.count({
            where: {
              actorId: op.id,
              type: EVENT_TYPES.PROPOSAL_SENT,
              createdAt: { gte: since7d },
            },
          }),
          // Snapshot of open pipeline
          db.clientDeal.aggregate({
            where: {
              userId: op.id,
              stage: { notIn: ["COMPLETED", "LOST"] },
            },
            _sum: { value: true },
            _count: { _all: true },
          }),
          // High-value deals (>$2K) that haven't been touched in 5+ days
          db.clientDeal.findMany({
            where: {
              userId: op.id,
              stage: { notIn: ["COMPLETED", "LOST"] },
              value: { gte: 2000 },
              updatedAt: { lt: since5d },
            },
            orderBy: { value: "desc" },
            take: 5,
            select: { id: true, companyName: true, value: true, stage: true, updatedAt: true },
          }),
        ])

        const newPipelineDollars = newDeals.reduce((s, d) => s + d.value, 0)
        const lostDollars = newLosses.reduce((s, d) => s + d.value, 0)
        const wonDollars = newWins.reduce((s, d) => s + d.value, 0)

        const firstName = op.name?.split(" ")[0] ?? "there"

        const html = renderWeeklyHtml({
          firstName,
          recipientEmail: op.email,
          newWins,
          newRetainers,
          newDealCount: newDeals.length,
          newPipelineDollars,
          lostCount: newLosses.length,
          lostDollars,
          activityCount,
          proposalsSent,
          pipelineCount: pipelineSnapshot._count._all,
          pipelineValue: pipelineSnapshot._sum.value ?? 0,
          wonDollars,
          idleHighValue,
        })

        await sendTrackedEmail({
          from: AIMS_FROM_EMAIL,
          to: op.email,
          replyTo: AIMS_REPLY_TO,
          subject: buildWeeklySubject({
            firstName,
            wins: newWins.length,
            wonDollars,
            newPipelineDollars,
            activityCount,
          }),
          html,
          serviceArm: "operator-weekly-rollup",
        })
        sent += 1
      } catch (err) {
        errors += 1
        logger.error("Weekly roll-up send failed", err, { userId: op.id })
      }
    }

    const duration = Date.now() - startTime
    await logCronExecution(
      "weekly-rollup",
      errors === 0 ? "success" : "error",
      `sent=${sent} skipped=${skipped} errors=${errors} total=${operators.length}`,
      duration,
    )

    return NextResponse.json({
      ok: true,
      sent,
      skipped,
      errors,
      durationMs: duration,
    })
  } catch (err) {
    logger.error("Weekly roll-up cron crashed", err, {
      endpoint: "/api/cron/weekly-rollup",
    })
    await logCronExecution(
      "weekly-rollup",
      "error",
      `crash sent=${sent} skipped=${skipped}`,
      Date.now() - startTime,
    )
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

function buildWeeklySubject(args: {
  firstName: string
  wins: number
  wonDollars: number
  newPipelineDollars: number
  activityCount: number
}): string {
  if (args.wins > 0) {
    const dollarsBlurb = args.wonDollars > 0 ? ` ($${args.wonDollars.toLocaleString()})` : ""
    return `${args.firstName}, you closed ${args.wins} deal${args.wins === 1 ? "" : "s"} last week${dollarsBlurb}`
  }
  if (args.newPipelineDollars >= 5000) {
    return `${args.firstName}, you added $${args.newPipelineDollars.toLocaleString()} to pipeline last week`
  }
  if (args.activityCount >= 10) {
    return `${args.firstName}, your week in review: ${args.activityCount} activities logged`
  }
  return `${args.firstName}, this week's intention setter`
}

function renderWeeklyHtml(args: {
  firstName: string
  recipientEmail: string
  newWins: Array<{ id: string; companyName: string; value: number; currency: string }>
  newRetainers: Array<{ id: string; companyName: string; value: number }>
  newDealCount: number
  newPipelineDollars: number
  lostCount: number
  lostDollars: number
  activityCount: number
  proposalsSent: number
  pipelineCount: number
  pipelineValue: number
  wonDollars: number
  idleHighValue: Array<{ id: string; companyName: string; value: number; stage: string; updatedAt: Date }>
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aioperatorcollective.com"

  const winsBlock =
    args.newWins.length > 0
      ? `
        <h3 style="margin:24px 0 8px;font-size:14px;font-weight:700;color:#111827;">Wins last week</h3>
        <ul style="margin:0 0 0 20px;padding:0;font-size:14px;color:#374151;">
          ${args.newWins
            .map(
              (w) =>
                `<li style="margin:0 0 4px;"><strong>${escapeHtml(w.companyName)}</strong>${w.value > 0 ? ` ($${w.value.toLocaleString()})` : ""}</li>`,
            )
            .join("")}
        </ul>
      `
      : ""

  const retainersBlock =
    args.newRetainers.length > 0
      ? `
        <h3 style="margin:24px 0 8px;font-size:14px;font-weight:700;color:#111827;">New retainers</h3>
        <ul style="margin:0 0 0 20px;padding:0;font-size:14px;color:#374151;">
          ${args.newRetainers
            .map(
              (r) =>
                `<li style="margin:0 0 4px;"><strong>${escapeHtml(r.companyName)}</strong>${r.value > 0 ? ` ($${r.value.toLocaleString()}/mo)` : ""}</li>`,
            )
            .join("")}
        </ul>
      `
      : ""

  // Compact KPI grid. Always rendered so the email feels structured.
  const kpiBlock = `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;margin:24px 0;">
      <tr>
        <td width="33%" style="padding:14px 12px;border-right:1px solid #E5E7EB;text-align:center;">
          <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.06em;">New deals</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#111827;">${args.newDealCount}</p>
          <p style="margin:0;font-size:11px;color:#6B7280;">$${args.newPipelineDollars.toLocaleString()} added</p>
        </td>
        <td width="34%" style="padding:14px 12px;border-right:1px solid #E5E7EB;text-align:center;">
          <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.06em;">Activity</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#111827;">${args.activityCount}</p>
          <p style="margin:0;font-size:11px;color:#6B7280;">${args.proposalsSent} proposal${args.proposalsSent === 1 ? "" : "s"} sent</p>
        </td>
        <td width="33%" style="padding:14px 12px;text-align:center;">
          <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.06em;">Open pipeline</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#111827;">${args.pipelineCount}</p>
          <p style="margin:0;font-size:11px;color:#6B7280;">$${args.pipelineValue.toLocaleString()} total</p>
        </td>
      </tr>
    </table>
  `

  const idleBlock =
    args.idleHighValue.length > 0
      ? `
        <h3 style="margin:24px 0 8px;font-size:14px;font-weight:700;color:#111827;">Top dollar opportunities going cold</h3>
        <p style="margin:0 0 8px;font-size:13px;color:#6B7280;">High-value deals that haven&apos;t been touched in 5+ days. Worth a quick check-in.</p>
        <ul style="margin:0 0 0 20px;padding:0;font-size:14px;color:#374151;">
          ${args.idleHighValue
            .map((d) => {
              const days = Math.floor(
                (Date.now() - new Date(d.updatedAt).getTime()) / 86400000,
              )
              return `<li style="margin:0 0 4px;"><strong>${escapeHtml(d.companyName)}</strong> ($${d.value.toLocaleString()}) - ${escapeHtml(d.stage)}, ${days}d quiet</li>`
            })
            .join("")}
        </ul>
      `
      : ""

  // Encouraging close. If nothing happened, prompt reflection rather
  // than guilt-trip. Operators churn fastest when they feel like the
  // tool is judging them.
  const hasMomentum =
    args.newWins.length > 0 ||
    args.newRetainers.length > 0 ||
    args.newDealCount > 0 ||
    args.activityCount > 5
  const closingNote = hasMomentum
    ? `Nice work last week. Set one specific intention for this week, then open your pipeline and pick the deal that gets you there fastest.`
    : `Last week was quiet. That&apos;s totally fine: pick one thing to focus on this week. Reach out to 5 prospects, send 1 proposal, or close 1 stale deal as won/lost. Small moves compound.`

  return emailLayout(
    `
      ${h1(`${escapeHtml(args.firstName)}, your week in review`)}
      ${p(`A short snapshot of last week so you can plan this one.`)}
      ${kpiBlock}
      ${winsBlock}
      ${retainersBlock}
      ${idleBlock}
      ${p(closingNote)}
      ${btn("Open your pipeline", `${appUrl}/portal/crm`)}
      ${divider()}
      ${p(`These weekly summaries help you spot trends across months. You can turn them off in <a href="${appUrl}/portal/settings" style="color:#C4972A;">notification settings</a>.`)}
    `,
    `${args.firstName}, here is your week in review.`,
    args.recipientEmail,
  )
}
