import { db } from "@/lib/db"
import type { Prisma } from "@prisma/client"

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
 */
export async function upsertChatSession({
  sessionId,
  source,
  email,
  clerkUserId,
  messages,
}: UpsertChatSessionParams): Promise<void> {
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
    // Non-blocking: log but don't fail the chat request
    console.error("Failed to upsert chat session:", error)
  }
}
