"use client"

import { useState } from "react"
import { MessageSquare, Plus, Clock, CheckCircle, AlertCircle, Send, RefreshCw } from "lucide-react"

const statusConfig = {
  open: { icon: AlertCircle, label: "Open", class: "text-red-600 bg-red-50 border-red-200" },
  in_progress: { icon: Clock, label: "In Progress", class: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  resolved: { icon: CheckCircle, label: "Resolved", class: "text-green-700 bg-green-50 border-green-200" },
}

const priorityConfig = {
  low: "text-gray-500",
  normal: "text-blue-600",
  high: "text-orange-600",
  urgent: "text-red-600",
}

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
}

export default function SupportPage() {
  const [showNew, setShowNew] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)

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

  // Load tickets on first render
  useState(() => {
    loadTickets()
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, priority: "normal" }),
      })
    } catch {}
    setSubmitted(true)
    setShowNew(false)
    setSubject("")
    setMessage("")
    loadTickets()
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Support</h1>
          <p className="text-gray-500">Get help from the AIMS team</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadTickets}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            title="Refresh tickets"
          >
            <RefreshCw className={`w-4 h-4 ${loadingTickets ? "animate-spin" : ""}`} />
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
        <div className="bg-white border border-red-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Open a Support Ticket</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">Message</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the issue in detail. Include any relevant context..."
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626] resize-none"
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
                className="px-5 py-2.5 text-gray-500 text-sm hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {submitted && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-6 text-green-700 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Your ticket has been submitted. Our team typically responds within 2 business hours.
        </div>
      )}

      {/* Tickets list */}
      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">No support tickets yet</p>
            <p className="text-sm mt-1">Open a ticket above and our team will respond within 2 hours.</p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const sc = statusConfig[ticket.status as keyof typeof statusConfig] ?? statusConfig.open
            return (
              <div
                key={ticket.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${sc.class}`}>
                        <sc.icon className="w-3 h-3" />
                        {sc.label}
                      </span>
                      <span className={`text-xs font-medium ${priorityConfig[ticket.priority as keyof typeof priorityConfig] ?? "text-gray-500"}`}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} priority
                      </span>
                    </div>
                    <h3 className="text-gray-900 font-medium mb-1">{ticket.subject}</h3>
                    <div className="text-xs text-gray-500 flex flex-wrap items-center gap-3">
                      <span>Opened {new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      <span>Updated {new Date(ticket.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Contact info */}
      <div className="mt-8 bg-gray-50 border border-gray-100 rounded-xl p-5">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Urgent? Reach us directly</h4>
        <div className="text-sm text-gray-500 space-y-1">
          <div>Slack: <span className="text-gray-900">#aims-support</span></div>
          <div>Email: <a href="mailto:support@aimseos.com" className="text-gray-900 hover:text-[#DC2626] transition-colors">support@aimseos.com</a></div>
          <div>Response time: <span className="text-green-600 font-medium">Under 2 hours (business days)</span></div>
        </div>
      </div>
    </div>
  )
}
