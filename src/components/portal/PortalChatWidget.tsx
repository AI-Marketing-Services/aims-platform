"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { MessageSquare, X, Send, Loader2, Layers, CreditCard, MessageSquarePlus, ShoppingBag, AlertCircle } from "lucide-react"
import { useChat } from "@ai-sdk/react"
import { TextStreamChatTransport, type UIMessage } from "ai"
import Link from "next/link"
import Image from "next/image"

const QUICK_LINKS = [
  { label: "My Services", href: "/portal/services", icon: Layers },
  { label: "Billing", href: "/portal/billing", icon: CreditCard },
  { label: "Submit Ticket", href: "/portal/support", icon: MessageSquarePlus },
  { label: "Marketplace", href: "/portal/marketplace", icon: ShoppingBag },
]

function getMessageText(parts: { type: string; text?: string }[]): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

function buildWelcomeMessage(firstName: string, serviceCount: number): string {
  if (serviceCount === 0) {
    return `Hi ${firstName}! I can help you find the right AIMS service, answer pricing questions, or connect you with our team. What would you like to know?`
  }
  const s = serviceCount === 1 ? "" : "s"
  return `Hi ${firstName}! You have ${serviceCount} active service${s}. Need help with your setup, billing, or anything else?`
}

interface PortalChatWidgetProps {
  firstName?: string
  serviceCount?: number
}

function generatePortalSessionId(): string {
  return `portal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function PortalChatWidget({ firstName = "there", serviceCount = 0 }: PortalChatWidgetProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [showNudge, setShowNudge] = useState(false)
  const [nudgeDismissed, setNudgeDismissed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sessionIdRef = useRef(generatePortalSessionId())

  const welcomeText = buildWelcomeMessage(firstName, serviceCount)

  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: "/api/ai/portal-chat",
        body: { sessionId: sessionIdRef.current },
      }),
    []
  )

  const { messages, sendMessage, status, error } = useChat<UIMessage>({
    transport,
    messages: [
      {
        id: "welcome",
        role: "assistant" as const,
        parts: [{ type: "text" as const, text: welcomeText }],
      },
    ],
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Proactive nudge after 8 seconds
  useEffect(() => {
    if (open || nudgeDismissed) return
    const timer = setTimeout(() => setShowNudge(true), 8000)
    return () => clearTimeout(timer)
  }, [open, nudgeDismissed])

  const isStreaming = status === "streaming" || status === "submitted"

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return
    sendMessage({ text: input.trim() })
    setInput("")
  }

  return (
    <>
      {!open && (
        <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3">
          {showNudge && !nudgeDismissed && (
            <div className="relative bg-card border border-border rounded-xl px-4 py-3 shadow-xl max-w-[220px] animate-in slide-in-from-right-2 fade-in duration-300">
              <button
                onClick={() => { setNudgeDismissed(true); setShowNudge(false) }}
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="h-3 w-3" />
              </button>
              <p className="text-sm text-foreground font-medium">Need help?</p>
              <p className="text-xs text-muted-foreground mt-1">I can answer questions about your services, billing, or setup.</p>
            </div>
          )}
          <button
            onClick={() => { setOpen(true); setShowNudge(false); setNudgeDismissed(true) }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-card border border-border shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95"
            aria-label="AIMS Support"
          >
            <Image src="/logo.png" alt="AIMS" width={28} height={28} className="h-7 w-7 object-contain" />
          </button>
        </div>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[520px] rounded-2xl border border-border bg-[#0E1219] shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card flex-shrink-0">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="AIMS" width={20} height={20} className="object-contain" />
              <div>
                <p className="text-sm font-semibold text-foreground">AIMS Support</p>
                <p className="text-[10px] text-muted-foreground">Ask about your services</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/5 transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Quick links */}
          {messages.length <= 1 && (
            <div className="flex-shrink-0 grid grid-cols-4 gap-1.5 px-3 py-2.5 border-b border-border">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg border border-border bg-card hover:bg-white/5 transition-colors"
                >
                  <link.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">{link.label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {messages.map((m) => {
              const text = getMessageText(m.parts as { type: string; text?: string }[])
              if (!text && m.role !== "user") return null
              return (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "assistant" && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-card border border-border shadow-sm mr-2 mt-1 flex-shrink-0 overflow-hidden">
                      <Image src="/logo.png" alt="AIMS" width={16} height={16} className="h-4 w-4 object-contain" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-[#C4972A] text-[#08090D] font-medium rounded-br-sm"
                        : "bg-card border border-border text-foreground rounded-bl-sm"
                    }`}
                  >
                    {text}
                  </div>
                </div>
              )
            })}
            {isStreaming && (
              <div className="flex justify-start">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-card border border-border shadow-sm mr-2 mt-1 flex-shrink-0 overflow-hidden">
                  <Image src="/logo.png" alt="AIMS" width={16} height={16} className="h-4 w-4 object-contain" />
                </div>
                <div className="bg-card border border-border rounded-xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center gap-2 py-2">
                <AlertCircle className="h-3.5 w-3.5 text-foreground/60" />
                <p className="text-xs text-foreground/60">Our assistant is temporarily unavailable. Please try again later.</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-border bg-card p-3">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your services..."
                className="flex-1 rounded-lg border border-border bg-[#0E1219] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#C4972A]/50"
                disabled={isStreaming}
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C4972A] text-[#08090D] hover:bg-[#A17D22] disabled:opacity-40 transition flex-shrink-0"
              >
                {isStreaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
