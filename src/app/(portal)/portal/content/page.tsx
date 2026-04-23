"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Newspaper,
  Plus,
  Copy,
  Check,
  Trash2,
  Archive,
  Linkedin,
  FileText,
  Mail,
  MessageSquare,
  Hash,
  Globe,
} from "lucide-react"
import { ContentPieceType, ContentPieceStatus } from "@prisma/client"

// ── Types ──────────────────────────────────────────────────────────────────────

interface ContentPieceListItem {
  id: string
  type: ContentPieceType
  status: ContentPieceStatus
  title: string
  content: string
  clientDealId: string | null
  clientDeal: { companyName: string } | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ContentPieceType, string> = {
  LINKEDIN_POST: "LinkedIn Post",
  CASE_STUDY: "Case Study",
  EMAIL_SEQUENCE: "Email Sequence",
  TESTIMONIAL: "Testimonial",
  TWEET_THREAD: "Tweet Thread",
}

const TYPE_COLORS: Record<ContentPieceType, string> = {
  LINKEDIN_POST: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  CASE_STUDY: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  EMAIL_SEQUENCE: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  TESTIMONIAL: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  TWEET_THREAD: "bg-sky-500/10 text-sky-400 border-sky-500/20",
}

const TYPE_ICONS: Record<ContentPieceType, React.ElementType> = {
  LINKEDIN_POST: Linkedin,
  CASE_STUDY: FileText,
  EMAIL_SEQUENCE: Mail,
  TESTIMONIAL: MessageSquare,
  TWEET_THREAD: Hash,
}

const STATUS_COLORS: Record<ContentPieceStatus, string> = {
  DRAFT: "bg-muted/5 text-muted-foreground/50 border-border/10",
  PUBLISHED: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  ARCHIVED: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
}

const TYPE_FILTER_TABS: Array<{ label: string; value: ContentPieceType | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "LinkedIn Post", value: "LINKEDIN_POST" },
  { label: "Case Study", value: "CASE_STUDY" },
  { label: "Email Sequence", value: "EMAIL_SEQUENCE" },
  { label: "Testimonial", value: "TESTIMONIAL" },
  { label: "Tweet Thread", value: "TWEET_THREAD" },
]

const STATUS_FILTER_TABS: Array<{ label: string; value: ContentPieceStatus | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Archived", value: "ARCHIVED" },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ── ContentCard ───────────────────────────────────────────────────────────────

function ContentCard({
  piece,
  onDelete,
  onArchive,
}: {
  piece: ContentPieceListItem
  onDelete: (id: string) => void
  onArchive: (id: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const Icon = TYPE_ICONS[piece.type]

  const handleCopy = async () => {
    await navigator.clipboard.writeText(piece.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/portal/content/${piece.id}`, { method: "DELETE" })
      if (res.ok) onDelete(piece.id)
    } finally {
      setDeleting(false)
    }
  }

  const handleArchive = async () => {
    if (piece.status === "ARCHIVED") return
    setArchiving(true)
    try {
      const res = await fetch(`/api/portal/content/${piece.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      })
      if (res.ok) onArchive(piece.id)
    } finally {
      setArchiving(false)
    }
  }

  const preview = piece.content.slice(0, 150) + (piece.content.length > 150 ? "…" : "")

  return (
    <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 group flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {piece.title}
            </h3>
            {piece.clientDeal && (
              <p className="text-xs text-muted-foreground/40 mt-0.5">{piece.clientDeal.companyName}</p>
            )}
          </div>
        </div>
        <span
          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${TYPE_COLORS[piece.type]}`}
        >
          {TYPE_LABELS[piece.type]}
        </span>
      </div>

      {/* Preview */}
      <p className="text-xs text-muted-foreground/60 leading-relaxed flex-1 mb-4">{preview}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_COLORS[piece.status]}`}
          >
            {piece.status.charAt(0) + piece.status.slice(1).toLowerCase()}
          </span>
          <span className="text-[10px] text-muted-foreground/30">{formatDate(piece.createdAt)}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
            title="Copy to clipboard"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>

          {piece.status !== "ARCHIVED" && (
            <button
              onClick={handleArchive}
              disabled={archiving}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground/40 hover:text-muted-foreground/80 hover:bg-muted/40 transition-all disabled:opacity-50"
              title="Archive"
            >
              <Archive className="h-3.5 w-3.5" />
              {archiving ? "…" : "Archive"}
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/5 transition-all disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? "…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ContentLibraryPage() {
  const [pieces, setPieces] = useState<ContentPieceListItem[]>([])
  const [typeFilter, setTypeFilter] = useState<ContentPieceType | "ALL">("ALL")
  const [statusFilter, setStatusFilter] = useState<ContentPieceStatus | "ALL">("ALL")
  const [loading, setLoading] = useState(true)

  const fetchPieces = useCallback(async (
    type: ContentPieceType | "ALL",
    status: ContentPieceStatus | "ALL"
  ) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (type !== "ALL") params.set("type", type)
      if (status !== "ALL") params.set("status", status)
      const url = `/api/portal/content${params.size > 0 ? `?${params.toString()}` : ""}`
      const res = await fetch(url)
      const data = await res.json()
      setPieces(data.pieces ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPieces(typeFilter, statusFilter)
  }, [typeFilter, statusFilter, fetchPieces])

  const handleDelete = (id: string) => {
    setPieces((prev) => prev.filter((p) => p.id !== id))
  }

  const handleArchive = (id: string) => {
    setPieces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "ARCHIVED" as ContentPieceStatus } : p))
    )
    // Re-fetch if filtering by non-archived status so the card disappears from current view
    if (statusFilter !== "ALL" && statusFilter !== "ARCHIVED") {
      fetchPieces(typeFilter, statusFilter)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Newspaper className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Content Engine</h1>
            <p className="text-xs text-muted-foreground">Turn your wins into content that attracts clients</p>
          </div>
        </div>
        <Link
          href="/portal/content/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Content
        </Link>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {TYPE_FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTypeFilter(tab.value)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              typeFilter === tab.value
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status Sub-filter */}
      <div className="flex items-center gap-1">
        {STATUS_FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              statusFilter === tab.value
                ? "bg-muted/30 text-foreground"
                : "text-muted-foreground/30 hover:text-muted-foreground/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 h-48 animate-pulse"
            />
          ))}
        </div>
      ) : pieces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Globe className="h-7 w-7 text-primary/50" />
          </div>
          <p className="text-muted-foreground font-medium mb-1">No content yet</p>
          <p className="text-sm text-muted-foreground/50 mb-4 max-w-xs">
            Turn your wins into content. Connect a won deal to generate case studies, LinkedIn posts, and more.
          </p>
          <Link
            href="/portal/content/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Content
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pieces.map((piece) => (
            <ContentCard
              key={piece.id}
              piece={piece}
              onDelete={handleDelete}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}
    </div>
  )
}
