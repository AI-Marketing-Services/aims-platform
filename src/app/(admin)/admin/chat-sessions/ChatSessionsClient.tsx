"use client"

import { useState, useMemo } from "react"
import { ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown, MessageSquare, Mail, Clock, Hash, Search } from "lucide-react"
import { cn, timeAgo } from "@/lib/utils"

type MessagePart = {
  type: string
  text?: string
}

type StoredMessage = {
  id?: string
  role?: string
  parts?: MessagePart[]
  content?: string
}

export interface ChatSessionRow {
  id: string
  email: string | null
  source: string
  clerkUserId: string | null
  messageCount: number
  messages: StoredMessage[]
  lastMessagePreview: string
  createdAt: string
  updatedAt: string
}

const SOURCE_LABELS: Record<string, string> = {
  intake: "Intake",
  onboarding: "Onboarding",
  portal: "Portal",
  marketing: "Marketing",
}

const SOURCE_COLORS: Record<string, string> = {
  intake: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  onboarding: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  portal: "bg-green-500/10 text-green-400 border-green-500/20",
  marketing: "bg-purple-500/10 text-purple-400 border-purple-500/20",
}

function getMessageText(msg: StoredMessage): string {
  if (msg.parts) {
    return msg.parts
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text)
      .join("")
  }
  return msg.content ?? ""
}

// Use shared timeAgo from lib/utils instead of a local duplicate

interface ChatSessionsClientProps {
  sessions: ChatSessionRow[]
}

type SortField = "email" | "messageCount" | "updatedAt"
type SortDir = "asc" | "desc"

export function ChatSessionsClient({ sessions }: ChatSessionsClientProps) {
  const [filter, setFilter] = useState<string>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("updatedAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return sessions
      .filter((s) => {
        if (filter !== "all" && s.source !== filter) return false
        if (q && !(s.email ?? "").toLowerCase().includes(q) && !s.lastMessagePreview.toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => {
        let cmp = 0
        if (sortField === "email") cmp = (a.email ?? "").localeCompare(b.email ?? "")
        else if (sortField === "messageCount") cmp = a.messageCount - b.messageCount
        else if (sortField === "updatedAt") cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        return sortDir === "asc" ? cmp : -cmp
      })
  }, [sessions, filter, search, sortField, sortDir])

  const sourceCounts = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.source] = (acc[s.source] ?? 0) + 1
    return acc
  }, {})

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap",
            filter === "all"
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-card text-muted-foreground border-border hover:text-foreground"
          )}
        >
          All ({sessions.length})
        </button>
        {["intake", "onboarding", "portal", "marketing"].map((src) => (
          <button
            key={src}
            onClick={() => setFilter(src)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap",
              filter === src
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            )}
          >
            {SOURCE_LABELS[src] ?? src} ({sourceCounts[src] ?? 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          data-search
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or message content..."
          className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#981B1B] focus:ring-1 focus:ring-[#981B1B]/20"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No chat sessions found</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 w-8" />
                <th
                  onClick={() => handleSort("email")}
                  className="text-left text-xs font-medium text-muted-foreground px-4 py-3 cursor-pointer hover:text-foreground select-none transition-colors"
                >
                  <span className="inline-flex items-center gap-1">
                    Email
                    {sortField === "email" ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-foreground" /> : <ChevronDown className="w-3 h-3 text-foreground" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
                  </span>
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Source</th>
                <th
                  onClick={() => handleSort("messageCount")}
                  className="text-left text-xs font-medium text-muted-foreground px-4 py-3 cursor-pointer hover:text-foreground select-none transition-colors"
                >
                  <span className="inline-flex items-center gap-1">
                    Messages
                    {sortField === "messageCount" ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-foreground" /> : <ChevronDown className="w-3 h-3 text-foreground" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
                  </span>
                </th>
                <th
                  onClick={() => handleSort("updatedAt")}
                  className="text-left text-xs font-medium text-muted-foreground px-4 py-3 cursor-pointer hover:text-foreground select-none transition-colors"
                >
                  <span className="inline-flex items-center gap-1">
                    Last Active
                    {sortField === "updatedAt" ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-foreground" /> : <ChevronDown className="w-3 h-3 text-foreground" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
                  </span>
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Preview</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((session) => {
                const isExpanded = expandedId === session.id
                return (
                  <SessionRow
                    key={session.id}
                    session={session}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedId(isExpanded ? null : session.id)}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SessionRow({
  session,
  isExpanded,
  onToggle,
}: {
  session: ChatSessionRow
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-border hover:bg-card/50 cursor-pointer transition-colors"
      >
        <td className="px-4 py-3">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm text-foreground">
              {session.email ?? <span className="text-muted-foreground italic">No email</span>}
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border",
              SOURCE_COLORS[session.source] ?? "bg-card text-muted-foreground border-border"
            )}
          >
            {SOURCE_LABELS[session.source] ?? session.source}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <Hash className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm text-foreground">{session.messageCount}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{timeAgo(session.updatedAt)}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
            {session.lastMessagePreview || "--"}
          </p>
        </td>
      </tr>

      {/* Expanded conversation view */}
      {isExpanded && (
        <tr>
          <td colSpan={6} className="p-0">
            <div className="bg-muted/30 border-t border-border px-6 py-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              <div className="space-y-3 max-w-2xl">
                {session.messages.map((msg, idx) => {
                  const text = getMessageText(msg)
                  if (!text) return null
                  const role = msg.role ?? "unknown"
                  return (
                    <div key={idx} className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={cn(
                          "max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap shadow-sm",
                          role === "user"
                            ? "bg-primary/10 text-foreground border border-primary/20 rounded-br-sm"
                            : "bg-card border border-border text-foreground rounded-bl-sm"
                        )}
                      >
                        <p className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                          {role}
                        </p>
                        {text}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
