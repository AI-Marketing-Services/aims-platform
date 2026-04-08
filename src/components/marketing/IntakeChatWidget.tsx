"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { usePathname } from "next/navigation"
import { X, Send, Loader2, Mail, ArrowRight, AlertCircle } from "lucide-react"
import { useChat } from "@ai-sdk/react"
import { TextStreamChatTransport, type UIMessage } from "ai"
import Image from "next/image"
import { getMessageText } from "@/lib/utils"

const WELCOME_TEXT =
  "What's the biggest bottleneck in your business right now? We help companies embed AI to remove growth ceilings."

const INITIAL_MESSAGES: UIMessage[] = [
  {
    id: "welcome",
    role: "assistant" as const,
    parts: [{ type: "text" as const, text: WELCOME_TEXT }],
  },
]

function generateSessionId(): string {
  return `intake_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function IntakeChatWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [hasAutoOpened, setHasAutoOpened] = useState(false)
  const [email, setEmail] = useState("")
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [emailInput, setEmailInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sessionIdRef = useRef(generateSessionId())

  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: "/api/ai/intake-chat",
        body: () => ({
          sessionId: sessionIdRef.current,
          email: email || undefined,
        }),
      }),
    [email]
  )

  const { messages, sendMessage, status, error } = useChat<UIMessage>({
    transport,
    messages: INITIAL_MESSAGES,
  } as Parameters<typeof useChat>[0])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Listen for global open-chatbot events
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener("open-intake-chat", handler)
    return () => window.removeEventListener("open-intake-chat", handler)
  }, [])

  // Auto-open after 5 seconds
  useEffect(() => {
    if (hasAutoOpened) return
    const timer = setTimeout(() => {
      setOpen(true)
      setHasAutoOpened(true)
    }, 5000)
    return () => clearTimeout(timer)
  }, [hasAutoOpened])

  const isStreaming = status === "streaming" || status === "submitted"

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return
    sendMessage({ text: input.trim() })
    setInput("")
  }

  const handleEmailSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = emailInput.trim().toLowerCase()
      if (!EMAIL_REGEX.test(trimmed)) {
        setEmailError("Please enter a valid email address")
        return
      }
      setEmailError("")
      setEmail(trimmed)
      setEmailSubmitted(true)
    },
    [emailInput]
  )

  // Hide on /crm-onboarding since it has its own dedicated chatbot
  if (pathname === "/crm-onboarding") return null

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#141923] border border-[#C4972A]/30 shadow-xl hover:shadow-2xl hover:shadow-[#C4972A]/10 transition-all hover:scale-105 active:scale-95"
          aria-label="Open chat"
        >
          <Image src="/logo.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[520px] rounded-2xl border border-[#C4972A]/20 bg-[#141923] shadow-2xl shadow-black/40 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#C4972A]/20 bg-[#0D0F14] flex-shrink-0">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="" width={20} height={20} className="object-contain" />
              <div>
                <p className="text-sm font-semibold text-[#F0EBE0]">AI Operator Collective</p>
                <p className="text-[10px] text-[#F0EBE0]/40">AI-powered growth partner</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/5 transition-colors">
              <X className="h-4 w-4 text-[#F0EBE0]/40" />
            </button>
          </div>

          {!emailSubmitted ? (
            /* Email capture gate */
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C4972A]/10 border border-[#C4972A]/20 mb-4">
                <Mail className="h-5 w-5 text-[#C4972A]" />
              </div>
              <h3 className="text-base font-semibold text-[#F0EBE0] mb-1 text-center">
                Chat with our AI assistant
              </h3>
              <p className="text-sm text-[#F0EBE0]/50 mb-6 text-center max-w-[280px]">
                Enter your email to start the conversation. We will follow up with personalized recommendations.
              </p>
              <form onSubmit={handleEmailSubmit} className="w-full max-w-[300px] space-y-3">
                <div>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value)
                      if (emailError) setEmailError("")
                    }}
                    placeholder="you@company.com"
                    className="w-full rounded-lg border border-[#C4972A]/20 bg-[#0D0F14] px-3 py-2.5 text-sm text-[#F0EBE0] placeholder:text-[#F0EBE0]/30 focus:outline-none focus:ring-1 focus:ring-[#C4972A]/50"
                    autoFocus
                  />
                  {emailError && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {emailError}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#C4972A] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#A17D22] transition-colors"
                >
                  Start chatting
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {messages.map((m) => {
                  const text = getMessageText(m.parts as { type: string; text?: string }[])
                  if (!text && m.role !== "user") return null
                  return (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      {m.role === "assistant" && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#141923] border border-[#C4972A]/20 shadow-sm mr-2 mt-1 flex-shrink-0 overflow-hidden">
                          <Image src="/logo.png" alt="" width={16} height={16} className="h-4 w-4 object-contain" />
                        </div>
                      )}
                      <div
                        className={`max-w-[82%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                          m.role === "user"
                            ? "bg-[#C4972A] text-white rounded-br-sm"
                            : "bg-white/5 text-[#F0EBE0]/90 rounded-bl-sm"
                        }`}
                      >
                        {text}
                      </div>
                    </div>
                  )
                })}
                {isStreaming && (
                  <div className="flex justify-start">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#141923] border border-[#C4972A]/20 shadow-sm mr-2 mt-1 flex-shrink-0 overflow-hidden">
                      <Image src="/logo.png" alt="" width={16} height={16} className="h-4 w-4 object-contain" />
                    </div>
                    <div className="bg-white/5 rounded-xl rounded-bl-sm px-3 py-2">
                      <Loader2 className="h-3.5 w-3.5 text-[#C4972A] animate-spin" />
                    </div>
                  </div>
                )}
                {error && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <AlertCircle className="h-3.5 w-3.5 text-[#F0EBE0]/60" />
                    <p className="text-xs text-[#F0EBE0]/60">Our assistant is temporarily unavailable. Please try again later.</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex-shrink-0 border-t border-[#C4972A]/20 bg-[#0D0F14] p-3">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask us anything..."
                    className="flex-1 rounded-lg border border-[#C4972A]/20 bg-[#141923] px-3 py-2 text-sm text-[#F0EBE0] placeholder:text-[#F0EBE0]/30 focus:outline-none focus:ring-1 focus:ring-[#C4972A]/50"
                    disabled={isStreaming}
                    maxLength={1000}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isStreaming}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C4972A] text-white hover:bg-[#A17D22] disabled:opacity-40 transition flex-shrink-0"
                  >
                    {isStreaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
