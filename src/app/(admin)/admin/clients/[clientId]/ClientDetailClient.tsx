"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Mail,
  Phone,
  Globe,
  Building2,
  Calendar,
  Clock,
  Package,
  Kanban,
  Headphones,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  ExternalLink,
  Zap,
} from "lucide-react"
import { cn, timeAgo, formatDate } from "@/lib/utils"

// ── Types ──

interface SerializedUser {
  id: string
  name: string | null
  email: string
  company: string | null
  phone: string | null
  industry: string | null
  website: string | null
  role: string
  avatarUrl: string | null
  createdAt: string
  lastLoginAt: string | null
}

interface SerializedSubscription {
  id: string
  status: string
  tier: string | null
  monthlyAmount: number
  fulfillmentStatus: string
  onboardingCompletedAt: string | null
  createdAt: string
  cancelledAt: string | null
  serviceArm: {
    id: string
    name: string
    slug: string
    pillar: string
  }
  fulfillmentTasks: {
    id: string
    title: string
    status: string
    priority: string
    dueDate: string | null
    completedAt: string | null
    assignedTo: string | null
  }[]
}

interface SerializedDeal {
  id: string
  contactName: string
  company: string | null
  stage: string
  value: number
  mrr: number
  leadScore: number | null
  leadScoreTier: string | null
  createdAt: string
  activities: {
    id: string
    type: string
    detail: string | null
    createdAt: string
  }[]
  serviceArms: string[]
}

interface SerializedTicket {
  id: string
  subject: string
  status: string
  priority: string
  createdAt: string
  resolvedAt: string | null
}

interface SerializedLeadMagnet {
  id: string
  type: string
  score: number | null
  convertedToDeal: boolean
  createdAt: string
}

interface Props {
  user: SerializedUser
  subscriptions: SerializedSubscription[]
  deals: SerializedDeal[]
  tickets: SerializedTicket[]
  leadMagnets: SerializedLeadMagnet[]
  healthScore: number
  totalMRR: number
}

// ── Helpers ──

const STAGE_CONFIG: Record<string, { label: string; class: string }> = {
  APPLICATION_SUBMITTED: { label: "Applied",           class: "text-muted-foreground bg-muted/50 border-border" },
  CONSULT_BOOKED:        { label: "Consult Booked",    class: "text-primary bg-primary/5 border-primary/30" },
  CONSULT_COMPLETED:     { label: "Consult Completed", class: "text-primary bg-primary/10 border-primary/40" },
  MIGHTY_INVITED:        { label: "Mighty Invited",    class: "text-primary bg-primary/15 border-primary/50" },
  MEMBER_JOINED:         { label: "Member Joined",     class: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  LOST:                  { label: "Lost / Ghosted",    class: "text-muted-foreground bg-muted/30 border-border" },
}

const SUB_STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  ACTIVE: { label: "Active", class: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  TRIALING: { label: "Trialing", class: "text-primary bg-primary/5 border-primary/30" },
  PAST_DUE: { label: "Past Due", class: "text-primary bg-primary/10 border-primary/30" },
  CANCELLED: { label: "Cancelled", class: "text-muted-foreground bg-muted/40 border-border" },
  PAUSED: { label: "Paused", class: "text-muted-foreground bg-muted/50 border-border" },
}

const FULFILLMENT_STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  PENDING_SETUP: { label: "Pending Setup", class: "text-muted-foreground bg-muted/50 border-border" },
  IN_PROGRESS: { label: "In Progress", class: "text-primary bg-primary/5 border-primary/30" },
  ACTIVE_MANAGED: { label: "Active", class: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  NEEDS_ATTENTION: { label: "Needs Attention", class: "text-primary bg-primary/10 border-primary/30" },
  COMPLETED: { label: "Completed", class: "text-muted-foreground bg-muted/40 border-border" },
  ON_HOLD: { label: "On Hold", class: "text-muted-foreground bg-muted/40 border-border" },
}

const TICKET_STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  open: { label: "Open", class: "text-primary bg-primary/5 border-primary/30" },
  in_progress: { label: "In Progress", class: "text-primary bg-primary/10 border-primary/40" },
  resolved: { label: "Resolved", class: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  closed: { label: "Closed", class: "text-muted-foreground bg-muted/40 border-border" },
}


function healthColor(score: number): string {
  if (score >= 70) return "text-emerald-700 bg-emerald-50 border-emerald-200"
  if (score >= 40) return "text-primary bg-primary/10 border-primary/30"
  return "text-primary bg-primary/15 border-primary/40"
}

function healthLabel(score: number): string {
  if (score >= 70) return "Healthy"
  if (score >= 40) return "At Risk"
  return "Critical"
}

type Tab = "overview" | "subscriptions" | "deals" | "support" | "activity"

const TABS: { value: Tab; label: string; icon: React.ElementType }[] = [
  { value: "overview", label: "Overview", icon: Activity },
  { value: "subscriptions", label: "Subscriptions", icon: Package },
  { value: "deals", label: "Deals", icon: Kanban },
  { value: "support", label: "Support", icon: Headphones },
  { value: "activity", label: "Activity", icon: Clock },
]

// ── Component ──

export function ClientDetailClient({
  user,
  subscriptions,
  deals,
  tickets,
  leadMagnets,
  healthScore,
  totalMRR,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview")

  const activeSubs = subscriptions.filter((s) => s.status === "ACTIVE" || s.status === "TRIALING")

  // Build combined activity timeline
  const timeline = [
    ...deals.flatMap((d) =>
      d.activities.map((a) => ({
        id: a.id,
        type: "deal" as const,
        label: `${a.type.replace(/_/g, " ").toLowerCase()} - ${d.contactName}`,
        detail: a.detail,
        createdAt: a.createdAt,
      }))
    ),
    ...tickets.map((t) => ({
      id: t.id,
      type: "ticket" as const,
      label: `Support ticket: ${t.subject}`,
      detail: `Status: ${t.status}`,
      createdAt: t.createdAt,
    })),
    ...subscriptions.map((s) => ({
      id: s.id,
      type: "subscription" as const,
      label: `Subscription: ${s.serviceArm.name}`,
      detail: `${s.status} - $${s.monthlyAmount}/mo`,
      createdAt: s.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#981B1B]/10 text-[#981B1B] font-bold text-lg flex-shrink-0">
              {(user.name ?? user.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">
                {user.name ?? user.email}
              </h1>
              {user.company && (
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {user.company}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="w-3 h-3" /> {user.email}
                </span>
                {user.phone && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" /> {user.phone}
                  </span>
                )}
                {user.website && (
                  <a href={user.website.startsWith("http") ? user.website : `https://${user.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Globe className="w-3 h-3" /> {user.website}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <span className="text-xs px-2.5 py-1 rounded-lg border font-medium text-muted-foreground bg-deep border-border capitalize">
              {user.role.toLowerCase().replace("_", " ")}
            </span>
            <span className={cn("text-xs px-2.5 py-1 rounded-lg border font-medium", healthColor(healthScore))}>
              {healthScore}/100 {healthLabel(healthScore)}
            </span>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Member Since</p>
            <p className="text-sm font-medium text-foreground">{formatDate(user.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Login</p>
            <p className="text-sm font-medium text-foreground">
              {user.lastLoginAt ? timeAgo(user.lastLoginAt) : "Never"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total MRR</p>
            <p className="text-sm font-bold font-mono text-foreground">${totalMRR.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active Services</p>
            <p className="text-sm font-medium text-foreground">{activeSubs.length}</p>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0",
                activeTab === tab.value
                  ? "text-foreground border-b-2 border-[#981B1B]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ── Overview Tab ── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Active Subscriptions", value: activeSubs.length.toString(), icon: Package },
                  { label: "Total Deals", value: deals.length.toString(), icon: Kanban },
                  { label: "Open Tickets", value: tickets.filter((t) => t.status === "open").length.toString(), icon: Headphones },
                  { label: "Lead Magnets", value: leadMagnets.length.toString(), icon: Zap },
                ].map((s) => (
                  <div key={s.label} className="bg-deep border border-border rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <s.icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{s.label}</span>
                    </div>
                    <p className="text-lg font-bold font-mono text-foreground">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Active subscription cards */}
              {activeSubs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Active Services</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeSubs.map((sub) => {
                      const fs = FULFILLMENT_STATUS_CONFIG[sub.fulfillmentStatus] ?? { label: sub.fulfillmentStatus, class: "text-muted-foreground bg-deep border-border" }
                      return (
                        <div key={sub.id} className="bg-deep border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">{sub.serviceArm.name}</span>
                            <span className="text-sm font-mono font-bold text-foreground">${sub.monthlyAmount}/mo</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {sub.tier && <span className="text-xs text-muted-foreground">{sub.tier}</span>}
                            <span className={cn("text-xs px-2 py-0.5 rounded border", fs.class)}>{fs.label}</span>
                            {sub.onboardingCompletedAt ? (
                              <span className="text-xs text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Onboarded
                              </span>
                            ) : (
                              <span className="text-xs text-primary flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Onboarding
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Total spend calculation */}
              <div className="bg-deep border border-border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Financial Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Current MRR</p>
                    <p className="text-lg font-bold font-mono text-foreground">${totalMRR.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active Services</p>
                    <p className="text-lg font-bold text-foreground">{activeSubs.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Projected Annual</p>
                    <p className="text-lg font-bold font-mono text-foreground">${(totalMRR * 12).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Subscriptions Tab ── */}
          {activeTab === "subscriptions" && (
            <div className="space-y-3">
              {subscriptions.length === 0 ? (
                <div className="text-center py-10">
                  <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No subscriptions</p>
                </div>
              ) : (
                subscriptions.map((sub) => {
                  const ss = SUB_STATUS_CONFIG[sub.status] ?? { label: sub.status, class: "text-muted-foreground bg-deep border-border" }
                  const fs = FULFILLMENT_STATUS_CONFIG[sub.fulfillmentStatus] ?? { label: sub.fulfillmentStatus, class: "text-muted-foreground bg-deep border-border" }
                  return (
                    <div key={sub.id} className="bg-deep border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{sub.serviceArm.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {sub.tier && `${sub.tier} tier - `}Started {formatDate(sub.createdAt)}
                          </p>
                        </div>
                        <span className="text-sm font-mono font-bold text-foreground">${sub.monthlyAmount}/mo</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <span className={cn("text-xs px-2 py-0.5 rounded border", ss.class)}>{ss.label}</span>
                        <span className={cn("text-xs px-2 py-0.5 rounded border", fs.class)}>{fs.label}</span>
                        {sub.onboardingCompletedAt ? (
                          <span className="text-xs text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Onboarded {formatDate(sub.onboardingCompletedAt)}
                          </span>
                        ) : (
                          <span className="text-xs text-primary flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Onboarding pending
                          </span>
                        )}
                        {sub.cancelledAt && (
                          <span className="text-xs text-primary flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Cancelled {formatDate(sub.cancelledAt)}
                          </span>
                        )}
                      </div>
                      {sub.fulfillmentTasks.length > 0 && (
                        <div className="border-t border-border pt-2 mt-2">
                          <p className="text-xs font-medium text-foreground mb-1">Fulfillment Tasks</p>
                          <div className="space-y-1">
                            {sub.fulfillmentTasks.map((task) => (
                              <div key={task.id} className="flex items-center justify-between text-xs">
                                <span className={cn("text-foreground", task.status === "done" && "line-through text-muted-foreground")}>
                                  {task.title}
                                </span>
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded",
                                  task.status === "done" ? "text-emerald-700 bg-emerald-50" :
                                  task.status === "in_progress" ? "text-primary bg-primary/10" :
                                  "text-muted-foreground bg-muted/40"
                                )}>
                                  {task.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* ── Deals Tab ── */}
          {activeTab === "deals" && (
            <div className="space-y-3">
              {deals.length === 0 ? (
                <div className="text-center py-10">
                  <Kanban className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No deals</p>
                </div>
              ) : (
                deals.map((deal) => {
                  const sc = STAGE_CONFIG[deal.stage] ?? { label: deal.stage, class: "text-muted-foreground bg-deep border-border" }
                  return (
                    <Link
                      key={deal.id}
                      href={`/admin/crm/${deal.id}`}
                      className="block bg-deep border border-border rounded-lg p-4 hover:bg-surface hover:border-border transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="text-sm font-medium text-foreground group-hover:text-[#981B1B] transition-colors">
                            {deal.contactName}
                          </p>
                          {deal.company && <p className="text-xs text-muted-foreground">{deal.company}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={cn("text-xs px-2 py-0.5 rounded border", sc.class)}>{sc.label}</span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="font-mono">${deal.value.toLocaleString()}</span>
                        {deal.leadScore != null && (
                          <span>Score: {deal.leadScore}</span>
                        )}
                        {deal.serviceArms.length > 0 && (
                          <span>{deal.serviceArms.join(", ")}</span>
                        )}
                        <span>{formatDate(deal.createdAt)}</span>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          )}

          {/* ── Support Tab ── */}
          {activeTab === "support" && (
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="text-center py-10">
                  <Headphones className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No support tickets</p>
                </div>
              ) : (
                tickets.map((ticket) => {
                  const ts = TICKET_STATUS_CONFIG[ticket.status] ?? { label: ticket.status, class: "text-muted-foreground bg-deep border-border" }
                  return (
                    <div key={ticket.id} className="bg-deep border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-sm font-medium text-foreground">{ticket.subject}</p>
                        <span className={cn("text-xs px-2 py-0.5 rounded border flex-shrink-0", ts.class)}>{ts.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Priority: {ticket.priority}</span>
                        <span>Created: {formatDate(ticket.createdAt)}</span>
                        {ticket.resolvedAt && <span>Resolved: {formatDate(ticket.resolvedAt)}</span>}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* ── Activity Tab ── */}
          {activeTab === "activity" && (
            <div className="space-y-4">
              {timeline.length === 0 ? (
                <div className="text-center py-10">
                  <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                </div>
              ) : (
                timeline.slice(0, 50).map((item) => (
                  <div key={item.id + item.createdAt} className="flex items-start gap-3">
                    <div className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0 mt-0.5",
                      item.type === "deal" ? "bg-primary/10 text-primary" :
                      item.type === "ticket" ? "bg-primary/5 text-primary/70" :
                      "bg-emerald-50 text-emerald-700"
                    )}>
                      {item.type === "deal" && <TrendingUp className="w-3.5 h-3.5" />}
                      {item.type === "ticket" && <Headphones className="w-3.5 h-3.5" />}
                      {item.type === "subscription" && <Package className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-foreground font-medium capitalize truncate">
                          {item.label}
                        </p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>
                      {item.detail && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
