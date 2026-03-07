/**
 * Close CRM REST API integration
 * Docs: https://developer.close.com/
 * API key: Settings > API Keys in Close dashboard
 */

const CLOSE_API_BASE = "https://api.close.com/api/v1"

// Stage → Close status ID mapping
export const CLOSE_STATUS_MAP: Record<string, string> = {
  NEW_LEAD:            "",                                               // no status on creation
  QUALIFIED:           "stat_kY1aMGKOui3jjlgniY2LQWMadXN78cr7vTHVMPDCliy", // 📞 Follow Up
  DEMO_BOOKED:         "stat_lGHxEKwhbVswuchbpRo6XcMMSXz0fV4CID9qFWT8KCO", // ☎️ Call Booked
  PROPOSAL_SENT:       "stat_vL6LDuMPhQHcpNvvT6bA6Ofc0soHWDBks1azdq8UTJk", // 📄 Contract Sent
  NEGOTIATION:         "stat_vL6LDuMPhQHcpNvvT6bA6Ofc0soHWDBks1azdq8UTJk", // 📄 Contract Sent
  ACTIVE_CLIENT:       "stat_0oW3iRpVp9z5DJq0cuwI1HgR0XhHAhykEPPIq4TFsxd", // 🏆 Closed / Won
  UPSELL_OPPORTUNITY:  "stat_mRxbAkfEqzEcmEF2Z5CkucMQocXAbwzs0hSlD0SzHEh", // 🗓️ Long Term Follow Up
  AT_RISK:             "stat_kY1aMGKOui3jjlgniY2LQWMadXN78cr7vTHVMPDCliy", // 📞 Follow Up
  CHURNED:             "stat_aR2jBa8YnTNZmHAnPsnlQuinBdaXpSBCkZGP3UvoBlV", // 💔 Lost
  LOST:                "stat_aR2jBa8YnTNZmHAnPsnlQuinBdaXpSBCkZGP3UvoBlV", // 💔 Lost
}

function closeHeaders() {
  const key = process.env.CLOSE_API_KEY
  if (!key) return null
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
  }
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

  try {
    // Create the lead (company)
    const leadRes = await fetch(`${CLOSE_API_BASE}/lead/`, {
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
    })

    if (!leadRes.ok) {
      console.error("Close lead creation failed:", await leadRes.text())
      return null
    }

    const lead = await leadRes.json()
    return lead.id as string
  } catch (err) {
    console.error("Close API error (createLead):", err)
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

  try {
    const res = await fetch(`${CLOSE_API_BASE}/lead/${closeLeadId}/`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ status_id: statusId }),
    })

    return res.ok
  } catch (err) {
    console.error("Close API error (updateStatus):", err)
    return false
  }
}

export async function addCloseNote(
  closeLeadId: string,
  note: string
): Promise<boolean> {
  const headers = closeHeaders()
  if (!headers) return false

  try {
    const res = await fetch(`${CLOSE_API_BASE}/activity/note/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        lead_id: closeLeadId,
        note,
      }),
    })

    return res.ok
  } catch (err) {
    console.error("Close API error (addNote):", err)
    return false
  }
}
