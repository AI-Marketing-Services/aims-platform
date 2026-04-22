import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getDealChecklistProgress, DEAL_CHECKLIST_STEPS } from "@/lib/onboarding/deal-checklist"
import type { ClientActivityType } from "@prisma/client"

// ONBOARDING_STEP_COMPLETED is in schema but requires `prisma generate` to appear
// in the generated enum type. Cast to satisfy the type system until then.
const ONBOARDING_STEP_COMPLETED = "ONBOARDING_STEP_COMPLETED" as ClientActivityType

async function getDbUserId(clerkId: string): Promise<string | null> {
  const u = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  return u?.id ?? null
}

const VALID_STEP_KEYS = DEAL_CHECKLIST_STEPS.map((s) => s.key) as [string, ...string[]]

const checklistActionSchema = z.object({
  stepKey: z.enum(VALID_STEP_KEYS as [string, ...string[]]),
  completed: z.boolean(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id } = await params

  const deal = await db.clientDeal.findFirst({
    where: { id, userId: dbUserId },
    select: { id: true, stage: true },
  })
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const activities = await db.clientDealActivity.findMany({
      where: { clientDealId: id, type: ONBOARDING_STEP_COMPLETED },
      select: { type: true, metadata: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    })

    const progress = getDealChecklistProgress(activities)
    return NextResponse.json({ checklist: progress })
  } catch (err) {
    logger.error("Failed to fetch deal checklist", err, { userId, dealId: id })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { id } = await params

  const deal = await db.clientDeal.findFirst({
    where: { id, userId: dbUserId },
    select: { id: true, stage: true },
  })
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  try {
    const body = await req.json()
    const parsed = checklistActionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 })
    }

    const { stepKey, completed } = parsed.data

    if (completed) {
      // Idempotent — only create if not already present
      const existing = await db.clientDealActivity.findFirst({
        where: {
          clientDealId: id,
          type: ONBOARDING_STEP_COMPLETED,
          metadata: { path: ["stepKey"], equals: stepKey },
        },
      })

      if (!existing) {
        await db.clientDealActivity.create({
          data: {
            clientDealId: id,
            type: ONBOARDING_STEP_COMPLETED,
            description: `Onboarding step completed: ${stepKey}`,
            metadata: { stepKey },
          },
        })
      }
    } else {
      // Remove the completion record
      const record = await db.clientDealActivity.findFirst({
        where: {
          clientDealId: id,
          type: ONBOARDING_STEP_COMPLETED,
          metadata: { path: ["stepKey"], equals: stepKey },
        },
        select: { id: true },
      })

      if (record) {
        await db.clientDealActivity.delete({ where: { id: record.id } })
      }
    }

    // Return updated progress
    const activities = await db.clientDealActivity.findMany({
      where: { clientDealId: id, type: ONBOARDING_STEP_COMPLETED },
      select: { type: true, metadata: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    })

    const progress = getDealChecklistProgress(activities)
    return NextResponse.json({ checklist: progress })
  } catch (err) {
    logger.error("Failed to update deal checklist", err, { userId, dealId: id })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
