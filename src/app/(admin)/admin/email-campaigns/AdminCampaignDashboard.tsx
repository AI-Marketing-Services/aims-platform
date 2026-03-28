"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Mail,
  Users,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CampaignData {
  id: number
  name: string
  status: string
  emails_sent: number
  total_leads_contacted: number
  total_leads: number
  unique_replies: number
  bounced: number
  completion_percentage: number
  max_emails_per_day: number
}

interface ClientDashboard {
  userId: string
  name: string | null
  email: string
  company: string | null
  workspaceId: number
  workspaceName: string
  totals: {
    emailsSent: number
    peopleContacted: number
    replies: number
    bounced: number
    totalLeads: number
  } | null
  replyRate: string | null
  bounceRate: string | null
  campaigns: CampaignData[]
}

export function AdminCampaignDashboard() {
  const [clients, setClients] = useState<ClientDashboard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)
    try {
      const res = await fetch("/api/admin/emailbison/dashboard")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setClients(data.clients ?? [])
      setError(null)
      setLastRefresh(new Date())
    } catch {
      setError("Failed to load campaign data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial fetch + auto-refresh every 60 seconds
  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(), 60_000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading campaign data for all clients...
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No clients have Email Bison workspaces connected yet.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Assign a workspace above to start seeing campaign data.
        </p>
      </div>
    )
  }

  // Aggregate totals across all clients
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

  const globalReplyRate = globalTotals.peopleContacted > 0
    ? ((globalTotals.replies / globalTotals.peopleContacted) * 100).toFixed(2)
    : "0"

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Live Campaign Data</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {clients.length} connected client{clients.length !== 1 ? "s" : ""} &middot; {globalTotals.campaigns} campaign{globalTotals.campaigns !== 1 ? "s" : ""}
            {lastRefresh && (
              <> &middot; Updated {lastRefresh.toLocaleTimeString()}</>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {error}
        </div>
      )}

      {/* Global stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-in">
        <div className="rounded-xl border border-border bg-card p-4 micro-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Total Emails Sent</p>
            <Mail className="h-3.5 w-3.5 text-[#C4972A]" />
          </div>
          <p className="text-xl font-bold text-foreground font-mono">
            {globalTotals.emailsSent.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 micro-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">People Contacted</p>
            <Users className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <p className="text-xl font-bold text-foreground font-mono">
            {globalTotals.peopleContacted.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 micro-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Total Replies</p>
            <MessageSquare className="h-3.5 w-3.5 text-green-400" />
          </div>
          <p className="text-xl font-bold text-foreground font-mono">
            {globalTotals.replies.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{globalReplyRate}% rate</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 micro-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Bounced</p>
            <TrendingUp className="h-3.5 w-3.5 text-orange-400" />
          </div>
          <p className="text-xl font-bold text-foreground font-mono">
            {globalTotals.bounced.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Per-client breakdown */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-8" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Workspace</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sent</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contacted</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Replies</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reply %</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Campaigns</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              const isExpanded = expandedClient === client.userId
              return (
                <>
                  <tr
                    key={client.userId}
                    onClick={() => setExpandedClient(isExpanded ? null : client.userId)}
                    className="border-b border-border hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{client.name || client.email}</p>
                      {client.company && <p className="text-xs text-muted-foreground">{client.company}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{client.workspaceName}</td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {(client.totals?.emailsSent ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {(client.totals?.peopleContacted ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {(client.totals?.replies ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {client.replyRate ?? "0"}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {client.campaigns.length}
                    </td>
                  </tr>
                  {isExpanded && client.campaigns.length > 0 && (
                    <tr key={`${client.userId}-detail`}>
                      <td colSpan={8} className="bg-muted/10 px-4 py-4">
                        <div className="ml-8 space-y-2">
                          {client.campaigns.map((campaign) => {
                            const replyPct = campaign.total_leads_contacted > 0
                              ? ((campaign.unique_replies / campaign.total_leads_contacted) * 100).toFixed(1)
                              : "0"
                            return (
                              <div
                                key={campaign.id}
                                className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground text-sm truncate">{campaign.name}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className={cn(
                                      "text-xs px-1.5 py-0.5 rounded border font-medium",
                                      campaign.status === "active" || campaign.status === "running"
                                        ? "text-green-400 bg-green-900/15 border-green-800"
                                        : campaign.status === "paused"
                                        ? "text-yellow-400 bg-yellow-900/20 border-yellow-800"
                                        : "text-muted-foreground bg-deep border-border"
                                    )}>
                                      {campaign.status}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {campaign.max_emails_per_day > 0 ? `${campaign.max_emails_per_day}/day` : ""}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-6 text-xs">
                                  <div className="text-center">
                                    <p className="font-mono font-medium text-foreground">{campaign.total_leads.toLocaleString()}</p>
                                    <p className="text-muted-foreground">leads</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-mono font-medium text-foreground">{campaign.emails_sent.toLocaleString()}</p>
                                    <p className="text-muted-foreground">sent</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-mono font-medium text-foreground">{campaign.unique_replies}</p>
                                    <p className="text-muted-foreground">replies ({replyPct}%)</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-mono font-medium text-foreground">{campaign.bounced}</p>
                                    <p className="text-muted-foreground">bounced</p>
                                  </div>
                                  <div className="w-24">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-[#C4972A] rounded-full"
                                          style={{ width: `${Math.min(campaign.completion_percentage, 100)}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-mono text-muted-foreground">
                                        {Math.round(campaign.completion_percentage)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                  {isExpanded && client.campaigns.length === 0 && (
                    <tr key={`${client.userId}-empty`}>
                      <td colSpan={8} className="bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground">
                        No campaigns found in this workspace.
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
