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
import { markQuestEvent } from "@/lib/quests"
import type { TriggerEvent } from "@/lib/quests/registry"

// Map onboarding step keys → quest events. Some step completions also
// satisfy quest triggers (intro_post, attending a call, etc.).
const STEP_TO_QUEST_EVENT: Record<string, TriggerEvent> = {
  "week1.intro_post": "community.intro_posted",
  "week1.complete_profile": "profile.completed",
  "week2.module_1": "onboarding.track_selected",
  "week34.rsvp_call": "cohort.first_attended",
}

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

    // Bridge step → quest event (best effort).
    const event = STEP_TO_QUEST_EVENT[parsed.data.stepKey]
    if (event) {
      void markQuestEvent(dbUser.id, event, {
        metadata: { stepKey: parsed.data.stepKey },
      })
    }

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
