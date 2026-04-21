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

let cachedProgram: string | null = null
async function loadProgram(): Promise<string> {
  if (cachedProgram) return cachedProgram
  const file = path.join(process.cwd(), "src/lib/signal/program.md")
  cachedProgram = await readFile(file, "utf8").catch(() => "")
  return cachedProgram
}

export async function runDigestForUser(userId: string): Promise<{ status: "SENT" | "EMPTY" | "SKIPPED"; itemCount: number }> {
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
    const program = await loadProgram()
    const picks = await Promise.all(
      user.signalTopics.slice(0, 5).map(async (topic): Promise<DigestItem | null> => {
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

    const items = picks.filter((p): p is DigestItem => p !== null)

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
    logger.error("signal digest failed", { userId, msg })
    await db.signalDigestRun.update({
      where: { id: run.id },
      data: { status: "FAILED", error: msg.slice(0, 500) },
    })
    throw err
  }
}

export function startOfUtcDay(d: Date = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}
