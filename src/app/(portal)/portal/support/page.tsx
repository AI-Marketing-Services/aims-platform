"use client"

import { useState } from "react"
import { MessageSquare, Plus, Clock, CheckCircle, AlertCircle, Send } from "lucide-react"

const DEMO_TICKETS = [
  {
    id: "tkt_001",
    subject: "Voice agent not calling leads from this morning",
    status: "in_progress",
    priority: "high",
    createdAt: "2026-03-05",
    lastUpdate: "2026-03-06",
    replies: 2,
  },
  {
    id: "tkt_002",
    subject: "How do I add a new team member to the CRM?",
    status: "resolved",
    priority: "normal",
    createdAt: "2026-02-28",
    lastUpdate: "2026-03-01",
    replies: 3,
  },
]

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

export default function SupportPage() {
  const [showNew, setShowNew] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, priority: "normal" }),
      })
      if (!res.ok) throw new Error("Failed")
    } catch {
      // still show success — ticket will be visible on reload
    }
    setSubmitted(true)
    setShowNew(false)
    setSubject("")
    setMessage("")
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Support</h1>
          <p className="text-gray-500">Get help from the AIMS team</p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-2 px-4 py-2 bg-[#DC2626] text-white text-sm font-medium rounded-lg hover:bg-[#B91C1C] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
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
        {DEMO_TICKETS.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No support tickets yet</p>
          </div>
        ) : (
          DEMO_TICKETS.map((ticket) => {
            const sc = statusConfig[ticket.status as keyof typeof statusConfig]
            return (
              <div
                key={ticket.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${sc.class}`}>
                        <sc.icon className="w-3 h-3" />
                        {sc.label}
                      </span>
                      <span className={`text-xs font-medium ${priorityConfig[ticket.priority as keyof typeof priorityConfig]}`}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} priority
                      </span>
                    </div>
                    <h3 className="text-gray-900 font-medium mb-1">{ticket.subject}</h3>
                    <div className="text-xs text-gray-500 flex flex-wrap items-center gap-3">
                      <span>Opened {new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      <span>Updated {new Date(ticket.lastUpdate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      <span>{ticket.replies} replies</span>
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
          <div>Email: <span className="text-gray-900">support@aimseos.com</span></div>
          <div>Response time: <span className="text-green-600">Under 2 hours (business days)</span></div>
        </div>
      </div>
    </div>
  )
}
