import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

/**
 * GET /api/admin/funnel
 * Returns live funnel metrics for /admin/funnel auto-refresh.
 */

export async function GET() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 3600_000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600_000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600_000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    partialsAll,
    partialsToday,
    partialsWeek,
    partialsMonth,
    appsAll,
    appsToday,
    appsYesterday,
    appsWeek,
    appsMonth,
    appsHot,
    appsWarm,
    appsCold,
    dealStages,
    dealStagesWeek,
    invitesAll,
    invitesAccepted,
    invitesPending,
    invitesFailed,
    recentApps,
    recentActivity,
    dealMoments,
  ] = await Promise.all([
    db.partialApplication.count(),
    db.partialApplication.count({ where: { createdAt: { gte: todayStart } } }),
    db.partialApplication.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.partialApplication.count({ where: { createdAt: { gte: monthStart } } }),

    db.deal.count({ where: { source: "ai-operator-collective-application" } }),
    db.deal.count({
      where: {
        source: "ai-operator-collective-application",
        createdAt: { gte: todayStart },
      },
    }),
    db.deal.count({
      where: {
        source: "ai-operator-collective-application",
        createdAt: { gte: yesterdayStart, lt: todayStart },
      },
    }),
    db.deal.count({
      where: {
        source: "ai-operator-collective-application",
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    db.deal.count({
      where: {
        source: "ai-operator-collective-application",
        createdAt: { gte: monthStart },
      },
    }),

    db.deal.count({
      where: {
        source: "ai-operator-collective-application",
        leadScoreTier: "hot",
      },
    }),
    db.deal.count({
      where: {
        source: "ai-operator-collective-application",
        leadScoreTier: "warm",
      },
    }),
    db.deal.count({
      where: {
        source: "ai-operator-collective-application",
        leadScoreTier: "cold",
      },
    }),

    db.deal.groupBy({
      by: ["stage"],
      where: { source: "ai-operator-collective-application" },
      _count: { _all: true },
    }),
    db.deal.groupBy({
      by: ["stage"],
      where: {
        source: "ai-operator-collective-application",
        createdAt: { gte: sevenDaysAgo },
      },
      _count: { _all: true },
    }),

    db.mightyInvite.count(),
    db.mightyInvite.count({ where: { status: "accepted" } }),
    db.mightyInvite.count({ where: { status: { in: ["pending", "sent"] } } }),
    db.mightyInvite.count({ where: { status: "failed" } }),

    db.deal.findMany({
      where: { source: "ai-operator-collective-application" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        contactName: true,
        contactEmail: true,
        stage: true,
        leadScore: true,
        leadScoreTier: true,
        mightyInviteStatus: true,
        createdAt: true,
      },
    }),

    db.dealActivity.findMany({
      where: {
        type: {
          in: [
            "FORM_SUBMITTED",
            "DEMO_COMPLETED",
            "MIGHTY_INVITE_SENT",
            "MIGHTY_MEMBER_JOINED",
            "EMAIL_SENT",
            "STAGE_CHANGE",
          ],
        },
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        type: true,
        detail: true,
        createdAt: true,
        dealId: true,
      },
    }),

    db.dealActivity.groupBy({
      by: ["type"],
      where: {
        createdAt: { gte: sevenDaysAgo },
        type: {
          in: [
            "FORM_SUBMITTED",
            "DEMO_COMPLETED",
            "MIGHTY_INVITE_SENT",
            "MIGHTY_MEMBER_JOINED",
          ],
        },
      },
      _count: { _all: true },
    }),
  ])

  const stageCounts: Record<string, number> = {}
  for (const s of dealStages) stageCounts[s.stage] = s._count._all
  const stageCountsWeek: Record<string, number> = {}
  for (const s of dealStagesWeek) stageCountsWeek[s.stage] = s._count._all

  const momentCounts: Record<string, number> = {}
  for (const m of dealMoments) momentCounts[m.type] = m._count._all

  // Funnel rate calculations (lifetime)
  const starts = partialsAll
  const completed = appsAll
  const booked = stageCounts.DEMO_BOOKED ?? 0 // current stage only
  const allBookedEver = momentCounts.DEMO_COMPLETED ?? 0 // activity log ≈ ever booked
  const invited = invitesAll
  const joined = invitesAccepted

  const completionRate = starts > 0 ? (completed / starts) * 100 : 0
  // Booking rate relative to applications that exist (proxy)
  const bookedEverEstimate = Math.max(
    allBookedEver,
    stageCounts.DEMO_BOOKED ?? 0,
    stageCounts.PROPOSAL_SENT ?? 0,
    stageCounts.NEGOTIATION ?? 0,
    stageCounts.ACTIVE_CLIENT ?? 0
  )
  const bookingRate = completed > 0 ? (bookedEverEstimate / completed) * 100 : 0
  const mightyAcceptRate = invited > 0 ? (joined / invited) * 100 : 0
  const applicationToCollectiveRate = completed > 0 ? (joined / completed) * 100 : 0

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    top: {
      partialsToday,
      partialsWeek,
      partialsMonth,
      partialsAll,
      applicationsToday: appsToday,
      applicationsYesterday: appsYesterday,
      applicationsWeek: appsWeek,
      applicationsMonth: appsMonth,
      applicationsAll: appsAll,
      hot: appsHot,
      warm: appsWarm,
      cold: appsCold,
      bookingsEver: bookedEverEstimate,
      invitedEver: invited,
      joinedEver: joined,
      invitesPending,
      invitesFailed,
    },
    funnel: {
      starts,
      completed,
      booked: bookedEverEstimate,
      invited,
      joined,
      completionRate,
      bookingRate,
      mightyAcceptRate,
      applicationToCollectiveRate,
    },
    stages: stageCounts,
    stagesWeek: stageCountsWeek,
    recentApplications: recentApps.map((r) => ({
      id: r.id,
      name: r.contactName,
      email: r.contactEmail,
      stage: r.stage,
      score: r.leadScore,
      tier: r.leadScoreTier,
      mightyStatus: r.mightyInviteStatus,
      createdAt: r.createdAt.toISOString(),
    })),
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      type: a.type,
      detail: a.detail,
      dealId: a.dealId,
      createdAt: a.createdAt.toISOString(),
    })),
  })
  } catch (err) {
    logger.error("[Admin] funnel metrics failed", err)
    return NextResponse.json(
      { error: "Failed to compute funnel metrics" },
      { status: 500 }
    )
  }
}
