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

// Once a visitor closes the auto-open prompt OR sends a message, we don't
// auto-pop again for this many days — losing repeat visitors to a popup
// that won't go away is worse than missing one auto-open opportunity.
const DISMISS_PERSIST_DAYS = 7
const DISMISS_KEY = "aims_chat_dismissed_until"
// Bump after meaningful WELCOME_TEXT changes so existing visitors see the
// new prompt once.
const AUTO_OPEN_VERSION = "v2"
const AUTO_OPEN_VERSION_KEY = "aims_chat_auto_version"
// Pages where popping a chat widget is hostile to the funnel (the
// applicant is mid-form on apply, or just landed on the booking next-
// steps page). Suppress auto-open there; visitors can still open via
// the floating logo.
const AUTO_OPEN_PATH_DENYLIST = [
  "/apply",
  "/apply/next-steps",
  "/get-started",
  "/sign-in",
  "/sign-up",
]

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

function shouldAutoOpen(pathname: string): boolean {
  if (typeof window === "undefined") return false
  if (AUTO_OPEN_PATH_DENYLIST.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false
  }
  try {
    // Reset persistence when the welcome message changes — gives existing
    // visitors one more shot at the new prompt without spamming them.
    if (window.localStorage.getItem(AUTO_OPEN_VERSION_KEY) !== AUTO_OPEN_VERSION) {
      window.localStorage.setItem(AUTO_OPEN_VERSION_KEY, AUTO_OPEN_VERSION)
      window.localStorage.removeItem(DISMISS_KEY)
      return true
    }
    const until = window.localStorage.getItem(DISMISS_KEY)
    if (!until) return true
    return Date.now() > Number(until)
  } catch {
    // Private mode / storage disabled — fall back to auto-open once per session.
    return true
  }
}

function rememberDismissal() {
  if (typeof window === "undefined") return
  try {
    const until = Date.now() + DISMISS_PERSIST_DAYS * 24 * 60 * 60 * 1000
    window.localStorage.setItem(DISMISS_KEY, String(until))
  } catch {
    // Silently ignore — worst case we auto-open again next visit.
  }
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

  // Auto-open after a delay — gated on (a) the path not being one where
  // the popup interferes with the active funnel, (b) the visitor not
  // having dismissed the widget within the last DISMISS_PERSIST_DAYS,
  // and (c) the per-session "already happened" guard. Without this gate
  // every navigation re-pops the widget and craters engagement metrics
  // from the email campaign.
  useEffect(() => {
    if (hasAutoOpened) return
    if (!shouldAutoOpen(pathname ?? "/")) {
      // Mark as auto-opened so we don't re-evaluate on every re-render.
      setHasAutoOpened(true)
      return
    }
    const timer = setTimeout(() => {
      setOpen(true)
      setHasAutoOpened(true)
    }, 8000)
    return () => clearTimeout(timer)
  }, [hasAutoOpened, pathname])

  const closeWidget = useCallback(() => {
    setOpen(false)
    rememberDismissal()
  }, [])

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
          className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFFFFF] border border-[#981B1B]/30 shadow-xl hover:shadow-2xl hover:shadow-[#981B1B]/10 transition-all hover:scale-105 active:scale-95"
          aria-label="Open chat"
        >
          <Image src="/logo.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[520px] rounded-2xl border border-[#981B1B]/20 bg-[#FFFFFF] shadow-2xl shadow-black/40 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#981B1B]/20 bg-[#0D0F14] flex-shrink-0">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="" width={20} height={20} className="object-contain" />
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">AI Operator Collective</p>
                <p className="text-[10px] text-[#1A1A1A]/40">AI-powered growth partner</p>
              </div>
            </div>
            <button onClick={closeWidget} className="p-1 rounded hover:bg-white/5 transition-colors" aria-label="Close chat">
              <X className="h-4 w-4 text-[#1A1A1A]/40" />
            </button>
          </div>

          {!emailSubmitted ? (
            /* Email capture gate */
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#981B1B]/10 border border-[#981B1B]/20 mb-4">
                <Mail className="h-5 w-5 text-[#981B1B]" />
              </div>
              <h3 className="text-base font-semibold text-[#1A1A1A] mb-1 text-center">
                Chat with our AI assistant
              </h3>
              <p className="text-sm text-[#1A1A1A]/50 mb-6 text-center max-w-[280px]">
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
                    className="w-full rounded-lg border border-[#981B1B]/20 bg-[#0D0F14] px-3 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none focus:ring-1 focus:ring-[#981B1B]/50"
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
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#981B1B] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#791515] transition-colors"
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
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFFFFF] border border-[#981B1B]/20 shadow-sm mr-2 mt-1 flex-shrink-0 overflow-hidden">
                          <Image src="/logo.png" alt="" width={16} height={16} className="h-4 w-4 object-contain" />
                        </div>
                      )}
                      <div
                        className={`max-w-[82%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                          m.role === "user"
                            ? "bg-[#981B1B] text-white rounded-br-sm"
                            : "bg-white/5 text-[#1A1A1A]/90 rounded-bl-sm"
                        }`}
                      >
                        {text}
                      </div>
                    </div>
                  )
                })}
                {isStreaming && (
                  <div className="flex justify-start">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFFFFF] border border-[#981B1B]/20 shadow-sm mr-2 mt-1 flex-shrink-0 overflow-hidden">
                      <Image src="/logo.png" alt="" width={16} height={16} className="h-4 w-4 object-contain" />
                    </div>
                    <div className="bg-white/5 rounded-xl rounded-bl-sm px-3 py-2">
                      <Loader2 className="h-3.5 w-3.5 text-[#981B1B] animate-spin" />
                    </div>
                  </div>
                )}
                {error && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <AlertCircle className="h-3.5 w-3.5 text-[#1A1A1A]/60" />
                    <p className="text-xs text-[#1A1A1A]/60">Our assistant is temporarily unavailable. Please try again later.</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex-shrink-0 border-t border-[#981B1B]/20 bg-[#0D0F14] p-3">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask us anything..."
                    className="flex-1 rounded-lg border border-[#981B1B]/20 bg-[#FFFFFF] px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none focus:ring-1 focus:ring-[#981B1B]/50"
                    disabled={isStreaming}
                    maxLength={1000}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isStreaming}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#981B1B] text-white hover:bg-[#791515] disabled:opacity-40 transition flex-shrink-0"
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
