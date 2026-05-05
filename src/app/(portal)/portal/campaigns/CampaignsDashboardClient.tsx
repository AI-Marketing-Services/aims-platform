"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Mail,
  TrendingUp,
  MessageSquare,
  Users,
  ArrowRight,
  BarChart3,
  RefreshCw,
  Megaphone,
} from "lucide-react"
import { motion } from "framer-motion"
import { EmptyState } from "@/components/shared/EmptyState"
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

interface DashboardData {
  connected: boolean
  workspaceName?: string
  totals?: {
    emailsSent: number
    peopleContacted: number
    replies: number
    bounced: number
    totalLeads: number
  }
  replyRate?: string
  bounceRate?: string
  campaigns?: CampaignData[]
  error?: string
}

export function CampaignsDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchData = useCallback(async (showSpinner = false, signal?: AbortSignal) => {
    if (showSpinner) setRefreshing(true)
    try {
      const res = await fetch("/api/portal/email-campaign", { signal })
      if (!res.ok) throw new Error("Failed to fetch")
      const json = await res.json()
      if (signal?.aborted) return
      setData(json)
      setLastRefresh(new Date())
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return
      setData({ connected: false })
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchData(false, controller.signal)
    const interval = setInterval(() => fetchData(false, controller.signal), 60_000)
    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">Loading campaign data...</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading campaign data...
        </div>
      </div>
    )
  }

  // Not connected - show upsell
  if (!data?.connected) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track performance across your active outbound and reactivation campaigns.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Campaign Dashboard Preview
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Activate Cold Outbound, Voice Agents, or Lead Reactivation to unlock
            your live campaign metrics.
          </p>
        </div>

        <div
          className="grid grid-cols-2 gap-4 sm:grid-cols-4 opacity-50 pointer-events-none select-none"
          aria-hidden="true"
        >
          {[
            { label: "Emails Sent", icon: Mail },
            { label: "People Contacted", icon: Users },
            { label: "Reply Rate", icon: MessageSquare },
            { label: "Bounce Rate", icon: TrendingUp },
          ].map(({ label, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
              <p className="text-2xl font-bold text-muted-foreground font-mono">&mdash;</p>
              <p className="text-xs text-muted-foreground mt-1">No data yet</p>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Get started with a campaign service
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { name: "Cold Outbound Engine", href: "/portal/marketplace" },
              { name: "AI Voice Agents", href: "/portal/marketplace" },
              { name: "Lead Reactivation", href: "/portal/marketplace" },
            ].map(({ name, href }) => (
              <a
                key={name}
                href={href}
                className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-all group flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Custom pricing</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Connected - show real data
  const totals = data.totals ?? { emailsSent: 0, peopleContacted: 0, replies: 0, bounced: 0, totalLeads: 0 }
  const replyRate = data.replyRate ?? "0"
  const bounceRate = data.bounceRate ?? "0"
  const campaigns = data.campaigns ?? []

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live data from <span className="font-medium text-foreground">{data.workspaceName}</span> workspace.
            {lastRefresh && (
              <> &middot; Updated {lastRefresh.toLocaleTimeString()}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </button>
          <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-primary/50 animate-pulse" />
            <span className="text-xs font-medium text-primary">Connected</span>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 stagger-in">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">Emails Sent</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono">
            {totals.emailsSent.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">People Contacted</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/5">
              <Users className="h-3.5 w-3.5 text-primary/70" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono">
            {totals.peopleContacted.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">Reply Rate</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/5">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono">
            {replyRate}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totals.replies.toLocaleString()} replies
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">Bounce Rate</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono">
            {bounceRate}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totals.bounced.toLocaleString()} bounced
          </p>
        </div>
      </div>

      {/* Campaign table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Campaigns</h2>
            <span className="text-xs text-muted-foreground">({campaigns.length})</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Campaign</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Leads</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Sent</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Replies</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Bounced</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Progress</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={Megaphone}
                      title="No campaigns found"
                      description="No campaigns are running in this workspace yet. Create one in your email tool to see live metrics here."
                    />
                  </td>
                </tr>
              )}
              {campaigns.map((campaign) => {
                const replyPct = campaign.total_leads_contacted > 0
                  ? ((campaign.unique_replies / campaign.total_leads_contacted) * 100).toFixed(1)
                  : "0"
                return (
                  <tr
                    key={campaign.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {campaign.max_emails_per_day > 0 ? `${campaign.max_emails_per_day}/day limit` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                        campaign.status === "active" || campaign.status === "running"
                          ? "border-primary/20 bg-primary/5 text-primary"
                          : campaign.status === "paused"
                          ? "border-primary/30 bg-primary/5 text-primary"
                          : "border-border bg-muted/40 text-muted-foreground"
                      }`}>
                        {campaign.status === "active" || campaign.status === "running" ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                        ) : null}
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {campaign.total_leads.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {campaign.emails_sent.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-foreground">{campaign.unique_replies}</span>
                      <span className="text-xs text-muted-foreground ml-1">({replyPct}%)</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {campaign.bounced}
                    </td>
                    <td className="px-4 py-3 w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min(campaign.completion_percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                          {Math.round(campaign.completion_percentage)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Data from Email Bison &middot; {data.workspaceName} workspace &middot; Auto-refreshes every 60 seconds
      </p>
    </div>
  )
}
