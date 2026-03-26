"use client"

import { useState, useEffect } from "react"
import {
  MessageSquare,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  LifeBuoy,
  User,
  Shield,
} from "lucide-react"
import { toast } from "sonner"
import { EmptyState } from "@/components/shared/EmptyState"

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig = {
  open: {
    icon: AlertCircle,
    label: "Open",
    className: "text-primary bg-primary/10 border-primary/30",
  },
  in_progress: {
    icon: Clock,
    label: "In Progress",
    className: "text-amber-400 bg-amber-900/20 border-amber-800",
  },
  resolved: {
    icon: CheckCircle,
    label: "Resolved",
    className: "text-green-400 bg-green-900/15 border-green-800",
  },
  closed: {
    icon: CheckCircle,
    label: "Closed",
    className: "text-muted-foreground bg-muted/30 border-border",
  },
}

const priorityConfig: Record<string, string> = {
  low: "text-muted-foreground",
  normal: "text-blue-400",
  high: "text-orange-400",
  urgent: "text-primary",
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Reply {
  id: string
  message: string
  isAdmin: boolean
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
  createdAt: string
  updatedAt: string
  replies: Reply[]
}

interface ServiceOption {
  id: string
  name: string
  slug: string
}

// ─── FAQ data ─────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: "How long until my service is live?",
    a: "Most services activate within 48-72 business hours of your onboarding call. Complex setups (RevOps, Multi-location Voice) may take 5-7 days.",
  },
  {
    q: "How do I set up my DNS?",
    a: "Your AIMS team will send you a step-by-step DNS guide after setup begins. For urgent help, open a support ticket or message us on Slack.",
  },
  {
    q: "How do I upgrade my plan?",
    a: "Visit Billing > Open Stripe Portal to upgrade, downgrade, or modify your subscription at any time.",
  },
  {
    q: "What's included in my setup?",
    a: "Every service includes a dedicated setup call, configuration by our team, testing, and a 30-day post-launch support window.",
  },
  {
    q: "How do I cancel?",
    a: "You can cancel anytime through Billing > Stripe Portal. There are no long-term contracts or cancellation fees.",
  },
]

// ─── SupportFAQ component ─────────────────────────────────────────────────────

function SupportFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  function toggle(i: number) {
    setOpenIndex((prev) => (prev === i ? null : i))
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Common Questions</h2>
      </div>
      <div className="divide-y divide-border">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
            >
              <span className="text-sm font-medium text-foreground">{item.q}</span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground flex-shrink-0 ml-4 transition-transform duration-200 ${
                  openIndex === i ? "rotate-180" : ""
                }`}
              />
            </button>
            {openIndex === i && (
              <div className="px-5 pb-4">
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const [showNew, setShowNew] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [serviceContext, setServiceContext] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [services, setServices] = useState<ServiceOption[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)

  async function loadTickets() {
    setLoadingTickets(true)
    try {
      const res = await fetch("/api/support/tickets")
      if (res.ok) {
        const data = await res.json()
        setTickets(Array.isArray(data) ? data : [])
      }
    } catch {
      // Handled silently
    }
    setLoadingTickets(false)
  }

  async function loadServices() {
    try {
      const res = await fetch("/api/portal/subscriptions")
      if (res.ok) {
        const data = await res.json()
        setServices(Array.isArray(data) ? data : [])
      }
    } catch {
      // Handled silently
    }
  }

  useEffect(() => {
    loadTickets()
    loadServices()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const subjectWithContext = serviceContext
      ? `[${serviceContext}] ${subject}`
      : subject
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subjectWithContext,
          message,
          priority: "normal",
        }),
      })
      if (!res.ok) {
        setSubmitError("Failed to submit ticket. Please try again.")
        toast.error("Failed to submit ticket")
        return
      }
      setSubmitted(true)
      setSubmitError(null)
      setShowNew(false)
      setSubject("")
      setMessage("")
      setServiceContext("")
      toast.success("Ticket submitted successfully")
      loadTickets()
    } catch {
      setSubmitError("Failed to submit ticket. Please try again.")
      toast.error("Failed to submit ticket")
    }
  }

  async function handleReply(ticketId: string) {
    const text = replyTexts[ticketId] ?? ""
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/reply`, {
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
                  replies: [
                    ...t.replies,
                    {
                      id: data.id,
                      message: text,
                      isAdmin: false,
                      authorName: "You",
                      createdAt: new Date().toISOString(),
                    },
                  ],
                }
              : t
          )
        )
        setReplyTexts((prev) => ({ ...prev, [ticketId]: "" }))
        toast.success("Reply sent")
      } else {
        toast.error("Failed to send reply")
      }
    } catch {
      toast.error("Failed to send reply")
    }
    setSending(false)
  }

  function formatRelative(iso: string) {
    const date = new Date(iso)
    const diff = Date.now() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Get help from the AIMS team
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadTickets}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            title="Refresh tickets"
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingTickets ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={() => setShowNew(!showNew)}
            className="flex items-center gap-2 px-4 py-2 bg-[#C4972A] text-white text-sm font-medium rounded-lg hover:bg-[#A17D22] transition-colors btn-lift"
          >
            <Plus className="w-4 h-4" />
            New Ticket
          </button>
        </div>
      </div>

      {/* New ticket form */}
      {showNew && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4">
            Open a Support Ticket
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Service context */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">
                Which service is this about?
              </label>
              <select
                value={serviceContext}
                onChange={(e) => setServiceContext(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#C4972A]/20 focus:border-[#C4972A]"
              >
                <option value="">General / Other</option>
                {services.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">
                Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C4972A]/20 focus:border-[#C4972A]"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">
                Message
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                placeholder="Describe the issue in detail. Include any relevant context..."
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C4972A]/20 focus:border-[#C4972A] resize-none"
              />
              <p className="text-xs text-muted-foreground text-right mt-1">{message.length}/2000</p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-[#C4972A] text-white text-sm font-medium rounded-lg hover:bg-[#A17D22] transition-colors"
              >
                <Send className="w-4 h-4" />
                Submit Ticket
              </button>
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="px-5 py-2.5 text-muted-foreground text-sm hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error banner */}
      {submitError && (
        <div className="flex items-center gap-3 p-4 bg-red-900/15 border border-red-800 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {submitError}
        </div>
      )}

      {/* Success banner */}
      {submitted && (
        <div className="flex items-center gap-3 p-4 bg-green-900/15 border border-green-800 rounded-xl text-green-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Your ticket has been submitted. You will receive a confirmation email shortly. Our team typically responds within 24 hours.
        </div>
      )}

      {/* FAQ */}
      <SupportFAQ />

      {/* Tickets list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Your Tickets</h2>
        {tickets.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card">
            <EmptyState
              icon={LifeBuoy}
              title="No support tickets yet"
              description="Open a ticket above and our team will respond within 24 hours."
              actionLabel="New Ticket"
              onAction={() => setShowNew(true)}
            />
          </div>
        ) : (
          tickets.map((ticket) => {
            const sc =
              statusConfig[ticket.status as keyof typeof statusConfig] ??
              statusConfig.open
            const StatusIcon = sc.icon
            const isExpanded = expandedId === ticket.id
            const canReply = ticket.status !== "closed"

            return (
              <div
                key={ticket.id}
                className="rounded-2xl border border-border bg-card overflow-hidden hover:border-border/80 transition-colors"
              >
                {/* Ticket header */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                  className="w-full p-5 text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${sc.className}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            priorityConfig[ticket.priority] ?? "text-muted-foreground"
                          }`}
                        >
                          {ticket.priority.charAt(0).toUpperCase() +
                            ticket.priority.slice(1)}{" "}
                          priority
                        </span>
                        {ticket.replies.length > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {ticket.replies.length} {ticket.replies.length === 1 ? "reply" : "replies"}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {ticket.subject}
                      </h3>
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3 mt-1.5">
                        <span title={new Date(ticket.createdAt).toLocaleString()}>Opened {formatRelative(ticket.createdAt)}</span>
                        <span title={new Date(ticket.updatedAt).toLocaleString()}>Updated {formatRelative(ticket.updatedAt)}</span>
                        <span>
                          Assigned to:{" "}
                          <span className="text-foreground">
                            {ticket.assignedTo ?? "AIMS Team"}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded conversation */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Original message */}
                    <div className="px-5 py-4 bg-muted/10">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">You</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(ticket.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {ticket.message}
                      </p>
                    </div>

                    {/* Replies */}
                    {ticket.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`px-5 py-4 border-t border-border ${
                          reply.isAdmin ? "bg-primary/5" : "bg-muted/10"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {reply.isAdmin ? (
                            <Shield className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          <span
                            className={`text-xs font-medium ${
                              reply.isAdmin ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {reply.isAdmin ? `${reply.authorName ?? "AIMS Support"} (AIMS Team)` : "You"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {reply.message}
                        </p>
                      </div>
                    ))}

                    {/* Reply box */}
                    {canReply && (
                      <div className="px-5 py-4 border-t border-border">
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
                    )}

                    {!canReply && (
                      <div className="px-5 py-4 border-t border-border text-center">
                        <p className="text-xs text-muted-foreground">
                          This ticket is closed. Open a new ticket if you need further help.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Chatbot escalation notice */}
      <div className="rounded-2xl border border-border bg-muted/30 p-5">
        <h4 className="text-sm font-semibold text-foreground mb-2">
          Need more help?
        </h4>
        <p className="text-sm text-muted-foreground">
          Use the chatbot above to get instant answers. If you need additional support,
          the chatbot can escalate your request to our team.
        </p>
      </div>
    </div>
  )
}
