/**
 * Close CRM REST API integration
 * Docs: https://developer.close.com/
 * API key: Settings > API Keys in Close dashboard
 */

import { logger } from "@/lib/logger"

const CLOSE_API_BASE = "https://api.close.com/api/v1"
const CLOSE_TIMEOUT_MS = 10_000
const CLOSE_MAX_RETRIES = 2

// Stage → Close status ID mapping
export const CLOSE_STATUS_MAP: Record<string, string> = {
  NEW_LEAD:            "",                                               // no status on creation
  QUALIFIED:           "stat_kY1aMGKOui3jjlgniY2LQWMadXN78cr7vTHVMPDCliy", // Follow Up
  DEMO_BOOKED:         "stat_lGHxEKwhbVswuchbpRo6XcMMSXz0fV4CID9qFWT8KCO", // Call Booked
  PROPOSAL_SENT:       "stat_vL6LDuMPhQHcpNvvT6bA6Ofc0soHWDBks1azdq8UTJk", // Contract Sent
  NEGOTIATION:         "stat_vL6LDuMPhQHcpNvvT6bA6Ofc0soHWDBks1azdq8UTJk", // Contract Sent
  ACTIVE_CLIENT:       "stat_0oW3iRpVp9z5DJq0cuwI1HgR0XhHAhykEPPIq4TFsxd", // Closed / Won
  UPSELL_OPPORTUNITY:  "stat_mRxbAkfEqzEcmEF2Z5CkucMQocXAbwzs0hSlD0SzHEh", // Long Term Follow Up
  AT_RISK:             "stat_kY1aMGKOui3jjlgniY2LQWMadXN78cr7vTHVMPDCliy", // Follow Up
  CHURNED:             "stat_aR2jBa8YnTNZmHAnPsnlQuinBdaXpSBCkZGP3UvoBlV", // Lost
  LOST:                "stat_aR2jBa8YnTNZmHAnPsnlQuinBdaXpSBCkZGP3UvoBlV", // Lost
}

function closeHeaders(): HeadersInit | null {
  const key = process.env.CLOSE_API_KEY
  if (!key) return null
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
  }
}

/**
 * Fetch wrapper with timeout and retry for Close API calls.
 * Retries on network errors and 429 (rate limit) responses.
 */
async function closeFetch(
  url: string,
  options: RequestInit,
  context: string
): Promise<Response | null> {
  for (let attempt = 0; attempt <= CLOSE_MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), CLOSE_TIMEOUT_MS)

      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Retry on rate limit with exponential backoff
      if (res.status === 429 && attempt < CLOSE_MAX_RETRIES) {
        const retryAfter = parseInt(res.headers.get("retry-after") ?? "2", 10)
        const delayMs = Math.min(retryAfter * 1000, 5000) * (attempt + 1)
        logger.warn(`Close API rate limited, retrying in ${delayMs}ms`, {
          action: context,
        })
        await new Promise((resolve) => setTimeout(resolve, delayMs))
        continue
      }

      return res
    } catch (err) {
      const isTimeout = err instanceof DOMException && err.name === "AbortError"
      const isNetworkError = err instanceof TypeError

      if ((isTimeout || isNetworkError) && attempt < CLOSE_MAX_RETRIES) {
        const delayMs = 1000 * (attempt + 1)
        logger.warn(`Close API ${isTimeout ? "timeout" : "network error"}, retrying in ${delayMs}ms`, {
          action: context,
        })
        await new Promise((resolve) => setTimeout(resolve, delayMs))
        continue
      }

      logger.error(`Close API ${context} failed after ${attempt + 1} attempts`, err, {
        action: context,
      })
      return null
    }
  }

  return null
}

export async function createCloseLead(params: {
  contactName: string
  contactEmail: string
  company?: string | null
  phone?: string | null
  website?: string | null
  source?: string | null
  services?: string[]
  dealId: string
}): Promise<string | null> {
  const headers = closeHeaders()
  if (!headers) return null

  const res = await closeFetch(
    `${CLOSE_API_BASE}/lead/`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: params.company ?? params.contactName,
        url: params.website ?? undefined,
        description: [
          `Source: ${params.source ?? "AIMS platform"}`,
          params.services?.length ? `Interested in: ${params.services.join(", ")}` : "",
          `AIMS Deal ID: ${params.dealId}`,
        ].filter(Boolean).join("\n"),
        contacts: [
          {
            name: params.contactName,
            emails: [{ email: params.contactEmail, type: "office" }],
            ...(params.phone ? { phones: [{ phone: params.phone, type: "office" }] } : {}),
          },
        ],
      }),
    },
    "createLead"
  )

  if (!res) return null

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "unknown")
    logger.error("Close lead creation failed", undefined, {
      action: `createLead:${res.status}`,
      dealId: params.dealId,
    })
    // Log error body separately only in dev (may contain PII)
    if (process.env.NODE_ENV !== "production") {
      logger.warn(`Close createLead response: ${errorBody}`)
    }
    return null
  }

  try {
    const lead = await res.json()
    return lead.id as string
  } catch (err) {
    logger.error("Close createLead: failed to parse response", err, {
      action: "createLead",
      dealId: params.dealId,
    })
    return null
  }
}

export async function updateCloseLeadStatus(
  closeLeadId: string,
  stage: string
): Promise<boolean> {
  const headers = closeHeaders()
  if (!headers) return false

  const statusId = CLOSE_STATUS_MAP[stage]
  if (!statusId) return false

  const res = await closeFetch(
    `${CLOSE_API_BASE}/lead/${closeLeadId}/`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({ status_id: statusId }),
    },
    "updateStatus"
  )

  if (!res) return false

  if (!res.ok) {
    logger.error("Close updateStatus failed", undefined, {
      action: `updateStatus:${res.status}:${closeLeadId}`,
    })
    return false
  }

  return true
}

// Reverse mapping: Close status ID → label (for looking up current status)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CLOSE_STATUS_ID_TO_LABEL: Record<string, string> = Object.entries(CLOSE_STATUS_MAP).reduce(
  (acc, [stage, statusId]) => {
    if (statusId) {
      return { ...acc, [statusId]: stage }
    }
    return acc
  },
  {} as Record<string, string>
)

/**
 * Sync a deal stage change FROM AIMS TO Close CRM.
 * Call this whenever a deal stage is changed in the AIMS CRM Kanban.
 */
export async function syncDealStageToClose(
  closeLeadId: string,
  newStage: string,
  previousStage?: string
): Promise<boolean> {
  const headers = closeHeaders()
  if (!headers) return false

  const statusId = CLOSE_STATUS_MAP[newStage]
  if (!statusId) {
    logger.warn(`syncDealStageToClose: no Close status mapping for stage "${newStage}"`, {
      action: `syncDealStage:${newStage}`,
    })
    return false
  }

  const res = await closeFetch(
    `${CLOSE_API_BASE}/lead/${closeLeadId}/`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({ status_id: statusId }),
    },
    "syncDealStage"
  )

  if (!res) return false

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "unknown")
    logger.error("Close stage sync failed", undefined, {
      action: `syncDealStage:${res.status}:${closeLeadId}`,
    })
    if (process.env.NODE_ENV !== "production") {
      logger.warn(`Close syncDealStage response: ${errorBody}`)
    }
    return false
  }

  // Add a note documenting the change
  const noteText = previousStage
    ? `Stage changed in AIMS: ${previousStage} -> ${newStage}`
    : `Stage set in AIMS: ${newStage}`

  await addCloseNote(closeLeadId, noteText)

  return true
}

export async function addCloseNote(
  closeLeadId: string,
  note: string
): Promise<boolean> {
  const headers = closeHeaders()
  if (!headers) return false

  const res = await closeFetch(
    `${CLOSE_API_BASE}/activity/note/`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        lead_id: closeLeadId,
        note,
      }),
    },
    "addNote"
  )

  if (!res) return false

  if (!res.ok) {
    logger.error("Close addNote failed", undefined, {
      action: `addNote:${res.status}:${closeLeadId}`,
    })
    return false
  }

  return true
}
