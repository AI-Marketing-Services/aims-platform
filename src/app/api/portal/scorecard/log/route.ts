import { NextResponse } from "next/server"
import { z } from "zod"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

const ROW_TO_ACTIVITY = {
  outreachSent: { kind: "activity", type: "EMAIL" as const },
  followUpsSent: { kind: "activity", type: "FOLLOW_UP_SENT" as const },
  referralAsks: { kind: "activity", type: "REFERRAL_ASK_SENT" as const },
  discoveryRequested: { kind: "activity", type: "DISCOVERY_REQUESTED" as const },
  discoveryCompleted: { kind: "activity", type: "MEETING" as const },
  problemHypotheses: { kind: "note", noteKind: "PROBLEM_HYPOTHESIS" as const },
  quickWinHypotheses: { kind: "note", noteKind: "QUICK_WIN_HYPOTHESIS" as const },
} as const

type LoggableRow = keyof typeof ROW_TO_ACTIVITY

const schema = z.object({
  row: z.enum([
    "outreachSent",
    "followUpsSent",
    "referralAsks",
    "discoveryRequested",
    "discoveryCompleted",
    "problemHypotheses",
    "quickWinHypotheses",
  ]),
  /** Required: every loggable row creates either a ClientDealActivity or a
   *  ClientDealNote, both of which require a clientDealId. The runtime
   *  used to allow null and reject it later — schema is now the single
   *  source of truth. */
  clientDealId: z.string().min(1).max(64),
  /** Optional free-form copy attached to the activity / note. */
  description: z.string().max(2000).optional(),
})

/**
 * POST /api/portal/scorecard/log
 *
 * Records an activity (or hypothesis note) tied to a ClientDeal that the
 * operator owns. Used by the scorecard's "+1" affordance to keep the
 * auto-tally and the operator's manual count converging — and gives
 * operators a friction-free way to log day-to-day work without leaving
 * the scorecard page.
 *
 * Returns 404 when the deal isn't owned by the caller (defense in depth
 * — middleware already requires a portal role, but a malicious operator
 * shouldn't be able to log activity on someone else's deal).
 */
export async function POST(req: Request) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const json = await req.json().catch(() => null)
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const def = ROW_TO_ACTIVITY[parsed.data.row as LoggableRow]

  try {
    // Ownership check + write happen inside one try/catch so a Prisma
    // hiccup on either query becomes a clean 500 rather than a leaked
    // exception. The 404 below is intentional — middleware already
    // gates portal access; this defends against a malicious operator
    // logging activity on someone else's deal.
    const owns = await db.clientDeal.findFirst({
      where: { id: parsed.data.clientDealId, userId },
      select: { id: true },
    })
    if (!owns)
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })

    if (def.kind === "activity") {
      await db.clientDealActivity.create({
        data: {
          clientDealId: parsed.data.clientDealId,
          type: def.type,
          description: parsed.data.description ?? null,
        },
      })
    } else {
      await db.clientDealNote.create({
        data: {
          clientDealId: parsed.data.clientDealId,
          kind: def.noteKind,
          content: parsed.data.description ?? null,
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Failed to log scorecard activity", err, {
      endpoint: "POST /api/portal/scorecard/log",
      userId,
      action: parsed.data.row,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
