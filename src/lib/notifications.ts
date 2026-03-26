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
