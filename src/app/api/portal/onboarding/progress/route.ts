import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { markStepSchema } from "@/lib/onboarding/schemas"
import { ONBOARDING_STEP_KEYS } from "@/lib/onboarding/steps"
import {
  getProgressForUser,
  markStepComplete,
  resetStep,
} from "@/lib/onboarding/progress"
import { getOrCreateDbUserByClerkId } from "@/lib/auth/ensure-user"

async function resolveDbUser(clerkId: string) {
  const user = await getOrCreateDbUserByClerkId(clerkId)
  return { id: user.id }
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const dbUser = await resolveDbUser(userId)
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const progress = await getProgressForUser(dbUser.id)

    return NextResponse.json({
      completedKeys: Array.from(progress.completedKeys),
      completedCount: progress.completedCount,
      percent: progress.percent,
      lastCompletedAt: progress.lastCompletedAt,
      onboardingCompletedAt: progress.onboardingCompletedAt,
    })
  } catch (err) {
    logger.error("Failed to get onboarding progress", err, {
      endpoint: "GET /api/portal/onboarding/progress",
      userId,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const dbUser = await resolveDbUser(userId)
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await req.json()
    const parsed = markStepSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    await markStepComplete({
      userId: dbUser.id,
      stepKey: parsed.data.stepKey,
      method: "self",
      completedBy: null,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Failed to mark onboarding step complete", err, {
      endpoint: "POST /api/portal/onboarding/progress",
      userId,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const dbUser = await resolveDbUser(userId)
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const stepKey = searchParams.get("stepKey") ?? ""

    if (!ONBOARDING_STEP_KEYS.includes(stepKey)) {
      return NextResponse.json({ error: "Invalid stepKey" }, { status: 400 })
    }

    await resetStep({ userId: dbUser.id, stepKey, resetBy: userId })

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Failed to reset onboarding step", err, {
      endpoint: "DELETE /api/portal/onboarding/progress",
      userId,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
