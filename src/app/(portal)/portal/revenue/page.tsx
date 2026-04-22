"use client"

import { useEffect, useState } from "react"
import {
  TrendingUp,
  DollarSign,
  Target,
  BarChart2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────────

interface PipelineStage {
  stage: string
  count: number
  value: number
}

interface MonthlyTrendPoint {
  month: string
  collected: number
  pipeline: number
}

interface TopDeal {
  id: string
  companyName: string
  stage: string
  value: number
  daysOpen: number
}

interface RevenueData {
  mrr: number
  mrrChange: number
  pipelineValue: number
  pipelineCount: number
  wonThisMonth: number
  wonCountThisMonth: number
  lostThisMonth: number
  lostCountThisMonth: number
  closeRate: number
  avgDealSize: number
  invoiceOutstanding: number
  invoiceCollected: number
  invoiceCollectedThisMonth: number
  overdueCount: number
  pipelineByStage: PipelineStage[]
  monthlyTrend: MonthlyTrendPoint[]
  topDeals: TopDeal[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount)
}

function stageLabel(stage: string): string {
  const labels: Record<string, string> = {
    PROSPECT: "Prospect",
    DISCOVERY_CALL: "Discovery",
    PROPOSAL_SENT: "Proposal",
    ACTIVE_RETAINER: "Active",
    COMPLETED: "Completed",
    LOST: "Lost",
  }
  return labels[stage] ?? stage
}

function stageBadgeStyle(stage: string): string {
  const styles: Record<string, string> = {
    PROSPECT: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    DISCOVERY_CALL: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    PROPOSAL_SENT: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    ACTIVE_RETAINER: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    COMPLETED: "bg-[#C4972A]/10 text-[#C4972A] border border-[#C4972A]/20",
    LOST: "bg-red-500/10 text-red-400 border border-red-500/20",
  }
  return styles[stage] ?? "bg-[#1f2330] text-[#9CA3AF] border border-[#2a3040]"
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  sub?: string
  change?: number
  icon: React.ReactNode
  accent?: boolean
}

function StatCard({ label, value, sub, change, icon, accent }: StatCardProps) {
  const changePositive = change !== undefined && change >= 0
  return (
    <div className="bg-[#141923] border border-[#1f2d3d] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-semibold">{label}</span>
        <span className={`h-8 w-8 rounded-lg flex items-center justify-center ${accent ? "bg-[#C4972A]/10" : "bg-[#1f2d3d]"}`}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-[#F0EBE0] leading-none">{value}</p>
        {sub && <p className="text-[11px] text-[#6B7280] mt-1">{sub}</p>}
      </div>
      {change !== undefined && (
        <span
          className={`self-start inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            changePositive
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {changePositive ? "+" : ""}
          {change}% vs last month
        </span>
      )}
    </div>
  )
}

function BarChartCSS({ data }: { data: MonthlyTrendPoint[] }) {
  const maxVal = Math.max(...data.flatMap((d) => [d.collected, d.pipeline]), 1)

  return (
    <div className="flex items-end gap-3 h-40 w-full">
      {data.map((point) => {
        const collectedPct = Math.round((point.collected / maxVal) * 100)
        const pipelinePct = Math.round((point.pipeline / maxVal) * 100)
        return (
          <div key={point.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-end gap-0.5 h-32 w-full">
              {/* Collected bar (gold) */}
              <div className="flex-1 flex flex-col justify-end">
                <div
                  className="w-full rounded-t bg-[#C4972A] transition-all duration-500 min-h-[2px]"
                  style={{ height: `${collectedPct}%` }}
                  title={`Collected: ${fmt(point.collected)}`}
                />
              </div>
              {/* Pipeline bar (gray) */}
              <div className="flex-1 flex flex-col justify-end">
                <div
                  className="w-full rounded-t bg-[#2a3040] transition-all duration-500 min-h-[2px]"
                  style={{ height: `${pipelinePct}%` }}
                  title={`Pipeline: ${fmt(point.pipeline)}`}
                />
              </div>
            </div>
            <span className="text-[10px] text-[#6B7280] font-medium">{point.month}</span>
          </div>
        )
      })}
    </div>
  )
}

function PipelineStageBar({ stages }: { stages: PipelineStage[] }) {
  const maxVal = Math.max(...stages.map((s) => s.value), 1)

  return (
    <div className="space-y-3">
      {stages.map((s) => {
        const pct = Math.round((s.value / maxVal) * 100)
        return (
          <div key={s.stage} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#F0EBE0] font-medium">{stageLabel(s.stage)}</span>
              <div className="flex items-center gap-3">
                <span className="text-[#9CA3AF]">{s.count} deal{s.count !== 1 ? "s" : ""}</span>
                <span className="text-[#C4972A] font-semibold">{fmt(s.value)}</span>
              </div>
            </div>
            <div className="h-2 w-full bg-[#1f2d3d] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#C4972A] transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-[#141923] border border-[#1f2d3d] rounded-xl p-5 animate-pulse">
      <div className="h-3 w-20 bg-[#1f2d3d] rounded mb-4" />
      <div className="h-7 w-28 bg-[#1f2d3d] rounded mb-2" />
      <div className="h-3 w-16 bg-[#1f2d3d] rounded" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RevenueDashboardPage() {
  const [data, setData] = useState<RevenueData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/api/portal/revenue")
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as RevenueData
        if (!cancelled) {
          setData(json)
        }
      } catch {
        if (!cancelled) setError("Failed to load revenue data. Please try again.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-[#C4972A]/10 flex items-center justify-center shrink-0">
          <TrendingUp className="h-5 w-5 text-[#C4972A]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#F0EBE0]">Revenue Dashboard</h1>
          <p className="text-xs text-[#9CA3AF]">Pipeline health, close rates, and collected revenue at a glance</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Top row — 4 primary stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="MRR"
            value={fmt(data.mrr)}
            sub="active retainer + completed"
            change={data.mrrChange}
            icon={<DollarSign className="h-4 w-4 text-[#C4972A]" />}
            accent
          />
          <StatCard
            label="Pipeline Value"
            value={fmt(data.pipelineValue)}
            sub={`${data.pipelineCount} open deal${data.pipelineCount !== 1 ? "s" : ""}`}
            icon={<BarChart2 className="h-4 w-4 text-[#9CA3AF]" />}
          />
          <StatCard
            label="Close Rate"
            value={`${data.closeRate}%`}
            sub="last 90 days"
            icon={<Target className="h-4 w-4 text-[#9CA3AF]" />}
          />
          <StatCard
            label="Avg Deal Size"
            value={fmt(data.avgDealSize)}
            sub="won deals, last 90 days"
            icon={<TrendingUp className="h-4 w-4 text-[#9CA3AF]" />}
          />
        </div>
      ) : null}

      {/* Second row — won/lost + invoice stats */}
      {!loading && data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Won This Month"
              value={fmt(data.wonThisMonth)}
              sub={`${data.wonCountThisMonth} deal${data.wonCountThisMonth !== 1 ? "s" : ""} closed`}
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            />
            <StatCard
              label="Lost This Month"
              value={fmt(data.lostThisMonth)}
              sub={`${data.lostCountThisMonth} deal${data.lostCountThisMonth !== 1 ? "s" : ""} lost`}
              icon={<AlertCircle className="h-4 w-4 text-red-400" />}
            />
            <StatCard
              label="Outstanding Invoices"
              value={fmt(data.invoiceOutstanding)}
              sub="sent + overdue"
              icon={<Clock className="h-4 w-4 text-yellow-400" />}
            />
            <StatCard
              label="Collected This Month"
              value={fmt(data.invoiceCollectedThisMonth)}
              sub={data.overdueCount > 0 ? `${data.overdueCount} overdue` : "no overdue"}
              icon={<CheckCircle2 className="h-4 w-4 text-[#C4972A]" />}
              accent
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly Trend */}
            <div className="bg-[#141923] border border-[#1f2d3d] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-[#F0EBE0]">Monthly Trend</h2>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">Last 6 months</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[#9CA3AF]">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-[#C4972A] inline-block" />
                    Collected
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-[#2a3040] inline-block" />
                    Pipeline
                  </span>
                </div>
              </div>
              <BarChartCSS data={data.monthlyTrend} />
            </div>

            {/* Pipeline by Stage */}
            <div className="bg-[#141923] border border-[#1f2d3d] rounded-xl p-5">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-[#F0EBE0]">Pipeline by Stage</h2>
                <p className="text-[11px] text-[#6B7280] mt-0.5">Active deals (excl. lost)</p>
              </div>
              {data.pipelineByStage.every((s) => s.value === 0 && s.count === 0) ? (
                <p className="text-sm text-[#6B7280] text-center py-8">No deals yet</p>
              ) : (
                <PipelineStageBar stages={data.pipelineByStage} />
              )}
            </div>
          </div>

          {/* Top Deals */}
          <div className="bg-[#141923] border border-[#1f2d3d] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1f2d3d]">
              <h2 className="text-sm font-semibold text-[#F0EBE0]">Top Deals</h2>
              <p className="text-[11px] text-[#6B7280] mt-0.5">Top 5 by value, excluding lost</p>
            </div>

            {data.topDeals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="h-8 w-8 text-[#C4972A]/30 mb-3" />
                <p className="text-sm text-[#6B7280]">No deals yet. Add your first deal in the CRM.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1f2d3d]">
                      {["Company", "Stage", "Value", "Days Open"].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f2d3d]">
                    {data.topDeals.map((deal) => (
                      <tr key={deal.id} className="hover:bg-[#0f1620] transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-sm font-semibold text-[#F0EBE0]">{deal.companyName}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${stageBadgeStyle(deal.stage)}`}
                          >
                            {stageLabel(deal.stage)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-sm font-bold text-[#C4972A]">{fmt(deal.value)}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-sm text-[#9CA3AF]">{deal.daysOpen}d</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* All-time invoice collected footer */}
          <div className="flex items-center justify-between px-5 py-4 bg-[#141923] border border-[#1f2d3d] rounded-xl">
            <div>
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-semibold">All-Time Collected</p>
              <p className="text-lg font-bold text-[#F0EBE0] mt-0.5">{fmt(data.invoiceCollected)}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-[#C4972A]/30" />
          </div>
        </>
      ) : null}
    </div>
  )
}
