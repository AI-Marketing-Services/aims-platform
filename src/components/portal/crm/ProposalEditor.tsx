"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Edit3,
  Eye,
  Check,
  Copy,
  Send,
  Printer,
  Mail,
  FileDown,
  X,
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
  // Operator branding — drives preview header + accent color so the
  // operator sees the proposal in their own brand, not platform default.
  operatorBranding?: {
    businessName: string | null
    tagline: string | null
    logoUrl: string | null
    brandColor: string | null
    senderName: string | null
  }
}

const STATUS_OPTIONS = ["DRAFT", "SENT", "ACCEPTED", "REJECTED"] as const
// Tonal scale of primary instead of rainbow status badges. Matches
// the rest of the AIMS UI: nothing competes with the brand color.
const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  SENT: "bg-primary/[0.08] text-primary border-primary/30",
  ACCEPTED: "bg-primary text-primary-foreground border-primary",
  REJECTED: "bg-muted text-muted-foreground border-border line-through",
}

export function ProposalEditor({
  proposalId,
  dealId,
  initialTitle,
  initialContent,
  initialStatus,
  shareToken,
  companyName,
  operatorBranding,
}: ProposalEditorProps) {
  const brandColor = operatorBranding?.brandColor ?? "#C4972A"
  const businessName =
    operatorBranding?.businessName?.trim() ||
    operatorBranding?.senderName?.trim() ||
    "AI Operator"
  const tagline = operatorBranding?.tagline?.trim()
  const logoUrl = operatorBranding?.logoUrl
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [status, setStatus] = useState(initialStatus)
  const [mode, setMode] = useState<"preview" | "edit">("preview")
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailTo, setEmailTo] = useState("")
  const [emailName, setEmailName] = useState("")
  const [emailMsg, setEmailMsg] = useState("")
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

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

  async function handleEmailSend() {
    setEmailSending(true)
    setEmailError(null)
    try {
      const res = await fetch(`/api/portal/crm/proposals/${proposalId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: emailTo, recipientName: emailName || undefined, message: emailMsg || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Send failed")
      setEmailSent(true)
      setStatus("SENT")
      setTimeout(() => { setShowEmailModal(false); setEmailSent(false) }, 1500)
      router.refresh()
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Send failed")
    } finally {
      setEmailSending(false)
    }
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
              {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Share link"}
            </button>
          )}
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-surface border border-border transition-all"
          >
            <Mail className="h-3.5 w-3.5" />
            Email client
          </button>
          <a
            href={`/api/portal/crm/proposals/${proposalId}/pdf`}
            download
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-surface border border-border transition-all"
          >
            <FileDown className="h-3.5 w-3.5" />
            Download PDF
          </a>
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

      {/* Content — preview is a fully-branded, formal document layout.
          Operator sees the proposal as their client will receive it
          (their name, logo, brand color throughout). Edit mode swaps
          to a Markdown source textarea. */}
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden min-h-[500px]">
        {mode === "preview" ? (
          <article className="bg-white text-zinc-900">
            {/* Top brand bar — full width accent strip */}
            <div className="h-1.5" style={{ backgroundColor: brandColor }} />

            {/* Header: logo + name + tagline */}
            <header
              className="px-10 pt-8 pb-6 border-b"
              style={{ borderColor: `${brandColor}25` }}
            >
              <div className="flex items-start gap-4">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={businessName}
                    className="h-12 w-12 rounded object-contain shrink-0"
                  />
                ) : (
                  <div
                    className="h-12 w-12 rounded flex items-center justify-center shrink-0 text-white font-bold"
                    style={{ backgroundColor: brandColor }}
                  >
                    {businessName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-2xl font-bold leading-tight"
                    style={{ color: brandColor, fontFamily: "Georgia, 'Playfair Display', serif" }}
                  >
                    {businessName}
                  </p>
                  {tagline && (
                    <p className="text-xs text-zinc-500 mt-1">{tagline}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">
                    Proposal
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </header>

            {/* Title block */}
            <div className="px-10 pt-7 pb-4">
              <h1
                className="text-3xl font-bold leading-tight text-zinc-900"
                style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
              >
                {title}
              </h1>
              <p className="text-sm text-zinc-500 mt-2">
                Prepared for{" "}
                <span className="font-semibold text-zinc-700">{companyName}</span>
              </p>
            </div>

            {/* Body content — Markdown rendered with GFM (tables, strike, etc.) */}
            <div
              className={cn(
                "px-10 pb-10 max-w-none",
                // Formal serif body, theme-anchored colors, brand-accented
                // headings + bullets. Different prose plugin than the
                // dark-card variants — this looks like a real document.
                "prose prose-zinc prose-base",
                "prose-headings:font-bold prose-headings:text-zinc-900 prose-headings:tracking-tight",
                "prose-h1:hidden", // we render the title above
                "prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:pb-1.5 prose-h2:border-b prose-h2:border-zinc-200",
                "prose-h3:text-base prose-h3:mt-5 prose-h3:mb-2",
                "prose-p:text-zinc-700 prose-p:leading-relaxed",
                "prose-strong:text-zinc-900 prose-strong:font-semibold",
                "prose-li:text-zinc-700 prose-li:my-0.5",
                "prose-ul:my-3 prose-ol:my-3 prose-ul:pl-5 prose-ol:pl-5",
                // Brand-color bullet markers
                "marker:text-[color:var(--brand-color)]",
                "prose-a:text-[color:var(--brand-color)] prose-a:no-underline hover:prose-a:underline",
                "prose-blockquote:text-zinc-600 prose-blockquote:border-l-[color:var(--brand-color)] prose-blockquote:pl-4 prose-blockquote:italic",
                "prose-code:text-zinc-900 prose-code:bg-zinc-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:font-normal",
                "prose-hr:border-zinc-200",
                // Tables — formal pinstripe with branded header
                "prose-table:border prose-table:border-zinc-200 prose-table:rounded prose-table:overflow-hidden prose-table:my-4 prose-table:text-sm",
                "prose-thead:bg-[color:var(--brand-color-soft)] prose-thead:border-b-2 prose-thead:border-[color:var(--brand-color)]",
                "prose-th:text-zinc-900 prose-th:font-bold prose-th:text-left prose-th:px-3 prose-th:py-2",
                "prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-zinc-100 prose-td:text-zinc-700",
                "prose-tbody:bg-white",
              )}
              style={
                {
                  ["--brand-color" as string]: brandColor,
                  ["--brand-color-soft" as string]: `${brandColor}10`,
                } as React.CSSProperties
              }
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>

            {/* Footer */}
            <footer
              className="px-10 py-4 border-t flex items-center justify-between text-[11px] text-zinc-400"
              style={{ borderColor: `${brandColor}20` }}
            >
              <span>
                Confidential ·{" "}
                <span className="text-zinc-600 font-medium">{businessName}</span>
              </span>
              {operatorBranding?.senderName && (
                <span>Prepared by {operatorBranding.senderName}</span>
              )}
            </footer>
          </article>
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

      {/* Email modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-foreground">Email Proposal to Client</h3>
              <button onClick={() => setShowEmailModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                  Recipient Email <span className="text-primary">*</span>
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                  Recipient Name <span className="text-muted-foreground font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={emailName}
                  onChange={(e) => setEmailName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
                  Personal Message <span className="text-muted-foreground font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  value={emailMsg}
                  onChange={(e) => setEmailMsg(e.target.value)}
                  rows={3}
                  placeholder="Hi Jane, here's the proposal we discussed…"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                />
              </div>
            </div>

            {emailError && (
              <p className="mt-3 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{emailError}</p>
            )}

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground border border-border hover:bg-surface transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEmailSend}
                disabled={emailSending || !emailTo || emailSent}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all"
              >
                {emailSent ? (
                  <><Check className="h-4 w-4" /> Sent!</>
                ) : (
                  <><Mail className="h-4 w-4" /> {emailSending ? "Sending…" : "Send Proposal"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
