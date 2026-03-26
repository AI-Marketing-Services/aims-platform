import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import type { Prisma } from "@prisma/client"

const SESSION_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/

interface UpsertChatSessionParams {
  sessionId: string
  source: string
  email?: string | null
  clerkUserId?: string | null
  messages: unknown[]
}

/**
 * Upsert a chat session: create on first message, update on subsequent ones.
 * Stores the full message history and increments the message count.
 * Call with .catch(() => {}) for fire-and-forget usage.
 */
export async function upsertChatSession({
  sessionId,
  source,
  email,
  clerkUserId,
  messages,
}: UpsertChatSessionParams): Promise<void> {
  if (!SESSION_ID_RE.test(sessionId)) return

  try {
    const messagesJson = JSON.parse(JSON.stringify(messages)) as Prisma.InputJsonValue

    await db.chatSession.upsert({
      where: { id: sessionId },
      create: {
        id: sessionId,
        source,
        email: email ?? null,
        clerkUserId: clerkUserId ?? null,
        messages: messagesJson,
        messageCount: messages.length,
      },
      update: {
        messages: messagesJson,
        messageCount: messages.length,
        ...(email ? { email } : {}),
      },
    })
  } catch (error) {
    logger.error("Failed to upsert chat session", error, { sessionId, source })
  }
}
