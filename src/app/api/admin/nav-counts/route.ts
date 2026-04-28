import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * Lightweight counts for the admin sidebar badges. Fired on mount by the
 * AdminSidebar client component and re-fetched every 60 seconds so the
 * admin always sees the live state of their inbox without having to
 * full-refresh the page.
 *
 * Every count degrades to 0 on individual query failure — badges are
 * informational, not load-bearing; a single slow table shouldn't darken
 * the whole sidebar.
 */
export async function GET() {
  const { userId, sessionClaims } = await auth()
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000)
  const threeDaysAgo = new Date(Date.now() - 3 * 86400_000)

  const [
    newApplicationsToday,
    hotLeadsInPipeline,
    consultsAwaitingInvite,
    failedInvites,
    abandonedApplications,
    openTickets,
    newFeedback,
  ] = await Promise.allSettled([
    db.leadMagnetSubmission.count({
      where: {
        type: "COLLECTIVE_APPLICATION",
        createdAt: { gte: today },
      },
    }),
    db.deal.count({
      where: {
        leadScoreTier: "hot",
        stage: { in: ["APPLICATION_SUBMITTED", "CONSULT_BOOKED"] },
        createdAt: { gte: threeDaysAgo },
      },
    }),
    db.deal.count({
      where: {
        stage: { in: ["CONSULT_BOOKED", "CONSULT_COMPLETED"] },
        mightyInvites: { none: {} },
      },
    }),
    db.mightyInvite.count({ where: { status: "failed" } }),
    db.partialApplication.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        completedAt: null,
        contactedAt: null,
        dismissedAt: null,
      },
    }),
    db.supportTicket.count({ where: { status: "open" } }),
    db.portalFeedback.count({ where: { status: "NEW" } }),
  ])

  const get = (r: PromiseSettledResult<number>) =>
    r.status === "fulfilled" ? r.value : 0

  const counts = {
    applications: get(newApplicationsToday),
    crm: get(hotLeadsInPipeline) + get(consultsAwaitingInvite),
    mightyInvites: get(failedInvites),
    followUps: get(abandonedApplications),
    support: get(openTickets),
    feedback: get(newFeedback),
  }

  return NextResponse.json({ counts, fetchedAt: new Date().toISOString() })
}
