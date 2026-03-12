import { logApiCost } from "@/lib/ai"

const BASE_URL = "https://send.aimanagingservices.com/api"
const API_KEY = process.env.EMAIL_BISON_API_KEY!

async function ebFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options?.headers,
    },
    next: { revalidate: 300 }, // 5-min cache
  })
  if (!res.ok) throw new Error(`Email Bison API error: ${res.status} ${path}`)
  // Log each EB API call (~$0 direct cost but useful for usage tracking)
  logApiCost({ provider: "emailbison", model: "api", endpoint: path, tokens: 0, cost: 0 }).catch(() => {})
  return res.json()
}

export interface EBWorkspace {
  id: number
  name: string
  personal_team: boolean
  main: boolean
  sender_email_limit: number
  created_at: string
}

export interface EBCampaign {
  id: number
  uuid: string
  name: string
  type: string
  status: string
  completion_percentage: number
  emails_sent: number
  replied: number
  unique_replies: number
  bounced: number
  unsubscribed: number
  interested: number
  total_leads_contacted: number
  total_leads: number
  max_emails_per_day: number
}

export interface EBCampaignStats {
  emails_sent: number
  total_leads_contacted: number
  opened: number
  opened_percentage: number
  unique_replies_per_contact: number
  unique_replies_per_contact_percentage: number
  bounced: number
  bounced_percentage: number
  unsubscribed: number
  interested: number
  sequence_step_stats: Array<{
    sequence_step_id: number
    email_subject: string
    sent: number
    leads_contacted: number
    unique_replies: number
    bounced: number
  }>
}

export async function getWorkspaces(): Promise<EBWorkspace[]> {
  const data = await ebFetch("/workspaces")
  return data.data ?? []
}

export async function getCampaigns(workspaceId: number): Promise<EBCampaign[]> {
  const data = await ebFetch(`/campaigns?workspaceId=${workspaceId}`)
  return data.data ?? []
}

export async function getCampaignStats(
  campaignId: number,
  startDate: string,
  endDate: string
): Promise<EBCampaignStats> {
  const data = await ebFetch(`/campaigns/${campaignId}/stats`, {
    method: "POST",
    body: JSON.stringify({ start_date: startDate, end_date: endDate }),
  })
  return data.data
}

export async function getWorkspaceDashboard(workspaceId: number) {
  const campaigns = await getCampaigns(workspaceId)

  // Aggregate stats across all campaigns
  const totals = campaigns.reduce(
    (acc, c) => ({
      emailsSent: acc.emailsSent + c.emails_sent,
      peopleContacted: acc.peopleContacted + c.total_leads_contacted,
      replies: acc.replies + c.unique_replies,
      bounced: acc.bounced + c.bounced,
      totalLeads: acc.totalLeads + c.total_leads,
    }),
    { emailsSent: 0, peopleContacted: 0, replies: 0, bounced: 0, totalLeads: 0 }
  )

  const replyRate =
    totals.peopleContacted > 0
      ? ((totals.replies / totals.peopleContacted) * 100).toFixed(2)
      : "0"
  const bounceRate =
    totals.peopleContacted > 0
      ? ((totals.bounced / totals.peopleContacted) * 100).toFixed(2)
      : "0"

  return { campaigns, totals, replyRate, bounceRate }
}
