"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Mail,
  Phone,
  RefreshCw,
  MessageSquare,
  FileText,
  Plus,
  Trash2,
  Copy,
  Check,
  FileCode2,
} from "lucide-react"
import { AiScriptType } from "@prisma/client"

interface ScriptListItem {
  id: string
  type: AiScriptType
  title: string
  content: string
  clientDealId: string | null
  clientDeal: { companyName: string } | null
  createdAt: string
  updatedAt: string
}

const TYPE_LABELS: Record<AiScriptType, string> = {
  COLD_EMAIL: "Cold Email",
  DISCOVERY_CALL: "Discovery Call",
  FOLLOW_UP: "Follow-Up",
  LINKEDIN_DM: "LinkedIn DM",
  PROPOSAL_FOLLOW_UP: "Proposal Follow-Up",
}

const TYPE_COLORS: Record<AiScriptType, string> = {
  COLD_EMAIL: "bg-blue-50 text-blue-700 border-blue-200",
  DISCOVERY_CALL: "bg-violet-50 text-violet-700 border-violet-200",
  FOLLOW_UP: "bg-green-50 text-green-700 border-green-200",
  LINKEDIN_DM: "bg-sky-50 text-sky-700 border-sky-200",
  PROPOSAL_FOLLOW_UP: "bg-amber-50 text-amber-700 border-amber-200",
}

const TYPE_ICONS: Record<AiScriptType, React.ElementType> = {
  COLD_EMAIL: Mail,
  DISCOVERY_CALL: Phone,
  FOLLOW_UP: RefreshCw,
  LINKEDIN_DM: MessageSquare,
  PROPOSAL_FOLLOW_UP: FileText,
}

const FILTER_TABS: Array<{ label: string; value: AiScriptType | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "Cold Email", value: "COLD_EMAIL" },
  { label: "Discovery Call", value: "DISCOVERY_CALL" },
  { label: "Follow-Up", value: "FOLLOW_UP" },
  { label: "LinkedIn DM", value: "LINKEDIN_DM" },
  { label: "Proposal Follow-Up", value: "PROPOSAL_FOLLOW_UP" },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function ScriptCard({
  script,
  onDelete,
}: {
  script: ScriptListItem
  onDelete: (id: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const Icon = TYPE_ICONS[script.type]

  const handleCopy = async () => {
    await navigator.clipboard.writeText(script.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/portal/scripts/${script.id}`, { method: "DELETE" })
      if (res.ok) onDelete(script.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-xl bg-card border border-border p-5 hover:border-primary/30 hover:shadow-sm transition-all duration-200 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {script.title}
            </h3>
            {script.clientDeal && (
              <p className="text-xs text-muted-foreground mt-0.5">{script.clientDeal.companyName}</p>
            )}
          </div>
        </div>
        <span
          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${TYPE_COLORS[script.type]}`}
        >
          {TYPE_LABELS[script.type]}
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-4">
        {script.content.slice(0, 150)}
        {script.content.length > 150 ? "…" : ""}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{formatDate(script.createdAt)}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
            title="Copy to clipboard"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
            title="Delete script"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? "…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<ScriptListItem[]>([])
  const [activeFilter, setActiveFilter] = useState<AiScriptType | "ALL">("ALL")
  const [loading, setLoading] = useState(true)

  const fetchScripts = useCallback(async (filter: AiScriptType | "ALL") => {
    setLoading(true)
    try {
      const url =
        filter === "ALL"
          ? "/api/portal/scripts"
          : `/api/portal/scripts?type=${filter}`
      const res = await fetch(url)
      const data = await res.json()
      setScripts(data.scripts ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchScripts(activeFilter)
  }, [activeFilter, fetchScripts])

  const handleDelete = (id: string) => {
    setScripts((prev) => prev.filter((s) => s.id !== id))
  }

  const handleFilterChange = (filter: AiScriptType | "ALL") => {
    setActiveFilter(filter)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileCode2 className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">AI Script Builder</h1>
            <p className="text-xs text-muted-foreground">Generate and manage your sales scripts</p>
          </div>
        </div>
        <Link
          href="/portal/scripts/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Script
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFilter === tab.value
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Script Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-card border border-border p-5 h-44 animate-pulse"
            />
          ))}
        </div>
      ) : scripts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <FileCode2 className="h-7 w-7 text-primary/50" />
          </div>
          <p className="text-muted-foreground font-medium mb-1">No scripts yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            {activeFilter === "ALL"
              ? "Generate your first AI-powered sales script to get started."
              : `No ${TYPE_LABELS[activeFilter as AiScriptType]} scripts yet.`}
          </p>
          <Link
            href="/portal/scripts/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Generate Script
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {scripts.map((script) => (
            <ScriptCard key={script.id} script={script} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
