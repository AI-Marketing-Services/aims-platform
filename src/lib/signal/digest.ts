import { readFile } from "fs/promises"
import path from "path"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { gatherSources } from "./autoresearch"
import { councilPick, type CouncilPick } from "./council"
import { sendSignalEmail } from "./email"
import { sendSignalSms } from "./sms"

export type DigestItem = {
  topicId: string
  topicLabel: string
  headline: string
  summary: string
  url: string
  source: string
  publishedAt?: string
}

type TargetTopic = { id: string; label: string; query: string }
type RunStatus = "SENT" | "EMPTY" | "SKIPPED" | "FAILED"

let cachedProgram: string | null = null
async function loadProgram(): Promise<string> {
  if (cachedProgram) return cachedProgram
  const file = path.join(process.cwd(), "src/lib/signal/program.md")
  cachedProgram = await readFile(file, "utf8").catch(() => "")
  return cachedProgram
}

/** Shared per-target work: autoresearch + council over each topic, assemble digest items. */
async function pickForTopics(topics: TargetTopic[]): Promise<DigestItem[]> {
  const program = await loadProgram()
  const picks = await Promise.all(
    topics.slice(0, 5).map(async (topic): Promise<DigestItem | null> => {
      const sources = await gatherSources({ label: topic.label, query: topic.query }, program)
      const pick: CouncilPick = await councilPick({ label: topic.label }, sources, program)
      if (!pick) return null
      return {
        topicId: topic.id,
        topicLabel: topic.label,
        headline: pick.headline,
        summary: pick.summary,
        url: pick.url,
        source: pick.source,
        publishedAt: pick.publishedAt,
      }
    }),
  )
  return picks.filter((p): p is DigestItem => p !== null)
}

export async function runDigestForUser(
  userId: string,
): Promise<{ status: RunStatus; itemCount: number }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, name: true,
      notifSignalDigest: true, signalSmsOptIn: true, signalPhoneE164: true,
      signalTopics: { where: { enabled: true }, select: { id: true, label: true, query: true } },
    },
  })

  if (!user || !user.notifSignalDigest || user.signalTopics.length === 0) {
    return { status: "SKIPPED", itemCount: 0 }
  }

  const today = startOfUtcDay()
  const existing = await db.signalDigestRun.findUnique({
    where: { userId_runDate: { userId, runDate: today } },
  })
  if (existing?.status === "SENT") return { status: "SKIPPED", itemCount: 0 }

  const run = await db.signalDigestRun.upsert({
    where: { userId_runDate: { userId, runDate: today } },
    create: { userId, runDate: today, items: [], status: "PENDING" },
    update: { status: "PENDING", error: null },
  })

  try {
    const items = await pickForTopics(user.signalTopics)

    if (items.length === 0) {
      await db.signalDigestRun.update({
        where: { id: run.id },
        data: { items: [], status: "EMPTY" },
      })
      return { status: "EMPTY", itemCount: 0 }
    }

    await sendSignalEmail({ to: user.email, name: user.name, items, runDate: today })
    if (user.signalSmsOptIn && user.signalPhoneE164) {
      await sendSignalSms({ phone: user.signalPhoneE164, items, userId })
    }

    await db.signalDigestRun.update({
      where: { id: run.id },
      data: { items, status: "SENT", sentAt: new Date() },
    })

    return { status: "SENT", itemCount: items.length }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("signal digest failed (user)", { userId, msg })
    await db.signalDigestRun.update({
      where: { id: run.id },
      data: { status: "FAILED", error: msg.slice(0, 500) },
    })
    throw err
  }
}

/**
 * Public SignalSubscriber path (no Clerk account).
 * Topics are stored as JSON on the subscriber row.
 * Idempotency: lastSentDate >= today → skip.
 */
export async function runDigestForSubscriber(
  subscriberId: string,
): Promise<{ status: RunStatus; itemCount: number }> {
  const sub = await db.signalSubscriber.findUnique({ where: { id: subscriberId } })
  if (!sub || sub.status !== "ACTIVE") return { status: "SKIPPED", itemCount: 0 }

  const today = startOfUtcDay()
  if (sub.lastSentDate && sub.lastSentDate.getTime() >= today.getTime()) {
    return { status: "SKIPPED", itemCount: 0 }
  }

  const rawTopics = Array.isArray(sub.topics)
    ? (sub.topics as unknown as Array<{ label?: string; query?: string }>)
    : []
  const topics: TargetTopic[] = rawTopics
    .filter((t): t is { label: string; query: string } =>
      !!t && typeof t.label === "string" && typeof t.query === "string",
    )
    .map((t, i) => ({ id: `sub_${sub.id}_${i}`, label: t.label, query: t.query }))

  if (topics.length === 0) return { status: "SKIPPED", itemCount: 0 }

  try {
    const items = await pickForTopics(topics)

    if (items.length === 0) {
      await db.signalSubscriber.update({ where: { id: sub.id }, data: { lastSentDate: today } })
      return { status: "EMPTY", itemCount: 0 }
    }

    await sendSignalEmail({
      to: sub.email,
      name: sub.name,
      items,
      runDate: today,
      unsubToken: sub.unsubToken,
    })

    await db.signalSubscriber.update({ where: { id: sub.id }, data: { lastSentDate: today } })
    return { status: "SENT", itemCount: items.length }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("signal digest failed (subscriber)", { subscriberId, msg })
    throw err
  }
}

export function startOfUtcDay(d: Date = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}
