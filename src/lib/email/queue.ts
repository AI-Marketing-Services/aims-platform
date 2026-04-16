import { db } from "@/lib/db"
import { EMAIL_SEQUENCES } from "./index"

const REQUEUE_COOLDOWN_DAYS = 90

export async function queueEmailSequence(
  email: string,
  sequenceKey: keyof typeof EMAIL_SEQUENCES,
  metadata?: Record<string, unknown>
) {
  const sequence = EMAIL_SEQUENCES[sequenceKey]
  if (!sequence) return

  // Dedup: block re-queue if this recipient got this sequence in the last
  // 90 days. Covers anyone who re-applies, re-books, or double-submits —
  // we never want them receiving the same drip twice in a quarter.
  const cooldown = new Date(Date.now() - REQUEUE_COOLDOWN_DAYS * 86400000)
  const existing = await db.emailQueueItem.findFirst({
    where: {
      recipientEmail: email,
      sequenceKey,
      createdAt: { gte: cooldown },
    },
  })
  if (existing) return

  await db.emailQueueItem.createMany({
    data: sequence.emails.map((emailDef, index) => ({
      recipientEmail: email,
      sequenceKey,
      emailIndex: index,
      scheduledFor: new Date(Date.now() + emailDef.delay * 86400000),
      metadata: metadata as object,
    })),
  })
}

export async function cancelSequenceForRecipient(email: string, sequenceKey?: string) {
  await db.emailQueueItem.updateMany({
    where: {
      recipientEmail: email,
      status: "pending",
      ...(sequenceKey ? { sequenceKey } : {}),
    },
    data: { status: "cancelled" },
  })
}
