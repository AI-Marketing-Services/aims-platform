"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import {
  ArrowRight,
  Bot,
  AlertCircle,
  X,
  Send,
  Loader2,
  Mail,
  MessageSquare,
} from "lucide-react"
import { useChat } from "@ai-sdk/react"
import { TextStreamChatTransport, type UIMessage } from "ai"
import { getMessageText } from "@/lib/utils"

const CHAT_WELCOME = "I'm your AIMS CRM setup assistant. Ask me anything about configuring your account, connecting your domain, setting up automations, or troubleshooting issues."

const CHAT_INITIAL: UIMessage[] = [
  { id: "welcome", role: "assistant" as const, parts: [{ type: "text" as const, text: CHAT_WELCOME }] },
]

const ONBOARDING_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function generateOnboardingSessionId(): string {
  return `onboarding_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function OnboardingChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [email, setEmail] = useState("")
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [emailInput, setEmailInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sessionIdRef = useRef(generateOnboardingSessionId())

  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: "/api/ai/onboarding-chat",
        body: () => ({
          sessionId: sessionIdRef.current,
          email: email || undefined,
        }),
      }),
    [email]
  )

  const { messages, sendMessage, status, error } = useChat<UIMessage>({
    transport,
    messages: CHAT_INITIAL,
  } as Parameters<typeof useChat>[0])

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

  const handleEmailSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = emailInput.trim().toLowerCase()
      if (!ONBOARDING_EMAIL_REGEX.test(trimmed)) {
        setEmailError("Please enter a valid email address")
        return
      }
      setEmailError("")
      setEmail(trimmed)
      setEmailSubmitted(true)
    },
    [emailInput]
  )

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
          aria-label="Chat with Setup Assistant"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[520px] rounded-2xl border border-primary/20 bg-[#141923] shadow-2xl shadow-black/40 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20 bg-[#0D0F14] flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#F0EBE0]">Setup Assistant</p>
                <p className="text-[10px] text-[#F0EBE0]/40">AIMS CRM Onboarding Help</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/5 transition-colors">
              <X className="h-4 w-4 text-[#F0EBE0]/40" />
            </button>
          </div>

          {!emailSubmitted ? (
            /* Email capture gate */
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-[#F0EBE0] mb-1 text-center">
                Chat with our setup assistant
              </h3>
              <p className="text-sm text-[#F0EBE0]/50 mb-6 text-center max-w-[280px]">
                Enter your email to get help with your CRM setup, domain connection, and automations.
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
                    className="w-full rounded-lg border border-primary/20 bg-[#0D0F14] px-3 py-2.5 text-sm text-[#F0EBE0] placeholder:text-[#F0EBE0]/30 focus:outline-none focus:ring-1 focus:ring-primary/50"
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
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/80 transition-colors"
                >
                  Start chatting
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {messages.map((m) => {
                  const text = getMessageText(m.parts as { type: string; text?: string }[])
                  if (!text && m.role !== "user") return null
                  return (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      {m.role === "assistant" && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 mr-2 mt-1 flex-shrink-0">
                          <Bot className="h-3 w-3 text-primary" />
                        </div>
                      )}
                      <div className={`max-w-[82%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-primary text-white rounded-br-sm"
                          : "bg-white/5 text-[#F0EBE0]/90 rounded-bl-sm"
                      }`}>
                        {text}
                      </div>
                    </div>
                  )
                })}
                {isStreaming && (
                  <div className="flex justify-start">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 mr-2 mt-1 flex-shrink-0">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                    <div className="bg-white/5 rounded-xl rounded-bl-sm px-3 py-2">
                      <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
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

              <div className="flex-shrink-0 border-t border-primary/20 bg-[#0D0F14] p-3">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a setup question..."
                    className="flex-1 rounded-lg border border-primary/20 bg-[#141923] px-3 py-2 text-sm text-[#F0EBE0] placeholder:text-[#F0EBE0]/30 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    disabled={isStreaming}
                    maxLength={1500}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isStreaming}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/80 disabled:opacity-40 transition flex-shrink-0"
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
