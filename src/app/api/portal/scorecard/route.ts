import { NextResponse } from "next/server"
import { z } from "zod"
import { ensureDbUserIdForApi } from "@/lib/auth/ensure-user"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import {
  endOfLocalWeek,
  parseWeekStart,
  startOfLocalWeek,
} from "@/lib/scorecard/week"
import { aggregateAutoTally } from "@/lib/scorecard/aggregate"
import { getTargets } from "@/lib/scorecard/targets"

export const dynamic = "force-dynamic"

const tzOffsetSchema = z
  .preprocess((v) => (typeof v === "string" ? Number(v) : v), z.number())
  .pipe(z.number().int().min(-840).max(840))

/**
 * GET /api/portal/scorecard?week=YYYY-MM-DD&tzOffset=<minutes>
 *
 * Returns the operator's scorecard for the requested week. If no week
 * is supplied, defaults to the current week in their local timezone.
 * Lazily creates the OperatorWeeklyScorecard row on first read so the
 * client can always assume a row exists.
 */
export async function GET(req: Request) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const weekParam = url.searchParams.get("week")
  const tzOffsetParam = url.searchParams.get("tzOffset")

  const tzOffsetParsed = tzOffsetSchema.safeParse(tzOffsetParam ?? 0)
  const tzOffset = tzOffsetParsed.success ? tzOffsetParsed.data : 0

  const weekStart =
    parseWeekStart(weekParam) ?? startOfLocalWeek(new Date(), tzOffset)
  const weekEndExclusive = endOfLocalWeek(weekStart, 0)

  try {
    const [profile, scorecard, autoTally] = await Promise.all([
      db.memberProfile.findUnique({
        where: { userId },
        select: {
          businessName: true,
          niche: true,
          scorecardFocusNiche: true,
          weeklyGoalText: true,
          weeklyRule: true,
          commitmentLevel: true,
        },
      }),
      db.operatorWeeklyScorecard.upsert({
        where: { userId_weekStart: { userId, weekStart } },
        create: { userId, weekStart },
        update: {},
      }),
      aggregateAutoTally({ userId, weekStart, weekEndExclusive }),
    ])

    const commitmentLevel = profile?.commitmentLevel ?? "PART_TIME"
    const targets = getTargets(commitmentLevel)

    return NextResponse.json({
      week: {
        start: weekStart.toISOString().slice(0, 10),
        endExclusive: weekEndExclusive.toISOString().slice(0, 10),
      },
      profile: {
        businessName: profile?.businessName ?? null,
        focusNiche:
          profile?.scorecardFocusNiche ?? profile?.niche ?? null,
        weeklyGoalText:
          profile?.weeklyGoalText ?? "Create real business conversations",
        weeklyRule:
          profile?.weeklyRule ??
          "Do not pitch AI first. Diagnose the business problem.",
        commitmentLevel,
      },
      targets,
      manual: {
        newProspects: scorecard.manualNewProspects,
        outreachSent: scorecard.manualOutreachSent,
        followUpsSent: scorecard.manualFollowUpsSent,
        referralAsks: scorecard.manualReferralAsks,
        problemHypotheses: scorecard.manualProblemHypotheses,
        discoveryRequested: scorecard.manualDiscoveryRequested,
        discoveryBooked: scorecard.manualDiscoveryBooked,
        discoveryCompleted: scorecard.manualDiscoveryCompleted,
        quickWinHypotheses: scorecard.manualQuickWinHypotheses,
      },
      auto: autoTally,
      kpis: {
        revenueImpact: scorecard.revenueImpact,
        strongOpportunities: scorecard.strongOpportunities,
      },
      notes: scorecard.notes ?? "",
    })
  } catch (err) {
    logger.error("Failed to load scorecard", err, {
      endpoint: "GET /api/portal/scorecard",
      userId,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

const patchSchema = z.object({
  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "weekStart must be YYYY-MM-DD"),
  // Per-row manual counts — all optional partial updates.
  manualNewProspects: z.number().int().min(0).max(9999).optional(),
  manualOutreachSent: z.number().int().min(0).max(9999).optional(),
  manualFollowUpsSent: z.number().int().min(0).max(9999).optional(),
  manualReferralAsks: z.number().int().min(0).max(9999).optional(),
  manualProblemHypotheses: z.number().int().min(0).max(9999).optional(),
  manualDiscoveryRequested: z.number().int().min(0).max(9999).optional(),
  manualDiscoveryBooked: z.number().int().min(0).max(9999).optional(),
  manualDiscoveryCompleted: z.number().int().min(0).max(9999).optional(),
  manualQuickWinHypotheses: z.number().int().min(0).max(9999).optional(),
  // Manual KPIs.
  revenueImpact: z.number().min(0).max(10_000_000).optional(),
  strongOpportunities: z.number().int().min(0).max(9999).optional(),
  notes: z.string().max(10_000).optional(),
  // Profile-level fields (commitment level + header text). These persist
  // on MemberProfile so they apply to every week, not just the one being
  // viewed — the client batches the patch so a single save updates
  // both surfaces.
  commitmentLevel: z.enum(["PART_TIME", "FULL_TIME"]).optional(),
  weeklyGoalText: z.string().max(280).optional(),
  weeklyRule: z.string().max(280).optional(),
  focusNiche: z.string().max(120).optional(),
})

/**
 * PATCH /api/portal/scorecard — save manual edits for a given week.
 * Profile-level fields (commitment level, goal, rule, focus) update
 * MemberProfile in the same transaction.
 */
export async function PATCH(req: Request) {
  const userId = await ensureDbUserIdForApi()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const json = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const weekStart = parseWeekStart(parsed.data.weekStart)
  if (!weekStart)
    return NextResponse.json(
      { error: "weekStart must be a Monday in YYYY-MM-DD format" },
      { status: 400 },
    )

  const {
    commitmentLevel,
    weeklyGoalText,
    weeklyRule,
    focusNiche,
    ...weekly
  } = parsed.data

  // Build the partial scorecard update payload from only the fields the
  // client actually sent — Prisma will ignore the others.
  const scorecardUpdate: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(weekly)) {
    if (key === "weekStart") continue
    if (value !== undefined) scorecardUpdate[key] = value
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.operatorWeeklyScorecard.upsert({
        where: { userId_weekStart: { userId, weekStart } },
        create: { userId, weekStart, ...scorecardUpdate },
        update: scorecardUpdate,
      })

      if (
        commitmentLevel !== undefined ||
        weeklyGoalText !== undefined ||
        weeklyRule !== undefined ||
        focusNiche !== undefined
      ) {
        const profileUpdate: Record<string, unknown> = {}
        if (commitmentLevel !== undefined) profileUpdate.commitmentLevel = commitmentLevel
        if (weeklyGoalText !== undefined) profileUpdate.weeklyGoalText = weeklyGoalText
        if (weeklyRule !== undefined) profileUpdate.weeklyRule = weeklyRule
        if (focusNiche !== undefined) profileUpdate.scorecardFocusNiche = focusNiche

        await tx.memberProfile.upsert({
          where: { userId },
          create: { userId, ...profileUpdate },
          update: profileUpdate,
        })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("Failed to save scorecard", err, {
      endpoint: "PATCH /api/portal/scorecard",
      userId,
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
