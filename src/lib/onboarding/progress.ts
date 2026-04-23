import { db } from "@/lib/db"
import { ONBOARDING_STEPS, TOTAL_STEPS } from "./steps"

const UNLOCK_MILESTONES = [
  {
    threshold: 50,
    key: "unlock_50",
    title: "Halfway there! New tools unlocked.",
    message: "You've completed 50% of Getting Started. Your Toolkit just gained 4 new AI tools — check them out.",
    link: "/portal/tools",
  },
  {
    threshold: 100,
    key: "unlock_100",
    title: "Onboarding complete! Full access unlocked.",
    message: "You've finished all onboarding steps. Every tool in your Toolkit is now available.",
    link: "/portal/tools",
  },
]

export interface OnboardingProgress {
  completedKeys: Set<string>
  completedCount: number
  percent: number
  lastCompletedAt: Date | null
  onboardingCompletedAt: Date | null
}

export async function getProgressForUser(userId: string): Promise<OnboardingProgress> {
  const [steps, profile] = await Promise.all([
    db.memberOnboardingStep.findMany({
      where: { userId },
      select: { stepKey: true, completedAt: true },
      orderBy: { completedAt: "desc" },
    }),
    db.memberProfile.findUnique({
      where: { userId },
      select: { onboardingCompletedAt: true },
    }),
  ])

  const completedKeys = new Set(steps.map((s) => s.stepKey))
  const completedCount = completedKeys.size
  const percent = Math.round((completedCount / TOTAL_STEPS) * 100)
  const lastCompletedAt = steps[0]?.completedAt ?? null

  return {
    completedKeys,
    completedCount,
    percent,
    lastCompletedAt,
    onboardingCompletedAt: profile?.onboardingCompletedAt ?? null,
  }
}

export async function markStepComplete({
  userId,
  stepKey,
  method,
  completedBy,
}: {
  userId: string
  stepKey: string
  method: "self" | "admin"
  completedBy: string | null
}): Promise<void> {
  const step = ONBOARDING_STEPS.find((s) => s.key === stepKey)
  if (!step) return

  // Capture count before so we can detect milestone crossings
  const previousCount = await db.memberOnboardingStep.count({ where: { userId } })

  await db.$transaction(async (tx) => {
    // Upsert step (idempotent — re-marking is a no-op on data)
    await tx.memberOnboardingStep.upsert({
      where: { userId_stepKey: { userId, stepKey } },
      create: { userId, stepKey, method, completedBy, completedAt: new Date() },
      update: { method, completedBy, completedAt: new Date() },
    })

    // Check if all steps are now complete
    const completedCount = await tx.memberOnboardingStep.count({ where: { userId } })
    if (completedCount >= TOTAL_STEPS) {
      await tx.memberProfile.upsert({
        where: { userId },
        create: { userId, onboardingCompletedAt: new Date() },
        update: { onboardingCompletedAt: new Date() },
      })
    }

    // Write DealActivity if there's a linked Deal
    const deal = await tx.deal.findFirst({
      where: { userId },
      select: { id: true },
    })
    if (deal) {
      await tx.dealActivity.create({
        data: {
          dealId: deal.id,
          type: "ONBOARDING_STEP_COMPLETED",
          detail: `${method === "admin" ? "Admin" : "Member"} completed: ${step.title}`,
          authorId: completedBy ?? userId,
          metadata: { stepKey, method, stepTitle: step.title },
        },
      })
    }
  })

  // Fire in-app unlock notifications (non-blocking)
  const newCount = await db.memberOnboardingStep.count({ where: { userId } })

  const previousPct = Math.round((previousCount / TOTAL_STEPS) * 100)
  const newPct = Math.round((newCount / TOTAL_STEPS) * 100)
  for (const milestone of UNLOCK_MILESTONES) {
    if (previousPct < milestone.threshold && newPct >= milestone.threshold) {
      db.notification.create({
        data: {
          userId,
          channel: "IN_APP",
          type: `onboarding_unlock_${milestone.key}`,
          title: milestone.title,
          message: milestone.message,
          metadata: { link: milestone.link, percent: newPct },
        },
      }).catch(() => {})
    }
  }
}

export async function resetStep({
  userId,
  stepKey,
  resetBy,
}: {
  userId: string
  stepKey: string
  resetBy: string
}): Promise<void> {
  const step = ONBOARDING_STEPS.find((s) => s.key === stepKey)

  await db.$transaction(async (tx) => {
    await tx.memberOnboardingStep.deleteMany({ where: { userId, stepKey } })

    // Clear completion timestamp since they no longer have all steps done
    await tx.memberProfile.updateMany({
      where: { userId, onboardingCompletedAt: { not: null } },
      data: { onboardingCompletedAt: null },
    })

    const deal = await tx.deal.findFirst({
      where: { userId },
      select: { id: true },
    })
    if (deal) {
      await tx.dealActivity.create({
        data: {
          dealId: deal.id,
          type: "ONBOARDING_STEP_RESET",
          detail: `Admin reset step: ${step?.title ?? stepKey}`,
          authorId: resetBy,
          metadata: { stepKey, stepTitle: step?.title },
        },
      })
    }
  })
}

export async function getProgressForDeal(dealId: string): Promise<OnboardingProgress | null> {
  const deal = await db.deal.findUnique({
    where: { id: dealId },
    select: { userId: true },
  })
  if (!deal?.userId) return null
  return getProgressForUser(deal.userId)
}

export async function getProgressSummaryForAdmin(dealId: string): Promise<{
  userId: string | null
  progress: OnboardingProgress | null
  profile: {
    businessName: string | null
    logoUrl: string | null
    oneLiner: string | null
    niche: string | null
    idealClient: string | null
    businessUrl: string | null
  } | null
}> {
  const deal = await db.deal.findUnique({
    where: { id: dealId },
    select: {
      userId: true,
      user: {
        select: {
          memberProfile: {
            select: {
              businessName: true,
              logoUrl: true,
              oneLiner: true,
              niche: true,
              idealClient: true,
              businessUrl: true,
            },
          },
        },
      },
    },
  })

  if (!deal?.userId) return { userId: null, progress: null, profile: null }

  const progress = await getProgressForUser(deal.userId)
  const profile = deal.user?.memberProfile ?? null

  return { userId: deal.userId, progress, profile }
}
