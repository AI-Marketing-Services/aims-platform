"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import {
  FileText,
  Edit3,
  Eye,
  Check,
  Copy,
  Send,
  Printer,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ProposalEditorProps {
  proposalId: string
  dealId: string
  initialTitle: string
  initialContent: string
  initialStatus: string
  shareToken: string | null
  companyName: string
}

const STATUS_OPTIONS = ["DRAFT", "SENT", "ACCEPTED", "REJECTED"] as const
const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-surface text-muted-foreground border-border",
  SENT: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ACCEPTED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
}

export function ProposalEditor({
  proposalId,
  dealId,
  initialTitle,
  initialContent,
  initialStatus,
  shareToken,
  companyName,
}: ProposalEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [status, setStatus] = useState(initialStatus)
  const [mode, setMode] = useState<"preview" | "edit">("preview")
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleSave() {
    startTransition(async () => {
      await fetch(`/api/portal/crm/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, status }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    })
  }

  async function copyShareLink() {
    if (!shareToken) return
    const url = `${window.location.origin}/proposals/${shareToken}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xl font-bold text-foreground bg-transparent border-0 border-b border-transparent hover:border-border focus:border-primary focus:outline-none pb-1 transition-colors"
          />
          <p className="text-xs text-muted-foreground mt-1">For {companyName}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status selector */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={cn(
              "h-7 px-2 rounded-full text-[11px] font-semibold border focus:outline-none",
              STATUS_COLORS[status] ?? STATUS_COLORS.DRAFT
            )}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="bg-card text-foreground">
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center rounded-lg bg-surface border border-border p-0.5 gap-0.5">
          <button
            onClick={() => setMode("preview")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
              mode === "preview"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
          <button
            onClick={() => setMode("edit")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
              mode === "edit"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {shareToken && (
            <button
              onClick={copyShareLink}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-surface border border-border transition-all"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Share link"}
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-surface border border-border transition-all"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {saved ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Saved
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                {isPending ? "Saving…" : "Save"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-card border border-border rounded-xl min-h-[500px]">
        {mode === "preview" ? (
          <div className="prose prose-invert prose-sm max-w-none p-6 print:text-black print:bg-white">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[500px] p-6 bg-transparent text-foreground text-sm font-mono leading-relaxed resize-y focus:outline-none"
            placeholder="Write your proposal in Markdown…"
          />
        )}
      </div>

      <p className="text-[10px] text-muted-foreground/50">
        {mode === "edit" ? "Editing Markdown source. Switch to Preview to see formatted output." : ""}
      </p>
    </div>
  )
}
