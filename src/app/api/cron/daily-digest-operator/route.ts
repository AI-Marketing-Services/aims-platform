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
 * Daily operator digest — runs every weekday at 7am ET (12:00 UTC).
 * vercel.json: { "path": "/api/cron/daily-digest-operator", "schedule": "0 12 * * 1-5" }
 *
 * For every active operator (RESELLER role with notifMarketingDigest=true),
 * builds a personalized morning brief and sends via Resend:
 *   - Hot leads from the last 24h (audit submissions on their quizzes)
 *   - Stale follow-ups (Deals untouched 7+ days, still in pipeline)
 *   - Yesterday's wins (Deals advanced to COMPLETED in last 24h)
 *   - Pipeline value snapshot
 *   - Quick action: open today's dashboard
 *
 * Skips operators with no signal (no recent leads, no stale deals,
 * no wins) so we don't spam empty inboxes — they'll re-receive a
 * digest the day they actually have something to act on.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()
  const now = new Date()
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  let sent = 0
  let skipped = 0
  let errors = 0

  try {
    // Pull every operator who could plausibly receive a digest. We'll
    // gate per-user on signal availability + opt-in below.
    const operators = await db.user.findMany({
      where: {
        role: { in: ["RESELLER", "ADMIN", "SUPER_ADMIN"] },
        emailNotifs: true, // master kill-switch for any auto email
      },
      select: {
        id: true,
        email: true,
        name: true,
        notifMarketingDigest: true,
      },
    })

    for (const op of operators) {
      // Honor user-level digest opt-out. Default is false (we don't
      // spam newcomers); they enable in /portal/settings.
      if (!op.notifMarketingDigest) {
        skipped += 1
        continue
      }

      try {
        const [hotLeads, staleDeals, recentWins, pipelineSnapshot] = await Promise.all([
          // Hot leads = audit submissions in last 24h via OperatorEvent
          db.operatorEvent.findMany({
            where: {
              actorId: op.id,
              type: EVENT_TYPES.AUDIT_COMPLETED,
              createdAt: { gte: since24h },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          }),
          // Stale deals = open pipeline, untouched 7d
          db.clientDeal.findMany({
            where: {
              userId: op.id,
              stage: { notIn: ["COMPLETED", "LOST"] },
              updatedAt: { lt: since7d },
            },
            orderBy: { updatedAt: "asc" },
            take: 5,
            select: { id: true, companyName: true, stage: true, updatedAt: true, value: true },
          }),
          // Wins = Deals advanced to COMPLETED in last 24h
          db.clientDeal.findMany({
            where: {
              userId: op.id,
              stage: "COMPLETED",
              wonAt: { gte: since24h },
            },
            select: { id: true, companyName: true, value: true, currency: true },
            take: 5,
          }),
          // Pipeline snapshot
          db.clientDeal.aggregate({
            where: {
              userId: op.id,
              stage: { notIn: ["COMPLETED", "LOST"] },
            },
            _sum: { value: true },
            _count: { _all: true },
          }),
        ])

        const hasSignal =
          hotLeads.length > 0 || staleDeals.length > 0 || recentWins.length > 0
        if (!hasSignal) {
          skipped += 1
          continue
        }

        const firstName = op.name?.split(" ")[0] ?? "there"
        const html = renderDigestHtml({
          firstName,
          recipientEmail: op.email,
          hotLeads: hotLeads.map((e) => {
            const meta = (e.metadata as Record<string, unknown> | null) ?? {}
            return {
              when: e.createdAt,
              leadEmail: typeof meta.leadEmail === "string" ? meta.leadEmail : null,
              leadCompany: typeof meta.leadCompany === "string" ? meta.leadCompany : null,
              quizTitle: typeof meta.quizTitle === "string" ? meta.quizTitle : "Audit",
            }
          }),
          staleDeals,
          recentWins,
          pipelineCount: pipelineSnapshot._count._all,
          pipelineValue: pipelineSnapshot._sum.value ?? 0,
        })

        await sendTrackedEmail({
          from: AIMS_FROM_EMAIL,
          to: op.email,
          replyTo: AIMS_REPLY_TO,
          subject: buildSubject(hotLeads.length, recentWins.length, staleDeals.length, firstName),
          html,
          serviceArm: "operator-digest",
        })
        sent += 1
      } catch (err) {
        errors += 1
        logger.error("Operator digest send failed", err, {
          userId: op.id,
        })
      }
    }

    const duration = Date.now() - startTime
    await logCronExecution(
      "daily-digest-operator",
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
    logger.error("Operator digest cron crashed", err, {
      endpoint: "/api/cron/daily-digest-operator",
    })
    await logCronExecution(
      "daily-digest-operator",
      "error",
      `crash sent=${sent} skipped=${skipped}`,
      Date.now() - startTime,
    )
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

function buildSubject(
  hotCount: number,
  winCount: number,
  staleCount: number,
  firstName: string,
): string {
  if (winCount > 0) {
    return `${firstName}, you closed ${winCount} deal${winCount === 1 ? "" : "s"} yesterday`
  }
  if (hotCount > 0) {
    return `${firstName}, ${hotCount} new lead${hotCount === 1 ? "" : "s"} for you to follow up`
  }
  if (staleCount > 0) {
    return `${firstName}, ${staleCount} deal${staleCount === 1 ? "" : "s"} need${staleCount === 1 ? "s" : ""} a follow-up`
  }
  return `${firstName}, your morning brief`
}

function renderDigestHtml(args: {
  firstName: string
  recipientEmail: string
  hotLeads: Array<{
    when: Date
    leadEmail: string | null
    leadCompany: string | null
    quizTitle: string
  }>
  staleDeals: Array<{ id: string; companyName: string; stage: string; value: number; updatedAt: Date }>
  recentWins: Array<{ id: string; companyName: string; value: number; currency: string }>
  pipelineCount: number
  pipelineValue: number
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.aioperatorcollective.com"

  const winsBlock =
    args.recentWins.length > 0
      ? `
        <h3 style="margin:24px 0 8px;font-size:14px;font-weight:700;color:#111827;">🎉 Yesterday's wins</h3>
        <ul style="margin:0 0 0 20px;padding:0;font-size:14px;color:#374151;">
          ${args.recentWins
            .map(
              (w) =>
                `<li style="margin:0 0 4px;"><strong>${escapeHtml(w.companyName)}</strong>${w.value > 0 ? ` — $${w.value.toLocaleString()}` : ""}</li>`,
            )
            .join("")}
        </ul>
      `
      : ""

  const hotBlock =
    args.hotLeads.length > 0
      ? `
        <h3 style="margin:24px 0 8px;font-size:14px;font-weight:700;color:#111827;">🔥 New leads (last 24h)</h3>
        <ul style="margin:0 0 0 20px;padding:0;font-size:14px;color:#374151;">
          ${args.hotLeads
            .map(
              (l) =>
                `<li style="margin:0 0 4px;"><strong>${escapeHtml(l.leadCompany ?? l.leadEmail ?? "Anonymous")}</strong> — completed <em>${escapeHtml(l.quizTitle)}</em></li>`,
            )
            .join("")}
        </ul>
        <p style="margin:8px 0 0;font-size:13px;color:#6B7280;">Reach out within the hour for the best conversion rate.</p>
      `
      : ""

  const staleBlock =
    args.staleDeals.length > 0
      ? `
        <h3 style="margin:24px 0 8px;font-size:14px;font-weight:700;color:#111827;">⏱ Deals due for a touch</h3>
        <ul style="margin:0 0 0 20px;padding:0;font-size:14px;color:#374151;">
          ${args.staleDeals
            .map((d) => {
              const days = Math.floor(
                (Date.now() - new Date(d.updatedAt).getTime()) / 86400000,
              )
              return `<li style="margin:0 0 4px;"><strong>${escapeHtml(d.companyName)}</strong> — ${escapeHtml(d.stage)} · ${days}d quiet</li>`
            })
            .join("")}
        </ul>
      `
      : ""

  const pipelineBlock =
    args.pipelineCount > 0
      ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin:24px 0;">
          <tr style="background:#F9FAFB;">
            <td style="padding:14px 18px;">
              <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.06em;">Open pipeline</p>
              <p style="margin:0;font-size:16px;color:#111827;">
                <strong>${args.pipelineCount}</strong> deal${args.pipelineCount === 1 ? "" : "s"} · <strong>$${args.pipelineValue.toLocaleString()}</strong> total value
              </p>
            </td>
          </tr>
        </table>
      `
      : ""

  return emailLayout(
    `
      ${h1(`Good morning, ${escapeHtml(args.firstName)}`)}
      ${p(`Here's what's happening across your pipeline.`)}
      ${winsBlock}
      ${hotBlock}
      ${staleBlock}
      ${pipelineBlock}
      ${btn("Open your dashboard →", `${appUrl}/portal/dashboard`)}
      ${divider()}
      ${p(`This digest only sends on days where you have new leads, follow-ups due, or wins to celebrate. Quiet days = no email.`)}
    `,
    `Your morning brief — ${args.hotLeads.length} new leads, ${args.recentWins.length} wins.`,
    args.recipientEmail,
  )
}
