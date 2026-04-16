import { db } from "@/lib/db"
import { sendInternalNotification } from "@/lib/email"
import { logger } from "@/lib/logger"

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

interface NotificationPayload {
  type: string
  title: string
  message: string
  channel?: "IN_APP" | "SLACK" | "EMAIL" | "ALL"
  userId?: string
  metadata?: Record<string, unknown>
  urgency?: "low" | "normal" | "high"
}

export async function notify(payload: NotificationPayload) {
  const channel = payload.channel ?? "ALL"

  const promises: Promise<unknown>[] = []

  // In-app notification
  if (channel === "IN_APP" || channel === "ALL") {
    promises.push(
      db.notification.create({
        data: {
          userId: payload.userId,
          channel: "IN_APP",
          type: payload.type,
          title: payload.title,
          message: payload.message,
          metadata: payload.metadata as object,
        },
      })
    )
  }

  // Slack notification
  if ((channel === "SLACK" || channel === "ALL") && SLACK_WEBHOOK_URL) {
    const emoji =
      payload.urgency === "high"
        ? ":rotating_light:"
        : payload.type.includes("new_lead")
          ? ":dart:"
          : payload.type.includes("purchase")
            ? ":moneybag:"
            : payload.type.includes("churn")
              ? ":warning:"
              : ":clipboard:"

    promises.push(
      fetch(SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `${emoji} *${payload.title}*\n${payload.message}`,
              },
            },
          ],
        }),
      }).catch((err) => logger.error("Slack notification failed", err))
    )
  }

  // Email notification
  if (channel === "EMAIL" || channel === "ALL") {
    promises.push(
      sendInternalNotification({
        subject: payload.title,
        message: payload.message,
        urgency: payload.urgency,
      }).catch((err) => logger.error("Email notification failed", err))
    )
  }

  await Promise.allSettled(promises)
}

// ============ PRE-BUILT NOTIFICATIONS ============

export async function notifyNewLead(deal: {
  contactName: string
  contactEmail: string
  company?: string
  source?: string
  channelTag?: string
  userId?: string
}) {
  await notify({
    type: "new_lead",
    title: "New Lead",
    message: `${deal.contactName}${deal.company ? ` (${deal.company})` : ""} - ${deal.contactEmail}\nSource: ${deal.source ?? "direct"}${deal.channelTag ? ` | Channel: ${deal.channelTag}` : ""}`,
    userId: deal.userId,
  })
}

export async function notifyNewPurchase(params: {
  clientName: string
  serviceName: string
  tier?: string
  amount: number
  userId?: string
}) {
  await notify({
    type: "new_purchase",
    title: "New Purchase",
    message: `${params.clientName} subscribed to ${params.serviceName}${params.tier ? ` (${params.tier})` : ""} at $${params.amount}/mo`,
    urgency: "high",
    userId: params.userId,
  })
}

export async function notifyChurnRisk(params: {
  clientName: string
  email: string
  daysSinceLogin: number
  mrr: number
}) {
  await notify({
    type: "churn_risk",
    title: "Churn Risk Detected",
    message: `${params.clientName} (${params.email}) hasn't logged in for ${params.daysSinceLogin} days. MRR at risk: $${params.mrr}`,
    urgency: "high",
  })
}

export async function notifyApiCostSpike(params: {
  provider: string
  currentCost: number
  previousCost: number
  percentIncrease: number
}) {
  await notify({
    type: "api_cost_spike",
    title: "API Cost Spike",
    message: `${params.provider} costs up ${params.percentIncrease.toFixed(0)}% this week ($${params.previousCost.toFixed(2)} → $${params.currentCost.toFixed(2)})`,
    urgency: "high",
  })
}

export async function notifyFulfillmentOverdue(params: {
  clientName: string
  serviceName: string
  taskTitle: string
  assignedTo: string
  daysOverdue: number
}) {
  await notify({
    type: "fulfillment_overdue",
    title: "Fulfillment Task Overdue",
    message: `"${params.taskTitle}" for ${params.clientName} (${params.serviceName}) is ${params.daysOverdue} days overdue. Assigned to: ${params.assignedTo}`,
    urgency: "high",
  })
}

export async function notifyMissedEOD(internName: string) {
  await notify({
    type: "missed_eod",
    title: "Missed EOD Report",
    message: `${internName} didn't submit their end-of-day report`,
    channel: "SLACK",
  })
}

export async function notifyHotLead(params: {
  dealId: string
  name: string
  email: string
  phone?: string | null
  score: number
  tier: string
  country?: string | null
  reason?: string | null
  calLink?: string | null
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aims-platform.vercel.app"
  const crmUrl = `${appUrl}/admin/crm/${params.dealId}`

  // In-app + email via standard notify (preserves existing behavior)
  await notify({
    type: "new_lead_hot",
    title: `HOT LEAD: ${params.name} (${params.score}/100)`,
    message: `${params.email}${params.phone ? ` | ${params.phone}` : ""}${params.country ? ` | ${params.country}` : ""}\n${params.reason ?? ""}`,
    urgency: "high",
    channel: "ALL",
    metadata: { dealId: params.dealId, score: params.score, tier: params.tier },
  })

  // Rich Slack block — posted in addition to the plain Slack message above so
  // hot leads stand out with action buttons.
  const slack = process.env.SLACK_WEBHOOK_URL
  if (!slack) return
  try {
    await fetch(slack, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `🚨 HOT LEAD: ${params.name}`,
              emoji: true,
            },
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Score:* ${params.score}/100 (${params.tier})` },
              { type: "mrkdwn", text: `*Email:* ${params.email}` },
              ...(params.phone ? [{ type: "mrkdwn", text: `*Phone:* ${params.phone}` }] : []),
              ...(params.country ? [{ type: "mrkdwn", text: `*Country:* ${params.country}` }] : []),
            ],
          },
          ...(params.reason
            ? [
                {
                  type: "section",
                  text: { type: "mrkdwn", text: `*Signals:* ${params.reason}` },
                },
              ]
            : []),
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "Open in CRM" },
                url: crmUrl,
                style: "primary",
              },
              ...(params.calLink
                ? [
                    {
                      type: "button",
                      text: { type: "plain_text", text: "Matt's Calendar" },
                      url: params.calLink.startsWith("http")
                        ? params.calLink
                        : `https://calendly.com/${params.calLink}`,
                    },
                  ]
                : []),
            ],
          },
        ],
      }),
    })
  } catch (err) {
    logger.error("Failed to send hot lead Slack notification", err)
  }
}
