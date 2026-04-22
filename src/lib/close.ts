/**
 * Close CRM REST API integration — AI Operator Collective partition.
 *
 * We share the Vendingpreneurs Close workspace with multiple brands. To
 * keep AIMS/AOC data isolated, every Close lead carries a custom field
 * called "BTC Business Line" (field ID cf_aJlNlilQZIgLLuhcymNN8fiOzewnFxrbWjLZFPmsucO).
 * When the value is "AI Operator Collective (AOC)" the lead belongs to
 * us; anything else (e.g. vending lines) we ignore.
 *
 * Every outbound createCloseLead call here stamps that field to AOC.
 * Every inbound sync / webhook path checks that field before touching
 * our CRM. One source of truth for partitioning.
 *
 * Docs: https://developer.close.com/
 * API key: Settings > API Keys in Close dashboard (env: CLOSE_API_KEY)
 */

import { logger } from "@/lib/logger"

const CLOSE_API_BASE = "https://api.close.com/api/v1"
const CLOSE_TIMEOUT_MS = 10_000
const CLOSE_MAX_RETRIES = 2

// ─── AOC partition identifiers ──────────────────────────────────────────
//
// BTC Business Line custom field. Stephen from Vendingpreneurs provided
// these — do NOT change them without confirming with him, since his
// automation (which sets the field when Ryan is the meeting host) is
// keyed on the same ID.
export const CLOSE_BTC_BUSINESS_LINE_FIELD = "cf_aJlNlilQZIgLLuhcymNN8fiOzewnFxrbWjLZFPmsucO"
export const CLOSE_AOC_VALUE = "AI Operator Collective (AOC)"

// Custom field payloads in Close are keyed as `custom.${fieldId}`.
export const CLOSE_AOC_CUSTOM_FIELD = `custom.${CLOSE_BTC_BUSINESS_LINE_FIELD}`

// AOC launch date — any Close lead created before this is treated as a
// legacy Vendingpreneurs lead, even if it carries the AOC tag. Stephen's
// retroactive automation has mis-tagged historical vending leads as AOC,
// so the tag alone is not sufficient; we combine it with a creation-date
// floor. Override via CLOSE_AOC_LAUNCH_DATE env (ISO string) if needed.
export const CLOSE_AOC_LAUNCH_DATE_DEFAULT = "2026-04-01T00:00:00Z"
export function aocLaunchDate(): Date {
  const raw = process.env.CLOSE_AOC_LAUNCH_DATE ?? CLOSE_AOC_LAUNCH_DATE_DEFAULT
  const d = new Date(raw)
  return isNaN(d.getTime()) ? new Date(CLOSE_AOC_LAUNCH_DATE_DEFAULT) : d
}

/**
 * Shape-only type for Close leads that we actually use. The real API
 * response has ~40 fields; we only care about these.
 */
export interface CloseLead {
  id: string
  display_name?: string
  name?: string
  description?: string
  url?: string | null
  status_id?: string
  status_label?: string
  contacts?: Array<{
    id?: string
    name?: string
    emails?: Array<{ email: string; type?: string }>
    phones?: Array<{ phone: string; type?: string }>
  }>
  opportunities?: CloseOpportunity[]
  date_created?: string
  date_updated?: string
  // Custom fields come back flattened as `custom.<id>: value`.
  [customFieldKey: `custom.${string}`]: unknown
}

export interface CloseOpportunity {
  id: string
  lead_id: string
  status_label?: string
  value?: number // dollars * 100 (Close uses cents — confirm per env)
  value_period?: "one_time" | "monthly" | "annual" | string
  confidence?: number
  date_created?: string
  date_won?: string | null
  date_lost?: string | null
}

// ─── Stage mapping (AIMS -> Close + Close -> AIMS) ──────────────────────

// AIMS DealStage -> Close status ID. Used by the outbound sync when we
// want to reflect a stage change in AIMS back into Close.
export const CLOSE_STATUS_MAP: Record<string, string> = {
  APPLICATION_SUBMITTED: "",                                               // no status on creation
  CONSULT_BOOKED:        "stat_lGHxEKwhbVswuchbpRo6XcMMSXz0fV4CID9qFWT8KCO", // Call Booked
  CONSULT_COMPLETED:     "stat_kY1aMGKOui3jjlgniY2LQWMadXN78cr7vTHVMPDCliy", // Follow Up
  MIGHTY_INVITED:        "stat_kY1aMGKOui3jjlgniY2LQWMadXN78cr7vTHVMPDCliy", // Follow Up
  MEMBER_JOINED:         "stat_0oW3iRpVp9z5DJq0cuwI1HgR0XhHAhykEPPIq4TFsxd", // Closed / Won
  LOST:                  "stat_aR2jBa8YnTNZmHAnPsnlQuinBdaXpSBCkZGP3UvoBlV", // Lost
}

// Close status ID -> AIMS stage. Stage IDs are stable; labels in this
// workspace are emoji-prefixed and can be renamed, so we key on IDs.
// Verified against the live Vendingpreneurs workspace 2026-04-17.
export const CLOSE_STATUS_ID_TO_AIMS_STAGE: Record<string, string> = {
  stat_EwxduBOxA2CLBUrvXAyB7ZrVXKGw7v9i5xz0f2JuIY9: "APPLICATION_SUBMITTED", // 🆕 New
  stat_nN6uLtk05n1MZML0gDFUVvP7zPpQOqOLQm4SsRuvdiW: "APPLICATION_SUBMITTED", // Webinar Lead
  stat_lGHxEKwhbVswuchbpRo6XcMMSXz0fV4CID9qFWT8KCO: "CONSULT_BOOKED",        // ☎️ Call Booked
  stat_2SmOUMCp1vDFJF0TcJ011hNnpLYWDGwugyo4JyiRMEP: "CONSULT_BOOKED",        // 🕛 Reschedule
  stat_kY1aMGKOui3jjlgniY2LQWMadXN78cr7vTHVMPDCliy: "CONSULT_COMPLETED",     // 📞 Follow Up
  stat_mRxbAkfEqzEcmEF2Z5CkucMQocXAbwzs0hSlD0SzHEh: "CONSULT_COMPLETED",     // 🗓️ Long Term Follow Up
  stat_vL6LDuMPhQHcpNvvT6bA6Ofc0soHWDBks1azdq8UTJk: "CONSULT_COMPLETED",     // 📄 Contract Sent
  stat_0oW3iRpVp9z5DJq0cuwI1HgR0XhHAhykEPPIq4TFsxd: "MEMBER_JOINED",         // 🏆 Closed / Won
  stat_aR2jBa8YnTNZmHAnPsnlQuinBdaXpSBCkZGP3UvoBlV: "LOST",                  // 💔 Lost
  stat_5CqIgNJnGYO357zXjSnH6BAkKyoCvYUOBxVvpYfDMZn: "LOST",                  // 👻 No Show
  stat_hWIGHjzyNpl4YjIFSFz3VK4fp2ny10SFJLKAihmo4KT: "LOST",                  // 🔻 Canceled (by Lead)
  stat_l8ATqabgtlrL7EKL5o0EL8ufBg8UMPxMJJP1AXI9V9i: "LOST",                  // 💤 Non-responsive
  stat_U9MI7pqsvIjceTv3pCU7b1EghO8Q83h1HUcL6fGVyi6: "LOST",                  // Do Not Contact
  stat_LP7GD0DeMzhsyVzRjjIjSwCK89OiXu1auVSOPxYy17Q: "LOST",                  // Off Ramp
  stat_YV4ZngDB4IGjLjlOf0YTFEWuKZJ6fhNxVkzQkvKYfdB: "LOST",                  // 🌎 Outside the US
}

// Label-keyed map kept as a fallback for webhook payloads that only
// include the label (some Close webhook event shapes do). Match the
// emoji-prefixed labels exactly.
export const CLOSE_LABEL_TO_AIMS_STAGE: Record<string, string> = {
  "🆕 New":                  "APPLICATION_SUBMITTED",
  "Webinar Lead":            "APPLICATION_SUBMITTED",
  "☎️ Call Booked":          "CONSULT_BOOKED",
  "🕛 Reschedule":           "CONSULT_BOOKED",
  "📞 Follow Up":            "CONSULT_COMPLETED",
  "🗓️ Long Term Follow Up":  "CONSULT_COMPLETED",
  "📄 Contract Sent":        "CONSULT_COMPLETED",
  "🏆 Closed / Won":         "MEMBER_JOINED",
  "💔 Lost":                 "LOST",
  "👻 No Show":              "LOST",
  "🔻 Canceled (by Lead)":   "LOST",
  "💤 Non-responsive":       "LOST",
  "Do Not Contact":          "LOST",
  "Off Ramp":                "LOST",
  "🌎 Outside the US":       "LOST",
  // Generic fallbacks (case-insensitive checked in consumer)
  "Call Booked":             "CONSULT_BOOKED",
  "Follow Up":               "CONSULT_COMPLETED",
  "Contract Sent":           "CONSULT_COMPLETED",
  "Closed / Won":            "MEMBER_JOINED",
  "Lost":                    "LOST",
}

export function closeStatusToAimsStage(params: {
  statusId?: string | null
  statusLabel?: string | null
}): string | null {
  if (params.statusId && CLOSE_STATUS_ID_TO_AIMS_STAGE[params.statusId]) {
    return CLOSE_STATUS_ID_TO_AIMS_STAGE[params.statusId]
  }
  if (params.statusLabel && CLOSE_LABEL_TO_AIMS_STAGE[params.statusLabel]) {
    return CLOSE_LABEL_TO_AIMS_STAGE[params.statusLabel]
  }
  return null
}

// ─── HTTP primitives ────────────────────────────────────────────────────

function closeHeaders(): HeadersInit | null {
  const key = process.env.CLOSE_API_KEY
  if (!key) return null
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
  }
}

/**
 * Fetch wrapper with timeout and retry for Close API calls. Retries on
 * network errors and 429 (rate limit) responses.
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
        logger.warn(
          `Close API ${isTimeout ? "timeout" : "network error"}, retrying in ${delayMs}ms`,
          { action: context }
        )
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

// ─── AOC-partition helpers ──────────────────────────────────────────────

/**
 * Returns true if the given Close lead payload has BTC Business Line
 * set to the AOC value. Used as the partition guard on every inbound
 * sync path so vending-line leads never touch our CRM.
 */
export function isAOCLead(lead: Partial<CloseLead> | null | undefined): boolean {
  if (!lead) return false
  const raw = (lead as Record<string, unknown>)[CLOSE_AOC_CUSTOM_FIELD]
  const tagMatch =
    typeof raw === "string"
      ? raw === CLOSE_AOC_VALUE
      : Array.isArray(raw)
      ? raw.includes(CLOSE_AOC_VALUE)
      : false
  if (!tagMatch) return false

  // Creation-date floor: reject legacy vending leads that got
  // retroactively tagged as AOC. If date_created is missing, allow it
  // through — that shape only shows up in older test fixtures.
  if (lead.date_created) {
    const created = new Date(lead.date_created)
    if (!isNaN(created.getTime()) && created < aocLaunchDate()) return false
  }
  return true
}

/**
 * Returns the primary contact email for a Close lead, or null.
 */
export function primaryEmail(lead: CloseLead): string | null {
  for (const c of lead.contacts ?? []) {
    const email = c.emails?.[0]?.email
    if (email) return email.toLowerCase()
  }
  return null
}

/**
 * Returns the primary contact name, falling back to lead display name.
 */
export function primaryName(lead: CloseLead): string {
  for (const c of lead.contacts ?? []) {
    if (c.name) return c.name
  }
  return lead.display_name ?? lead.name ?? "Unknown"
}

// ─── Create / update lead ───────────────────────────────────────────────

/**
 * Create a Close lead pre-stamped with BTC Business Line = AOC so
 * Stephen's shared workspace automation recognises it as ours.
 */
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
        ]
          .filter(Boolean)
          .join("\n"),
        contacts: [
          {
            name: params.contactName,
            emails: [{ email: params.contactEmail, type: "office" }],
            ...(params.phone ? { phones: [{ phone: params.phone, type: "office" }] } : {}),
          },
        ],
        // Stamp the AOC partition key so the shared workspace treats
        // this lead as ours. Without this the inbound sync won't pull
        // it back and Stephen's automation can't route it.
        [CLOSE_AOC_CUSTOM_FIELD]: CLOSE_AOC_VALUE,
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

/**
 * Update the status on an existing Close lead from an AIMS stage change.
 */
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

/**
 * Mirror an AIMS stage change back to Close and drop a note so the
 * change is visible in Close's activity stream.
 */
export async function syncDealStageToClose(
  closeLeadId: string,
  newStage: string,
  previousStage?: string
): Promise<boolean> {
  const ok = await updateCloseLeadStatus(closeLeadId, newStage)
  if (!ok) return false
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
      body: JSON.stringify({ lead_id: closeLeadId, note }),
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

// ─── Read / list ────────────────────────────────────────────────────────

/**
 * Fetch a single Close lead by ID with full custom-field payload.
 */
export async function getCloseLead(leadId: string): Promise<CloseLead | null> {
  const headers = closeHeaders()
  if (!headers) return null

  const res = await closeFetch(
    `${CLOSE_API_BASE}/lead/${leadId}/`,
    { method: "GET", headers },
    "getLead"
  )
  if (!res || !res.ok) return null
  return (await res.json()) as CloseLead
}

/**
 * List Close leads partitioned to AOC via the BTC Business Line custom
 * field. Pages internally until the cursor is exhausted or we hit the
 * safety cap.
 *
 * Close search uses a query string like:
 *   custom.cf_xxx:"AI Operator Collective (AOC)"
 * We URL-encode the field_id + value.
 */
export async function listAOCLeads(options?: {
  dateUpdatedAfter?: Date
  limit?: number
}): Promise<CloseLead[]> {
  const headers = closeHeaders()
  if (!headers) return []

  const launch = aocLaunchDate()
  const queryParts = [
    `${CLOSE_AOC_CUSTOM_FIELD}:"${CLOSE_AOC_VALUE}"`,
    // Creation-date floor — block legacy Vendingpreneurs leads that got
    // retroactively mis-tagged as AOC.
    `date_created >= "${launch.toISOString()}"`,
  ]
  if (options?.dateUpdatedAfter) {
    // Close supports `date_updated >= "ISO"` style filters.
    queryParts.push(`date_updated >= "${options.dateUpdatedAfter.toISOString()}"`)
  }
  const query = queryParts.join(" ")

  const MAX_PER_PAGE = 100
  const SAFETY_CAP = options?.limit ?? 1000
  const all: CloseLead[] = []

  let cursor: string | null = null
  // Guard against runaway pagination if the cursor never exhausts.
  let pages = 0

  do {
    const params = new URLSearchParams({
      query,
      _limit: String(Math.min(MAX_PER_PAGE, SAFETY_CAP - all.length)),
    })
    if (cursor) params.set("_cursor", cursor)

    const res = await closeFetch(
      `${CLOSE_API_BASE}/lead/?${params}`,
      { method: "GET", headers },
      "listAOCLeads"
    )
    if (!res || !res.ok) break

    const body = (await res.json()) as {
      data: CloseLead[]
      cursor_next?: string | null
      has_more?: boolean
    }

    all.push(...(body.data ?? []))
    cursor = body.cursor_next ?? null
    pages++
    if (!body.has_more) break
    if (pages > 50) break // hard cap: 5000 leads per call
  } while (cursor && all.length < SAFETY_CAP)

  return all
}

/**
 * List opportunities for a single lead. Used when we want to surface
 * real revenue tied to an AOC lead.
 */
export async function listLeadOpportunities(
  leadId: string
): Promise<CloseOpportunity[]> {
  const headers = closeHeaders()
  if (!headers) return []
  const res = await closeFetch(
    `${CLOSE_API_BASE}/opportunity/?lead_id=${encodeURIComponent(leadId)}`,
    { method: "GET", headers },
    "listLeadOpportunities"
  )
  if (!res || !res.ok) return []
  const body = (await res.json()) as { data?: CloseOpportunity[] }
  return body.data ?? []
}
