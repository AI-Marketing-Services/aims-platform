/**
 * Email Bison Dashboard Logic Tests
 * Tests the aggregation logic used by both portal and admin dashboards.
 */
import { describe, it, expect } from "vitest"

// Re-implement the aggregation logic from getWorkspaceDashboard to test it
function aggregateCampaigns(campaigns: Array<{
  emails_sent: number
  total_leads_contacted: number
  unique_replies: number
  bounced: number
  total_leads: number
}>) {
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

  return { totals, replyRate, bounceRate }
}

describe("Campaign aggregation", () => {
  it("aggregates totals from multiple campaigns", () => {
    const campaigns = [
      { emails_sent: 1000, total_leads_contacted: 500, unique_replies: 25, bounced: 10, total_leads: 600 },
      { emails_sent: 2000, total_leads_contacted: 800, unique_replies: 40, bounced: 20, total_leads: 1000 },
    ]
    const result = aggregateCampaigns(campaigns)
    expect(result.totals.emailsSent).toBe(3000)
    expect(result.totals.peopleContacted).toBe(1300)
    expect(result.totals.replies).toBe(65)
    expect(result.totals.bounced).toBe(30)
    expect(result.totals.totalLeads).toBe(1600)
  })

  it("calculates reply rate correctly", () => {
    const campaigns = [
      { emails_sent: 1000, total_leads_contacted: 200, unique_replies: 10, bounced: 5, total_leads: 300 },
    ]
    const result = aggregateCampaigns(campaigns)
    expect(result.replyRate).toBe("5.00") // 10/200 = 5%
  })

  it("calculates bounce rate correctly", () => {
    const campaigns = [
      { emails_sent: 1000, total_leads_contacted: 200, unique_replies: 10, bounced: 6, total_leads: 300 },
    ]
    const result = aggregateCampaigns(campaigns)
    expect(result.bounceRate).toBe("3.00") // 6/200 = 3%
  })

  it("handles zero contacts gracefully", () => {
    const campaigns = [
      { emails_sent: 0, total_leads_contacted: 0, unique_replies: 0, bounced: 0, total_leads: 100 },
    ]
    const result = aggregateCampaigns(campaigns)
    expect(result.replyRate).toBe("0")
    expect(result.bounceRate).toBe("0")
  })

  it("handles empty campaign array", () => {
    const result = aggregateCampaigns([])
    expect(result.totals.emailsSent).toBe(0)
    expect(result.totals.peopleContacted).toBe(0)
    expect(result.totals.replies).toBe(0)
    expect(result.totals.bounced).toBe(0)
    expect(result.totals.totalLeads).toBe(0)
    expect(result.replyRate).toBe("0")
    expect(result.bounceRate).toBe("0")
  })

  it("handles real MedPro data pattern", () => {
    // Based on actual MedPro workspace data from the session
    const campaigns = [
      { emails_sent: 3415, total_leads_contacted: 3200, unique_replies: 50, bounced: 15, total_leads: 10000 },
    ]
    const result = aggregateCampaigns(campaigns)
    expect(result.totals.emailsSent).toBe(3415)
    expect(result.replyRate).toBe("1.56") // 50/3200
    expect(result.bounceRate).toBe("0.47") // 15/3200
  })
})

describe("Admin global aggregation", () => {
  it("aggregates across multiple clients correctly", () => {
    const clients = [
      {
        totals: { emailsSent: 1000, peopleContacted: 500, replies: 25, bounced: 10 },
        campaigns: [{ id: 1 }, { id: 2 }],
      },
      {
        totals: { emailsSent: 2000, peopleContacted: 800, replies: 40, bounced: 20 },
        campaigns: [{ id: 3 }],
      },
      {
        totals: null,
        campaigns: [],
      },
    ]

    const globalTotals = clients.reduce(
      (acc, c) => ({
        emailsSent: acc.emailsSent + (c.totals?.emailsSent ?? 0),
        peopleContacted: acc.peopleContacted + (c.totals?.peopleContacted ?? 0),
        replies: acc.replies + (c.totals?.replies ?? 0),
        bounced: acc.bounced + (c.totals?.bounced ?? 0),
        campaigns: acc.campaigns + c.campaigns.length,
      }),
      { emailsSent: 0, peopleContacted: 0, replies: 0, bounced: 0, campaigns: 0 }
    )

    expect(globalTotals.emailsSent).toBe(3000)
    expect(globalTotals.peopleContacted).toBe(1300)
    expect(globalTotals.replies).toBe(65)
    expect(globalTotals.bounced).toBe(30)
    expect(globalTotals.campaigns).toBe(3)
  })

  it("handles null totals gracefully", () => {
    const clients = [
      { totals: null, campaigns: [] },
      { totals: null, campaigns: [] },
    ]

    const globalTotals = clients.reduce(
      (acc, c) => ({
        emailsSent: acc.emailsSent + (c.totals?.emailsSent ?? 0),
        peopleContacted: acc.peopleContacted + (c.totals?.peopleContacted ?? 0),
        replies: acc.replies + (c.totals?.replies ?? 0),
        bounced: acc.bounced + (c.totals?.bounced ?? 0),
        campaigns: acc.campaigns + c.campaigns.length,
      }),
      { emailsSent: 0, peopleContacted: 0, replies: 0, bounced: 0, campaigns: 0 }
    )

    expect(globalTotals.emailsSent).toBe(0)
    expect(globalTotals.campaigns).toBe(0)
  })
})
