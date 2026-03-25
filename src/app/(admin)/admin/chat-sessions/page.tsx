import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { MessageSquare } from "lucide-react"
import { ChatSessionsClient, type ChatSessionRow } from "./ChatSessionsClient"

export const metadata = { title: "Chat Sessions" }

function getLastMessagePreview(messages: unknown): string {
  if (!Array.isArray(messages) || messages.length === 0) return ""
  const lastMsg = messages[messages.length - 1]
  if (!lastMsg || typeof lastMsg !== "object") return ""
  const msg = lastMsg as Record<string, unknown>

  // Handle parts-based messages (UIMessage format)
  if (Array.isArray(msg.parts)) {
    const textParts = msg.parts
      .filter((p: unknown) => typeof p === "object" && p !== null && (p as Record<string, unknown>).type === "text")
      .map((p: unknown) => ((p as Record<string, unknown>).text as string) ?? "")
    const text = textParts.join("")
    return text.length > 80 ? `${text.slice(0, 80)}...` : text
  }

  // Handle content-based messages
  if (typeof msg.content === "string") {
    return msg.content.length > 80 ? `${msg.content.slice(0, 80)}...` : msg.content
  }

  return ""
}

export default async function AdminChatSessionsPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/portal/dashboard")

  const rawSessions = await db.chatSession.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
  })

  const sessions: ChatSessionRow[] = rawSessions.map((s) => ({
    id: s.id,
    email: s.email,
    source: s.source,
    clerkUserId: s.clerkUserId,
    messageCount: s.messageCount,
    messages: Array.isArray(s.messages) ? (s.messages as ChatSessionRow["messages"]) : [],
    lastMessagePreview: getLastMessagePreview(s.messages),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))

  // Stats
  const totalSessions = sessions.length
  const withEmail = sessions.filter((s) => s.email).length
  const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0)
  const uniqueSources = new Set(sessions.map((s) => s.source)).size

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Chat Sessions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor conversations across all chatbot touchpoints
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Sessions" value={totalSessions} icon={MessageSquare} />
        <StatCard label="With Email" value={withEmail} />
        <StatCard label="Total Messages" value={totalMessages} />
        <StatCard label="Active Sources" value={uniqueSources} />
      </div>

      <ChatSessionsClient sessions={sessions} />
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
    </div>
  )
}
