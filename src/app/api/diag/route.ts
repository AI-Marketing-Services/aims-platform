import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

// Temporary diagnostic endpoint — runs a few Prisma queries and returns the
// raw error code / meta so we can see what's failing on Vercel runtime that
// the truncated log viewer is hiding. Public on purpose — no sensitive data
// is returned. DELETE THIS FILE once the prod outage is fixed.
export async function GET() {
  const result: Record<string, unknown> = {
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
      databaseUrlHost:
        process.env.DATABASE_URL?.match(/@([^/]+)\//)?.[1] ?? null,
      nodeEnv: process.env.NODE_ENV,
      prismaClientVersion:
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        (require("@prisma/client/package.json") as { version?: string }).version,
    },
  }

  // Probe the actual queries each portal page makes during render so we can
  // see which one is throwing. The simple counts already passed, so the
  // failure is in a complex query path. This mirrors the real page queries.
  for (const [label, run] of [
    ["userCount", () => db.user.count()],
    ["auditQuizCount", () => db.auditQuiz.count()],
    [
      "userByClerkId_layoutShape",
      () =>
        db.user.findUnique({
          where: { clerkId: "user_diag_probe_does_not_exist" },
          select: {
            id: true,
            name: true,
            subscriptions: {
              where: { status: "ACTIVE" },
              select: { monthlyAmount: true },
            },
          },
        }),
    ],
    [
      "auditQuizFindManyShape",
      () =>
        db.auditQuiz.findMany({
          where: { ownerId: "user_does_not_exist", archivedAt: null },
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
    [
      "notificationCount",
      () => db.notification.count({ where: { userId: "x", read: false } }),
    ],
    [
      "aiScriptFindMany",
      () =>
        db.aiScript.findMany({
          where: { userId: "x" },
          select: {
            id: true,
            type: true,
            title: true,
            content: true,
            clientDealId: true,
            clientDeal: { select: { companyName: true } },
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
        }),
    ],
  ] as const) {
    try {
      result[label] = { ok: true, value: await run() }
    } catch (err) {
      const e = err as {
        message?: string
        name?: string
        code?: string
        meta?: unknown
        clientVersion?: string
      }
      result[label] = {
        ok: false,
        name: e.name,
        code: e.code,
        meta: e.meta,
        clientVersion: e.clientVersion,
        message: e.message?.split("\n").slice(0, 4).join(" | "),
      }
    }
  }

  return NextResponse.json(result, { status: 200 })
}
