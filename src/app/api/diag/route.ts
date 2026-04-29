import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getProgressForUser } from "@/lib/onboarding/progress"

export const dynamic = "force-dynamic"

// TEMP — runs the exact server-side queries each broken portal page makes,
// against a real admin user, and returns the actual Prisma error code/meta
// when something throws. Public on purpose for debugging the prod outage.
export async function GET() {
  const out: Record<string, unknown> = {}

  let admin
  try {
    admin = await db.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true, clerkId: true },
    })
    out.admin = { id: admin?.id, clerkId: admin?.clerkId }
  } catch (err) {
    return NextResponse.json({ adminLookupFailed: serializeErr(err) })
  }

  if (!admin) return NextResponse.json({ error: "no admin user" })

  const probes: Array<[string, () => Promise<unknown>]> = [
    [
      "onboard:userMemberProfile",
      () =>
        db.user.findUnique({
          where: { id: admin!.id },
          select: {
            id: true,
            name: true,
            memberProfile: {
              select: {
                businessName: true,
                logoUrl: true,
                oneLiner: true,
                niche: true,
                idealClient: true,
                businessUrl: true,
                brandColor: true,
                tagline: true,
                onboardingCompletedAt: true,
              },
            },
          },
        }),
    ],
    ["onboard:getProgressForUser", () => getProgressForUser(admin!.id)],
    [
      "billing:subscriptionsWithServiceArm",
      () =>
        db.subscription.findMany({
          where: { userId: admin!.id },
          include: { serviceArm: true },
        }),
    ],
    [
      "services:subscriptions",
      () =>
        db.subscription.findMany({
          where: { userId: admin!.id },
          include: { serviceArm: true, fulfillmentTasks: true },
        }),
    ],
    [
      "marketplace:serviceArms",
      () =>
        db.serviceArm.findMany({
          where: { status: "ACTIVE" },
          orderBy: { sortOrder: "asc" },
        }),
    ],
    [
      "tools:userEntitlements",
      () =>
        db.entitlement.findMany({
          where: { userId: admin!.id, revokedAt: null },
        }),
    ],
    [
      "metrics:usageEvents",
      () =>
        db.usageEvent.findMany({
          where: { userId: admin!.id },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
    ],
    [
      "campaigns:emailBisonConnection",
      () =>
        db.emailBisonConnection.findUnique({ where: { userId: admin!.id } }),
    ],
    [
      "signal:topics",
      () => db.signalTopic.findMany({ where: { userId: admin!.id } }),
    ],
    [
      "referrals:given",
      () =>
        db.referral.findMany({
          where: { referrerId: admin!.id },
        }),
    ],
    [
      "ops-excellence:engagements",
      () =>
        db.opsExcellenceEngagement.findMany({
          where: { userId: admin!.id },
        }),
    ],
    [
      "audits:loadQuizzes",
      () =>
        db.auditQuiz.findMany({
          where: { ownerId: admin!.id, archivedAt: null },
          select: {
            id: true,
            slug: true,
            title: true,
            subtitle: true,
            isPublished: true,
            brandColor: true,
            customDomain: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { responses: true } },
            responses: {
              select: { createdAt: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          orderBy: { updatedAt: "desc" },
        }),
    ],
  ]

  for (const [label, run] of probes) {
    try {
      const v = await run()
      out[label] = {
        ok: true,
        rowCount: Array.isArray(v) ? v.length : v == null ? null : 1,
      }
    } catch (err) {
      out[label] = serializeErr(err)
    }
  }

  return NextResponse.json(out)
}

function serializeErr(err: unknown) {
  const e = err as {
    name?: string
    message?: string
    code?: string
    meta?: unknown
    clientVersion?: string
  }
  return {
    ok: false,
    name: e.name,
    code: e.code,
    meta: e.meta,
    clientVersion: e.clientVersion,
    message: e.message?.split("\n").slice(0, 6).join(" | "),
  }
}
