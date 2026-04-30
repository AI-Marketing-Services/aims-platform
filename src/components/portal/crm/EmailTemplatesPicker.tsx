"use client"

import { useState, useMemo, useRef } from "react"
import {
  Mail,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  EMAIL_TEMPLATES,
  renderTemplate,
  type EmailTemplate,
} from "@/lib/email/lead-templates"

interface EmailTemplatesPickerProps {
  dealId: string
  vars: {
    firstName: string | null
    fullName: string | null
    companyName: string
    industry: string | null
    cityState: string | null
    description: string | null
    employeesRange: string | null
    operatorName: string | null
    operatorBusiness: string | null
    calendarLink: string | null
  }
  recipientEmail: string | null
}

const CATEGORY_LABELS: Record<EmailTemplate["category"], string> = {
  cold: "Cold opener",
  warm: "Warm opener",
  value: "Value-led",
  "follow-up": "Follow-up",
  breakup: "Breakup",
  "post-meeting": "Post-meeting",
}

const CATEGORY_ORDER: EmailTemplate["category"][] = [
  "cold",
  "warm",
  "value",
  "follow-up",
  "post-meeting",
  "breakup",
]

export function EmailTemplatesPicker({
  dealId,
  vars,
  recipientEmail,
}: EmailTemplatesPickerProps) {
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [copied, setCopied] = useState<"subject" | "body" | "all" | null>(null)
  const [logging, setLogging] = useState(false)
  const subjectRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  // Group templates by category for the picker grid
  const grouped = useMemo(() => {
    const map: Record<string, EmailTemplate[]> = {}
    for (const t of EMAIL_TEMPLATES) {
      if (!map[t.category]) map[t.category] = []
      map[t.category].push(t)
    }
    return map
  }, [])

  const active = activeId
    ? EMAIL_TEMPLATES.find((t) => t.id === activeId) ?? null
    : null
  const rendered = useMemo(() => {
    if (!active) return null
    return renderTemplate(active, vars)
  }, [active, vars])

  async function handleCopy(which: "subject" | "body" | "all") {
    if (!rendered) return
    const subjectVal = subjectRef.current?.value ?? rendered.subject
    const bodyVal = bodyRef.current?.value ?? rendered.body
    const text =
      which === "subject"
        ? subjectVal
        : which === "body"
          ? bodyVal
          : `Subject: ${subjectVal}\n\n${bodyVal}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // ignore
    }
  }

  async function handleOpenInMail() {
    if (!rendered) return
    const subjectVal = subjectRef.current?.value ?? rendered.subject
    const bodyVal = bodyRef.current?.value ?? rendered.body
    const to = recipientEmail ?? ""
    const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subjectVal)}&body=${encodeURIComponent(bodyVal)}`
    window.open(url, "_blank", "noopener,noreferrer")

    // Log as a follow-up sent so the deal's stale-timer resets
    setLogging(true)
    try {
      await fetch(`/api/portal/crm/deals/${dealId}/log-followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subjectVal,
          recipientEmail: recipientEmail ?? undefined,
          tone: active?.category,
          intent: active?.id,
        }),
      })
    } catch {
      // non-fatal
    } finally {
      setLogging(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full p-3 rounded-lg border border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-left transition-all"
      >
        <Mail className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Send email — pick a template
          </p>
          <p className="text-[11px] text-muted-foreground">
            10 personalized templates · auto-fills from this lead&apos;s data ·
            free
          </p>
        </div>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="rounded-lg border border-border bg-card p-3 space-y-3">
          {/* Template grid grouped by category */}
          <div className="space-y-2.5">
            {CATEGORY_ORDER.filter((c) => grouped[c]?.length).map((cat) => (
              <div key={cat}>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                  {CATEGORY_LABELS[cat]}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {grouped[cat].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveId(t.id)}
                      className={cn(
                        "text-left rounded-md border px-3 py-2 text-xs transition-colors",
                        activeId === t.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:border-primary/40 hover:bg-primary/5",
                      )}
                    >
                      <p className="font-semibold text-foreground">{t.label}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {t.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Active template preview + edit */}
          {rendered && (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Subject
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopy("subject")}
                    className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    {copied === "subject" ? (
                      <>
                        <Check className="h-2.5 w-2.5 text-emerald-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-2.5 w-2.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <input
                  ref={subjectRef}
                  defaultValue={rendered.subject}
                  className="w-full px-2.5 py-1.5 rounded border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Body
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopy("body")}
                    className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    {copied === "body" ? (
                      <>
                        <Check className="h-2.5 w-2.5 text-emerald-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-2.5 w-2.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  ref={bodyRef}
                  defaultValue={rendered.body}
                  rows={10}
                  className="w-full px-2.5 py-2 rounded border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-y font-mono text-[12.5px] leading-relaxed"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Edit anything before sending. Variables auto-filled from this
                  lead&apos;s data.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-primary/15">
                <button
                  type="button"
                  onClick={() => handleCopy("all")}
                  className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors"
                >
                  {copied === "all" ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy all
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleOpenInMail}
                  disabled={logging}
                  className="inline-flex items-center gap-1.5 rounded bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {logging ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Opening…
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-3 w-3" />
                      Open in mail app
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
