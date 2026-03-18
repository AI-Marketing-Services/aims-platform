"use client"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, X, Send, ArrowRight, Loader2 } from "lucide-react"
// MessageSquare kept for chat bubbles; FAB uses AIMS logo image
import { useChat } from "@ai-sdk/react"
import { TextStreamChatTransport, type UIMessage } from "ai"
import Link from "next/link"
import Image from "next/image"

// Fallback quick actions shown when AI is not streaming a reply
const QUICK_ACTIONS = [
  { label: "Explore Services", href: "/marketplace" },
  { label: "Take AI Quiz", href: "/tools/ai-readiness-quiz" },
  { label: "Book a Call", href: "/get-started" },
  { label: "Free Site Audit", href: "/tools/website-audit" },
]

function FallbackWidget({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" })
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email) return
    await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactName: form.name,
        contactEmail: form.email,
        source: "chatbot-fallback",
        channelTag: "website-chatbot",
        sourceDetail: form.message || "Via chat widget",
      }),
    }).catch(() => {})
    setSent(true)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-[#DC2626]">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="AIMS" width={22} height={22} className="object-contain" />
          <span className="text-sm font-semibold text-white">AIMS AI</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/20 transition-colors">
          <X className="h-4 w-4 text-white" />
        </button>
      </div>

      <div className="p-4">
        {sent ? (
          <div className="text-center py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 mx-auto mb-3">
              <MessageSquare className="h-5 w-5 text-[#DC2626]" />
            </div>
            <p className="text-sm font-semibold text-foreground">Got it! We&apos;ll reach out soon.</p>
            <p className="mt-1 text-xs text-muted-foreground">Check your inbox within 24 hours.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Hi! How can we help? Browse our resources or drop us a message.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-2 text-xs font-medium text-foreground hover:border-[#DC2626]/30 hover:bg-red-50 transition"
                >
                  {a.label}
                </Link>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="space-y-2">
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
              />
              <input
                type="email"
                placeholder="Your email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
              />
              <textarea
                placeholder="What are you looking to solve?"
                rows={2}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626] resize-none"
              />
              <button
                type="submit"
                disabled={!form.name || !form.email}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#DC2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B91C1C] disabled:opacity-50 transition"
              >
                Send Message <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function getMessageText(parts: { type: string; text?: string }[]): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

function AIChat({ onClose }: { onClose: () => void }) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState("")

  const { messages, sendMessage, status, error } = useChat<UIMessage>({
    transport: new TextStreamChatTransport({ api: "/api/ai/chat" }),
    messages: [
      {
        id: "welcome",
        role: "assistant" as const,
        parts: [{ type: "text" as const, text: "Hi! I'm the AIMS AI assistant. What kind of business do you run, and what's your biggest growth challenge right now?" }],
      },
    ],
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const isStreaming = status === "streaming" || status === "submitted"

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return
    sendMessage({ text: input.trim() })
    setInput("")
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[560px] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-[#DC2626] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="AIMS" width={22} height={22} className="object-contain" />
          <div>
            <p className="text-sm font-semibold text-white">AIMS AI</p>
            <p className="text-[10px] text-red-100">Ask about our services</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/20 transition-colors">
          <X className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.map((m) => {
          const text = getMessageText(m.parts as { type: string; text?: string }[])
          if (!text && m.role !== "user") return null
          return (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm mr-2 mt-1 flex-shrink-0 overflow-hidden">
                  <Image src="/logo.png" alt="AIMS" width={16} height={16} className="object-contain" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-[#DC2626] text-white rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                {text}
              </div>
            </div>
          )
        })}

        {isStreaming && (
          <div className="flex justify-start">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm mr-2 mt-1 flex-shrink-0 overflow-hidden">
              <Image src="/logo.png" alt="AIMS" width={16} height={16} className="object-contain" />
            </div>
            <div className="bg-muted rounded-xl rounded-bl-sm px-3.5 py-2.5">
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 text-center">Something went wrong. Please try again.</p>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border p-3">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about our AI services..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#DC2626] text-white hover:bg-[#B91C1C] disabled:opacity-50 transition flex-shrink-0"
          >
            {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
        <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
          Powered by AIMS AI · <Link href="/get-started" className="hover:text-[#DC2626] transition-colors">Book a strategy call</Link>
        </p>
      </div>
    </div>
  )
}

export function AIMSChatWidget() {
  const [open, setOpen] = useState(false)
  const [useAI, setUseAI] = useState(false)

  // Detect if AI is configured (only on client)
  useEffect(() => {
    // We attempt to use AI chat; if the endpoint returns 503 we fall back
    setUseAI(true)
  }, [])

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white border border-gray-200 shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95"
          aria-label="Chat with AIMS AI"
        >
          <Image src="/logo.png" alt="AIMS" width={30} height={30} className="object-contain" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        useAI
          ? <AIChat onClose={() => setOpen(false)} />
          : <FallbackWidget onClose={() => setOpen(false)} />
      )}
    </>
  )
}
