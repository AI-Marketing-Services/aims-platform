import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const topicSchema = z.object({
  label: z.string().trim().min(1).max(60),
  query: z.string().trim().min(1).max(200),
})

const patchSchema = z.object({
  topics: z.array(topicSchema).min(1).max(5),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    const sub = await db.signalSubscriber.findUnique({
      where: { unsubToken: token },
      select: { id: true, status: true },
    })
    if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await db.signalSubscriber.update({
      where: { id: sub.id },
      data: {
        topics: parsed.data.topics as unknown as object,
        status: "ACTIVE", // re-editing topics reactivates
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Signal manage PATCH failed", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
