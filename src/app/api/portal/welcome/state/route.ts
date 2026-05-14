import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"

export const dynamic = "force-dynamic"

/**
 * First-run wizard state — resume helper.
 *
 * GET  → { step, completedAt, skippedAt } so the wizard can land on the
 *        right step when an operator bails mid-flow and comes back.
 * PATCH → updates step | markComplete | markSkipped.
 *
 * Keeping all wizard state writes behind a single endpoint means we
 * only have to audit one place for race conditions, and it lets the
 * sidebar widget poll a single URL to surface the resume prompt.
 */

const STEPS = [
  "intro",
  "profile",
  "branding",
  "site",
  "scout",
  "connections",
  "done",
] as const

const patchSchema = z.object({
  step: z.enum(STEPS).optional(),
  markComplete: z.boolean().optional(),
  markSkipped: z.boolean().optional(),
})

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const dbUser = await getOrCreateDbUserByClerkId(clerkId)
    return NextResponse.json({
      step: dbUser.firstRunStep ?? "intro",
      completedAt: dbUser.firstRunCompletedAt,
      skippedAt: dbUser.firstRunSkippedAt,
    })
  } catch (err) {
    // Clerk-webhook-race or DB blip — don't 500 the resume helper.
    // A polling sidebar widget calling this every 30s shouldn't be the
    // thing that crashes the experience. Degrade to a safe default;
    // the next poll will recover.
    logger.error("welcome/state GET failed; returning safe default", err, {
      endpoint: "GET /api/portal/welcome/state",
      userId: clerkId,
    })
    return NextResponse.json({
      step: "intro",
      completedAt: null,
      skippedAt: null,
    })
  }
}

export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const dbUser = await getOrCreateDbUserByClerkId(clerkId)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid state update", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  // Reject empty no-op bodies (`{}`) and mutually-exclusive flag
  // collisions. Without this, a malformed client could simultaneously
  // mark complete + skipped, leaving the row in an ambiguous state
  // where both timestamps are set.
  const { step, markComplete, markSkipped } = parsed.data
  if (!step && !markComplete && !markSkipped) {
    return NextResponse.json(
      { error: "No state fields provided" },
      { status: 400 },
    )
  }
  if (markComplete && markSkipped) {
    return NextResponse.json(
      { error: "markComplete and markSkipped are mutually exclusive" },
      { status: 400 },
    )
  }

  const now = new Date()
  const data: Record<string, unknown> = {}
  if (step) data.firstRunStep = step
  if (markComplete) {
    data.firstRunCompletedAt = now
    data.firstRunStep = "done"
  }
  if (markSkipped) {
    data.firstRunSkippedAt = now
  }

  try {
    const updated = await db.user.update({
      where: { id: dbUser.id },
      data,
      select: {
        firstRunStep: true,
        firstRunCompletedAt: true,
        firstRunSkippedAt: true,
      },
    })
    return NextResponse.json({
      step: updated.firstRunStep ?? "intro",
      completedAt: updated.firstRunCompletedAt,
      skippedAt: updated.firstRunSkippedAt,
    })
  } catch (err) {
    logger.error("Failed to update wizard state", err, {
      endpoint: "PATCH /api/portal/welcome/state",
      userId: dbUser.id,
    })
    return NextResponse.json({ error: "Could not update state" }, { status: 500 })
  }
}
