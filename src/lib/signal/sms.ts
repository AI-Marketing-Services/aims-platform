import { logApiCost } from "@/lib/ai"
import { logger } from "@/lib/logger"
import type { DigestItem } from "./digest"

const BLOO_BASE = "https://backend.blooio.com/v2/api"

export async function sendSignalSms(params: { phone: string; items: DigestItem[]; userId: string }) {
  const key = process.env.BLOO_API_KEY
  if (!key) {
    logger.warn("BLOO_API_KEY not set, skipping signal SMS")
    return
  }
  if (params.items.length === 0) return

  const lead = params.items[0]
  const rest = params.items.length - 1
  const body =
    rest > 0
      ? `${lead.topicLabel.toUpperCase()}: ${lead.headline}\n${lead.url}\n\n+${rest} more: https://www.aioperatorcollective.com/portal/signal`
      : `${lead.topicLabel.toUpperCase()}: ${lead.headline}\n${lead.url}`

  const phone = encodeURIComponent(params.phone)
  const res = await fetch(`${BLOO_BASE}/chats/${phone}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: body.slice(0, 480) }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    logger.error("blooio SMS failed", { status: res.status, detail: detail.slice(0, 200) })
    throw new Error(`blooio SMS failed: ${res.status}`)
  }

  logApiCost({
    provider: "blooio",
    model: "sms",
    endpoint: "/chats/messages",
    tokens: 0,
    cost: 0.01,
    serviceArm: "signal",
    clientId: params.userId,
  })
}
