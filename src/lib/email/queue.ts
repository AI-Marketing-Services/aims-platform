import { db } from "@/lib/db"
import { EMAIL_SEQUENCES } from "./index"

export async function queueEmailSequence(
  email: string,
  sequenceKey: keyof typeof EMAIL_SEQUENCES,
  metadata?: Record<string, unknown>
) {
  const sequence = EMAIL_SEQUENCES[sequenceKey]
  if (!sequence) return

  // Check if already queued to avoid duplicates
  const existing = await db.emailQueueItem.findFirst({
    where: { recipientEmail: email, sequenceKey, status: "pending" },
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
