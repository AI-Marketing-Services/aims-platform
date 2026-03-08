"use client"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, X, Send, Loader2, LifeBuoy, Layers, CreditCard, MessageSquarePlus, ShoppingBag } from "lucide-react"
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

export function PortalChatWidget({ firstName = "there", serviceCount = 0 }: PortalChatWidgetProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const welcomeText = buildWelcomeMessage(firstName, serviceCount)

  const { messages, sendMessage, status, error } = useChat<UIMessage>({
    transport: new TextStreamChatTransport({ api: "/api/ai/portal-chat" }),
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
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#DC2626] text-white shadow-lg hover:bg-[#B91C1C] transition-all hover:scale-105 active:scale-95"
          aria-label="AIMS Support"
        >
          <LifeBuoy className="h-5 w-5" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[520px] rounded-2xl border border-white/10 bg-[#0D0F14] shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="AIMS" width={20} height={20} className="object-contain" />
              <div>
                <p className="text-sm font-semibold text-white">AIMS Support</p>
                <p className="text-[10px] text-white/40">Ask about your services</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/10 transition-colors">
              <X className="h-4 w-4 text-white/60" />
            </button>
          </div>

          {/* Quick links */}
          {messages.length <= 1 && (
            <div className="flex-shrink-0 grid grid-cols-4 gap-1.5 px-3 py-2.5 border-b border-white/10">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-foreground"
                >
                  <link.icon className="h-4 w-4 text-white/50" />
                  <span className="text-[10px] text-white/40 text-center leading-tight">{link.label}</span>
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
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#DC2626] mr-2 mt-1 flex-shrink-0">
                      <LifeBuoy className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-[#DC2626] text-white rounded-br-sm"
                        : "bg-white/[0.08] text-white/80 rounded-bl-sm"
                    }`}
                  >
                    {text}
                  </div>
                </div>
              )
            })}
            {isStreaming && (
              <div className="flex justify-start">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#DC2626] mr-2 mt-1 flex-shrink-0">
                  <LifeBuoy className="h-2.5 w-2.5 text-white" />
                </div>
                <div className="bg-white/[0.08] rounded-xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="h-3.5 w-3.5 text-white/40 animate-spin" />
                </div>
              </div>
            )}
            {error && <p className="text-xs text-red-400 text-center">Error. Please try again or visit /portal/support.</p>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-white/10 p-3">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your services..."
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#DC2626]/50"
                disabled={isStreaming}
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#DC2626] text-white hover:bg-[#B91C1C] disabled:opacity-40 transition flex-shrink-0"
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
