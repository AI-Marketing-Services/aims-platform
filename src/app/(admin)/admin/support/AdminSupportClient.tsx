"use client"

import { useState, useMemo } from "react"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  User,
  Shield,
  Search,
} from "lucide-react"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Reply {
  id: string
  message: string
  isAdmin: boolean
  authorId: string
  authorName: string | null
  createdAt: string
}

interface Ticket {
  id: string
  subject: string
  message: string
  status: string
  priority: string
  assignedTo: string | null
  resolvedAt: string | null
  resolutionNote: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    email: string
    company: string | null
  }
  replies: Reply[]
}

interface Props {
  tickets: Ticket[]
  stats: {
    total: number
    open: number
    inProgress: number
    resolved: number
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; className: string; icon: typeof AlertCircle }> = {
  open: { label: "Open", className: "text-red-400 bg-red-900/20 border-red-800", icon: AlertCircle },
  in_progress: { label: "In Progress", className: "text-amber-400 bg-amber-900/20 border-amber-800", icon: Clock },
  resolved: { label: "Resolved", className: "text-green-400 bg-green-900/15 border-green-800", icon: CheckCircle },
  closed: { label: "Closed", className: "text-muted-foreground bg-muted/30 border-border", icon: CheckCircle },
}

const priorityConfig: Record<string, string> = {
  low: "text-muted-foreground",
  normal: "text-blue-400",
  high: "text-orange-400",
  urgent: "text-red-400 font-bold",
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminSupportClient({ tickets: initialTickets, stats }: Props) {
  const [tickets, setTickets] = useState(initialTickets)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sending, setSending] = useState(false)
  const [statusNotes, setStatusNotes] = useState<Record<string, string>>({})
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false
      if (q && !t.subject.toLowerCase().includes(q) && !(t.user.name ?? "").toLowerCase().includes(q) && !t.user.email.toLowerCase().includes(q)) return false
      return true
    })
  }, [tickets, statusFilter, search])

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  async function handleReply(ticketId: string) {
    const text = replyTexts[ticketId] ?? ""
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })
      if (res.ok) {
        const data = await res.json()
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  status: t.status === "open" ? "in_progress" : t.status,
                  replies: [
                    ...t.replies,
                    {
                      id: data.id,
                      message: text,
                      isAdmin: true,
                      authorId: "",
                      authorName: "AIMS Support",
                      createdAt: new Date().toISOString(),
                    },
                  ],
                }
              : t
          )
        )
        setReplyTexts((prev) => ({ ...prev, [ticketId]: "" }))
        toast.success("Reply sent to client")
      } else {
        toast.error("Failed to send reply")
      }
    } catch {
      toast.error("Failed to send reply")
    }
    setSending(false)
  }

  async function handleStatusChange(ticketId: string, newStatus: string) {
    const note = statusNotes[ticketId] ?? ""
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          resolutionNote: note || undefined,
        }),
      })
      if (res.ok) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  status: newStatus,
                  resolvedAt: ["resolved", "closed"].includes(newStatus) ? new Date().toISOString() : t.resolvedAt,
                  resolutionNote: note || t.resolutionNote,
                }
              : t
          )
        )
        setStatusNotes((prev) => ({ ...prev, [ticketId]: "" }))
        toast.success(`Ticket marked as ${newStatus.replace("_", " ")}`)
      } else {
        toast.error("Failed to update ticket status")
      }
    } catch {
      toast.error("Failed to update ticket status")
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Open", value: stats.open, color: "text-red-400" },
          { label: "In Progress", value: stats.inProgress, color: "text-amber-400" },
          { label: "Resolved", value: stats.resolved, color: "text-green-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          data-search
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tickets by subject, name, or email..."
          className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#C4972A] focus:ring-1 focus:ring-[#C4972A]/20"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { label: "All", value: "all" },
          { label: "Open", value: "open" },
          { label: "In Progress", value: "in_progress" },
          { label: "Resolved", value: "resolved" },
          { label: "Closed", value: "closed" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === tab.value
                ? "bg-[#C4972A] text-white border-[#C4972A]"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Ticket list */}
      <div className="space-y-3">
        {filtered.map((ticket) => {
          const sc = statusConfig[ticket.status] ?? statusConfig.open
          const StatusIcon = sc.icon
          const isExpanded = expandedId === ticket.id

          return (
            <div
              key={ticket.id}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              {/* Header */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                className="w-full flex items-start justify-between p-5 text-left hover:bg-muted/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${sc.className}`}>
                      <StatusIcon className="w-3 h-3" />
                      {sc.label}
                    </span>
                    <span className={`text-xs font-medium ${priorityConfig[ticket.priority] ?? "text-muted-foreground"}`}>
                      {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </span>
                    {ticket.replies.length > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {ticket.replies.length}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{ticket.subject}</h3>
                  <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3 mt-1.5">
                    <span>{ticket.user.name ?? ticket.user.email}</span>
                    {ticket.user.company && <span>({ticket.user.company})</span>}
                    <span>Opened {formatDate(ticket.createdAt)}</span>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-border">
                  {/* Original message */}
                  <div className="px-5 py-4 bg-muted/10">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">
                        {ticket.user.name ?? ticket.user.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(ticket.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.message}</p>
                  </div>

                  {/* Replies */}
                  {ticket.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`px-5 py-4 border-t border-border ${reply.isAdmin ? "bg-primary/5" : "bg-muted/10"}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {reply.isAdmin ? (
                          <Shield className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                        <span className={`text-xs font-medium ${reply.isAdmin ? "text-primary" : "text-foreground"}`}>
                          {reply.authorName ?? "Unknown"}
                          {reply.isAdmin && " (Admin)"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{reply.message}</p>
                    </div>
                  ))}

                  {/* Reply + Status controls */}
                  <div className="px-5 py-4 border-t border-border space-y-4">
                    {/* Reply box */}
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Reply to client</label>
                      <textarea
                        rows={3}
                        value={replyTexts[ticket.id] ?? ""}
                        onChange={(e) => setReplyTexts((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                        placeholder="Type your reply..."
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C4972A]/20 focus:border-[#C4972A] resize-none"
                      />
                      <button
                        onClick={() => handleReply(ticket.id)}
                        disabled={!(replyTexts[ticket.id] ?? "").trim() || sending}
                        className="mt-2 flex items-center gap-2 px-4 py-2 bg-[#C4972A] text-white text-xs font-medium rounded-lg hover:bg-[#A17D22] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {sending ? "Sending..." : "Send Reply"}
                      </button>
                    </div>

                    {/* Status change */}
                    <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-border">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Resolution note (optional)</label>
                        <input
                          type="text"
                          value={statusNotes[ticket.id] ?? ""}
                          onChange={(e) => setStatusNotes((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                          placeholder="Brief resolution summary..."
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C4972A]/20 focus:border-[#C4972A]"
                        />
                      </div>
                      <div className="flex gap-2">
                        {ticket.status !== "in_progress" && (
                          <button
                            onClick={() => handleStatusChange(ticket.id, "in_progress")}
                            className="px-3 py-2 text-xs font-medium text-amber-400 border border-amber-800 rounded-lg hover:bg-amber-900/20 transition-colors"
                          >
                            In Progress
                          </button>
                        )}
                        {ticket.status !== "resolved" && (
                          <button
                            onClick={() => handleStatusChange(ticket.id, "resolved")}
                            className="px-3 py-2 text-xs font-medium text-green-400 border border-green-800 rounded-lg hover:bg-green-900/20 transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                        {ticket.status !== "closed" && (
                          <button
                            onClick={() => handleStatusChange(ticket.id, "closed")}
                            className="px-3 py-2 text-xs font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            Close
                          </button>
                        )}
                        {(ticket.status === "resolved" || ticket.status === "closed") && (
                          <button
                            onClick={() => handleStatusChange(ticket.id, "open")}
                            className="px-3 py-2 text-xs font-medium text-red-400 border border-red-800 rounded-lg hover:bg-red-900/20 transition-colors"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-border bg-card py-16 text-center">
            <p className="text-sm text-muted-foreground">No tickets match the current filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}
