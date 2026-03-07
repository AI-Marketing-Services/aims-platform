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
  open: { icon: AlertCircle, label: "Open", class: "text-red-400 bg-red-500/10 border-red-500/20" },
  in_progress: { icon: Clock, label: "In Progress", class: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  resolved: { icon: CheckCircle, label: "Resolved", class: "text-green-400 bg-green-500/10 border-green-500/20" },
}

const priorityConfig = {
  low: "text-gray-400",
  normal: "text-blue-400",
  high: "text-orange-400",
  urgent: "text-red-400",
}

export default function SupportPage() {
  const [showNew, setShowNew] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setShowNew(false)
    setSubject("")
    setMessage("")
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Support</h1>
          <p className="text-gray-400">Get help from the AIMS team</p>
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
        <div className="bg-[#151821] border border-[#DC2626]/30 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-white mb-4">Open a Support Ticket</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
                className="w-full px-4 py-3 bg-[#0D0F14] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Message</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the issue in detail. Include any relevant context..."
                className="w-full px-4 py-3 bg-[#0D0F14] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:border-transparent resize-none"
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
                className="px-5 py-2.5 text-gray-400 text-sm hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {submitted && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl mb-6 text-green-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          Your ticket has been submitted. Our team typically responds within 2 business hours.
        </div>
      )}

      {/* Tickets list */}
      <div className="space-y-3">
        {DEMO_TICKETS.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No support tickets yet</p>
          </div>
        ) : (
          DEMO_TICKETS.map((ticket) => {
            const sc = statusConfig[ticket.status as keyof typeof statusConfig]
            return (
              <div
                key={ticket.id}
                className="bg-[#151821] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${sc.class}`}>
                        <sc.icon className="w-3 h-3" />
                        {sc.label}
                      </span>
                      <span className={`text-xs font-medium ${priorityConfig[ticket.priority as keyof typeof priorityConfig]}`}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} priority
                      </span>
                    </div>
                    <h3 className="text-white font-medium mb-1">{ticket.subject}</h3>
                    <div className="text-xs text-gray-500 flex items-center gap-3">
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
      <div className="mt-8 bg-[#1C1F2A] border border-white/5 rounded-xl p-5">
        <h4 className="text-sm font-medium text-white mb-2">Urgent? Reach us directly</h4>
        <div className="text-sm text-gray-400 space-y-1">
          <div>Slack: <span className="text-white">#aims-support</span></div>
          <div>Email: <span className="text-white">support@aimseos.com</span></div>
          <div>Response time: <span className="text-green-400">Under 2 hours (business days)</span></div>
        </div>
      </div>
    </div>
  )
}
