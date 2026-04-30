"use client"

import { useState, useRef, useEffect } from "react"
import {
  MessageCircle,
  X,
  Sparkles,
  Send,
  Loader2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DealChatPanelProps {
  dealId: string
  companyName: string
}

interface Message {
  role: "user" | "assistant"
  content: string
}

const SUGGESTED_PROMPTS = [
  "What should I focus on with this lead?",
  "Draft 3 subject lines for the next email",
  "Summarize all our meeting notes",
  "What objections is this lead likely to raise?",
  "Write a 2-sentence pitch tailored to this company",
  "Is this deal worth pursuing? Why or why not?",
] as const

/**
 * Chat side panel scoped to one ClientDeal. The API endpoint already
 * has full context (enrichment + contacts + notes + activities +
 * proposals) so the operator never has to re-prime the assistant.
 *
 * 2 credits per message. UI shows the cost up-front + balance check
 * via 402 responses.
 */
export function DealChatPanel({ dealId, companyName }: DealChatPanelProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

  // Auto-grow textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 160)}px`
    }
  }, [input])

  async function handleSend(content: string) {
    const trimmed = content.trim()
    if (!trimmed) return
    setError(null)
    setSending(true)

    // Optimistic add user message + clear input
    const updated: Message[] = [...messages, { role: "user", content: trimmed }]
    setMessages(updated)
    setInput("")

    try {
      const res = await fetch(`/api/portal/crm/deals/${dealId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Send only the last 6 turns to keep context reasonable
          messages: updated.slice(-6),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 402) {
          setError(
            `Need ${data.required ?? 2} credits but have ${data.available ?? 0}.`,
          )
        } else {
          setError(typeof data.error === "string" ? data.error : "Chat failed")
        }
        // Rollback the optimistic user message
        setMessages(messages)
        return
      }
      setMessages([
        ...updated,
        { role: "assistant", content: data.reply ?? "" },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
      setMessages(messages)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSend(input)
    }
  }

  function handleReset() {
    setMessages([])
    setError(null)
    setInput("")
    inputRef.current?.focus()
  }

  return (
    <>
      {/* Trigger button (in the deal detail page, mounted by parent) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full p-3 rounded-lg border border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-left transition-all"
      >
        <MessageCircle className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Ask AI about this deal
          </p>
          <p className="text-[11px] text-muted-foreground">
            Full deal context preloaded. 2 credits per question.
          </p>
        </div>
      </button>

      {/* Slide-in panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative ml-auto h-full w-full sm:w-[440px] bg-card border-l border-border flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-10">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    Ask about {companyName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    AI has full context: enrichment, notes, activity, proposals.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                    title="Start a new chat"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
            >
              {messages.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Try one of these to get started:
                  </p>
                  <div className="space-y-1.5">
                    {SUGGESTED_PROMPTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleSend(p)}
                        disabled={sending}
                        className="w-full text-left rounded-md border border-border bg-background hover:border-primary/40 hover:bg-primary/5 px-3 py-2 text-xs text-foreground disabled:opacity-50 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      m.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-3.5 py-2.5 max-w-[85%] text-sm leading-relaxed",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted/40 text-foreground rounded-bl-sm whitespace-pre-wrap",
                      )}
                    >
                      {m.content}
                    </div>
                  </div>
                ))
              )}

              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-3.5 py-2.5 bg-muted/40 text-foreground rounded-bl-sm inline-flex items-center gap-2 text-sm">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mx-4 mb-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Composer */}
            <div className="border-t border-border bg-card p-3 space-y-2">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about this deal..."
                  rows={1}
                  disabled={sending}
                  className="flex-1 resize-none px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => handleSend(input)}
                  disabled={sending || !input.trim()}
                  className="rounded-lg bg-primary text-primary-foreground p-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Enter to send. Shift+Enter for newline. 2 credits per message.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
