import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"

export const dynamic = "force-dynamic"

const stepSchema = z.object({
  id: z.string().optional(),
  order: z.number().int().min(0),
  delayDays: z.number().int().min(0).max(180),
  subject: z.string().min(1).max(300),
  body: z.string().min(1).max(20_000),
})

const enrollSchema = z.object({
  recipients: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().max(200).optional(),
        clientDealId: z.string().optional(),
      }),
    )
    .min(1)
    .max(500),
})

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  fromName: z.string().max(120).nullable().optional(),
  pauseOnReply: z.boolean().optional(),
  status: z.enum(["draft", "active", "paused"]).optional(),
  steps: z.array(stepSchema).optional(),
  enroll: enrollSchema.optional(),
})

/** GET /api/portal/sequences/[id] — full sequence with steps + enrollments. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const sequence = await db.emailSequence.findFirst({
    where: { id, userId },
    include: {
      steps: { orderBy: { order: "asc" } },
      enrollments: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  })
  if (!sequence) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ sequence })
}

/** PATCH /api/portal/sequences/[id] — update fields, replace steps, or enroll a batch. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const sequence = await db.emailSequence.findFirst({ where: { id, userId } })
  if (!sequence) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // Steps replacement: delete then re-create, transactionally.
  if (parsed.data.steps) {
    const ordered = [...parsed.data.steps]
      .sort((a, b) => a.order - b.order)
      .map((s, idx) => ({
        order: idx,
        delayDays: s.delayDays,
        subject: s.subject,
        body: s.body,
      }))
    await db.$transaction([
      db.sequenceStep.deleteMany({ where: { sequenceId: id } }),
      db.sequenceStep.createMany({
        data: ordered.map((s) => ({ ...s, sequenceId: id })),
      }),
    ])
  }

  // Enroll a batch — used by the "send to selected leads" flow.
  if (parsed.data.enroll) {
    const now = new Date()
    await db.sequenceEnrollment.createMany({
      data: parsed.data.enroll.recipients.map((r) => ({
        sequenceId: id,
        userId,
        recipientEmail: r.email.toLowerCase().trim(),
        recipientName: r.name ?? null,
        clientDealId: r.clientDealId ?? null,
        currentStep: 0,
        status: "active",
        // Schedule the first send for "now" — the cron / send-step
        // endpoint picks them up and sends step 0 immediately.
        nextSendAt: now,
      })),
      skipDuplicates: true,
    })
  }

  // Top-level field updates.
  const data: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) data.name = parsed.data.name
  if (parsed.data.fromName !== undefined) data.fromName = parsed.data.fromName
  if (parsed.data.pauseOnReply !== undefined)
    data.pauseOnReply = parsed.data.pauseOnReply
  if (parsed.data.status !== undefined) data.status = parsed.data.status
  if (Object.keys(data).length > 0) {
    await db.emailSequence.update({ where: { id }, data })
  }

  const refreshed = await db.emailSequence.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { order: "asc" } },
      enrollments: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  })
  return NextResponse.json({ sequence: refreshed })
}

/** DELETE /api/portal/sequences/[id] — owner-only. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const sequence = await db.emailSequence.findFirst({ where: { id, userId } })
  if (!sequence) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.emailSequence.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
