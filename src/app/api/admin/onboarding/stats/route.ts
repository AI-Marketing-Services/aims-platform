import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { db } from "@/lib/db"
import { TOTAL_STEPS } from "@/lib/onboarding/steps"

export async function GET(req: NextRequest) {
  const adminClerkId = await requireAdmin()
  if (!adminClerkId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const searchParams = req.nextUrl.searchParams
  const windowDays = parseInt(searchParams.get("window") ?? "30", 10)

  try {
    const members = await db.user.findMany({
      where: { role: "CLIENT" },
      include: {
        memberOnboardingSteps: {
          select: { completedAt: true },
          orderBy: { completedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    const totalMembers = members.length

    let completedIn7Days = 0
    let completedIn30Days = 0
    const daysToCompleteList: number[] = []

    for (const member of members) {
      const steps = member.memberOnboardingSteps
      if (steps.length < TOTAL_STEPS) continue

      // Member has completed all steps — find the latest completedAt
      const latestCompleted = steps[0]?.completedAt
      if (!latestCompleted) continue

      const joinedAt = member.createdAt
      const daysToComplete = Math.ceil(
        (latestCompleted.getTime() - joinedAt.getTime()) / 86_400_000
      )

      daysToCompleteList.push(Math.max(0, daysToComplete))

      if (daysToComplete <= 7) completedIn7Days++
      if (daysToComplete <= windowDays) completedIn30Days++
    }

    const percentIn7Days =
      totalMembers > 0
        ? Math.round((completedIn7Days / totalMembers) * 100)
        : 0

    let medianDaysToComplete: number | null = null
    if (daysToCompleteList.length > 0) {
      const sorted = [...daysToCompleteList].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      medianDaysToComplete =
        sorted.length % 2 === 0
          ? Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2)
          : (sorted[mid] ?? null)
    }

    return NextResponse.json({
      totalMembers,
      completedIn7Days,
      completedIn30Days,
      percentIn7Days,
      medianDaysToComplete,
    })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
