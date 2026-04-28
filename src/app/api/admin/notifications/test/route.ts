import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { requireAdmin } from "@/lib/auth"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

/**
 * Admin-only Slack test ping. Posts directly to SLACK_WEBHOOK_URL so we
 * can isolate "is the webhook reachable from the runtime" from "is the
 * notify() pipeline working" — if a deploy breaks something, this tells
 * the admin which half is broken.
 */
export async function POST() {
  const adminId = await requireAdmin()
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const webhook = process.env.SLACK_WEBHOOK_URL
  if (!webhook) {
    return NextResponse.json(
      {
        error:
          "SLACK_WEBHOOK_URL is not set in this environment. Add it in Vercel (Production + Preview) and redeploy.",
      },
      { status: 503 },
    )
  }

  const { userId } = await auth()
  const cu = await currentUser()
  const who =
    [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") ||
    cu?.fullName ||
    cu?.emailAddresses?.[0]?.emailAddress ||
    "an admin"
  const env = process.env.VERCEL_ENV ?? "local"

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `:white_check_mark: *Slack wiring test*\nFired by *${who}* from \`${env}\` at ${new Date().toLocaleString("en-US", { timeZone: "America/New_York", timeZoneName: "short" })}.`,
            },
          },
        ],
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      logger.error("Slack test webhook returned non-2xx", undefined, {
        endpoint: "POST /api/admin/notifications/test",
        userId: userId ?? undefined,
        action: `slack:${res.status}:${body.slice(0, 80)}`,
      })
      return NextResponse.json(
        { error: `Slack returned ${res.status}: ${body || "(empty)"}` },
        { status: 502 },
      )
    }
    return NextResponse.json({ ok: true, env, who })
  } catch (err) {
    logger.error("Slack test webhook fetch failed", err, {
      endpoint: "POST /api/admin/notifications/test",
      userId: userId ?? undefined,
    })
    return NextResponse.json(
      { error: "Could not reach Slack — check the webhook URL." },
      { status: 502 },
    )
  }
}
