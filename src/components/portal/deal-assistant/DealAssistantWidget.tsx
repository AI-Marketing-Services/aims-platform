"use client"

import { useState } from "react"
import { Bot, Send, Sparkles, AlertCircle, Copy, Check } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Props {
  dealId: string
  /** Quick-action presets shown above the input. */
  presets?: Array<{ label: string; action: AssistantAction; prompt: string }>
}

type AssistantAction =
  | "next_action"
  | "draft_followup"
  | "score"
  | "summary"
  | "ask"

const DEFAULT_PRESETS = [
  {
    label: "Next best action",
    action: "next_action" as const,
    prompt: "What's the single best next move on this deal?",
  },
  {
    label: "Draft follow-up",
    action: "draft_followup" as const,
    prompt: "Draft my next follow-up email.",
  },
  {
    label: "Score this deal",
    action: "score" as const,
    prompt: "Score this deal 1-10 with reasoning.",
  },
  {
    label: "Weekly summary",
    action: "summary" as const,
    prompt: "Summarize where this deal stands this week.",
  },
]

interface Message {
  role: "operator" | "assistant"
  text: string
  timestamp: number
}

/**
 * Renders the Deal Assistant chat box. Client-only; calls
 * /api/portal/crm/deals/[id]/assistant. Surfaces 402 (paywall) gracefully
 * because the EntitlementGate on the parent page should prevent that, but
 * defending the widget keeps it safe to embed elsewhere.
 */
export function DealAssistantWidget({ dealId, presets = DEFAULT_PRESETS }: Props) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<number | null>(null)

  const send = async (action: AssistantAction, prompt: string) => {
    if (busy) return
    setBusy(true)
    setError(null)
    const userMsg: Message = { role: "operator", text: prompt, timestamp: Date.now() }
    setMessages((prev) => [...prev, userMsg])

    try {
      const res = await fetch(`/api/portal/crm/deals/${dealId}/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, action }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 402) {
        setError(
          "Deal Assistant is a Pro+ feature. Upgrade your plan to unlock it.",
        )
        return
      }
      if (!res.ok) {
        throw new Error(data?.error ?? `Assistant failed (${res.status})`)
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.response ?? "(no response)",
          timestamp: Date.now(),
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assistant call failed")
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setInput("")
    await send("ask", text)
  }

  const handleCopy = async (idx: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(idx)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      // ignore clipboard failures
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-muted/20">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bot className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Deal Assistant</h3>
          <p className="text-[10px] text-muted-foreground">
            Knows this deal. Ask anything.
          </p>
        </div>
      </div>

      {/* Quick-action presets */}
      <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-border bg-card">
        {presets.map((p) => (
          <button
            key={p.action}
            type="button"
            onClick={() => send(p.action, p.prompt)}
            disabled={busy}
            className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 hover:border-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="inline h-3 w-3 mr-1 text-primary" />
            {p.label}
          </button>
        ))}
      </div>

      {/* Conversation */}
      <div className="px-4 py-3 max-h-96 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Pick a quick action above or type a question to get started.
          </p>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={
                m.role === "operator"
                  ? "ml-auto max-w-[85%] rounded-xl bg-primary/10 text-foreground px-3 py-2 text-sm"
                  : "max-w-[95%] rounded-xl bg-muted/40 text-foreground px-3 py-2 pr-8 text-sm relative group"
              }
            >
              {m.role === "operator" ? (
                <p className="whitespace-pre-wrap">{m.text}</p>
              ) : (
                <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-headings:font-semibold prose-h1:text-base prose-h1:mt-2 prose-h1:mb-1.5 prose-h2:text-sm prose-h2:mt-2 prose-h2:mb-1 prose-h3:text-[13px] prose-h3:mt-1.5 prose-h3:mb-1 prose-p:my-1.5 prose-p:leading-relaxed prose-strong:text-foreground prose-strong:font-semibold prose-ul:my-1.5 prose-ul:pl-4 prose-ol:my-1.5 prose-ol:pl-4 prose-li:my-0.5 prose-li:marker:text-muted-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[12px] prose-code:before:content-none prose-code:after:content-none prose-hr:my-3 prose-hr:border-border">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.text}
                  </ReactMarkdown>
                </div>
              )}
              {m.role === "assistant" && (
                <button
                  type="button"
                  onClick={() => handleCopy(idx, m.text)}
                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-card"
                  title="Copy"
                >
                  {copied === idx ? (
                    <Check className="h-3 w-3 text-emerald-700" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              )}
            </div>
          ))
        )}
        {busy && (
          <div className="text-xs text-muted-foreground italic">Thinking…</div>
        )}
      </div>

      {error && (
        <div className="px-4 py-2 border-t border-border bg-destructive/5 text-destructive text-xs flex items-start gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="border-t border-border bg-muted/10 p-2 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this deal…"
          className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2 py-2"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
