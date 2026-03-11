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
} from "lucide-react"

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig = {
  open: {
    icon: AlertCircle,
    label: "Open",
    className: "text-red-700 bg-red-50 border-red-200",
  },
  in_progress: {
    icon: Clock,
    label: "In Progress",
    className: "text-amber-700 bg-amber-50 border-amber-200",
  },
  resolved: {
    icon: CheckCircle,
    label: "Resolved",
    className: "text-green-700 bg-green-50 border-green-200",
  },
}

const priorityConfig: Record<string, string> = {
  low: "text-gray-500",
  normal: "text-blue-600",
  high: "text-orange-600",
  urgent: "text-red-600",
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  assignedTo: string | null
  createdAt: string
  updatedAt: string
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
    a: "Most services activate within 48–72 business hours of your onboarding call. Complex setups (RevOps, Multi-location Voice) may take 5–7 days.",
  },
  {
    q: "How do I set up my DNS?",
    a: "Your AIMS team will send you a step-by-step DNS guide after setup begins. For urgent help, open a support ticket or message us on Slack.",
  },
  {
    q: "How do I upgrade my plan?",
    a: "Visit Billing → Open Stripe Portal to upgrade, downgrade, or modify your subscription at any time.",
  },
  {
    q: "What's included in my setup?",
    a: "Every service includes a dedicated setup call, configuration by our team, testing, and a 30-day post-launch support window.",
  },
  {
    q: "How do I cancel?",
    a: "You can cancel anytime through Billing → Stripe Portal. There are no long-term contracts or cancellation fees.",
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
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [services, setServices] = useState<ServiceOption[]>([])

  async function loadTickets() {
    setLoadingTickets(true)
    try {
      const res = await fetch("/api/support/tickets")
      if (res.ok) {
        const data = await res.json()
        setTickets(Array.isArray(data) ? data : [])
      }
    } catch {}
    setLoadingTickets(false)
  }

  async function loadServices() {
    try {
      const res = await fetch("/api/portal/subscriptions")
      if (res.ok) {
        const data = await res.json()
        setServices(Array.isArray(data) ? data : [])
      }
    } catch {}
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
      await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subjectWithContext,
          message,
          priority: "normal",
        }),
      })
    } catch {}
    setSubmitted(true)
    setShowNew(false)
    setSubject("")
    setMessage("")
    setServiceContext("")
    loadTickets()
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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
            className="flex items-center gap-2 px-4 py-2 bg-[#DC2626] text-white text-sm font-medium rounded-lg hover:bg-[#B91C1C] transition-colors"
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
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
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
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
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
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the issue in detail. Include any relevant context..."
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-[#DC2626] text-white text-sm font-medium rounded-lg hover:bg-[#B91C1C] transition-colors"
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

      {/* Success banner */}
      {submitted && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Your ticket has been submitted. Our team typically responds within 2 business hours.
        </div>
      )}

      {/* FAQ */}
      <SupportFAQ />

      {/* Tickets list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Your Tickets</h2>
        {tickets.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card text-center py-16">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="font-medium text-foreground">No support tickets yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Open a ticket above and our team will respond within 2 hours.
            </p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const sc =
              statusConfig[ticket.status as keyof typeof statusConfig] ??
              statusConfig.open
            const StatusIcon = sc.icon
            return (
              <div
                key={ticket.id}
                className="rounded-2xl border border-border bg-card p-5 hover:border-border/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Status + priority badges */}
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
                    </div>

                    {/* Subject */}
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {ticket.subject}
                    </h3>

                    {/* Meta */}
                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3 mt-1.5">
                      <span>Opened {formatDate(ticket.createdAt)}</span>
                      <span>Updated {formatDate(ticket.updatedAt)}</span>
                      <span>
                        Assigned to:{" "}
                        <span className="text-foreground">
                          {ticket.assignedTo ?? "AIMS Team"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Direct contact */}
      <div className="rounded-2xl border border-border bg-muted/30 p-5">
        <h4 className="text-sm font-semibold text-foreground mb-2">
          Urgent? Reach us directly
        </h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <div>
            Slack:{" "}
            <span className="text-foreground font-medium">#aims-support</span>
          </div>
          <div>
            Email:{" "}
            <a
              href="mailto:support@aimseos.com"
              className="text-foreground font-medium hover:text-[#DC2626] transition-colors"
            >
              support@aimseos.com
            </a>
          </div>
          <div>
            Response time:{" "}
            <span className="text-green-600 font-medium">
              Under 2 hours (business days)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
